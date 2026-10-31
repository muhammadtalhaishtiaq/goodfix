import { describe, expect, test } from 'vitest'
import { boxFor, planShrink } from './shrink'

describe('planShrink', () => {
  test('uses ~1 Mbps for a normal clip', () => {
    expect(planShrink(180, 500e6)).toEqual({ ok: true, videoBps: 1_000_000 })
  })
  test('3 minutes at that bitrate stays well under the 48 MB upload cap', () => {
    const p = planShrink(180, 500e6)
    expect(p.ok && ((p.videoBps + 64_000) * 180) / 8).toBeLessThan(30e6)
  })
  test('refuses inputs over the limits with a reason', () => {
    expect(planShrink(181, 100e6)).toMatchObject({ ok: false })
    expect(planShrink(60, 501e6)).toMatchObject({ ok: false })
    expect(planShrink(0, 1e6)).toMatchObject({ ok: false })
  })
})

describe('boxFor', () => {
  test('keeps landscape within 1280x720 and portrait within 720x1280', () => {
    expect(boxFor(3840, 2160)).toEqual({ width: 1280, height: 720 })
    expect(boxFor(1080, 1920)).toEqual({ width: 720, height: 1280 })
  })
})
