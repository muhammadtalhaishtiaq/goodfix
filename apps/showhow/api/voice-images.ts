// POST /api/voice-images {guideId}: Muse Image illustrations for a voice guide (T17).
// One base image of the object, then every step is an EDIT of that base (keeps the object identical),
// then a highlight edit circles the key part. Labelled "Illustration by AI" everywhere; never evidence.
import { z } from 'zod'
import { STYLES, type StyleId } from '../src/lib/styles.js'
import { enforceCaps } from './_lib/caps.js'
import { serverDb } from './_lib/db.js'
import { claimGuide, failGuide, finishGuide } from './_lib/guide-state.js'
import { HttpError, ipKey, route } from './_lib/http.js'
import { editImage, generateImage } from './_lib/meta.js'

const Body = z.object({ guideId: z.uuid() })
const KEEP = 'Keep exactly the same object, shape, colours, camera angle, framing and background as the reference image.'

export const POST = route({ name: 'voice-images', body: Body, accessCode: true }, async ({ body, ip }) => {
  const db = serverDb()
  const id = body.guideId
  await enforceCaps((fn, args) => db.rpc(fn, args), 'image', ipKey(ip))
  const guide = await claimGuide(db, id, ['ready'])
  try {
    if (guide.kind !== 'voice') throw new HttpError(409, 'Only voice guides get illustrations.')
    const { data: g } = await db.from('guides').select('subject, image_style').eq('id', id).maybeSingle()
    const { data: steps } = await db.from('steps').select('idx, instruction, key_part').eq('guide_id', id)
    const style = STYLES[(g?.image_style ?? 'flat') as StyleId] ?? STYLES.flat
    let base: Buffer
    try {
      base = await generateImage(`${g?.subject ?? 'the object'}, shown alone, three-quarter view, centered, no hands. Style: ${style.prompt} Plain light background, no text, no faces.`)
    } catch { throw new HttpError(502, 'The illustrations couldn’t be made right now. You can try again.') }

    const media = db.storage.from('media')
    const put = (path: string, img: Buffer) => media.upload(path, img, { contentType: 'image/jpeg', upsert: true })
    const results = await Promise.all((steps ?? []).map(async (s: { idx: number; instruction: string; key_part: string }) => {
      try {
        const img = await editImage(base, `${KEEP} Now show this step: ${s.instruction} No text, no faces.`)
        const focus = await editImage(img, `Keep the image exactly the same. Only add a bold orange (#EE5A17) dashed circle around the ${s.key_part}, to highlight it. No text.`)
        await put(`${id}/${s.idx}-ai.jpg`, img)
        await put(`${id}/${s.idx}-ai-focus.jpg`, focus)
        await db.from('steps').update({ image_path: `${id}/${s.idx}-ai.jpg` }).eq('guide_id', id).eq('idx', s.idx)
        return { idx: s.idx, ok: true }
      } catch {
        return { idx: s.idx, ok: false } // that step shows text only, with "No illustration"
      }
    }))
    if (!results.some(r => r.ok)) throw new HttpError(502, 'The illustrations couldn’t be made right now. You can try again.')
    await finishGuide(db, id, 'ready')
    return { images: results.sort((a, b) => a.idx - b.idx) }
  } catch (e) {
    await failGuide(db, id, e, 'ready')
    throw e
  }
})
