// POST /api/listen: a learner's SPOKEN chat question → text (2026-11-03). Raw 16 kHz WAV, ≤ ~30 s, only for a
// published guide. The audio exists only in this request: never stored or logged; Voice Transcribe has no storage.
import { z } from 'zod'
import { enforceCaps } from './_lib/caps.js'
import { serverDb } from './_lib/db.js'
import { HttpError, ipKey, route } from './_lib/http.js'
import { transcribe } from './_lib/meta.js'

const Meta = z.object({ guideId: z.uuid() })

export const POST = route({ name: 'listen', body: Meta, raw: 'audio/wav', maxBytes: 1_100_000 }, async ({ body, raw, ip }) => {
  const db = serverDb()
  const { data: g } = await db.from('guides').select('id').eq('id', body.guideId).eq('status', 'published').maybeSingle()
  if (!g) throw new HttpError(404, 'That guide doesn’t exist or isn’t published.')
  await enforceCaps((fn, args) => db.rpc(fn, args), 'ask', ipKey(ip))
  let text: string
  try { text = (await transcribe(raw!)).map(t => t.transcript).join(' ').trim() } catch { throw new HttpError(504, 'We couldn’t hear that just now. Please try again or type it.') }
  if (text.length < 2) throw new HttpError(422, 'We couldn’t hear a question. Try again a little closer to the mic, or type it.')
  return { text: text.slice(0, 400) }
})
