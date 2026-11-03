import { expect, test } from 'vitest'
import { basePrompt, stepPrompt } from './imagePrompt'
import { validateSteps, stepsPrompt } from './steps'

const style = 'Realistic product photograph, soft natural light.'

test('scene steps are drawn from the picture brief in the shared setting and style, never the raw sentence', () => {
  const p = stepPrompt({ mode: 'scene', picture: 'An empty side table beside a reading chair, a closed door behind it.', instruction: 'Put your phone in another room, not face down on the table.', setting: 'a living room in warm daylight', stylePrompt: style })
  expect(p).toContain('An empty side table')
  expect(p).toContain('a living room in warm daylight')
  expect(p).toContain(style)
  expect(p).not.toMatch(/phone|face down/i)
})

test('object steps edit the reference; old guides without a brief fall back to the instruction', () => {
  const p = stepPrompt({ mode: 'object', instruction: 'Press the latch on the side.', stylePrompt: style })
  expect(p).toMatch(/^Same object/)
  expect(p).toContain('Press the latch on the side.')
})

test('prompts ask for attached hands and keep faces out, and the base shows the whole object', () => {
  expect(stepPrompt({ mode: 'scene', picture: 'x', instruction: 'x', stylePrompt: style })).toMatch(/attached to forearms/)
  expect(basePrompt('white air purifier', style)).toMatch(/^white air purifier, the whole object in view/)
})

test('voice step prompts ask for picture briefs; video prompts do not', () => {
  expect(stepsPrompt([{ startMs: 0, endMs: 1, transcript: 'hi' }], 'voice')).toMatch(/picture_mode/)
  expect(stepsPrompt([{ startMs: 0, endMs: 1, transcript: 'hi' }], 'video')).not.toMatch(/picture_mode/)
})

test('validateSteps passes the picture fields through when present', () => {
  const turns = [{ startMs: 0, endMs: 1000, transcript: 'a' }, { startMs: 1000, endMs: 2000, transcript: 'b' }]
  const base = { title: 't', instruction: 'i', tip_quote: '', key_part: 'k', sam_noun: 'k' }
  const r = validateSteps({ picture_mode: 'scene', setting: ' a room ', steps: [{ ...base, first_turn: 0, last_turn: 0, picture: 'a chair' }, { ...base, first_turn: 1, last_turn: 1 }] }, turns)
  expect(r).toMatchObject({ ok: true, pictureMode: 'scene', setting: 'a room' })
  if (r.ok) expect(r.steps.map(s => s.picture)).toEqual(['a chair', undefined])
})
