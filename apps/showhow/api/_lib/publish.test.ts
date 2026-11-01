import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fakeDb } from './fake-db'

const ID = '8d0c1c3e-6a5f-4f7e-9b0a-2f6d1f5b7a11'
let db = fakeDb()
vi.mock('./db', () => ({ serverDb: () => db }))
const { POST } = await import('../publish')

const seed = (status = 'ready') => fakeDb({
  guides: [{ id: ID, status }],
  steps: [0, 1].map(idx => ({ guide_id: ID, idx, title: `T${idx}`, instruction: `I${idx}`, start_s: idx, end_s: idx + 1, image_path: `${ID}/${idx}-ai.jpg` })),
})
const call = (edits: unknown[]) => POST(new Request('http://x/api/publish', { method: 'POST', headers: { 'x-access-code': 'good' }, body: JSON.stringify({ guideId: ID, edits }) }))

describe('POST /api/publish', () => {
  beforeEach(() => { vi.stubEnv('CREATE_ACCESS_CODES', 'good'); db = seed() })

  test('applies text edits, drops rejected AI images, publishes, returns the share path', async () => {
    const res = await call([{ idx: 0, title: ' Release the tank ', instruction: 'Press the latch.' }, { idx: 1, title: 'T1', instruction: 'I1', dropAiImage: true }])
    expect(await res.json()).toEqual({ id: ID, path: `#/guide/${ID}/1` })
    expect(db.tables.guides[0].status).toBe('published')
    expect(db.tables.steps.map(s => [s.title, s.image_path])).toEqual([['Release the tank', `${ID}/0-ai.jpg`], ['T1', null]])
    expect(db.tables.steps[0]).toMatchObject({ start_s: 0, end_s: 1 }) // times untouched
  })
  test('only ready guides can be published, once', async () => {
    db = seed('draft'); expect((await call([])).status).toBe(409)
    db = seed('published'); expect((await call([])).status).toBe(409)
  })
  test('rejects empty titles and over-long text', async () => {
    expect((await call([{ idx: 0, title: '  ', instruction: 'x' }])).status).toBe(400)
    expect((await call([{ idx: 0, title: 'x', instruction: 'y'.repeat(301) }])).status).toBe(400)
    expect(db.tables.guides[0].status).toBe('ready')
  })
})
