// Server-only Supabase client (service role). Never import this from src/.
import { createClient } from '@supabase/supabase-js'

export function serverDb() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase server env is not configured')
  return createClient(new URL(url).origin, key, { auth: { persistSession: false } })
}
