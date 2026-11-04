import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fakeDb } from './fake-db'

const ID = '8d0c1c3e-6a5f-4f7e-9b0a-2f6d1f5b7a11'
let db = fakeDb()
const meta = { sparkJson: vi.fn(), transcribe: vi.fn() }
const wit = { speak: vi.fn() }
const caps = { ok: true, kinds: [] as string[] }
vi.mock('./db', () => ({ serverDb: () => ({ ...db, rpc: async (_: string, a: { p_kind: string }) => { caps.kinds.push(a.p_kind); return { data: caps.ok, error: null } } }) }))
vi.mock('./meta', () => ({ sparkJson: (...a: unknown[]) => meta.sparkJson(...a), transcribe: (...a: unknown[]) => meta.transcribe(...a) }))
vi.mock('./wit', () => ({ speak: (...a: unknown[]) => wit.speak(...a) }))
const { POST: chat } = await import('../chat')
const { POST: listen } = await import('../listen')

const seed = (status = 'published') => fakeDb({
  guides: [{ id: ID, status, kind: 'video', title: 'Refill the humidifier', turns: [{ transcript: 'first you twist the lid left' }] }],
  steps: [
    { guide_id: ID, idx: 1, title: 'Fill the tank', instruction: 'Cold water to the line.', tip_quote: null },
    { guide_id: ID, idx: 0, title: 'Unlock the lid', instruction: 'Twist left until it clicks.', tip_quote: null },
  ],
})
const msgs = [{ role: 'user', text: 'which way do I twist?' }]
const call = (b: Record<string, unknown> = {}) => chat(new Request('http://x/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ guideId: ID, stepIdx: 0, messages: msgs, ...b }) }))
const prompt = () => (meta.sparkJson.mock.calls[0][0] as { text: string }[])[0].text

describe('POST /api/chat', () => {
  beforeEach(() => { db = seed(); caps.ok = true; caps.kinds = []; meta.sparkJson.mockReset(); wit.speak.mockReset() })

  test('answers from the guide + narration with step refs and an optional labelled tip', async () => {
    meta.sparkJson.mockResolvedValue({ from_guide: true, answer: 'Twist it left until it clicks.', step_refs: [1], ai_tip: '' })
    expect(await (await call()).json()).toEqual({ covered: true, answer: 'Twist it left until it clicks.', steps: [0], tip: null })
    expect(prompt()).toMatch(/>> Step 1: Unlock the lid[\s\S]*Step 2: Fill the tank/)
    expect(prompt()).toContain('first you twist the lid left')
    expect(caps.kinds).toContain('ask')
  })
  test('speak:true adds the reply read aloud; a TTS failure still returns the text', async () => {
    meta.sparkJson.mockResolvedValue({ from_guide: false, answer: '', step_refs: [], ai_tip: 'Use a jug.' })
    wit.speak.mockResolvedValue(Buffer.from('mp3'))
    const out = await (await call({ speak: true })).json()
    expect(out).toMatchObject({ covered: false, tip: 'Use a jug.', audio: Buffer.from('mp3').toString('base64') })
    expect(wit.speak.mock.calls[0][0]).toMatch(/doesn’t cover that, so here’s general guidance instead\. AI suggestion, not from the creator: Use a jug\./)
    wit.speak.mockRejectedValue(new Error('wit down'))
    expect((await call({ speak: true })).status).toBe(200)
  })
  test('blocked topic → 422 before lookups, cap or model; unpublished or bad step → 404 before the cap', async () => {
    expect((await call({ messages: [{ role: 'user', text: 'how do I rewire the fuse box?' }] })).status).toBe(422)
    expect((await call({ stepIdx: 5 })).status).toBe(404)
    db = seed('ready')
    expect((await call()).status).toBe(404)
    expect(caps.kinds).toEqual([])
    expect(meta.sparkJson).not.toHaveBeenCalled()
  })
  test('the last message must be the learner’s; history is capped; model errors are honest', async () => {
    expect((await call({ messages: [{ role: 'assistant', text: 'hi' }] })).status).toBe(400)
    expect((await call({ messages: Array.from({ length: 13 }, () => ({ role: 'user', text: 'x' })) })).status).toBe(400)
    meta.sparkJson.mockRejectedValue(new Error('timeout'))
    expect((await call()).status).toBe(504)
    meta.sparkJson.mockResolvedValue({ nope: true })
    expect((await call()).status).toBe(502)
  })
})

describe('POST /api/listen', () => {
  const send = (opts: { type?: string; size?: number; guideId?: string } = {}) => listen(new Request('http://x/api/listen', {
    method: 'POST', headers: { 'content-type': opts.type ?? 'audio/wav', 'x-meta': encodeURIComponent(JSON.stringify({ guideId: opts.guideId ?? ID })) }, body: new Uint8Array(opts.size ?? 1000),
  }))
  beforeEach(() => { db = seed(); caps.ok = true; caps.kinds = []; meta.transcribe.mockReset() })

  test('spoken question → text, only for a published guide', async () => {
    meta.transcribe.mockResolvedValue([{ transcript: 'which way' }, { transcript: 'do I twist' }])
    expect(await (await send()).json()).toEqual({ text: 'which way do I twist' })
    db = seed('ready')
    expect((await send()).status).toBe(404)
  })
  test('silence → 422; too large → 413; wrong type → 415', async () => {
    meta.transcribe.mockResolvedValue([])
    expect((await send()).status).toBe(422)
    expect((await send({ size: 1_200_000 })).status).toBe(413)
    expect((await send({ type: 'audio/mpeg' })).status).toBe(415)
  })
})
