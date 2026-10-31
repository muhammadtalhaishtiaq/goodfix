import { describe, expect, test } from 'vitest'
import { bestOutline, parseSamBoxes } from './sam'

// Format per dev.meta.ai/docs/sam/reading-segmentation (checked 2026-10-30).
const two = '<0f>0<|box;x1=181;y1=365;x2=556;y2=486;w=1516;h=1600;c=0.96|><|mask;x=0;y=0;data=1,1,~a|>,'
  + '3<|box;x1=10;y1=20;x2=40;y2=60;w=1516;h=1600;c=0.41|><|mask;x=0;y=0;data=1,1,~b|>'

describe('parseSamBoxes', () => {
  test('reads xyxy boxes into xywh outlines with frame size and confidence', () => {
    expect(parseSamBoxes(two)).toEqual([
      { frameW: 1516, frameH: 1600, box: [181, 365, 375, 121], score: 0.96 },
      { frameW: 1516, frameH: 1600, box: [10, 20, 30, 40], score: 0.41 },
    ])
  })
  test('empty output means zero matches', () => {
    expect(parseSamBoxes('')).toEqual([])
  })
  test('drops boxes with missing or broken fields', () => {
    expect(parseSamBoxes('<|box;x1=1;y1=2;x2=3|><|box;x1=a;y1=2;x2=3;y2=4;w=9;h=9|>')).toEqual([])
  })
})

describe('bestOutline', () => {
  const box = (score: number) => ({ frameW: 100, frameH: 100, box: [1, 1, 10, 10] as [number, number, number, number], score })
  test('returns the only confident match', () => {
    expect(bestOutline([box(0.9)])?.score).toBe(0.9)
  })
  test('returns null for no matches or low confidence', () => {
    expect(bestOutline([])).toBeNull()
    expect(bestOutline([box(0.3)])).toBeNull()
  })
  test('returns null when two matches are too close to call', () => {
    expect(bestOutline([box(0.9), box(0.85)])).toBeNull()
  })
  test('picks a clear winner among several', () => {
    expect(bestOutline([box(0.5), box(0.92)])?.score).toBe(0.92)
  })
})
