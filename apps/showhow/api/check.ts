// POST /api/check: "I'm stuck" (T5). The learner photo is compared with the step's REAL keyframe,
// never an AI image. The photo exists only in this request's memory and is sent with store:false.
import { z } from 'zod'
import { bestOutline, parseSamBoxes } from '../src/lib/sam.js'
import { blockedTopic } from '../src/lib/safety.js'
import { gateVerdict, verdictJsonSchema, verdictPrompt, VerdictSchema } from '../src/lib/verdict.js'
import { enforceCaps } from './_lib/caps.js'
import { serverDb } from './_lib/db.js'
import { HttpError, ipKey, route } from './_lib/http.js'
import { samText, sparkJson } from './_lib/meta.js'

const Body = z.object({
  guideId: z.uuid(),
  stepIdx: z.number().int().min(0).max(7),
  mode: z.literal('stuck'),
  photo: z.string().regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/).max(2_100_000), // ≈1.5 MB JPEG
  question: z.string().trim().max(300).optional(),
})

const noAnswer = () => new HttpError(504, 'The checker didn’t answer. Nothing was saved. Please try again.')

export const POST = route({ name: 'check', body: Body, maxBytes: 2_200_000 }, async ({ body, ip }) => {
  const db = serverDb()

  const { data: g } = await db.from('guides').select('id, kind').eq('id', body.guideId).eq('status', 'published').maybeSingle()
  if (!g) throw new HttpError(404, 'That guide doesn’t exist or isn’t published.')
  if (g.kind !== 'video') throw new HttpError(409, 'This guide has no real photos to compare with.')
  const { data: step } = await db.from('steps').select('title, instruction, keyframe_path').eq('guide_id', g.id).eq('idx', body.stepIdx).maybeSingle()
  if (!step?.keyframe_path) throw new HttpError(409, 'This step has no reference frame to compare with.')
  await enforceCaps((fn, args) => db.rpc(fn, args), 'check', ipKey(ip)) // after the lookups: refused requests don't spend it
  const reference = db.storage.from('media').getPublicUrl(step.keyframe_path).data.publicUrl

  let raw: unknown
  try {
    raw = await sparkJson([
      { type: 'input_text', text: verdictPrompt(step.title, step.instruction, body.question) },
      { type: 'input_image', image_url: reference },
      { type: 'input_image', image_url: body.photo },
    ], 'verdict', verdictJsonSchema, 60_000)
  } catch { throw noAnswer() }
  const parsed = VerdictSchema.safeParse(raw)
  if (!parsed.success) throw new HttpError(502, 'The checker gave an answer we couldn’t use. Nothing was saved. Please try again.')
  // Defence in depth against a steered answer: never show text that touches a blocked topic.
  if (blockedTopic(`${parsed.data.message} ${parsed.data.differences.map(d => d.note).join(' ')}`)) {
    return { mode: 'stuck', verdict: { status: 'unclear', differences: [], message: 'We can only check whether your photo matches this step.' }, outline: null, fixture: false }
  }

  let outline = null
  if (parsed.data.status === 'differs') {
    try { outline = bestOutline(parseSamBoxes(await samText(body.photo, parsed.data.differences[0].sam_noun))) } catch { outline = null } // a verdict without a box is still honest
  }
  return { mode: 'stuck', ...gateVerdict(parsed.data, outline), fixture: false }
})
