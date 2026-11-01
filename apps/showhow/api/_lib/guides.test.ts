import { beforeEach, describe, expect, test, vi } from 'vitest'

// Fake Supabase server client: records inserts, signs upload paths, answers bump_usage.
const db = {
  capOk: true,
  inserted: [] as unknown[],
  rpc: vi.fn(async () => ({ data: db.capOk, error: null })),
  from: () => ({
    insert: (row: unknown) => {
      db.inserted.push(row)
      return { select: () => ({ single: async () => ({ data: { id: 'g-123' }, error: null }) }) }
    },
  }),
  storage: { from: () => ({ createSignedUploadUrl: async (path: string) => ({ data: { path, token: `tok-${path}` }, error: null }) }) },
}
vi.mock('./db', () => ({ serverDb: () => db }))
const { POST } = await import('../guides')

const valid = { title: 'Change the purifier water', category: 'Home', creatorName: 'Talha', durationS: 95, consent: true, adult: true }
const call = (body: unknown, code = 'good') => POST(new Request('http://x/api/guides', {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-access-code': code }, body: JSON.stringify(body),
}))

describe('POST /api/guides', () => {
  beforeEach(() => { vi.stubEnv('CREATE_ACCESS_CODES', 'good'); db.capOk = true; db.inserted = [] })

  test('creates a draft and returns one-time upload URLs for the video and the audio', async () => {
    const res = await call(valid)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      id: 'g-123',
      uploads: { video: { path: 'g-123/video.mp4', token: 'tok-g-123/video.mp4' }, audio: { path: 'g-123/audio.wav', token: 'tok-g-123/audio.wav' } },
    })
    expect(db.inserted).toEqual([{ title: valid.title, category: 'Home', creator_name: 'Talha', duration_s: 95, kind: 'video', status: 'draft' }])
  })
  test('401 with a wrong access code, and nothing is created', async () => {
    expect((await call(valid, 'bad')).status).toBe(401)
    expect(db.inserted).toEqual([])
  })
  test('400 without consent or the 18+ confirmation', async () => {
    expect((await call({ ...valid, consent: false })).status).toBe(400)
    expect((await call({ ...valid, adult: undefined })).status).toBe(400)
    expect(db.inserted).toEqual([])
  })
  test('400 for videos over 3 minutes or unknown categories', async () => {
    expect((await call({ ...valid, durationS: 400 })).status).toBe(400)
    expect((await call({ ...valid, category: 'Weapons' })).status).toBe(400)
  })
  test('429 when the daily build cap is reached, and nothing is created', async () => {
    db.capOk = false
    expect((await call(valid)).status).toBe(429)
    expect(db.inserted).toEqual([])
  })
})
