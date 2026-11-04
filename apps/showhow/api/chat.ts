// POST /api/chat: the step chat (2026-11-03). Grounded in ONE published guide's steps + narration, plus an
// optional labelled AI tip (lib/chat.ts). Messages exist only in this request: never stored or logged, store:false.
// speak:true also returns the reply read aloud (Wit.ai), only ever OUR reply text, never learner input.
import { z } from 'zod'
import { chatJsonSchema, chatPrompt, gateChat, MAX_HISTORY, replyText, type ChatStep } from '../src/lib/chat.js'
import { blockedTopic } from '../src/lib/safety.js'
import { enforceCaps } from './_lib/caps.js'
import { serverDb } from './_lib/db.js'
import { HttpError, ipKey, route } from './_lib/http.js'
import { sparkJson } from './_lib/meta.js'
import { speak } from './_lib/wit.js'

const Msg = z.object({ role: z.enum(['user', 'assistant']), text: z.string().trim().min(1).max(800) })
const Body = z.object({
  guideId: z.uuid(),
  stepIdx: z.number().int().min(0).max(7),
  messages: z.array(Msg).min(1).max(MAX_HISTORY).refine(m => m[m.length - 1].role === 'user' && m[m.length - 1].text.length <= 400, 'The last message must be the learner’s, up to 400 characters.'),
  speak: z.boolean().optional(),
})

export const POST = route({ name: 'chat', body: Body, maxBytes: 16_000 }, async ({ body, ip }) => {
  const question = body.messages[body.messages.length - 1].text
  if (blockedTopic(question)) throw new HttpError(422, 'That topic isn’t one this guide can help with. Ask about the steps, or try “I’m stuck”.')
  const db = serverDb()
  const { data: g } = await db.from('guides').select('id, title, turns').eq('id', body.guideId).eq('status', 'published').maybeSingle()
  if (!g) throw new HttpError(404, 'That guide doesn’t exist or isn’t published.')
  const { data } = await db.from('steps').select('idx, title, instruction, tip_quote').eq('guide_id', g.id)
  const steps = [...((data ?? []) as ChatStep[])].sort((a, b) => a.idx - b.idx)
  if (!steps.some(s => s.idx === body.stepIdx)) throw new HttpError(404, 'That step doesn’t exist in this guide.')
  await enforceCaps((fn, args) => db.rpc(fn, args), 'ask', ipKey(ip)) // after the lookups: random ids can't spend the cap

  const narration = Array.isArray(g.turns) ? (g.turns as { transcript?: string }[]).map(t => t.transcript ?? '').join(' ') : undefined
  let raw: unknown
  try {
    raw = await sparkJson([{ type: 'input_text', text: chatPrompt({ title: g.title, steps, stepIdx: body.stepIdx, narration, history: body.messages }) }], 'chat', chatJsonSchema, 45_000)
  } catch { throw new HttpError(504, 'We couldn’t get an answer just now. Nothing was saved. Please try again.') }
  const reply = gateChat(raw, steps)
  if (!reply) throw new HttpError(502, 'We got an answer we couldn’t use. Nothing was saved. Please try again.')
  let audio: string | undefined
  if (body.speak) { try { audio = (await speak(replyText(reply).slice(0, 900))).toString('base64') } catch { /* text still works */ } }
  return { ...reply, audio }
})
