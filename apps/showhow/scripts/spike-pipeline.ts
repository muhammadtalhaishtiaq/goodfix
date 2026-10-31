// T0b pipeline spike: video → 720p MP4 + 16 kHz WAV (ffmpeg here; the browser uses Mediabunny)
// → Voice Transcribe ENDPOINTING turns → Muse Spark steps (by turn index) → validateSteps.
// Usage (from apps/showhow): node scripts/spike-pipeline.ts <video-file>
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { stepsJsonSchema, stepsPrompt, validateSteps, type Turn } from '../src/lib/steps.ts'

process.loadEnvFile('.env.local')
const KEY = process.env.META_API_KEY
const src = process.argv[2]
if (!KEY || !src) throw new Error('Need META_API_KEY in .env.local and a video file argument')
const API = 'https://api.meta.ai/v1'
const tmp = mkdtempSync(join(tmpdir(), 'showhow-'))
const mp4 = join(tmp, 'video.mp4'), wav = join(tmp, 'audio.wav')
const mb = (p: string) => (statSync(p).size / 1e6).toFixed(1)
const time = async <T>(label: string, f: () => Promise<T> | T): Promise<T> => {
  const t = Date.now(); const r = await f(); console.log(`${label}: ${Date.now() - t} ms`); return r
}

await time('shrink (ffmpeg)', () => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', src,
  '-vf', 'scale=w=1280:h=1280:force_original_aspect_ratio=decrease:force_divisible_by=2', '-r', '30',
  '-c:v', 'libx264', '-b:v', '1M', '-c:a', 'aac', '-ac', '1', '-b:a', '64k', '-movflags', '+faststart', mp4]))
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', src, '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', wav])
console.log(`input ${mb(src)} MB → mp4 ${mb(mp4)} MB, wav ${mb(wav)} MB`)

const turns: Turn[] = await time('Voice Transcribe', async () => {
  const form = new FormData()
  form.append('request', new Blob([JSON.stringify({ model: 'muse-voice-transcribe-1.0', mode: 'ENDPOINTING', audioEncoding: 'WAV' })], { type: 'application/json' }))
  form.append('audio', new Blob([readFileSync(wav)], { type: 'audio/wav' }), 'audio.wav')
  const res = await fetch(`${API}/asr/transcribe`, { method: 'POST', headers: { Authorization: `Bearer ${KEY}`, Accept: 'application/json' }, body: form })
  const text = await res.text()
  if (!res.ok) throw new Error(`transcribe ${res.status}: ${text.slice(0, 300)}`)
  return JSON.parse(text).turns ?? []
})
turns.forEach((t, i) => console.log(`  [${i}] ${(t.startMs / 1000).toFixed(1)}–${(t.endMs / 1000).toFixed(1)}s ${t.transcript}`))
if (turns.length < 2) throw new Error('Fewer than 2 turns: nothing to split into steps.')

const raw = await time('Muse Spark steps (video inline)', async () => {
  const res = await fetch(`${API}/responses`, {
    method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'muse-spark-1.3', store: false,
      input: [{ type: 'message', role: 'user', content: [
        { type: 'input_text', text: stepsPrompt(turns) },
        { type: 'input_video', video_url: `data:video/mp4;base64,${readFileSync(mp4).toString('base64')}` },
      ] }],
      text: { format: { type: 'json_schema', name: 'steps', schema: stepsJsonSchema } },
    }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`spark ${res.status}: ${text.slice(0, 300)}`)
  const j = JSON.parse(text)
  return j.output_text ?? j.output?.flatMap((o: { content?: { type: string; text: string }[] }) => o.content ?? []).filter((c: { type: string }) => c.type === 'output_text').map((c: { text: string }) => c.text).join('')
})

const result = validateSteps(JSON.parse(raw), turns)
console.log(result.ok ? 'VALID steps:' : `INVALID: ${result.reason}\nraw: ${raw.slice(0, 500)}`)
if (result.ok) for (const s of result.steps) console.log(`  ${s.idx + 1}. ${s.title} [${s.startS}–${s.endS}s] part="${s.keyPart}" sam="${s.samNoun}"\n     ${s.instruction}${s.tipQuote ? `\n     tip: "${s.tipQuote}"` : ''}`)
