// Status gate + credit guard for every model-stage route (ARCHITECTURE §6).
// claimGuide atomically moves a guide to 'processing' and counts the attempt, so a double click,
// a retry storm or a replayed request can't run the models twice or more than MAX_ATTEMPTS times.
import type { serverDb } from './db'
import { HttpError } from './http'

type Db = ReturnType<typeof serverDb>
export type GuideRow = { id: string; status: string; attempts: number; kind: string; duration_s: number | null; turns: unknown }
export const MAX_ATTEMPTS = 3

export async function claimGuide(db: Db, id: string, from: string[]): Promise<GuideRow> {
  const { data: g } = await db.from('guides').select('id, status, attempts, kind, duration_s, turns').eq('id', id).maybeSingle()
  if (!g) throw new HttpError(404, 'That guide doesn’t exist.')
  if (g.status === 'processing') throw new HttpError(409, 'This guide is already being processed.')
  if (!from.includes(g.status)) throw new HttpError(409, 'This step has already been done for this guide.')
  if (g.attempts >= MAX_ATTEMPTS) throw new HttpError(429, 'This video couldn’t be processed after 3 tries. Try a shorter, clearer clip.')
  const { data: won } = await db.from('guides').update({ status: 'processing', attempts: g.attempts + 1, error: null })
    .eq('id', id).eq('status', g.status).eq('attempts', g.attempts).select('id')
  if (!won?.length) throw new HttpError(409, 'This guide is already being processed.')
  return { ...g, attempts: g.attempts + 1 } as GuideRow
}

// Record a plain, user-facing reason; never upstream error text.
export async function failGuide(db: Db, id: string, e: unknown) {
  const error = e instanceof HttpError ? e.message : 'Something went wrong while building this guide. You can try again.'
  await db.from('guides').update({ status: 'failed', error }).eq('id', id)
}
