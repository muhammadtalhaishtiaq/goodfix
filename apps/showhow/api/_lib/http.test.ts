import { describe, expect, test, vi } from 'vitest'
import { z } from 'zod'
import { checkAccessCode, hashIp, HttpError, redact, route } from './http'

describe('checkAccessCode', () => {
  test('accepts any configured code, trimmed', () => {
    expect(checkAccessCode('beta-two', 'alpha-one, beta-two')).toBe(true)
  })
  test('rejects missing, wrong, or empty config', () => {
    expect(checkAccessCode(null, 'alpha')).toBe(false)
    expect(checkAccessCode('alph', 'alpha')).toBe(false)
    expect(checkAccessCode('', '')).toBe(false)
    expect(checkAccessCode('x', undefined)).toBe(false)
  })
})

describe('redact', () => {
  test('keeps only allow-listed, non-content fields', () => {
    expect(redact({ route: 'check', status: 200, ms: 12, model: 'sam-3.1', photo: 'data:...', prompt: 'hi', key: 'secret' }))
      .toEqual({ route: 'check', status: 200, ms: 12, model: 'sam-3.1' })
  })
})

describe('hashIp', () => {
  test('is stable, salted, and never the raw IP', () => {
    expect(hashIp('1.2.3.4', 's')).toBe(hashIp('1.2.3.4', 's'))
    expect(hashIp('1.2.3.4', 's')).not.toContain('1.2.3.4')
    expect(hashIp('1.2.3.4', 's')).not.toBe(hashIp('1.2.3.4', 't'))
  })
})

describe('route', () => {
  const Body = z.object({ n: z.number() })
  const post = (body: string, headers: Record<string, string> = {}) =>
    new Request('http://x/api/t', { method: 'POST', body, headers: { 'content-type': 'application/json', ...headers } })

  test('validates the body and returns JSON', async () => {
    const h = route({ name: 't', body: Body }, async ({ body }) => ({ doubled: body.n * 2 }))
    const res = await h(post('{"n":2}'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ doubled: 4 })
  })
  test('400 on bad JSON or schema mismatch, without echoing input', async () => {
    const h = route({ name: 't', body: Body }, async () => ({}))
    expect((await h(post('nope'))).status).toBe(400)
    const res = await h(post('{"n":"secret-ish"}'))
    expect(res.status).toBe(400)
    expect(await res.text()).not.toContain('secret-ish')
  })
  test('413 when the body is over the limit', async () => {
    const h = route({ name: 't', body: Body, maxBytes: 10 }, async () => ({}))
    expect((await h(post('{"n":1234567890}'))).status).toBe(413)
  })
  test('401 without a valid access code when required', async () => {
    vi.stubEnv('CREATE_ACCESS_CODES', 'good')
    const h = route({ name: 't', body: Body, accessCode: true }, async () => ({ ok: true }))
    expect((await h(post('{"n":1}'))).status).toBe(401)
    expect((await h(post('{"n":1}', { 'x-access-code': 'good' }))).status).toBe(200)
    vi.unstubAllEnvs()
  })
  test('500 with a generic message when the handler throws', async () => {
    const h = route({ name: 't', body: Body }, async () => { throw new Error('upstream said key=abc') })
    const res = await h(post('{"n":1}'))
    expect(res.status).toBe(500)
    expect(await res.text()).not.toContain('key=abc')
  })
  test('handler can return a typed error status', async () => {
    const h = route({ name: 't', body: Body }, async () => { throw new HttpError(429, 'Daily demo limit reached.') })
    const res = await h(post('{"n":1}'))
    expect(res.status).toBe(429)
    expect(((await res.json()) as { error: string }).error).toBe('Daily demo limit reached.')
  })
})

