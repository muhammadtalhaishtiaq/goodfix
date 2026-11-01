// POST /api/enhance {guideId}: optional "Enhanced by AI" stills for VIDEO guides (T18).
// Each real keyframe → Muse Image edit (same scene, clearer) → highlight edit. Stored separately as
// {idx}-ai.jpg; the real keyframe is untouched and remains the only reference /api/check uses.
// One step per call so stills appear as they finish (F9); calls run in parallel and count toward the image cap.
import { z } from 'zod'
import { enforceCaps } from './_lib/caps.js'
import { serverDb } from './_lib/db.js'
import { HttpError, ipKey, route } from './_lib/http.js'
import { jpegSize, sizeLike } from './_lib/jpeg.js'
import { editImage } from './_lib/meta.js'

const Body = z.object({ guideId: z.uuid(), idx: z.number().int().min(0).max(7) }) // one step per call (F9)
const ENHANCE = 'Keep exactly the same scene: the same objects, positions, hands, camera angle and framing. Only improve lighting, sharpness and colour, and remove blur and noise. Do not add, remove or change any object. No text.'

export const POST = route({ name: 'enhance', body: Body, accessCode: true }, async ({ body, ip }) => {
  const db = serverDb()
  const id = body.guideId
  await enforceCaps((fn, args) => db.rpc(fn, args), 'image', ipKey(ip))
  const { data: g } = await db.from('guides').select('status, kind').eq('id', id).maybeSingle()
  if (!g) throw new HttpError(404, 'That guide doesn’t exist.')
  if (g.kind !== 'video') throw new HttpError(409, 'Only video guides have frames to enhance.')
  if (g.status !== 'ready') throw new HttpError(409, 'This guide isn’t ready to enhance.')
  const { data: s } = await db.from('steps').select('idx, key_part, keyframe_path').eq('guide_id', id).eq('idx', body.idx).maybeSingle()
  if (!s) throw new HttpError(404, 'That step doesn’t exist.')
  const media = db.storage.from('media')
  if (!s.keyframe_path) return { idx: s.idx, ok: false }
  try {
    const { data: frame } = await media.download(s.keyframe_path)
    if (!frame) return { idx: s.idx, ok: false }
    const real = Buffer.from(await frame.arrayBuffer())
    const size = sizeLike(jpegSize(real)) // same shape as the real frame: no reframing
    const enhanced = await editImage(real, ENHANCE, size)
    const focus = await editImage(enhanced, `Keep the image exactly the same. Only add a bold orange (#EE5A17) dashed circle around the ${s.key_part}, to highlight it. No text.`, size)
    await media.upload(`${id}/${s.idx}-ai.jpg`, enhanced, { contentType: 'image/jpeg', upsert: true })
    await media.upload(`${id}/${s.idx}-ai-focus.jpg`, focus, { contentType: 'image/jpeg', upsert: true })
    await db.from('steps').update({ image_path: `${id}/${s.idx}-ai.jpg` }).eq('guide_id', id).eq('idx', s.idx)
    return { idx: s.idx, ok: true }
  } catch {
    return { idx: s.idx, ok: false } // that step keeps only its real frame
  }
})
