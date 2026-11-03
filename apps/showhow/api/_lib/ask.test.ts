import { beforeEach, describe, expect, test, vi } from 'vitest'
import { NOT_COVERED } from '../../src/lib/ask'
import { fakeDb } from './fake-db'

const ID = '8d0c1c3e-6a5f-4f7e-9b0a-2f6d1f5b7a11'
let db = fakeDb()
const meta = { sparkJson: vi.fn() }
const caps = { ok: true, kinds: [] as string[] }
vi.mock('./db', () => ({ serverDb: () => ({ ...db, rpc: async (_: string, a: { p_kind: string }) => { caps.kinds.push(a.p_kind); return { data: caps.ok, error: null } } }) }))
vi.mock('./meta', () => ({ sparkJson: (...a: unknown[]) => meta.sparkJson(...a) }))
const { POST } = await import('../ask')

const seed = (g: Record<string, unknown> = {}) => fakeDb({
  guides: [{ id: ID, status: 'published', kind: 'voice', ...g }],
  steps: [ // stored out of order on purpose
    { guide_id: ID, idx: 1, title: 'Load bottom rack', instruction: 'Plates face the middle.', tip_quote: null },
    { guide_id: ID, idx: 0, title: 'Scrape plates', instruction: 'No need to rinse.', tip_quote: 'everyone skips this' },
  ],
})
const call = (b: Record<string, unknown> = {}) => POST(new Request('http://x/api/ask', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ guideId: ID, stepIdx: 0, question: 'Do I rinse first?', ...b }),
}))
const prompt = () => (meta.sparkJson.mock.calls[0][0] as { text: string }[])[0].text

describe('POST /api/ask', () => {
  beforeEach(() => { db = seed(); caps.ok = true; caps.kinds = []; meta.sparkJson.mockReset() })

  test('answers from the guide’s own steps, in order, with the current step marked', async () => {
    meta.sparkJson.mockResolvedValue({ answer: 'No, just scrape.', covered: true, stepRefs: [1] })
    const res = await call()
    expect(await res.json()).toEqual({ answer: 'No, just scrape.', covered: true, stepRefs: [0] })
    expect(prompt()).toMatch(/>> Step 1: Scrape plates[\s\S]*Step 2: Load bottom rack/)
    expect(prompt()).toContain('"""\nDo I rinse first?\n"""')
    expect(caps.kinds[0]).toBe('ask')
  })
  test('not covered → plain message, no outside advice', async () => {
    meta.sparkJson.mockResolvedValue({ answer: 'Use bleach.', covered: false, stepRefs: [] })
    expect(((await (await call()).json()) as { answer: string }).answer).toBe(NOT_COVERED)
  })
  test('a blocked-topic question → 422 before any model call or cap', async () => {
    const res = await call({ question: 'how do I open the fuse box?' })
    expect(res.status).toBe(422)
    expect(meta.sparkJson).not.toHaveBeenCalled()
    expect(caps.kinds).toEqual([])
  })
  test('malformed output → 502; model error → 504; never a made-up answer', async () => {
    meta.sparkJson.mockResolvedValue({ reply: 'hi' })
    expect((await call()).status).toBe(502)
    meta.sparkJson.mockRejectedValue(new DOMException('timeout', 'TimeoutError'))
    const res = await call()
    expect(res.status).toBe(504)
    expect(((await res.json()) as { error: string }).error).toMatch(/try again/i)
  })
  test('daily cap → 429 before any model call', async () => {
    caps.ok = false
    expect((await call()).status).toBe(429)
    expect(meta.sparkJson).not.toHaveBeenCalled()
  })
  test('unpublished guide or missing step → 404', async () => {
    db = seed({ status: 'ready' }); expect((await call()).status).toBe(404)
    db = seed(); expect((await call({ stepIdx: 5 })).status).toBe(404)
    expect(meta.sparkJson).not.toHaveBeenCalled()
  })
  test('validates the body', async () => {
    expect((await call({ question: '   ' })).status).toBe(400)
    expect((await call({ question: 'q'.repeat(301) })).status).toBe(400)
    expect((await call({ guideId: 'nope' })).status).toBe(400)
  })
})
