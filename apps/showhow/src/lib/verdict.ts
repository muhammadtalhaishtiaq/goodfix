import { z } from 'zod'
import type { Outline } from './types'

export const VerdictSchema = z.object({
  status: z.enum(['match', 'differs', 'unclear']),
  differences: z.array(z.object({
    part: z.string().min(1).max(60),
    sam_noun: z.string().min(1).max(40),
    note: z.string().min(1).max(200),
  })).max(3),
  message: z.string().min(1).max(400),
}).refine(v => v.status !== 'differs' || v.differences.length > 0, 'differs needs at least one difference')

export type ModelVerdict = z.infer<typeof VerdictSchema>

// Sent as response_format.json_schema.schema; Meta constrains output to it, zod re-checks.
export const verdictJsonSchema = z.toJSONSchema(VerdictSchema)

export function verdictPrompt(stepTitle: string, instruction: string, question?: string): string {
  return [
    'You check a learner\'s work for one step of a how-to guide.',
    'Image 1 is the creator\'s reference photo at the end of this step. Image 2 is the learner\'s photo.',
    `Step: ${stepTitle}. ${instruction}`,
    question ? `The learner asks: ${question}` : '',
    'Judge only what is visible.',
    '- "unclear": image 2 is too blurry or dark, or does not show the area this step is about.',
    '- "match": image 2 matches the reference in everything that matters for this step.',
    '- "differs": something visible that matters for this step differs (wrong part, wrong way round, missing, wrong position). List up to 3 differences.',
    'For each difference: "part" is a short human name; "sam_noun" is ONE simple, common word for that object as it appears in image 2 (e.g. "tank", not "water tank"), no positions or directions; "note" says what differs.',
    '"message" is one or two plain sentences to the learner. Never give safety, medical or electrical advice.',
  ].filter(Boolean).join('\n')
}

export function parseVerdict(text: string): ModelVerdict | null {
  try {
    const r = VerdictSchema.safeParse(JSON.parse(text))
    return r.success ? r.data : null
  } catch {
    return null
  }
}

// What the learner may be shown: an outline only for differs, and only one SAM actually returned.
export function gateVerdict(verdict: ModelVerdict, outline: Outline | null) {
  return { verdict, outline: verdict.status === 'differs' ? outline : null }
}
