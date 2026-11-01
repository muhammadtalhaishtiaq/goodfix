// Meta Model API calls, in the request shapes verified live on 2026-10-30/31 (see HACKATHON-LOG).
// Every call sends store:false (Meta stores responses by default) and has a timeout.
import type { Turn } from '../../src/lib/steps'

const API = 'https://api.meta.ai/v1'
const auth = () => {
  const k = process.env.META_API_KEY
  if (!k) throw new Error('META_API_KEY is not configured')
  return { Authorization: `Bearer ${k}` }
}

type MetaJson = { turns?: Turn[]; output_text?: string; output?: { content?: { type: string; text?: string }[] }[] }

async function post(path: string, init: RequestInit, timeoutMs: number): Promise<MetaJson> {
  const res = await fetch(`${API}${path}`, { method: 'POST', ...init, signal: AbortSignal.timeout(timeoutMs) })
  if (!res.ok) throw new Error(`Meta ${path} ${res.status}`) // status only: never log bodies
  return (await res.json()) as MetaJson
}

const outputText = (j: MetaJson) =>
  j.output_text ?? (j.output ?? []).flatMap(o => o.content ?? []).filter(c => c.type === 'output_text').map(c => c.text ?? '').join('')

export async function transcribe(wav: Blob): Promise<Turn[]> {
  const form = new FormData()
  form.append('request', new Blob([JSON.stringify({ model: 'muse-voice-transcribe-1.0', mode: 'ENDPOINTING', audioEncoding: 'WAV' })], { type: 'application/json' }))
  form.append('audio', wav, 'audio.wav')
  const j = await post('/asr/transcribe', { headers: { ...auth(), Accept: 'application/json' }, body: form }, 90_000)
  return (j.turns ?? []).map((t: Turn) => ({ startMs: t.startMs, endMs: t.endMs, transcript: t.transcript }))
}

// SAM 3.1 on one image (public URL or data URL) with one simple noun → raw box/mask token text.
export async function samText(imageUrl: string, noun: string): Promise<string> {
  const j = await post('/responses', {
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'sam-3.1', store: false, metadata: { include_confidence: 'true' },
      input: [{ type: 'message', role: 'user', content: [{ type: 'input_text', text: noun }, { type: 'input_image', image_url: imageUrl }] }],
    }),
  }, 60_000)
  return outputText(j)
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

// Muse Image 1.0 ($0.01/image). Returns JPEG bytes. A content-policy refusal surfaces as an error.
type ImageJson = { data?: { b64_json?: string }[] }
async function image(path: string, body: object): Promise<Buffer> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST', signal: AbortSignal.timeout(90_000),
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'muse-image-1.0', n: 1, size: '1536x1024', output_format: 'jpeg', ...body }),
  })
  if (!res.ok) throw new Error(`Meta ${path} ${res.status}`)
  const b64 = ((await res.json()) as ImageJson).data?.[0]?.b64_json
  if (!b64) throw new Error(`Meta ${path} returned no image`)
  return Buffer.from(b64, 'base64')
}
export const generateImage = (prompt: string) => image('/images/generations', { prompt })
export const editImage = (reference: Buffer, prompt: string) =>
  image('/images/edits', { prompt, images: [{ image_url: `data:image/jpeg;base64,${reference.toString('base64')}` }] })
