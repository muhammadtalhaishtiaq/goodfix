// Daily caps that protect the Meta credits. Counters live in Postgres (bump_usage), so they hold
// across serverless instances. Fails closed: if counting fails, the request is refused.
import { HttpError } from './http.js'

type Rpc = (fn: string, args: { p_kind: string; p_limit: number }) => PromiseLike<{ data: unknown; error: unknown }>

// ponytail: fixed demo-sized limits; move to env vars if they need changing after deploy.
const LIMITS = {
  check: { total: 300, perIp: 40 },   // "I'm stuck" checks
  ask: { total: 1500, perIp: 200 },   // step chat: one text-only Muse Spark call per message (+ one Voice Transcribe per spoken question)
  image: { total: 1000, perIp: 1000 }, // Muse Image runs (≈ $0.01 each, ≤ $10/day). Needs an access code, so no separate per-IP squeeze; the total is a runaway guard
  build: { total: 40, perIp: 12 },    // video or voice guides built (a creator filming 3–4 guides with retries fits)
} as const

// Per-IP first: a visitor already over their own limit must not keep spending the shared total.
export async function enforceCaps(rpc: Rpc, kind: keyof typeof LIMITS, ipHash: string) {
  const limits = LIMITS[kind]
  for (const [counter, limit] of [[`${kind}-ip:${ipHash}`, limits.perIp], [kind, limits.total]] as const) {
    const { data, error } = await rpc('bump_usage', { p_kind: counter, p_limit: limit })
    if (error) throw new HttpError(503, 'We couldn’t check today’s usage, so nothing was sent. Please try again shortly.')
    if (data !== true) throw new HttpError(429, 'Today’s demo limit is reached. Viewing guides still works.')
  }
}
