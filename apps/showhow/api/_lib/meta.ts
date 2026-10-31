// Meta Model API calls, in the request shapes verified live on 2026-10-30/31 (see HACKATHON-LOG).
// Every call sends store:false (Meta stores responses by default) and has a timeout.
import type { Turn } from '../../src/lib/steps'

const API = 'https://api.meta.ai/v1'
const auth = () => {
  const k = process.env.META_API_KEY
  if (!k) throw new Error('META_API_KEY is not configured')
  return { Authorization: `Bearer ${k}` }
}

async function post(path: string, init: RequestInit, timeoutMs: number) {
  const res = await fetch(`${API}${path}`, { method: 'POST', ...init, signal: AbortSignal.timeout(timeoutMs) })
  if (!res.ok) throw new Error(`Meta ${path} ${res.status}`) // status only: never log bodies
  return res.json()
}

const outputText = (j: { output_text?: string; output?: { content?: { type: string; text?: string }[] }[] }) =>
  j.output_text ?? (j.output ?? []).flatMap(o => o.content ?? []).filter(c => c.type === 'output_text').map(c => c.text ?? '').join('')

export async function transcribe(wav: Blob): Promise<Turn[]> {
  const form = new FormData()
  form.append('request', new Blob([JSON.stringify({ model: 'muse-voice-transcribe-1.0', mode: 'ENDPOINTING', audioEncoding: 'WAV' })], { type: 'application/json' }))
  form.append('audio', wav, 'audio.wav')
  const j = await post('/asr/transcribe', { headers: { ...auth(), Accept: 'application/json' }, body: form }, 90_000)
  return (j.turns ?? []).map((t: Turn) => ({ startMs: t.startMs, endMs: t.endMs, transcript: t.transcript }))
}

// Muse Spark with schema-constrained JSON output. Returns the parsed object (still untrusted: zod-check it).
export async function sparkJson(content: unknown[], name: string, schema: object, timeoutMs = 180_000): Promise<unknown> {
  const j = await post('/responses', {
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'muse-spark-1.3', store: false,
      input: [{ type: 'message', role: 'user', content }],
      text: { format: { type: 'json_schema', name, schema } },
    }),
  }, timeoutMs)
  return JSON.parse(outputText(j))
}
