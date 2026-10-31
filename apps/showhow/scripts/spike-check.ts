// T0 check-accuracy spike: does Muse Spark spot the staged mistake, and does SAM 3.1 box the right part?
// Usage (from apps/showhow): node scripts/spike-check.ts <photos-dir>
// Layout: <photos-dir>/<task>/reference.(jpg|png|heic)  step.txt (line 1 title, rest instruction)
//         <photos-dir>/<task>/{right,wrong,blurry}/*.(jpg|png|heic)
// Writes <photos-dir>/_spike/results.json and report.html. Never prints the API key.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { bestOutline, parseSamBoxes } from '../src/lib/sam.ts'
import { parseVerdict, verdictJsonSchema, verdictPrompt } from '../src/lib/verdict.ts'

process.loadEnvFile('.env.local')
const KEY = process.env.META_API_KEY
const dir = process.argv[2]
if (!KEY || !dir) throw new Error('Need META_API_KEY in .env.local and a photos dir argument')
const API = 'https://api.meta.ai/v1'
const out = join(dir, '_spike')
mkdirSync(out, { recursive: true })

const isImage = (f: string) => /\.(jpe?g|png|heic)$/i.test(f)
// Same as the app: JPEG, longest side ≤1600 px. sips is built into macOS and converts HEIC.
function prep(src: string, name: string): string {
  const dst = join(out, `${name}.jpg`)
  execFileSync('sips', ['-s', 'format', 'jpeg', '-Z', '1600', src, '--out', dst], { stdio: 'ignore' })
  return dst
}
const dataUrl = (p: string) => `data:image/jpeg;base64,${readFileSync(p).toString('base64')}`

async function post(path: string, body: unknown) {
  const res = await fetch(`${API}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const text = await res.text()
  if (!res.ok) throw new Error(`${path} ${res.status}: ${text.slice(0, 300)}`)
  return JSON.parse(text)
}

async function spark(ref: string, photo: string, title: string, instruction: string) {
  const r = await post('/chat/completions', {
    model: 'muse-spark-1.3',
    messages: [{ role: 'user', content: [
      { type: 'text', text: verdictPrompt(title, instruction) },
      { type: 'image_url', image_url: { url: dataUrl(ref) } },
      { type: 'image_url', image_url: { url: dataUrl(photo) } },
    ] }],
    response_format: { type: 'json_schema', json_schema: { name: 'verdict', schema: verdictJsonSchema } },
    store: false,
  })
  return r.choices?.[0]?.message?.content ?? ''
}

async function sam(photo: string, noun: string) {
  const r = await post('/responses', {
    model: 'sam-3.1',
    input: [{ type: 'message', role: 'user', content: [{ type: 'input_text', text: noun }, { type: 'input_image', image_url: dataUrl(photo) }] }],
    metadata: { include_confidence: 'true' },
    store: false,
  })
  return r.output_text ?? (r.output ?? []).flatMap((o: { content?: { type: string; text: string }[] }) => o.content ?? [])
    .filter((c: { type: string }) => c.type === 'output_text').map((c: { text: string }) => c.text).join('')
}

type Row = { task: string; expected: string; file: string; img: string; got?: string; message?: string; noun?: string; boxes?: number; best?: unknown; sparkMs?: number; samMs?: number; samRaw?: string; error?: string }
const rows: Row[] = []

for (const task of readdirSync(dir).filter(t => !t.startsWith('_') && !t.startsWith('.') && existsSync(join(dir, t, 'step.txt')))) {
  const [title, ...rest] = readFileSync(join(dir, task, 'step.txt'), 'utf8').trim().split('\n')
  const refFile = readdirSync(join(dir, task)).find(f => /^reference\./i.test(f) && isImage(f))
  if (!refFile) { console.log(`skip ${task}: no reference image`); continue }
  const ref = prep(join(dir, task, refFile), `${task}-reference`)
  for (const expected of ['right', 'wrong', 'blurry']) {
    const sub = join(dir, task, expected)
    if (!existsSync(sub)) continue
    for (const f of readdirSync(sub).filter(isImage)) {
      const img = prep(join(sub, f), `${task}-${expected}-${basename(f).replace(/\.\w+$/, '')}`)
      const row: Row = { task, expected, file: f, img: basename(img) }
      try {
        let t = Date.now()
        const raw = await spark(ref, img, title, rest.join(' '))
        row.sparkMs = Date.now() - t
        const v = parseVerdict(raw)
        row.got = v?.status ?? 'INVALID'
        row.message = v?.message ?? raw.slice(0, 200)
        if (v?.status === 'differs') {
          row.noun = v.differences[0].sam_noun
          t = Date.now()
          row.samRaw = await sam(img, row.noun)
          row.samMs = Date.now() - t
          const boxes = parseSamBoxes(row.samRaw)
          row.boxes = boxes.length
          row.best = bestOutline(boxes)
          row.samRaw = row.samRaw.replace(/data=[^|]*/g, 'data=…') // keep the file small
        }
      } catch (e) {
        row.error = String(e instanceof Error ? e.message : e)
      }
      rows.push(row)
      console.log(`${task.padEnd(16)} ${expected.padEnd(6)} → ${(row.got ?? 'ERROR').padEnd(8)} ${row.noun ? `sam "${row.noun}": ${row.boxes} box(es)` : ''} ${row.sparkMs ?? '-'}ms ${row.error ?? ''}`)
    }
  }
}

writeFileSync(join(out, 'results.json'), JSON.stringify(rows, null, 2))
const want: Record<string, string> = { right: 'match', wrong: 'differs', blurry: 'unclear' }
const cards = rows.map(r => {
  const b = r.best as { frameW: number; frameH: number; box: number[]; score?: number } | null | undefined
  const ok = r.got === want[r.expected]
  return `<figure class="${ok ? 'ok' : 'bad'}"><div class="im"><img src="${r.img}">${b ? `<svg viewBox="0 0 ${b.frameW} ${b.frameH}" preserveAspectRatio="xMidYMid meet"><rect x="${b.box[0]}" y="${b.box[1]}" width="${b.box[2]}" height="${b.box[3]}"/></svg>` : ''}</div>
<figcaption><b>${r.task}</b> · expected ${r.expected} → <b>${r.got ?? 'ERROR'}</b>${r.noun ? ` · SAM "${r.noun}" ${r.boxes} box(es)${b ? ` c=${b.score}` : ' · no confident winner'}` : ''}<br>${(r.message ?? r.error ?? '').replace(/</g, '&lt;')}<br><small>${r.sparkMs ?? '-'} ms Spark · ${r.samMs ?? '-'} ms SAM</small></figcaption></figure>`
}).join('\n')
writeFileSync(join(out, 'report.html'), `<!doctype html><meta charset="utf-8"><title>T0 spike report</title><style>
body{font:14px system-ui;margin:20px;background:#f5f0e6}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
figure{margin:0;background:#fff;border-radius:10px;overflow:hidden;border:3px solid #2c7a4b}figure.bad{border-color:#d24c10}
.im{position:relative;aspect-ratio:4/3;background:#222}.im img,.im svg{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
rect{fill:rgba(238,90,23,.18);stroke:#ee5a17;stroke-width:6;vector-effect:non-scaling-stroke}figcaption{padding:8px 10px}</style>
<h1>T0 check-accuracy spike · ${new Date().toISOString()}</h1><p>Green border = verdict as expected. Check by eye whether each orange box sits on the part that differs.</p><main>${cards}</main>`)

for (const task of [...new Set(rows.map(r => r.task))]) {
  const rs = rows.filter(r => r.task === task)
  const hit = rs.filter(r => r.got === want[r.expected]).length
  console.log(`\n${task}: ${hit}/${rs.length} verdicts as expected; wrong photos with a confident box: ${rs.filter(r => r.expected === 'wrong' && r.best).length}/${rs.filter(r => r.expected === 'wrong').length}`)
}
console.log(`\nReport: ${join(out, 'report.html')}`)
