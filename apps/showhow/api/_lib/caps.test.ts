import { describe, expect, test, vi } from 'vitest'
import { enforceCaps } from './caps'
import { HttpError } from './http'

const rpc = (results: Record<string, boolean>) =>
  vi.fn(async (_fn: string, args: { p_kind: string; p_limit: number }) => ({ data: results[args.p_kind.split(':')[0]] ?? true, error: null }))

describe('enforceCaps', () => {
  test('passes when every counter is under its limit', async () => {
    const r = rpc({})
    await expect(enforceCaps(r, 'check', 'abc')).resolves.toBeUndefined()
    expect(r.mock.calls.map(c => c[1].p_kind)).toEqual(['check', 'check-ip:abc'])
  })
  test('429 with a plain message when the daily total is used up', async () => {
    await expect(enforceCaps(rpc({ check: false }), 'check', 'abc')).rejects.toMatchObject({ status: 429 })
  })
  test('429 when one visitor hits their own limit', async () => {
    await expect(enforceCaps(rpc({ 'check-ip': false }), 'check', 'abc')).rejects.toBeInstanceOf(HttpError)
  })
  test('fails closed if the counter itself errors', async () => {
    const broken = vi.fn(async () => ({ data: null, error: { message: 'db down' } }))
    await expect(enforceCaps(broken, 'build', 'abc')).rejects.toMatchObject({ status: 503 })
  })
})
