// POST /api/voice-images: Muse Image illustrations for a voice guide (T17), per step so the creator sees
// each image as it finishes (F9).
//   {guideId}       → base mode: one base image of the object in the chosen style (claimed, runs once)
//   {guideId, idx}  → one step: an EDIT of the base (keeps the object identical) + a highlight edit.
//                     Step calls run in parallel from the browser, so they don't take the claim lock.
// Every image is labelled "Illustration by AI" and never used as evidence. All calls count toward the image cap.
import { z } from 'zod'
import { STYLES, type StyleId } from '../src/lib/styles.js'
import { enforceCaps } from './_lib/caps.js'
import { serverDb } from './_lib/db.js'
import { claimGuide, failGuide, finishGuide } from './_lib/guide-state.js'
import { HttpError, ipKey, route } from './_lib/http.js'
import { editImage, generateImage } from './_lib/meta.js'

const Body = z.object({ guideId: z.uuid(), idx: z.number().int().min(0).max(7).optional() })
const KEEP = 'Keep exactly the same object, shape, colours, camera angle, framing and background as the reference image.'

export const POST = route({ name: 'voice-images', body: Body, accessCode: true }, async ({ body, ip }) => {
  const db = serverDb()
  const id = body.guideId
  await enforceCaps((fn, args) => db.rpc(fn, args), 'image', ipKey(ip))
  const media = db.storage.from('media')
  const put = (path: string, img: Buffer) => media.upload(path, img, { contentType: 'image/jpeg', upsert: true })

  if (body.idx === undefined) {
    const guide = await claimGuide(db, id, ['ready'])
    try {
      if (guide.kind !== 'voice') throw new HttpError(409, 'Only voice guides get illustrations.')
      const { data: g } = await db.from('guides').select('subject, image_style').eq('id', id).maybeSingle()
      const style = STYLES[(g?.image_style ?? 'flat') as StyleId] ?? STYLES.flat
      let base: Buffer
      try {
        base = await generateImage(`${g?.subject ?? 'the object'}, shown alone, three-quarter view, centered, no hands. Style: ${style.prompt} Plain light background, no text, no faces.`)
      } catch { throw new HttpError(502, 'The illustrations couldn’t be made right now. You can try again.') }
      await put(`${id}/base.jpg`, base)
      const { data: steps } = await db.from('steps').select('idx').eq('guide_id', id)
      await finishGuide(db, id, 'ready')
      return { base: true, steps: ((steps ?? []) as { idx: number }[]).map(s => s.idx).sort((a, b) => a - b) }
    } catch (e) {
      await failGuide(db, id, e, 'ready')
      throw e
    }
  }

  const { data: g } = await db.from('guides').select('status, kind').eq('id', id).maybeSingle()
  if (!g) throw new HttpError(404, 'That guide doesn’t exist.')
  if (g.kind !== 'voice') throw new HttpError(409, 'Only voice guides get illustrations.')
  if (g.status !== 'ready') throw new HttpError(409, 'This guide isn’t ready for illustrations.')
  const { data: s } = await db.from('steps').select('idx, instruction, key_part').eq('guide_id', id).eq('idx', body.idx).maybeSingle()
  if (!s) throw new HttpError(404, 'That step doesn’t exist.')
  const { data: baseBlob } = await media.download(`${id}/base.jpg`)
  if (!baseBlob) throw new HttpError(409, 'Draw the base picture first.')
  try {
    const base = Buffer.from(await baseBlob.arrayBuffer())
    const img = await editImage(base, `${KEEP} Now show this step: ${s.instruction} No text, no faces.`)
    const focus = await editImage(img, `Keep the image exactly the same. Only add a bold orange (#EE5A17) dashed circle around the ${s.key_part}, to highlight it. No text.`)
    await put(`${id}/${s.idx}-ai.jpg`, img)
    await put(`${id}/${s.idx}-ai-focus.jpg`, focus)
    await db.from('steps').update({ image_path: `${id}/${s.idx}-ai.jpg` }).eq('guide_id', id).eq('idx', s.idx)
    return { idx: s.idx, ok: true }
  } catch {
    return { idx: s.idx, ok: false } // that step shows text only, with "No illustration"
  }
})
