// POST /api/voice-guides: spoken how-to → guide (T17). Raw audio/wav body; details in the x-meta header.
// NOTHING is stored until both safety layers pass. Every failure (including model errors) blocks.
import { z } from 'zod'
import { blockedTopic, gateReview, reviewJsonSchema, reviewPrompt } from '../src/lib/safety.js'
import { stepsJsonSchema, stepsPrompt, validateSteps, type Turn } from '../src/lib/steps.js'
import { STYLE_IDS } from '../src/lib/styles.js'
import { enforceCaps } from './_lib/caps.js'
import { CategoryField, TitleField } from './_lib/fields.js'
import { serverDb } from './_lib/db.js'
import { HttpError, ipKey, route } from './_lib/http.js'
import { sparkJson, transcribe } from './_lib/meta.js'

const Meta = z.object({
  title: TitleField,
  category: CategoryField,
  creatorName: z.string().trim().min(1).max(60),
  style: z.enum(STYLE_IDS),
  consent: z.literal(true),
  adult: z.literal(true),
})
const nothingSaved = (msg: string) => new HttpError(422, `${msg} Nothing was saved.`)

export const POST = route({ name: 'voice-guides', body: Meta, accessCode: true, raw: 'audio/wav', maxBytes: 4_200_000 }, async ({ body, raw, ip }) => {
  const db = serverDb()
  await enforceCaps((fn, args) => db.rpc(fn, args), 'build', ipKey(ip))

  let turns: Turn[]
  try { turns = await transcribe(raw!) } catch { throw new HttpError(504, 'We couldn’t transcribe the recording. Nothing was saved. Please try again.') }
  const text = turns.map(t => t.transcript).join(' ')
  if (turns.length < 2 || text.length < 40) throw nothingSaved('We couldn’t hear enough to build a guide.')

  const topic = blockedTopic(text) // layer 1: hard rules
  if (topic) throw nothingSaved(`This topic isn’t allowed here (${topic}).`)

  let review: unknown = null // layer 2: model review; an error leaves null, which gateReview blocks
  try { review = await sparkJson([{ type: 'input_text', text: reviewPrompt(text) }], 'review', reviewJsonSchema, 45_000) } catch { /* fail closed */ }
  const gate = gateReview(review)
  if (!gate.pass) throw nothingSaved(gate.reason)

  let rawSteps: unknown
  try { rawSteps = await sparkJson([{ type: 'input_text', text: stepsPrompt(turns, 'voice') }], 'steps', stepsJsonSchema, 120_000) } catch { throw new HttpError(504, 'The step builder didn’t answer. Nothing was saved. Please try again.') }
  const result = validateSteps(rawSteps, turns)
  if (!result.ok) throw nothingSaved('We couldn’t turn this into clear steps. Try saying each step in order.')

  // Both gates passed: only now does anything get written.
  const { data: g, error } = await db.from('guides').insert({
    title: body.title || gate.title, category: body.category === 'auto' ? gate.category : body.category,
    auto_title: !body.title, auto_category: body.category === 'auto', creator_name: body.creatorName, kind: 'voice', status: 'ready',
    image_style: body.style, subject: gate.subject, turns, duration_s: turns[turns.length - 1].endMs / 1000,
  }).select('id').single()
  if (error || !g) throw new Error('guide insert failed')
  const { error: e2 } = await db.from('steps').insert(result.steps.map(s => ({
    guide_id: g.id, idx: s.idx, title: s.title, instruction: s.instruction, tip_quote: s.tipQuote ?? null,
    start_s: s.startS, end_s: s.endS, key_part: s.keyPart, sam_noun: s.samNoun,
  })))
  if (e2) { await db.from('guides').delete().eq('id', g.id); throw new Error('steps insert failed') }
  return { id: g.id, steps: result.steps, missing: gate.missing, title: body.title || gate.title, category: body.category === 'auto' ? gate.category : body.category }
})
