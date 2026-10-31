// Applies supabase/schema.sql through the Supabase Management API (needs SUPABASE_ACCESS_TOKEN).
// Usage (from apps/showhow): node scripts/apply-schema.ts
import { readFileSync } from 'node:fs'

process.loadEnvFile('.env.local')
const token = process.env.SUPABASE_ACCESS_TOKEN
const anon = process.env.VITE_SUPABASE_ANON_KEY ?? ''
if (!token) throw new Error('Missing SUPABASE_ACCESS_TOKEN in .env.local')
// The project ref is inside the anon key's JWT payload, which is public by design.
const ref = JSON.parse(Buffer.from(anon.split('.')[1] ?? '', 'base64url').toString()).ref as string
const url = process.env.VITE_SUPABASE_URL ?? ''
console.log(`project ${ref} · VITE_SUPABASE_URL ${url === `https://${ref}.supabase.co` ? 'matches' : 'DOES NOT MATCH (fix it in .env.local)'}`)

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: readFileSync('supabase/schema.sql', 'utf8') }),
})
console.log(res.ok ? 'schema applied' : `FAILED ${res.status}: ${(await res.text()).slice(0, 400)}`)
process.exit(res.ok ? 0 : 1)
