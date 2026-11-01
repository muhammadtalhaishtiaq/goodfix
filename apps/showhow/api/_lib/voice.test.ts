import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fakeDb, settle } from './fake-db'

let db = fakeDb()
let capOk = true
let nextId = 1
const meta = { transcribe: vi.fn(), sparkJson: vi.fn(), generateImage: vi.fn(), editImage: vi.fn() }
vi.mock('./db', () => ({
  serverDb: () => ({
    ...db,
    rpc: async () => ({ data: capOk, error: null }),
    from: (t: string) => {
      const q = db.from(t)
      // fake insert().select().single() for the guide row
      return t === 'guides' ? { ...q, insert: (row: Record<string, unknown>) => { const r = { id: `00000000-0000-4000-8000-00000000000${nextId++}`, ...row }; db.tables.guides.push(r); return { select: () => ({ single: async () => ({ data: { id: r.id }, error: null }) }) } } } : q
    },
  }),
}))
vi.mock('./meta', () => Object.fromEntries(Object.keys(meta).map(k => [k, (...a: unknown[]) => (meta as Record<string, (...x: unknown[]) => unknown>)[k](...a)])))
const { POST: voiceGuides } = await import('../voice-guides')
const { POST: voiceImages } = await import('../voice-images')

const turns = [
  { startMs: 0, endMs: 5000, transcript: 'First press the latch on the side and the water tank pops out.' },
  { startMs: 6000, endMs: 12000, transcript: 'Then fill it with cold water up to the max line and slide it back in.' },
]
const review = { is_howto: true, complete: true, safety: 'ok', category: 'Home', subject: 'white air purifier with a side water tank', title: 'Refill the purifier tank', missing: [], reason: 'clear' }
const steps = { steps: [
  { title: 'Release the tank', first_turn: 0, last_turn: 0, instruction: 'Press the latch.', tip_quote: '', key_part: 'Latch', sam_noun: 'latch' },
  { title: 'Refill the tank', first_turn: 1, last_turn: 1, instruction: 'Fill to MAX.', tip_quote: '', key_part: 'Water tank', sam_noun: 'tank' },
] }
const metaHeader = (m: Record<string, unknown> = {}) => encodeURIComponent(JSON.stringify({ title: 'Purifier water', category: 'Home', creatorName: 'Talha', style: 'flat', consent: true, adult: true, ...m }))
const send = async (opts: { type?: string; size?: number; meta?: string; code?: string } = {}) => settle(await voiceGuides(new Request('http://x/api/voice-guides', {
  method: 'POST',
  headers: { 'content-type': opts.type ?? 'audio/wav', 'x-meta': opts.meta ?? metaHeader(), 'x-access-code': opts.code ?? 'good' },
  body: new Uint8Array(opts.size ?? 1000),
})))
const nothingSaved = () => { expect(db.tables.guides).toEqual([]); expect(db.tables.steps).toEqual([]) }

describe('POST /api/voice-guides', () => {
  beforeEach(() => {
    vi.stubEnv('CREATE_ACCESS_CODES', 'good'); db = fakeDb(); capOk = true
    meta.transcribe.mockReset().mockResolvedValue(turns)
    meta.sparkJson.mockReset().mockImplementation(async (_c: unknown, name: string) => (name === 'review' ? review : steps))
  })

  test('a clear, safe how-to becomes a voice guide only after both gates pass', async () => {
    const res = await send()
    expect(res.status).toBe(200)
    expect(res.headers.get('x-stages')).toBe('transcribed,topic_rules,reviewed,steps,done')
    expect(db.tables.guides[0]).toMatchObject({ kind: 'voice', status: 'ready', image_style: 'flat', subject: review.subject, duration_s: 12 })
    expect(db.tables.steps.map(s => s.title)).toEqual(['Release the tank', 'Refill the tank'])
    expect(meta.sparkJson.mock.calls.map(c => c[1])).toEqual(['review', 'steps'])
  })
  test('blank title and "auto" category are filled from the review', async () => {
    meta.sparkJson.mockImplementation(async (_c: unknown, name: string) => (name === 'review' ? { ...review, category: 'Cleaning' } : steps))
    const res = await send({ meta: metaHeader({ title: '', category: 'auto' }) })
    expect(res.status).toBe(200)
    expect(db.tables.guides[0]).toMatchObject({ title: 'Refill the purifier tank', category: 'Cleaning', auto_title: true, auto_category: true })
  })
  test('a possibly-missing step is returned as advice; the guide is still built', async () => {
    meta.sparkJson.mockImplementation(async (_c: unknown, name: string) => (name === 'review' ? { ...review, complete: false, missing: ['pour out the old water'] } : steps))
    const res = await send()
    expect(res.status).toBe(200)
    expect(((await res.json()) as { missing: string[] }).missing).toEqual(['pour out the old water'])
  })
  test('layer 1: a blocked topic is refused before any model review, nothing saved', async () => {
    meta.transcribe.mockResolvedValue([turns[0], { ...turns[1], transcript: 'then open the fuse box and swap the live wire carefully' }])
    const res = await send()
    expect(res.status).toBe(422)
    expect(((await res.json()) as { error: string }).error).toMatch(/mains electrical.*Nothing was saved/)
    expect(meta.sparkJson).not.toHaveBeenCalled()
    nothingSaved()
  })
  test.each([
    ['unsafe review', { ...review, safety: 'blocked', reason: 'risk of injury' }, /isn’t allowed/],
    ['not a how-to', { ...review, is_howto: false, reason: 'just chatting' }, /doesn’t sound like a how-to/],
    ['malformed review', { nope: true }, /couldn’t check this recording/],
  ])('layer 2: %s is blocked, nothing saved', async (_l, r, msg) => {
    meta.sparkJson.mockImplementation(async (_c: unknown, name: string) => (name === 'review' ? r : steps))
    const res = await send()
    expect(res.status).toBe(422)
    expect(((await res.json()) as { error: string }).error).toMatch(msg)
    nothingSaved()
  })
  test('layer 2 fails closed when the review call itself errors', async () => {
    meta.sparkJson.mockImplementation(async (_c: unknown, name: string) => { if (name === 'review') throw new Error('Meta 503'); return steps })
    expect((await send()).status).toBe(422)
    nothingSaved()
  })
  test('too little speech, bad steps, and transcription errors save nothing', async () => {
    meta.transcribe.mockResolvedValueOnce(turns.slice(0, 1)); expect((await send()).status).toBe(422)
    meta.sparkJson.mockImplementation(async (_c: unknown, name: string) => (name === 'review' ? review : { steps: [] })); expect((await send()).status).toBe(422)
    meta.transcribe.mockRejectedValueOnce(new Error('Meta 500')); expect((await send()).status).toBe(504)
    nothingSaved()
  })
  test('transport rules: audio/wav only, ≤4.2 MB, details required, access code, caps', async () => {
    expect((await send({ type: 'application/json' })).status).toBe(415)
    expect((await send({ size: 4_300_000 })).status).toBe(413)
    expect((await send({ meta: 'not-json' })).status).toBe(400)
    expect((await send({ meta: metaHeader({ consent: false }) })).status).toBe(400)
    expect((await send({ meta: metaHeader({ style: 'neon' }) })).status).toBe(400)
    expect((await send({ code: 'bad' })).status).toBe(401)
    capOk = false; expect((await send()).status).toBe(429)
    expect(meta.transcribe).not.toHaveBeenCalled()
  })
})

describe('POST /api/voice-images (base, then one call per step)', () => {
  const ID = '8d0c1c3e-6a5f-4f7e-9b0a-2f6d1f5b7a11'
  const seed = (kind = 'voice', withBase = false) => fakeDb({
    guides: [{ id: ID, status: 'ready', attempts: 0, kind, subject: 'white air purifier', image_style: 'clay' }],
    steps: [0, 1].map(idx => ({ guide_id: ID, idx, instruction: `do ${idx}`, key_part: ['Latch', 'Tank'][idx], image_path: null })),
    files: withBase ? { [`${ID}/base.jpg`]: new Blob(['base']) } : {},
  })
  const call = (idx?: number) => voiceImages(new Request('http://x', { method: 'POST', headers: { 'x-access-code': 'good' }, body: JSON.stringify({ guideId: ID, ...(idx === undefined ? {} : { idx }) }) }))
  beforeEach(() => {
    vi.stubEnv('CREATE_ACCESS_CODES', 'good'); db = seed(); capOk = true
    meta.generateImage.mockReset().mockResolvedValue(Buffer.from('base'))
    meta.editImage.mockReset().mockImplementation(async (ref: Buffer, prompt: string) => Buffer.from(prompt.includes('circle') ? `focus(${ref})` : `step(${ref})`))
  })

  test('base mode draws one base image in the chosen style and lists the steps', async () => {
    expect(await (await call()).json()).toEqual({ base: true, steps: [0, 1] })
    expect(meta.generateImage.mock.calls[0][0]).toMatch(/white air purifier.*3D clay render/)
    expect(await db.files[`${ID}/base.jpg`].text()).toBe('base')
    expect(db.tables.guides[0]).toMatchObject({ status: 'ready', attempts: 0 })
  })
  test('each step is an edit OF THE BASE (not chained), then a highlight edit', async () => {
    db = seed('voice', true)
    expect(await (await call(1)).json()).toEqual({ idx: 1, ok: true })
    expect(String(meta.editImage.mock.calls[0][0])).toBe('base')
    expect(await db.files[`${ID}/1-ai.jpg`].text()).toBe('step(base)')
    expect(await db.files[`${ID}/1-ai-focus.jpg`].text()).toBe('focus(step(base))')
    expect(db.tables.steps.map(s => s.image_path)).toEqual([null, `${ID}/1-ai.jpg`])
  })
  test('a failed step just has no illustration', async () => {
    db = seed('voice', true)
    meta.editImage.mockRejectedValue(new Error('content_policy_violation'))
    expect(await (await call(0)).json()).toEqual({ idx: 0, ok: false })
    expect(db.tables.steps[0].image_path).toBeNull()
  })
  test('a step before the base exists → 409; base failure → 502 and the guide stays ready', async () => {
    expect((await call(0)).status).toBe(409)
    meta.generateImage.mockRejectedValue(new Error('Meta 503'))
    expect((await call()).status).toBe(502)
    expect(db.tables.guides[0]).toMatchObject({ status: 'ready', attempts: 1 })
  })
  test('video guides never get illustrations; the image cap applies to every call', async () => {
    db = seed('video', true)
    expect((await call()).status).toBe(409)
    expect((await call(0)).status).toBe(409)
    db = seed('voice', true); capOk = false
    expect((await call(0)).status).toBe(429)
    expect(meta.generateImage).not.toHaveBeenCalled()
  })
})
