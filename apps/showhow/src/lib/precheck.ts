// Instant checks on the creator's device, before anything is sent (2026-11-03). Pure: no React, no network.
// They only catch what can't work (silent, too short/long/big); the real safety gate still runs on the server.
import { MAX_INPUT_BYTES, MAX_SECONDS } from './shrink-limits.js'

export const MAX_VOICE_SECONDS = 120
export const MAX_VOICE_WAV_BYTES = 4_200_000 // the voice-guides request limit
export const MIN_SECONDS = 8

// Share of 50 ms windows loud enough to be speech, from 16-bit mono PCM. Room hiss stays below the floor.
export function speechRatio(pcm: Int16Array, sampleRate = 16_000): number {
  const win = Math.round(sampleRate * 0.05)
  let loud = 0, total = 0
  for (let i = 0; i + win <= pcm.length; i += win) {
    let sum = 0
    for (let j = i; j < i + win; j++) sum += pcm[j] * pcm[j]
    if (Math.sqrt(sum / win) > 500) loud++ // ≈ −36 dBFS
    total++
  }
  return total ? loud / total : 0
}

// 16-bit PCM samples of a WAV file: finds the "data" chunk rather than assuming a 44-byte header.
export function wavSamples(buf: ArrayBuffer): Int16Array {
  const v = new DataView(buf)
  for (let o = 12; o + 8 <= buf.byteLength; o += 8 + v.getUint32(o + 4, true)) {
    if (String.fromCharCode(v.getUint8(o), v.getUint8(o + 1), v.getUint8(o + 2), v.getUint8(o + 3)) === 'data') {
      const len = Math.min(v.getUint32(o + 4, true), buf.byteLength - o - 8)
      return new Int16Array(buf.slice(o + 8, o + 8 + (len - (len % 2))))
    }
  }
  return new Int16Array(0)
}

export function voiceProblems(a: { durationS: number; wavBytes: number; speech: number }): string[] {
  const p: string[] = []
  if (a.durationS < MIN_SECONDS) p.push(`It’s only ${Math.round(a.durationS)} seconds. Talk through every step, at least ${MIN_SECONDS} seconds.`)
  if (a.durationS > MAX_VOICE_SECONDS + 1) p.push('It’s over 2 minutes. Keep it to 2 minutes or less.')
  else if (a.wavBytes > MAX_VOICE_WAV_BYTES) p.push('It’s too large to send. Try a slightly shorter recording.')
  if (a.speech < 0.15) p.push('We can barely hear any speech. Record closer to the microphone, somewhere quiet.')
  return p
}

export function videoProblems(v: { bytes: number; durationS: number; hasVideo: boolean; hasAudio: boolean }): string[] {
  const p: string[] = []
  if (!v.hasVideo) p.push('This file has no video track.')
  if (!v.hasAudio) p.push('This video has no sound. Your narration becomes the steps, so talk while you film.')
  if (v.bytes > MAX_INPUT_BYTES) p.push('Videos can be up to 500 MB.')
  if (v.durationS > MAX_SECONDS + 1) p.push('Videos can be up to 3 minutes.')
  else if (v.hasVideo && v.durationS < MIN_SECONDS) p.push(`It’s only ${Math.round(v.durationS)} seconds. Film and talk through every step.`)
  return p
}
