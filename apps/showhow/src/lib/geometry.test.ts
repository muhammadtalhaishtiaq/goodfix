import { describe, expect, test } from 'vitest'
import { isValidOutline, outlinePath } from './geometry'

const frame = { frameW: 1280, frameH: 720 }

describe('isValidOutline', () => {
  test('accepts a box inside the frame', () => {
    expect(isValidOutline({ ...frame, box: [100, 50, 200, 120] })).toBe(true)
  })
  test('rejects boxes that leave the frame or have no area', () => {
    expect(isValidOutline({ ...frame, box: [1200, 50, 200, 120] })).toBe(false)
    expect(isValidOutline({ ...frame, box: [-5, 50, 200, 120] })).toBe(false)
    expect(isValidOutline({ ...frame, box: [100, 50, 0, 120] })).toBe(false)
  })
  test('rejects non-finite numbers and bad frames', () => {
    expect(isValidOutline({ ...frame, box: [Number.NaN, 0, 10, 10] })).toBe(false)
    expect(isValidOutline({ frameW: 0, frameH: 720, box: [0, 0, 10, 10] })).toBe(false)
  })
})

describe('outlinePath', () => {
  test('draws the SAM box', () => {
    expect(outlinePath({ ...frame, box: [10, 20, 30, 40] })).toBe('M10 20H40V60H10Z')
  })
})
