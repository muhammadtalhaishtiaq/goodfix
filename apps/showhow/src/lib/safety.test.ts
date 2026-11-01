import { describe, expect, test } from 'vitest'
import { blockedTopic, gateReview } from './safety'

describe('blockedTopic (layer 1, hard rules)', () => {
  test.each([
    ['First load the gun and check the safety catch', 'weapons'],
    ['how to make a pipe bomb at home', 'weapons'],
    ['this is how you hurt someone without leaving marks', 'violence'],
    ['the easiest way to kill someone', 'violence'],
    ['I want to show how to end my life', 'self-harm'],
    ['mix the pills to get high', 'drugs'],
    ['disconnect the gas line behind the boiler', 'gas'],
    ['open the fuse box and swap the live wire', 'mains electrical'],
    ['now rewire the plug socket', 'mains electrical'],
    ['set fire to the pile and walk away', 'fire'],
    ['inject the insulin into the vein', 'medical'],
    ['replace the brake pads on your car', 'vehicle'],
    ['how to hack into your neighbour’s wifi', 'hacking'],
    ['how to pick a lock that isn’t yours', 'illegal'],
  ])('blocks %s', (text, topic) => {
    expect(blockedTopic(text)).toBe(topic)
  })

  test.each([
    'Kill the power at the switch before you clean it',
    'Fire up the app and pair the speaker',
    'Press the latch and slide the water tank out',
    'Shoot a quick photo of the label',
    'Unplug the coffee machine and let it cool down',
    'Change the battery in the smoke alarm',
  ])('allows everyday wording: %s', text => {
    expect(blockedTopic(text)).toBeNull()
  })
})

describe('gateReview (layer 2, fail closed)', () => {
  const ok = { is_howto: true, complete: true, safety: 'ok', category: 'Home', subject: 'white air purifier with a side water tank', missing: [], reason: 'clear' }

  test('passes a clear, complete, safe how-to', () => {
    expect(gateReview(ok)).toEqual({ pass: true, subject: ok.subject, missing: [] })
  })
  test('blocks unsafe content with the model’s reason', () => {
    expect(gateReview({ ...ok, safety: 'blocked', reason: 'involves mains wiring' })).toEqual({ pass: false, reason: 'This topic isn’t allowed: involves mains wiring', missing: [] })
  })
  test('blocks gibberish / not a how-to', () => {
    expect(gateReview({ ...ok, is_howto: false, reason: 'random words' })).toMatchObject({ pass: false, reason: expect.stringMatching(/doesn’t sound like a how-to/) })
  })
  test('a possibly-missing step is a warning for the creator, not a block', () => {
    expect(gateReview({ ...ok, complete: false, missing: ['how to put the tank back'] })).toEqual({ pass: true, subject: ok.subject, missing: ['how to put the tank back'] })
  })
  test('unsafe still blocks even if the model also lists missing steps', () => {
    expect(gateReview({ ...ok, safety: 'blocked', complete: false, missing: ['x'] }).pass).toBe(false)
  })
  test('fails closed on missing, malformed or off-schema output', () => {
    expect(gateReview(null).pass).toBe(false)
    expect(gateReview('yes').pass).toBe(false)
    expect(gateReview({ ...ok, safety: 'probably fine' }).pass).toBe(false)
    expect(gateReview({ ...ok, is_howto: undefined }).pass).toBe(false)
  })
})
