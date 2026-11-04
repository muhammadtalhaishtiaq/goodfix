// Demo-video art with Meta Muse Image (2026-11-03). Reads META_API_KEY from .env.local inside this process only;
// prints file names, never the key. Usage (from apps/showhow): node scripts/gen-demo-art.ts <outDir>
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'

process.loadEnvFile('.env.local')
const out = process.argv[2]
const set = process.argv[3] ?? 'scenes' // 'scenes' or 'objects'
if (!out) throw new Error('Usage: node scripts/gen-demo-art.ts <outDir> [scenes|objects]')
mkdirSync(out, { recursive: true })

const STYLE = 'Editorial flat illustration with subtle paper grain, warm muted palette of cream, charcoal, sage and one bright orange accent, soft natural light, clean shapes, natural proportions, hands attached to arms, faces turned away or out of frame, no text, no letters, no logos.'
const ART: Record<string, string> = {
  'hook-stuck': 'A person sitting on a living-room rug among loose flat-pack furniture panels, screws and an Allen key, holding a phone that plays a how-to video, one hand on their head in frustration, seen from behind and slightly above.',
  'world-bike': 'Close view of two hands fixing a slipped bicycle chain onto a gear, a bike upside down on a garage floor, tools laid out neatly.',
  'world-printer': 'Two hands sliding an ink cartridge into an open home printer on a wooden desk, a plant and a lamp beside it.',
  'world-tie': 'Two hands tying a necktie on a white dress shirt collar, seen in a bathroom mirror reflection from the shoulders down.',
  'world-kitchen': 'Hands pulling out and rinsing a dishwasher filter at a kitchen sink, morning light through a window.',
  'world-purifier': 'Hands lifting the grey water tank off a white round humidifier on a wooden floor beside a wall.',
  'learner-snap': 'A hand holding a phone up to photograph a half-assembled shelf bracket on a workbench, the phone screen showing the camera view.',
  'teach-hands': 'Two pairs of hands side by side over a workbench, one showing the other how to turn a small part, warm and friendly, seen from above.',
  'end-world': 'A cosy home workshop corner at golden hour, a workbench with neatly hung tools, a tablet propped up on the bench, a plant, wide and calm composition with empty space on the left.',
}

// Single objects on a flat background, to cut out and animate between scenes.
const OBJ_STYLE = 'A single object, centred, whole object in view with generous margin, on a perfectly flat plain light grey (#D9D9D9) background with no shadow on the background. Editorial flat illustration with subtle grain, warm muted palette of cream, charcoal, sage and one bright orange accent, crisp edges. No text, no letters, no logos.'
const OBJECTS: Record<string, string> = {
  'obj-phone': 'A modern smartphone held upright, its screen showing a camera viewfinder with an orange shutter button.',
  'obj-wrench': 'An adjustable wrench with a charcoal handle and an orange grip band, at a slight diagonal.',
  'obj-screwdriver': 'A screwdriver with an orange and charcoal handle, at a slight diagonal.',
  'obj-tank': 'A grey translucent humidifier water tank with a white cap, three-quarter view.',
  'obj-ear': 'A friendly stylised sound waveform shaped like a speech bubble, charcoal and orange, symbol of listening to speech.',
  'obj-spark': 'A stylised four-point spark burst made of charcoal and orange folded paper, symbol of thinking and splitting into steps.',
  'obj-target': 'A precise orange outline frame with corner marks hovering around a small grey machine part, symbol of finding a part.',
  'obj-brush': 'A paintbrush painting a small framed landscape picture, charcoal handle and orange paint, symbol of illustration.',
  'obj-shield': 'A sturdy charcoal shield with two layers and an orange check mark, symbol of a two-layer safety check.',
  'obj-chat': 'Two overlapping speech bubbles, one charcoal and one cream with an orange dot, symbol of a helpful conversation.',
}
const key = process.env.META_API_KEY
if (!key) throw new Error('META_API_KEY missing in .env.local')
for (const [name, scene] of Object.entries(set === 'objects' ? OBJECTS : ART)) {
  const file = `${out}/${name}.jpg`
  if (existsSync(file)) { console.log('skip', name); continue }
  const res = await fetch('https://api.meta.ai/v1/images/generations', {
    method: 'POST', signal: AbortSignal.timeout(90_000),
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'muse-image-1.0', n: 1, size: '1536x1024', output_format: 'jpeg', prompt: `${scene} ${set === 'objects' ? OBJ_STYLE : STYLE}` }),
  })
  if (!res.ok) { console.log('FAILED', name, res.status); continue }
  const b64 = ((await res.json()) as { data?: { b64_json?: string }[] }).data?.[0]?.b64_json
  if (!b64) { console.log('NO IMAGE', name); continue }
  writeFileSync(file, Buffer.from(b64, 'base64'))
  console.log('ok', name)
}
