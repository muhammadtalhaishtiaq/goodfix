// Fails if anything secret reached the browser bundle (dist/ by default, or the dir given).
// Checks: values of server-only env vars (CI sets fake canaries), Supabase secret-key prefixes,
// service_role JWTs, and server-only variable names that client code should never mention.
// Usage (from apps/showhow): node scripts/scan-bundle.ts [dir]
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

if (existsSync('.env.local')) process.loadEnvFile('.env.local') // locally, also check the real values (never printed)
const dir = process.argv[2] ?? 'dist'
const SERVER_VARS = ['META_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ACCESS_TOKEN', 'SUPABASE_DB_URL', 'WIT_TOKEN', 'CREATE_ACCESS_CODES', 'IP_SALT']
const needles = [
  ...SERVER_VARS.map(v => process.env[v]).filter((v): v is string => !!v && v.length >= 8),
  'sb_secret_', 'sbp_', ...SERVER_VARS,
]

const files = (d: string): string[] => readdirSync(d).flatMap(f => statSync(join(d, f)).isDirectory() ? files(join(d, f)) : [join(d, f)])
const isServiceJwt = (jwt: string) => {
  try { return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString()).role === 'service_role' } catch { return false }
}

let hits = 0
for (const f of files(dir)) {
  const text = readFileSync(f, 'latin1')
  for (const n of needles) if (text.includes(n)) { hits++; console.log(`LEAK ${f}: contains ${SERVER_VARS.includes(n) || n.startsWith('sb') ? n : 'a server env value'}`) }
  for (const [jwt] of text.matchAll(/eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+/g)) if (isServiceJwt(jwt)) { hits++; console.log(`LEAK ${f}: service_role JWT`) }
}
console.log(hits ? `${hits} leak(s) found` : `No secrets in ${dir}`)
process.exit(hits ? 1 : 0)
