// POST /api/guides: create a draft video guide and hand back one-time upload URLs.
// The browser uploads the shrunk MP4 + WAV straight to Storage; media never passes through here.
import { z } from 'zod'
import { MAX_SECONDS } from '../src/lib/shrink-limits.js'
import { enforceCaps } from './_lib/caps.js'
import { CategoryField, PLACEHOLDER_TITLE, TitleField } from './_lib/fields.js'
import { serverDb } from './_lib/db.js'
import { ipKey, route } from './_lib/http.js'

export const Body = z.object({
  title: TitleField,
  category: CategoryField,
  creatorName: z.string().trim().min(1).max(60),
  durationS: z.number().positive().max(MAX_SECONDS + 1),
  consent: z.literal(true), // creator saw who processes and hosts their video
  adult: z.literal(true),   // Meta API Terms: 18+
})

export const POST = route({ name: 'guides', body: Body, accessCode: true }, async ({ body, ip }) => {
  const db = serverDb()
  await enforceCaps((fn, args) => db.rpc(fn, args), 'build', ipKey(ip))
  const { data: guide, error } = await db.from('guides')
    .insert({
      title: body.title || PLACEHOLDER_TITLE, category: body.category === 'auto' ? 'Other' : body.category,
      auto_title: !body.title, auto_category: body.category === 'auto',
      creator_name: body.creatorName, duration_s: body.durationS, kind: 'video', status: 'draft',
    })
    .select('id').single()
  if (error || !guide) throw new Error('guide insert failed')

  const sign = async (name: string) => {
    const { data, error: e } = await db.storage.from('media').createSignedUploadUrl(`${guide.id}/${name}`)
    if (e || !data) throw new Error('signed upload url failed')
    return { path: data.path, token: data.token }
  }
  return { id: guide.id, uploads: { video: await sign('video.mp4'), audio: await sign('audio.wav') } }
})
