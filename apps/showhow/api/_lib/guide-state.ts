// Status gate + credit guard for every model-stage route (ARCHITECTURE §6). attempts counts consecutive
// runs of the current stage and resets when a stage succeeds (finishGuide).
// claimGuide atomically moves a guide to 'processing' and counts the attempt, so a double click,
// a retry storm or a replayed request can't run the models twice or more than MAX_ATTEMPTS times.
import type { serverDb } from './db.js'
import { HttpError } from './http.js'

type Db = ReturnType<typeof serverDb>
export type GuideRow = { id: string; status: string; attempts: number; kind: string; duration_s: number | null; turns: unknown; claimed_at?: string | null }
export const MAX_ATTEMPTS = 3
// Longer than any route can run (Vercel Hobby kills functions at 300 s), so an older claim is a dead run.
export const STALE_CLAIM_MS = 330_000
const isStale = (claimedAt?: string | null) => !claimedAt || Date.now() - Date.parse(claimedAt) > STALE_CLAIM_MS

export async function claimGuide(db: Db, id: string, from: string[]): Promise<GuideRow> {
  const { data: g } = await db.from('guides').select('id, status, attempts, kind, duration_s, turns, claimed_at').eq('id', id).maybeSingle()
  if (!g) throw new HttpError(404, 'That guide doesn’t exist.')
  // A run killed mid-flight (timeout) leaves 'processing' behind; after 330 s it may be retried.
  const takeover = g.status === 'processing' && isStale(g.claimed_at)
  if (g.status === 'processing' && !takeover) throw new HttpError(409, 'This guide is already being processed.')
  if (!takeover && !from.includes(g.status)) throw new HttpError(409, 'This step has already been done for this guide.')
  if (g.attempts >= MAX_ATTEMPTS) throw new HttpError(429, 'This video couldn’t be processed after 3 tries. Try a shorter, clearer clip.')
  const { data: won } = await db.from('guides').update({ status: 'processing', attempts: g.attempts + 1, error: null, claimed_at: new Date().toISOString() })
    .eq('id', id).eq('status', g.status).eq('attempts', g.attempts).select('id')
  if (!won?.length) throw new HttpError(409, 'This guide is already being processed.')
  return { ...g, attempts: g.attempts + 1 } as GuideRow
}

// A stage succeeded: back to `status` and reset the counter, so attempts count consecutive failures of one stage.
export async function finishGuide(db: Db, id: string, status: string, extra: Record<string, unknown> = {}) {
  await db.from('guides').update({ status, attempts: 0, error: null, ...extra }).eq('id', id)
}

// Record a plain, user-facing reason; never upstream error text. Later stages fall back to 'ready'
// (their steps already exist) rather than 'failed'.
export async function failGuide(db: Db, id: string, e: unknown, status: 'failed' | 'ready' = 'failed') {
  const error = e instanceof HttpError ? e.message : 'Something went wrong while building this guide. You can try again.'
  await db.from('guides').update({ status, error }).eq('id', id)
}
