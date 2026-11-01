// Deletes guides that were never published (draft/processing/ready/failed) and are older than 24 h,
// with their Storage files. Runs daily in CI (which also keeps the free Supabase project awake).
// Usage (from apps/showhow): node scripts/cleanup-drafts.ts [--dry-run]
import { existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

if (existsSync('.env.local')) process.loadEnvFile('.env.local')
const { VITE_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env
if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
const dry = process.argv.includes('--dry-run')
const db = createClient(new URL(url).origin, key, { auth: { persistSession: false } })

const cutoff = new Date(Date.now() - 24 * 3600_000).toISOString()
const { data: stale, error } = await db.from('guides').select('id, status, created_at').neq('status', 'published').lt('created_at', cutoff)
if (error) throw new Error(`query failed: ${error.message}`)
for (const g of stale ?? []) {
  const { data: files } = await db.storage.from('media').list(g.id)
  if (!dry) {
    if (files?.length) await db.storage.from('media').remove(files.map(f => `${g.id}/${f.name}`))
    await db.from('guides').delete().eq('id', g.id)
  }
  console.log(`${dry ? 'would delete' : 'deleted'} ${g.status} guide ${g.id.slice(0, 8)}… (${files?.length ?? 0} files)`)
}
// Old daily counters are not needed after a few days.
if (!dry) await db.from('usage').delete().lt('day', new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10))
console.log(`${stale?.length ?? 0} stale draft(s) ${dry ? 'found' : 'removed'}`)
