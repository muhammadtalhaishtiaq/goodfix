// POST /api/voice-images: Muse Image illustrations for a voice guide (T17), per step so the creator sees
// each image as it finishes (F9).
//   {guideId}       → base mode: "object" guides draw one base picture of the object (claimed, runs once);
//                     "scene" guides need no base and return straight away.
//   {guideId, idx}  → one step: "object" = an EDIT of the base (object stays identical); "scene" = drawn fresh
//                     in the guide's shared setting and style. Then SAM 3.1 outlines the key part on it.
// Prompts come from Spark's picture brief, not the creator's raw sentence (lib/imagePrompt.ts).
// Every image is labelled "Illustration by AI" and never used as evidence. Every Muse Image call counts toward the image cap.
import { z } from 'zod'
import { basePrompt, stepPrompt } from '../src/lib/imagePrompt.js'
import { bestOutline, parseSamBoxes } from '../src/lib/sam.js'
import { STYLES, type StyleId } from '../src/lib/styles.js'
import type { PictureMode } from '../src/lib/steps.js'
import { enforceCaps } from './_lib/caps.js'
import { serverDb } from './_lib/db.js'
import { claimGuide, failGuide, finishGuide } from './_lib/guide-state.js'
import { HttpError, ipKey, route } from './_lib/http.js'
import { editImage, generateImage, samText } from './_lib/meta.js'

const Body = z.object({ guideId: z.uuid(), idx: z.number().int().min(0).max(7).optional() })
type GuideRow = { status: string; kind: string; subject: string | null; image_style: string | null; image_mode: PictureMode | null; image_setting: string | null }

export const POST = route({ name: 'voice-images', body: Body, accessCode: true }, async ({ body, ip }) => {
  const db = serverDb()
  const id = body.guideId
  const caps = () => enforceCaps((fn, args) => db.rpc(fn, args), 'image', ipKey(ip))
  const media = db.storage.from('media')
  const put = (path: string, img: Buffer) => media.upload(path, img, { contentType: 'image/jpeg', upsert: true })
  const { data: g } = await db.from('guides').select('status, kind, subject, image_style, image_mode, image_setting').eq('id', id).maybeSingle() as { data: GuideRow | null }
  if (!g) throw new HttpError(404, 'That guide doesn’t exist.')
  if (g.kind !== 'voice') throw new HttpError(409, 'Only voice guides get illustrations.')
  const style = STYLES[(g.image_style ?? 'flat') as StyleId] ?? STYLES.flat
  const mode: PictureMode = g.image_mode ?? 'object'

  if (body.idx === undefined) {
    const { data: steps } = await db.from('steps').select('idx').eq('guide_id', id)
    const list = ((steps ?? []) as { idx: number }[]).map(s => s.idx).sort((a, b) => a - b)
    if (mode === 'scene') {
      if (g.status !== 'ready') throw new HttpError(409, 'This guide isn’t ready for illustrations.')
      return { base: false, steps: list }
    }
    await caps()
    await claimGuide(db, id, ['ready'])
    try {
      let base: Buffer
      try { base = await generateImage(basePrompt(g.subject ?? 'the object', style.prompt)) } catch { throw new HttpError(502, 'The illustrations couldn’t be made right now. You can try again.') }
      await put(`${id}/base.jpg`, base)
      await finishGuide(db, id, 'ready')
      return { base: true, steps: list }
    } catch (e) {
      await failGuide(db, id, e, 'ready')
      throw e
    }
  }

  if (g.status !== 'ready') throw new HttpError(409, 'This guide isn’t ready for illustrations.')
  const { data: s } = await db.from('steps').select('idx, instruction, key_part, sam_noun, picture').eq('guide_id', id).eq('idx', body.idx).maybeSingle()
  if (!s) throw new HttpError(404, 'That step doesn’t exist.')
  let base: Buffer | null = null
  if (mode === 'object') {
    const { data: baseBlob } = await media.download(`${id}/base.jpg`)
    if (!baseBlob) throw new HttpError(409, 'Draw the base picture first.')
    base = Buffer.from(await baseBlob.arrayBuffer())
  }
  await caps()
  const prompt = stepPrompt({ mode, picture: s.picture, instruction: s.instruction, setting: g.image_setting, stylePrompt: style.prompt })
  let img: Buffer
  try { img = base ? await editImage(base, prompt) : await generateImage(prompt) } catch {
    return { idx: s.idx, ok: false, outline: null } // that step shows text only, with "No illustration"
  }
  const path = `${id}/${s.idx}-ai.jpg`
  await put(path, img)
  // The highlight is SAM's box on this picture, drawn by our overlay: no match → no circle.
  let outline = null
  try { outline = bestOutline(parseSamBoxes(await samText(media.getPublicUrl(path).data.publicUrl, s.sam_noun || s.key_part))) } catch { /* no outline */ }
  await db.from('steps').update({ image_path: path, outline }).eq('guide_id', id).eq('idx', s.idx)
  return { idx: s.idx, ok: true, outline }
})
