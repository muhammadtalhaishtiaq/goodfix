import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fakeDb } from './fake-db'

const ID = '8d0c1c3e-6a5f-4f7e-9b0a-2f6d1f5b7a11'
let db = fakeDb()
const meta = { transcribe: vi.fn(), sparkJson: vi.fn() }
vi.mock('./db', () => ({ serverDb: () => db }))
vi.mock('./meta', () => ({ transcribe: (...a: unknown[]) => meta.transcribe(...a), sparkJson: (...a: unknown[]) => meta.sparkJson(...a) }))
const { POST } = await import('../steps')

const turns = [
  { startMs: 0, endMs: 3000, transcript: 'Hi, today the purifier water.' },
  { startMs: 4000, endMs: 9000, transcript: 'Press the latch and the tank pops out.' },
  { startMs: 10000, endMs: 16000, transcript: 'Fill it to the max line, not above.' },
]
const goodSteps = { steps: [
  { title: 'Release the tank', first_turn: 1, last_turn: 1, instruction: 'Press the latch.', tip_quote: '', key_part: 'Latch', sam_noun: 'latch' },
  { title: 'Fill the tank', first_turn: 2, last_turn: 2, instruction: 'Fill to MAX.', tip_quote: 'not above', key_part: 'Tank', sam_noun: 'tank' },
] }
const seed = (g: Record<string, unknown> = {}) => fakeDb({
  guides: [{ id: ID, status: 'draft', attempts: 0, kind: 'video', duration_s: 20, turns: null, ...g }],
  files: { [`${ID}/audio.wav`]: new Blob(['wav'], { type: 'audio/wav' }) },
})
const call = () => POST(new Request('http://x/api/steps', {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-access-code': 'good' }, body: JSON.stringify({ guideId: ID }),
}))
const guide = () => db.tables.guides[0]

describe('POST /api/steps', () => {
  beforeEach(() => {
    vi.stubEnv('CREATE_ACCESS_CODES', 'good')
    db = seed()
    meta.transcribe.mockReset().mockResolvedValue(turns)
    meta.sparkJson.mockReset().mockResolvedValue(goodSteps)
  })

  test('builds validated steps with times from the transcript, saves them, returns keyframe upload URLs', async () => {
    const res = await call()
    expect(res.status).toBe(200)
    const out = (await res.json()) as { keyframeUploads: { idx: number; atS: number; path: string }[] }
    expect(db.tables.steps.map(s => [s.title, s.start_s, s.end_s, s.tip_quote])).toEqual([['Release the tank', 4, 9, null], ['Fill the tank', 10, 16, 'not above']])
    expect(out.keyframeUploads).toEqual([
      { idx: 0, atS: 6.5, path: `${ID}/0.jpg`, token: `tok-${ID}/0.jpg` },
      { idx: 1, atS: 13, path: `${ID}/1.jpg`, token: `tok-${ID}/1.jpg` },
    ])
    expect(guide()).toMatchObject({ status: 'ready', attempts: 0, video_path: `${ID}/video.mp4` }) // counter resets on success
    expect(db.files[`${ID}/audio.wav`]).toBeUndefined() // audio deleted once transcribed
    expect(meta.sparkJson.mock.calls[0][0][1]).toEqual({ type: 'input_video', video_url: `https://storage.test/media/${ID}/video.mp4` })
  })

  test('invalid model output marks the guide failed with a plain reason and saves no steps', async () => {
    meta.sparkJson.mockResolvedValue({ steps: [{ title: 'x' }] })
    const res = await call()
    expect(res.status).toBe(422)
    expect(guide()).toMatchObject({ status: 'failed' })
    expect(String(guide().error)).toMatch(/couldn’t split/)
    expect(db.tables.steps).toEqual([])
  })

  test('a retry reuses the saved transcript instead of transcribing again', async () => {
    meta.sparkJson.mockRejectedValueOnce(new Error('Meta /responses 503'))
    expect((await call()).status).toBe(500)
    expect(guide()).toMatchObject({ status: 'failed', error: expect.stringMatching(/try again/) })
    expect((await call()).status).toBe(200)
    expect(meta.transcribe).toHaveBeenCalledTimes(1)
  })

  test('too little narration fails with a helpful reason', async () => {
    meta.transcribe.mockResolvedValue(turns.slice(0, 1))
    expect((await call()).status).toBe(422)
    expect(String(guide().error)).toMatch(/enough narration/)
  })

  test('credit guard: refuses a 4th run, and refuses while already processing or already done', async () => {
    db = seed({ attempts: 3, status: 'failed' })
    expect((await call()).status).toBe(429)
    db = seed({ status: 'processing' })
    expect((await call()).status).toBe(409)
    db = seed({ status: 'ready' })
    expect((await call()).status).toBe(409)
    expect(meta.transcribe).not.toHaveBeenCalled()
  })

  test('the last failed attempt deletes the audio copy', async () => {
    db = seed({ attempts: 2, status: 'failed' })
    meta.transcribe.mockRejectedValue(new Error('Meta /asr 500'))
    expect((await call()).status).toBe(500)
    expect(db.files[`${ID}/audio.wav`]).toBeUndefined()
  })

  test('400 for a non-UUID id, 401 without the access code', async () => {
    const bad = await POST(new Request('http://x', { method: 'POST', headers: { 'x-access-code': 'good' }, body: '{"guideId":"nope"}' }))
    expect(bad.status).toBe(400)
    const noCode = await POST(new Request('http://x', { method: 'POST', body: JSON.stringify({ guideId: ID }) }))
    expect(noCode.status).toBe(401)
  })
})
