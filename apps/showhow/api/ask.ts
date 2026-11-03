// POST /api/ask: "Ask about this step" (F13+). Answered only from the published guide's own steps.
// The question exists only in this request (never stored or logged) and is sent with store:false.
import { z } from 'zod'
import { askJsonSchema, askPrompt, gateAnswer, type AskStep } from '../src/lib/ask.js'
import { blockedTopic } from '../src/lib/safety.js'
import { enforceCaps } from './_lib/caps.js'
import { serverDb } from './_lib/db.js'
import { HttpError, ipKey, route } from './_lib/http.js'
import { sparkJson } from './_lib/meta.js'

const Body = z.object({
  guideId: z.uuid(),
  stepIdx: z.number().int().min(0).max(7),
  question: z.string().trim().min(1).max(300),
})

export const POST = route({ name: 'ask', body: Body, maxBytes: 4_000 }, async ({ body, ip }) => {
  if (blockedTopic(body.question)) throw new HttpError(422, 'We can only answer questions about what this guide covers, and that topic isn’t one we can help with.')
  const db = serverDb()
  const { data: g } = await db.from('guides').select('id').eq('id', body.guideId).eq('status', 'published').maybeSingle()
  if (!g) throw new HttpError(404, 'That guide doesn’t exist or isn’t published.')
  const { data } = await db.from('steps').select('idx, title, instruction, tip_quote').eq('guide_id', g.id)
  const steps = [...((data ?? []) as AskStep[])].sort((a, b) => a.idx - b.idx)
  if (!steps.some(s => s.idx === body.stepIdx)) throw new HttpError(404, 'That step doesn’t exist in this guide.')
  await enforceCaps((fn, args) => db.rpc(fn, args), 'ask', ipKey(ip)) // after the lookups: random ids can't spend the cap

  let raw: unknown
  try {
    raw = await sparkJson([{ type: 'input_text', text: askPrompt(steps, body.stepIdx, body.question) }], 'answer', askJsonSchema, 45_000)
  } catch { throw new HttpError(504, 'We couldn’t get an answer just now. Nothing was saved. Please try again.') }
  const answer = gateAnswer(raw, steps)
  if (!answer) throw new HttpError(502, 'We got an answer we couldn’t use. Nothing was saved. Please try again.')
  return answer
})
