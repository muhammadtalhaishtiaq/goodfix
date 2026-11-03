import { describe, expect, test } from 'vitest'
import { blockedMatch, blockedMessage, blockedTopic, gateReview } from './safety'

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
    ['this is a guide to filming porn at home', 'adult content'],
    ['take off your clothes and pose naked', 'adult content'],
    ['how to harass someone online until they quit', 'hate or harassment'],
    ['call me on 0300 1234567 for help', 'personal details'],
    ['email me at jane.doe@example.com', 'personal details'],
    ['my card number is 4111 1111 1111 1111', 'personal details'],
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
    'How to stop bullying at school with your kids',
    'Set a timer for 25 minutes and read',
    'Cook it for 12 minutes at 200 degrees',
    'Fill it to the 1600 ml line',
  ])('allows everyday wording: %s', text => {
    expect(blockedTopic(text)).toBeNull()
  })
})

describe('gateReview (layer 2, fail closed)', () => {
  const ok = { is_howto: true, complete: true, safety: 'ok', category: 'Home', subject: 'white air purifier with a side water tank', title: 'Refill the purifier tank', missing: [], reason: 'clear' }

  test('passes a clear, complete, safe how-to', () => {
    expect(gateReview(ok)).toEqual({ pass: true, subject: ok.subject, missing: [], title: ok.title, category: 'Home' })
  })
  test('blocks unsafe content with the model’s reason', () => {
    expect(gateReview({ ...ok, safety: 'blocked', reason: 'involves mains wiring' })).toEqual({ pass: false, reason: 'This topic isn’t allowed: involves mains wiring', missing: [] })
  })
  test('blocks gibberish / not a how-to', () => {
    expect(gateReview({ ...ok, is_howto: false, reason: 'random words' })).toMatchObject({ pass: false, reason: expect.stringMatching(/doesn’t sound like a how-to/) })
  })
  test('a possibly-missing step is a warning for the creator, not a block', () => {
    expect(gateReview({ ...ok, complete: false, missing: ['how to put the tank back'] })).toEqual({ pass: true, subject: ok.subject, missing: ['how to put the tank back'], title: ok.title, category: 'Home' })
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

describe('blockedMatch shows the creator what tripped the rule', () => {
  test('quotes the words around the match', () => {
    const hit = blockedMatch('First unplug it, then you can call me on 0712 345 6789 if you get stuck with the tank')
    expect(hit?.topic).toBe('personal details')
    expect(hit?.heard).toContain('0712 345 6789')
    expect(hit && blockedMessage(hit)).toMatch(/^This topic isn’t allowed here \(personal details\)\. We heard: “…/)
  })
  test('everyday wording has no match', () => {
    expect(blockedMatch('Kill the power at the switch before you clean it')).toBeNull()
  })
})
