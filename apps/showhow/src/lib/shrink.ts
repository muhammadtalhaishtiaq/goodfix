// On-device shrink: phone video (≤500 MB, ≤3 min) → H.264 ≤720p MP4 under 48 MB + 16 kHz mono WAV.
// The original never leaves the device. See ARCHITECTURE §4.
import {
  ALL_FORMATS, BlobSource, BufferTarget, CanvasSink, canEncodeAudio, canEncodeVideo, Conversion, Input,
  Mp4OutputFormat, Output, Quality, WavOutputFormat,
} from 'mediabunny'

import { MAX_VOICE_SECONDS } from './precheck.js'
import { MAX_INPUT_BYTES, MAX_SECONDS } from './shrink-limits.js'

export { MAX_INPUT_BYTES, MAX_SECONDS }
const AUDIO_BPS = 64_000
const VIDEO_BPS = 1_000_000 // 3 min at ~1.06 Mbps total ≈ 24 MB, well under the 48 MB cap

export type ShrinkPlan = { ok: true; videoBps: number } | { ok: false; reason: string }

export function planShrink(durationS: number, bytes: number): ShrinkPlan {
  if (!(durationS > 0)) return { ok: false, reason: 'We couldn’t read this video’s length.' }
  if (bytes > MAX_INPUT_BYTES) return { ok: false, reason: 'Videos can be up to 500 MB.' }
  if (durationS > MAX_SECONDS) return { ok: false, reason: 'Videos can be up to 3 minutes.' }
  return { ok: true, videoBps: VIDEO_BPS }
}

export function boxFor(w: number, h: number) {
  return w >= h ? { width: 1280, height: 720 } : { width: 720, height: 1280 }
}

export async function canShrinkHere(): Promise<boolean> {
  try {
    return (await canEncodeVideo('avc')) && (await canEncodeAudio('aac'))
  } catch {
    return false
  }
}

// Reads only the container header (fast): length and which tracks exist, for the instant checks.
export async function probeVideo(file: File): Promise<{ durationS: number; hasVideo: boolean; hasAudio: boolean }> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })
  const [durationS, video, audio] = await Promise.all([input.computeDuration(), input.getPrimaryVideoTrack(), input.getPrimaryAudioTrack()])
  return { durationS, hasVideo: !!video, hasAudio: !!audio }
}

// One frame of the shrunk MP4 as a JPEG, decoded with WebCodecs (the same path the shrink just used).
// Phones often never load frames into a hidden <video>, so this avoids <video> entirely (2026-11-03).
export async function frameAt(mp4: Blob, atS: number, maxSide = 1280): Promise<Blob> {
  const input = new Input({ source: new BlobSource(mp4), formats: ALL_FORMATS })
  const track = await input.getPrimaryVideoTrack()
  if (!track) throw new Error('This file has no video track.')
  const [w, h] = [await track.getDisplayWidth(), await track.getDisplayHeight()]
  const sink = new CanvasSink(track, w >= h ? { width: Math.min(maxSide, w) } : { height: Math.min(maxSide, h) })
  const start = await track.getFirstTimestamp()
  const frame = (await sink.getCanvas(Math.max(atS, start))) ?? (await sink.getCanvas(start))
  if (!frame) throw new Error('Couldn’t read a frame from the video.')
  const c = frame.canvas
  if ('convertToBlob' in c) return c.convertToBlob({ type: 'image/jpeg', quality: 0.85 })
  return new Promise<Blob>((ok, bad) => c.toBlob(b => (b ? ok(b) : bad(new Error('Couldn’t encode the image.'))), 'image/jpeg', 0.85))
}

export type Shrunk = { mp4: Blob; wav: Blob; durationS: number; width: number; height: number; ms: number }

export async function shrinkVideo(file: File, onProgress: (p: number) => void): Promise<Shrunk> {
  const t0 = performance.now()
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })
  const durationS = await input.computeDuration()
  const track = await input.getPrimaryVideoTrack()
  if (!track) throw new Error('This file has no video track.')
  const plan = planShrink(durationS, file.size)
  if (!plan.ok) throw new Error(plan.reason)

  const box = boxFor(await track.getDisplayWidth(), await track.getDisplayHeight())
  const mp4Out = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() })
  const video = await Conversion.init({
    input, output: mp4Out,
    video: { ...box, fit: 'contain', codec: 'avc', frameRate: 30, quality: new Quality({ bitrate: plan.videoBps }) },
    audio: { codec: 'aac', numberOfChannels: 1, quality: new Quality({ bitrate: AUDIO_BPS }) },
  })
  if (!video.isValid) throw new Error('This video can’t be converted in this browser.')
  video.onProgress = p => onProgress(p * 0.85)
  await video.execute()

  const wavOut = new Output({ format: new WavOutputFormat(), target: new BufferTarget() })
  const audio = await Conversion.init({ input, output: wavOut, video: { discard: true }, audio: { numberOfChannels: 1, sampleRate: 16_000, codec: 'pcm-s16' } })
  if (!audio.isValid) throw new Error('This video’s audio can’t be read in this browser.')
  audio.onProgress = p => onProgress(0.85 + p * 0.15)
  await audio.execute()

  const mp4 = new Blob([mp4Out.target.buffer!], { type: 'video/mp4' })
  if (mp4.size > 48e6) throw new Error('The prepared video is still over 48 MB. Try a shorter clip.')
  return { mp4, wav: new Blob([wavOut.target.buffer!], { type: 'audio/wav' }), durationS, ...box, ms: Math.round(performance.now() - t0) }
}

// Any recording (MediaRecorder WebM/Opus, phone M4A, WAV…) → 16 kHz mono 16-bit WAV for Voice Transcribe.
// 2 minutes ≈ 3.8 MB, which fits one request as a raw body (base64 JSON would not).
export async function toWav16k(blob: Blob): Promise<{ wav: Blob; durationS: number }> {
  const input = new Input({ source: new BlobSource(blob), formats: ALL_FORMATS })
  const durationS = await input.computeDuration()
  if (durationS > MAX_VOICE_SECONDS + 1) throw new Error('Recordings can be up to 2 minutes.')
  const out = new Output({ format: new WavOutputFormat(), target: new BufferTarget() })
  const c = await Conversion.init({ input, output: out, video: { discard: true }, audio: { numberOfChannels: 1, sampleRate: 16_000, codec: 'pcm-s16' } })
  if (!c.isValid) throw new Error('This recording can’t be read in this browser.')
  await c.execute()
  return { wav: new Blob([out.target.buffer!], { type: 'audio/wav' }), durationS }
}
