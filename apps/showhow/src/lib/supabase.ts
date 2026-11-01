// Browser Supabase client: public anon key only. RLS lets it read published guides and
// upload to server-signed URLs, nothing else.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase = url && key ? createClient(new URL(url).origin, key, { auth: { persistSession: false } }) : null

export const mediaUrl = (path: string) => supabase?.storage.from('media').getPublicUrl(path).data.publicUrl ?? ''

export async function uploadSigned(path: string, token: string, file: Blob) {
  if (!supabase) throw new Error('Storage isn’t configured.')
  const { error } = await supabase.storage.from('media').uploadToSignedUrl(path, token, file, { contentType: file.type, upsert: true })
  if (error) throw new Error('Upload failed. Check your connection and try again.')
}
