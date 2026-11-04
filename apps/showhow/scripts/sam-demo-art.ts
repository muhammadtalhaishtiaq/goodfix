// Real SAM 3.1 boxes on the Muse Image demo art (2026-11-03), so every outline in the video is a model result.
// Reads META_API_KEY from .env.local in this process only. Usage: node scripts/sam-demo-art.ts <artDir>
import { readFileSync, writeFileSync } from 'node:fs'
import { bestOutline, parseSamBoxes } from '../src/lib/sam.ts'

process.loadEnvFile('.env.local')
const dir = process.argv[2]
const NOUNS: Record<string, string> = { 'world-bike': 'chain', 'world-printer': 'cartridge', 'world-tie': 'tie', 'world-kitchen': 'filter', 'world-purifier': 'tank', 'hook-stuck': 'phone', 'learner-snap': 'phone', 'teach-hands': 'screwdriver' }
const out: Record<string, unknown> = {}
for (const [name, noun] of Object.entries(NOUNS)) {
  const url = `data:image/jpeg;base64,${readFileSync(`${dir}/${name}.jpg`).toString('base64')}`
  const res = await fetch('https://api.meta.ai/v1/responses', {
    method: 'POST', signal: AbortSignal.timeout(60_000),
    headers: { Authorization: `Bearer ${process.env.META_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'sam-3.1', store: false, metadata: { include_confidence: 'true' }, input: [{ type: 'message', role: 'user', content: [{ type: 'input_text', text: noun }, { type: 'input_image', image_url: url }] }] }),
  })
  if (!res.ok) { console.log('FAILED', name, res.status); continue }
  const j = await res.json() as { output_text?: string; output?: { content?: { type: string; text?: string }[] }[] }
  const text = j.output_text ?? (j.output ?? []).flatMap(o => o.content ?? []).filter(c => c.type === 'output_text').map(c => c.text ?? '').join('')
  const all = parseSamBoxes(text)
  out[name] = { noun, best: bestOutline(all), all }
  console.log(name, noun, all.length, 'boxes, best', JSON.stringify(bestOutline(all)?.box ?? null))
}
writeFileSync(`${dir}/sam.json`, JSON.stringify(out, null, 1))
