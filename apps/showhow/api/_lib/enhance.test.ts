import { beforeEach, describe, expect, test, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fakeDb } from './fake-db'

const ID = '8d0c1c3e-6a5f-4f7e-9b0a-2f6d1f5b7a11'
let db = fakeDb()
const editImage = vi.fn()
vi.mock('./db', () => ({ serverDb: () => db }))
vi.mock('./meta', () => ({ editImage: (...a: unknown[]) => editImage(...a) }))
const { POST } = await import('../enhance')

const seed = (kind = 'video') => fakeDb({
  guides: [{ id: ID, status: 'ready', attempts: 0, kind }],
  steps: [0, 1, 2].map(idx => ({ guide_id: ID, idx, key_part: ['Latch', 'Tank', 'Cap'][idx], keyframe_path: idx === 2 ? null : `${ID}/${idx}.jpg`, image_path: null })),
  files: { [`${ID}/0.jpg`]: new Blob(['frame0']), [`${ID}/1.jpg`]: new Blob(['frame1']) },
})
const call = () => POST(new Request('http://x', { method: 'POST', headers: { 'x-access-code': 'good' }, body: JSON.stringify({ guideId: ID }) }))

describe('POST /api/enhance', () => {
  beforeEach(() => {
    vi.stubEnv('CREATE_ACCESS_CODES', 'good'); db = seed()
    editImage.mockReset().mockImplementation(async (ref: Buffer, p: string) => Buffer.from(p.includes('circle') ? `focus(${ref})` : `enhanced(${ref})`))
  })

  test('enhances each REAL keyframe, stores it separately, never overwrites the real frame', async () => {
    expect(await (await call()).json()).toEqual({ images: [{ idx: 0, ok: true }, { idx: 1, ok: true }, { idx: 2, ok: false }] })
    expect(String(editImage.mock.calls[0][0])).toBe('frame0')
    expect(await db.files[`${ID}/0.jpg`].text()).toBe('frame0') // real keyframe untouched
    expect(await db.files[`${ID}/0-ai.jpg`].text()).toBe('enhanced(frame0)')
    expect(await db.files[`${ID}/0-ai-focus.jpg`].text()).toBe('focus(enhanced(frame0))')
    expect(db.tables.steps.map(s => [s.keyframe_path, s.image_path])).toEqual([[`${ID}/0.jpg`, `${ID}/0-ai.jpg`], [`${ID}/1.jpg`, `${ID}/1-ai.jpg`], [null, null]])
    expect(String(editImage.mock.calls[0][1])).toMatch(/Do not add, remove or change any object/)
  })
  test('asks for the real frame’s aspect ratio on both edits', async () => {
    db.files[`${ID}/0.jpg`] = new Blob([readFileSync(`${process.cwd()}/api/_lib/fixtures/64x36.jpg`)])
    await call()
    const forFrame0 = editImage.mock.calls.filter(c => c[2] === '1792x1008')
    expect(forFrame0).toHaveLength(2)
  })
  test('a failed step keeps only its real frame; all failing → 502 and the guide stays ready', async () => {
    editImage.mockImplementation(async (ref: Buffer) => { if (String(ref) === 'frame1') throw new Error('content_policy_violation'); return Buffer.from('x') })
    expect(await (await call()).json()).toEqual({ images: [{ idx: 0, ok: true }, { idx: 1, ok: false }, { idx: 2, ok: false }] })
    db = seed(); editImage.mockRejectedValue(new Error('Meta 503'))
    expect((await call()).status).toBe(502)
    expect(db.tables.guides[0]).toMatchObject({ status: 'ready' })
  })
  test('image cap reached → 429 before any Muse Image call', async () => {
    db.capOk = false
    expect((await call()).status).toBe(429)
    expect(editImage).not.toHaveBeenCalled()
  })
  test('voice guides are refused', async () => {
    db = seed('voice')
    expect((await call()).status).toBe(409)
    expect(editImage).not.toHaveBeenCalled()
  })
})
