// POST /api/enhance {guideId}: optional "Enhanced by AI" stills for VIDEO guides (T18).
// Each real keyframe → Muse Image edit (same scene, clearer) → highlight edit. Stored separately as
// {idx}-ai.jpg; the real keyframe is untouched and remains the only reference /api/check uses.
import { z } from 'zod'
import { serverDb } from './_lib/db'
import { claimGuide, failGuide, finishGuide } from './_lib/guide-state'
import { HttpError, route } from './_lib/http'
import { jpegSize, sizeLike } from './_lib/jpeg'
import { editImage } from './_lib/meta'

const Body = z.object({ guideId: z.uuid() })
const ENHANCE = 'Keep exactly the same scene: the same objects, positions, hands, camera angle and framing. Only improve lighting, sharpness and colour, and remove blur and noise. Do not add, remove or change any object. No text.'

export const POST = route({ name: 'enhance', body: Body, accessCode: true }, async ({ body }) => {
  const db = serverDb()
  const id = body.guideId
  const guide = await claimGuide(db, id, ['ready'])
  try {
    if (guide.kind !== 'video') throw new HttpError(409, 'Only video guides have frames to enhance.')
    const { data: steps } = await db.from('steps').select('idx, key_part, keyframe_path').eq('guide_id', id)
    const media = db.storage.from('media')
    const results = await Promise.all((steps ?? []).map(async (s: { idx: number; key_part: string; keyframe_path: string | null }) => {
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
    }))
    if (results.length && !results.some(r => r.ok)) throw new HttpError(502, 'The enhanced images couldn’t be made right now. Your guide is fine without them.')
    await finishGuide(db, id, 'ready')
    return { images: results.sort((a, b) => a.idx - b.idx) }
  } catch (e) {
    await failGuide(db, id, e, 'ready')
    throw e
  }
})
