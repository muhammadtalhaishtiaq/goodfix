import { describe, expect, test } from 'vitest'
import { validateSteps } from './steps'

const turns = [
  { startMs: 0, endMs: 4000, transcript: 'Hi, today we fix the vacuum.' },
  { startMs: 4500, endMs: 9000, transcript: 'Press the grey latch and the bin drops out.' },
  { startMs: 9500, endMs: 15000, transcript: 'Twist the filter anticlockwise, like a jar lid.' },
  { startMs: 15500, endMs: 21000, transcript: 'New one in, turn until it clicks. No click means weak suction.' },
]
const step = (first: number, last: number, extra = {}) => ({
  title: 'T', first_turn: first, last_turn: last, instruction: 'Do it.', tip_quote: '', key_part: 'Latch', sam_noun: 'latch', ...extra,
})

describe('validateSteps', () => {
  test('maps turn indices to real times', () => {
    const r = validateSteps({ steps: [step(1, 1), step(2, 3)] }, turns)
    expect(r.ok && r.steps.map(s => [s.startS, s.endS])).toEqual([[4.5, 9], [9.5, 21]])
  })
  test('rejects out-of-range, reversed, or overlapping turns', () => {
    expect(validateSteps({ steps: [step(1, 1), step(2, 9)] }, turns).ok).toBe(false)
    expect(validateSteps({ steps: [step(2, 1), step(3, 3)] }, turns).ok).toBe(false)
    expect(validateSteps({ steps: [step(1, 2), step(2, 3)] }, turns).ok).toBe(false)
  })
  test('needs 2 to 8 steps', () => {
    expect(validateSteps({ steps: [step(1, 3)] }, turns).ok).toBe(false)
  })
  test('keeps a tip only if the creator actually said it', () => {
    const r = validateSteps({ steps: [
      step(1, 1, { tip_quote: 'press the GREY latch' }),
      step(3, 3, { tip_quote: 'Always unplug it first.' }),
    ] }, turns)
    expect(r.ok && r.steps.map(s => s.tipQuote)).toEqual(['press the GREY latch', undefined])
  })
  test('rejects malformed model output', () => {
    expect(validateSteps({ nope: true }, turns).ok).toBe(false)
  })
})
