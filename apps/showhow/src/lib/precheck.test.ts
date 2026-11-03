import { expect, test } from 'vitest'
import { speechRatio, videoProblems, voiceProblems, wavSamples } from './precheck'

const tone = (n: number, amp: number) => Int16Array.from({ length: n }, (_, i) => Math.round(amp * Math.sin(i / 5)))

test('speech ratio: silence and hiss are ~0, talking is high', () => {
  expect(speechRatio(new Int16Array(16_000))).toBe(0)
  expect(speechRatio(tone(16_000, 200))).toBe(0)
  expect(speechRatio(tone(16_000, 6000))).toBeGreaterThan(0.9)
})

test('wavSamples finds the data chunk after extra header chunks', () => {
  const pcm = tone(100, 3000)
  const list = 'LIST'.split('').map(c => c.charCodeAt(0))
  const head = new Uint8Array([...'RIFF'].map(c => c.charCodeAt(0)).concat([0, 0, 0, 0], [...'WAVE'].map(c => c.charCodeAt(0)), list, [4, 0, 0, 0, 1, 2, 3, 4], [...'data'].map(c => c.charCodeAt(0)), [200, 0, 0, 0]))
  const buf = new Uint8Array(head.length + 200); buf.set(head); buf.set(new Uint8Array(pcm.buffer), head.length)
  expect(Array.from(wavSamples(buf.buffer))).toEqual(Array.from(pcm))
})

test('voice: a normal clip passes; short, long, oversized and silent clips say why', () => {
  expect(voiceProblems({ durationS: 60, wavBytes: 2e6, speech: 0.6 })).toEqual([])
  expect(voiceProblems({ durationS: 3, wavBytes: 1e5, speech: 0.6 })[0]).toMatch(/only 3 seconds/)
  expect(voiceProblems({ durationS: 130, wavBytes: 4.3e6, speech: 0.6 })).toEqual(['It’s over 2 minutes. Keep it to 2 minutes or less.'])
  expect(voiceProblems({ durationS: 119, wavBytes: 4.3e6, speech: 0.6 })[0]).toMatch(/too large/)
  expect(voiceProblems({ durationS: 60, wavBytes: 2e6, speech: 0.02 })[0]).toMatch(/barely hear/)
})

test('video: needs picture and sound, within size and length', () => {
  const ok = { bytes: 50e6, durationS: 90, hasVideo: true, hasAudio: true }
  expect(videoProblems(ok)).toEqual([])
  expect(videoProblems({ ...ok, hasAudio: false })[0]).toMatch(/no sound/)
  expect(videoProblems({ ...ok, bytes: 600e6 })).toEqual(['Videos can be up to 500 MB.'])
  expect(videoProblems({ ...ok, durationS: 200 })).toEqual(['Videos can be up to 3 minutes.'])
  expect(videoProblems({ ...ok, durationS: 4 })[0]).toMatch(/only 4 seconds/)
})
