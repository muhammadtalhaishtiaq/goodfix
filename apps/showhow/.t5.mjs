import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
process.loadEnvFile('.env.local')
const code = (process.env.CREATE_ACCESS_CODES ?? '').split(',')[0].trim()
const H = { 'content-type': 'application/json', 'x-access-code': code }
const base = new URL(process.env.VITE_SUPABASE_URL).origin
const anon = createClient(base, process.env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
const server = createClient(base, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const post = async (n, b, h = H) => { const r = await fetch('http://localhost:5173/api/' + n, { method: 'POST', headers: h, body: JSON.stringify(b) }); return [r.status, await r.json()] }
const [, g] = await post('guides', { title: 'T5 check (temporary)', category: 'Home', creatorName: 't5', durationS: 33, consent: true, adult: true })
for (const [k, f, t] of [['video', '/private/tmp/claude-501/-Users-talhaishtiaq-Documents-Me-Projects-rnd-vault/d77ae519-d35e-4ab3-a826-d68961fc8e4b/scratchpad/t8.mp4', 'video/mp4'], ['audio', '/private/tmp/claude-501/-Users-talhaishtiaq-Documents-Me-Projects-rnd-vault/d77ae519-d35e-4ab3-a826-d68961fc8e4b/scratchpad/t8.wav', 'audio/wav']]) await anon.storage.from('media').uploadToSignedUrl(g.uploads[k].path, g.uploads[k].token, new Blob([readFileSync(f)], { type: t }), { contentType: t })
const [, built] = await post('steps', { guideId: g.id })
for (const k of built.keyframeUploads) { execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', String(k.atS), '-i', '/private/tmp/claude-501/-Users-talhaishtiaq-Documents-Me-Projects-rnd-vault/d77ae519-d35e-4ab3-a826-d68961fc8e4b/scratchpad/t8.mp4', '-frames:v', '1', '-q:v', '3', '/private/tmp/claude-501/-Users-talhaishtiaq-Documents-Me-Projects-rnd-vault/d77ae519-d35e-4ab3-a826-d68961fc8e4b/scratchpad/kf' + k.idx + '.jpg']); await anon.storage.from('media').uploadToSignedUrl(k.path, k.token, new Blob([readFileSync('/private/tmp/claude-501/-Users-talhaishtiaq-Documents-Me-Projects-rnd-vault/d77ae519-d35e-4ab3-a826-d68961fc8e4b/scratchpad/kf' + k.idx + '.jpg')], { type: 'image/jpeg' }), { contentType: 'image/jpeg' }) }
await post('outlines', { guideId: g.id }); await post('publish', { guideId: g.id, edits: [] })
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', '/private/tmp/claude-501/-Users-talhaishtiaq-Documents-Me-Projects-rnd-vault/d77ae519-d35e-4ab3-a826-d68961fc8e4b/scratchpad/kf1.jpg', '-vf', 'vflip,hflip', '/private/tmp/claude-501/-Users-talhaishtiaq-Documents-Me-Projects-rnd-vault/d77ae519-d35e-4ab3-a826-d68961fc8e4b/scratchpad/wrong.jpg'])
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', '/private/tmp/claude-501/-Users-talhaishtiaq-Documents-Me-Projects-rnd-vault/d77ae519-d35e-4ab3-a826-d68961fc8e4b/scratchpad/kf1.jpg', '-vf', 'boxblur=40:5', '/private/tmp/claude-501/-Users-talhaishtiaq-Documents-Me-Projects-rnd-vault/d77ae519-d35e-4ab3-a826-d68961fc8e4b/scratchpad/blurry.jpg'])
const url = f => 'data:image/jpeg;base64,' + readFileSync(f).toString('base64')
for (const [label, f] of [['right (same frame)', '/private/tmp/claude-501/-Users-talhaishtiaq-Documents-Me-Projects-rnd-vault/d77ae519-d35e-4ab3-a826-d68961fc8e4b/scratchpad/kf1.jpg'], ['wrong (upside down)', '/private/tmp/claude-501/-Users-talhaishtiaq-Documents-Me-Projects-rnd-vault/d77ae519-d35e-4ab3-a826-d68961fc8e4b/scratchpad/wrong.jpg'], ['blurry', '/private/tmp/claude-501/-Users-talhaishtiaq-Documents-Me-Projects-rnd-vault/d77ae519-d35e-4ab3-a826-d68961fc8e4b/scratchpad/blurry.jpg']]) {
  const t = Date.now(); const [st, out] = await post('check', { guideId: g.id, stepIdx: 1, mode: 'stuck', photo: url(f), question: 'Is it the right way up?' }, { 'content-type': 'application/json' })
  console.log(label.padEnd(20), '→', st, out.verdict?.status ?? out.error, (Date.now() - t) + ' ms', out.verdict?.differences?.[0] ? '· sam "' + out.verdict.differences[0].sam_noun + '" box=' + !!out.outline : '', '·', (out.verdict?.message ?? '').slice(0, 90))
}
const { data: files } = await server.storage.from('media').list(g.id); await server.storage.from('media').remove(files.map(f => g.id + '/' + f.name)); await server.from('guides').delete().eq('id', g.id); await server.from('usage').delete().like('kind', 'check%'); console.log('cleaned up')
