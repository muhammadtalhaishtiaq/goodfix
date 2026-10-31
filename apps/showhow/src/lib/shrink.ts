// On-device shrink: phone video (≤500 MB, ≤3 min) → H.264 ≤720p MP4 under 48 MB + 16 kHz mono WAV.
// The original never leaves the device. See ARCHITECTURE §4.
import {
  ALL_FORMATS, BlobSource, BufferTarget, canEncodeAudio, canEncodeVideo, Conversion, Input,
  Mp4OutputFormat, Output, Quality, WavOutputFormat,
} from 'mediabunny'

export const MAX_INPUT_BYTES = 500e6
export const MAX_SECONDS = 180
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
