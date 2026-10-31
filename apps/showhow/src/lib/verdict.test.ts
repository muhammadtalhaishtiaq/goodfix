import { describe, expect, test } from 'vitest'
import { gateVerdict, parseVerdict } from './verdict'

const outline = { frameW: 100, frameH: 100, box: [1, 1, 10, 10] as [number, number, number, number], score: 0.9 }
const differs = { status: 'differs', differences: [{ part: 'Middle shelf', sam_noun: 'shelf', note: 'upside down' }], message: 'Flip it.' }

describe('parseVerdict', () => {
  test('accepts schema-shaped JSON text', () => {
    expect(parseVerdict(JSON.stringify(differs))?.status).toBe('differs')
  })
  test('rejects malformed or off-schema output', () => {
    expect(parseVerdict('not json')).toBeNull()
    expect(parseVerdict(JSON.stringify({ ...differs, status: 'fixed' }))).toBeNull()
    expect(parseVerdict(JSON.stringify({ ...differs, differences: [{ part: '', sam_noun: 'x', note: '' }] }))).toBeNull()
  })
  test('differs without any difference listed is invalid', () => {
    expect(parseVerdict(JSON.stringify({ ...differs, differences: [] }))).toBeNull()
  })
})

describe('gateVerdict', () => {
  test('keeps the outline only for differs', () => {
    expect(gateVerdict(parseVerdict(JSON.stringify(differs))!, outline).outline).toBe(outline)
    expect(gateVerdict({ status: 'match', differences: [], message: 'ok' }, outline).outline).toBeNull()
  })
  test('differs with no outline stays a verdict, just not pinpointed', () => {
    const shown = gateVerdict(parseVerdict(JSON.stringify(differs))!, null)
    expect(shown.verdict.status).toBe('differs')
    expect(shown.outline).toBeNull()
  })
})
