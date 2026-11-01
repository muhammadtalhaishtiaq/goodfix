import { z } from 'zod'
import type { Step } from './types'

export type Turn = { startMs: number; endMs: number; transcript: string }

export const StepsSchema = z.object({
  steps: z.array(z.object({
    title: z.string().min(1).max(60),
    first_turn: z.number().int().min(0),
    last_turn: z.number().int().min(0),
    instruction: z.string().min(1).max(300),
    tip_quote: z.string().max(200),
    key_part: z.string().min(1).max(60),
    sam_noun: z.string().min(1).max(40),
  })).min(2).max(8),
})

export const stepsJsonSchema = z.toJSONSchema(StepsSchema)

export function stepsPrompt(turns: Turn[], source: 'video' | 'voice' = 'video'): string {
  return [
    source === 'video'
      ? 'This is a creator\'s narrated how-to video. Their speech is transcribed below as numbered turns.'
      : 'A creator explained a how-to task out loud (no video). Their speech is transcribed below as numbered turns.',
    ...turns.map((t, i) => `[${i}] (${(t.startMs / 1000).toFixed(1)}s) ${t.transcript}`),
    '',
    'Split the task into 2-8 steps in order. Each step covers consecutive turns (first_turn..last_turn); steps must not overlap. Skip greetings and sign-offs.',
    'title: imperative, at most 6 words. instruction: 1-2 sentences using only what the creator says or visibly does in those turns. Never add advice they did not give.',
    'tip_quote: an exact quote from those turns that is a useful tip, or "" if none.',
    'key_part: the main object handled in the step. sam_noun: ONE simple, common word for it (e.g. "tank", not "water tank"; "tap", not "faucet handle"), no positions or directions.',
  ].join('\n')
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export type DraftStep = Omit<Step, 'outline'> & { samNoun: string }
export type StepsResult = { ok: true; steps: DraftStep[] } | { ok: false; reason: string }

export function validateSteps(raw: unknown, turns: Turn[]): StepsResult {
  const parsed = StepsSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, reason: 'Model output did not match the steps schema.' }
  const steps = parsed.data.steps
  let prevLast = -1
  for (const s of steps) {
    if (s.first_turn > s.last_turn || s.last_turn >= turns.length) return { ok: false, reason: 'A step points at turns that don’t exist.' }
    if (s.first_turn <= prevLast) return { ok: false, reason: 'Steps overlap or are out of order.' }
    prevLast = s.last_turn
  }
  return {
    ok: true,
    steps: steps.map((s, idx) => {
      const said = norm(turns.slice(s.first_turn, s.last_turn + 1).map(t => t.transcript).join(' '))
      const tip = s.tip_quote.trim()
      return {
        idx,
        title: s.title,
        instruction: s.instruction,
        tipQuote: tip && said.includes(norm(tip)) ? tip : undefined,
        startS: turns[s.first_turn].startMs / 1000,
        endS: turns[s.last_turn].endMs / 1000,
        keyPart: s.key_part,
        samNoun: s.sam_noun,
      }
    }),
  }
}
