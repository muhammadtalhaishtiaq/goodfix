import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fakeDb } from './fake-db'

const ID = '8d0c1c3e-6a5f-4f7e-9b0a-2f6d1f5b7a11'
let db = fakeDb()
const samText = vi.fn()
const sparkJson = vi.fn()
vi.mock('./db', () => ({ serverDb: () => db }))
vi.mock('./meta', () => ({ samText: (...a: unknown[]) => samText(...a), sparkJson: (...a: unknown[]) => sparkJson(...a) }))
const { POST } = await import('../outlines')

const box = (c: number) => `<|box;x1=10;y1=20;x2=110;y2=220;w=1280;h=720;c=${c}|>`
const seed = (g: Record<string, unknown> = {}, withFrames = [0, 1, 2]) => fakeDb({
  guides: [{ id: ID, status: 'ready', attempts: 0, kind: 'video', ...g }],
  steps: [0, 1, 2].map(idx => ({ guide_id: ID, idx, sam_noun: ['latch', 'tank', ''][idx], key_part: ['Latch', 'Water tank', 'Max line'][idx], keyframe_path: null, outline: null })),
  files: Object.fromEntries(withFrames.map(i => [`${ID}/${i}.jpg`, new Blob(['jpg'])])),
})
const call = () => POST(new Request('http://x/api/outlines', { method: 'POST', headers: { 'x-access-code': 'good' }, body: JSON.stringify({ guideId: ID }) }))

describe('POST /api/outlines', () => {
  beforeEach(() => { vi.stubEnv('CREATE_ACCESS_CODES', 'good'); db = seed(); samText.mockReset(); sparkJson.mockReset().mockResolvedValue({ ok: true, reason: 'fine' }) })

  test('saves only confident, unambiguous boxes; ambiguous and empty results stay null', async () => {
    samText.mockImplementation(async (_url: string, noun: string) => noun === 'latch' ? box(0.9) : noun === 'tank' ? box(0.8) + box(0.78) : '')
    const res = await call()
    expect(res.status).toBe(200)
    expect(db.tables.steps.map(s => [s.idx, s.keyframe_path, s.outline === null])).toEqual([[0, `${ID}/0.jpg`, false], [1, `${ID}/1.jpg`, true], [2, `${ID}/2.jpg`, true]])
    expect(db.tables.steps[0].outline).toEqual({ frameW: 1280, frameH: 720, box: [10, 20, 100, 200], score: 0.9 })
    expect(samText.mock.calls.map(c => c[1])).toEqual(['latch', 'tank', 'line']) // empty sam_noun falls back to the last word of key_part
    expect(db.tables.guides[0]).toMatchObject({ status: 'ready', attempts: 0, frames_ok: true })
  })
  test('frames showing unsuitable content block the guide (failed), before any SAM call', async () => {
    sparkJson.mockResolvedValue({ ok: false, reason: 'a bank card is visible' })
    const res = await call()
    expect(res.status).toBe(422)
    expect(db.tables.guides[0]).toMatchObject({ status: 'failed' })
    expect(db.tables.guides[0].frames_ok).not.toBe(true)
    expect(String(db.tables.guides[0].error)).toMatch(/bank card/)
    expect(samText).not.toHaveBeenCalled()
  })
  test('a frame-check error fails closed: not published-ready, retry allowed', async () => {
    sparkJson.mockRejectedValue(new Error('Meta 503'))
    expect((await call()).status).toBe(502)
    expect(db.tables.guides[0]).toMatchObject({ status: 'ready' })
    expect(db.tables.guides[0].frames_ok).not.toBe(true)
  })
  test('steps without an uploaded keyframe are skipped, not guessed', async () => {
    db = seed({}, [0])
    samText.mockResolvedValue(box(0.9))
    await call()
    expect(samText).toHaveBeenCalledTimes(1)
    expect(db.tables.steps[1]).toMatchObject({ keyframe_path: null, outline: null })
  })
  test('a SAM failure returns the guide to ready with a reason (steps are kept)', async () => {
    samText.mockRejectedValue(new Error('Meta /responses 503'))
    expect((await call()).status).toBe(500)
    expect(db.tables.guides[0]).toMatchObject({ status: 'ready', attempts: 1 })
    expect(db.tables.steps).toHaveLength(3)
  })
  test('only from ready, and only for video guides', async () => {
    db = seed({ status: 'draft' })
    expect((await call()).status).toBe(409)
    db = seed({ kind: 'voice' })
    expect((await call()).status).toBe(409)
    expect(samText).not.toHaveBeenCalled()
  })
})
