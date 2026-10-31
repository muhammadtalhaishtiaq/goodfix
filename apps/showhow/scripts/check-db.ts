// T3 verify: row-level security does what ARCHITECTURE §2 says. Creates and deletes one throwaway guide.
// Usage (from apps/showhow): node scripts/check-db.ts
import { createClient } from '@supabase/supabase-js'

process.loadEnvFile('.env.local')
const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: anonKey, SUPABASE_SERVICE_ROLE_KEY: serverKey } = process.env
if (!url || !anonKey || !serverKey) throw new Error('Missing Supabase vars in .env.local')
const opts = { auth: { persistSession: false } }
const base = new URL(url).origin // tolerate a pasted .../rest/v1/ suffix
const server = createClient(base, serverKey, opts)
const anon = createClient(base, anonKey, opts)

let failed = 0
const check = (name: string, ok: boolean) => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`) }

const { data: g, error } = await server.from('guides').insert({ title: 'RLS check (temporary)', category: 'Test', creator_name: 'check-db', status: 'draft' }).select('id').single()
if (error || !g) throw new Error(`server insert failed: ${error?.message}`)
await server.from('steps').insert({ guide_id: g.id, idx: 0, title: 't', instruction: 'i', start_s: 0, end_s: 1, key_part: 'k' })

try {
  check('anon cannot see a draft guide', ((await anon.from('guides').select('id').eq('id', g.id)).data ?? []).length === 0)
  check('anon cannot see a draft guide’s steps', ((await anon.from('steps').select('id').eq('guide_id', g.id)).data ?? []).length === 0)
  check('anon cannot insert guides', !!(await anon.from('guides').insert({ title: 'x', category: 'x', creator_name: 'x' })).error)
  check('anon cannot read usage counters', ((await anon.from('usage').select('*')).data ?? []).length === 0)
  check('anon cannot call bump_usage', !!(await anon.rpc('bump_usage', { p_kind: 'rls-check', p_limit: 99 })).error)
  check('anon cannot upload to media', !!(await anon.storage.from('media').upload(`${g.id}/x.jpg`, new Blob(['x'], { type: 'image/jpeg' }))).error)

  await server.from('guides').update({ status: 'published' }).eq('id', g.id)
  check('anon sees it once published', ((await anon.from('guides').select('id').eq('id', g.id)).data ?? []).length === 1)
  check('anon sees its steps once published', ((await anon.from('steps').select('id').eq('guide_id', g.id)).data ?? []).length === 1)
  check('anon cannot unpublish or edit', ((await anon.from('guides').update({ title: 'hacked' }).eq('id', g.id).select()).data ?? []).length === 0)
  check('server bump_usage counts under the limit', (await server.rpc('bump_usage', { p_kind: 'rls-check', p_limit: 1_000_000 })).data === true)
  check('server can create a signed upload URL', !(await server.storage.from('media').createSignedUploadUrl(`${g.id}/check.jpg`)).error)
} finally {
  await server.from('guides').delete().eq('id', g.id)
  await server.from('usage').delete().eq('kind', 'rls-check')
}
console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed; test guide removed.')
process.exit(failed ? 1 : 0)
