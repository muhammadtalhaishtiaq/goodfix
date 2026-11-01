// POST /api/outlines {guideId}: SAM 3.1 boxes the key part on each step's real keyframe (T10).
// Only a confident, unambiguous box is saved; otherwise the step simply has no outline.
import { z } from 'zod'
import { FRAME_REVIEW_PROMPT, frameReviewJsonSchema, gateFrames } from '../src/lib/safety.js'
import { bestOutline, parseSamBoxes } from '../src/lib/sam.js'
import { serverDb } from './_lib/db.js'
import { claimGuide, failGuide, finishGuide } from './_lib/guide-state.js'
import { HttpError, route } from './_lib/http.js'
import { samText, sparkJson } from './_lib/meta.js'

const Body = z.object({ guideId: z.uuid() })

export const POST = route({ name: 'outlines', body: Body, accessCode: true }, async ({ body }) => {
  const db = serverDb()
  const id = body.guideId
  const guide = await claimGuide(db, id, ['ready'])
  if (guide.kind !== 'video') { await finishGuide(db, id, 'ready'); throw new HttpError(409, 'Only video guides have keyframes to outline.') }
  try {
    const media = db.storage.from('media')
    const { data: steps } = await db.from('steps').select('idx, sam_noun, key_part').eq('guide_id', id)
    const { data: files } = await media.list(id)
    const have = new Set((files ?? []).map((f: { name: string }) => f.name))
    // Content check on what the frames show, before anything else (F4). Errors fail closed.
    const frameUrls = (steps ?? []).filter((s: { idx: number }) => have.has(`${s.idx}.jpg`)).map((s: { idx: number }) => media.getPublicUrl(`${id}/${s.idx}.jpg`).data.publicUrl)
    let frameReview: unknown = null
    try { frameReview = await sparkJson([{ type: 'input_text', text: FRAME_REVIEW_PROMPT }, ...frameUrls.map(u => ({ type: 'input_image', image_url: u }))], 'frames', frameReviewJsonSchema, 60_000) } catch { /* fail closed */ }
    const frames = gateFrames(frameReview)
    if (!frames.ok) {
      const blocked = frameReview !== null && (frameReview as { ok?: boolean }).ok === false
      await failGuide(db, id, new HttpError(blocked ? 422 : 502, frames.reason), blocked ? 'failed' : 'ready')
      throw new HttpError(blocked ? 422 : 502, frames.reason)
    }
    const results = await Promise.all((steps ?? []).map(async (s: { idx: number; sam_noun: string | null; key_part: string }) => {
      const path = `${id}/${s.idx}.jpg`
      if (!have.has(`${s.idx}.jpg`)) return { idx: s.idx, keyframe: false, outline: null }
      const noun = s.sam_noun || s.key_part.split(' ').pop() || s.key_part
      const outline = bestOutline(parseSamBoxes(await samText(media.getPublicUrl(path).data.publicUrl, noun)))
      await db.from('steps').update({ keyframe_path: path, outline }).eq('guide_id', id).eq('idx', s.idx)
      return { idx: s.idx, keyframe: true, outline }
    }))
    await finishGuide(db, id, 'ready', { frames_ok: true })
    return { outlines: results.sort((a, b) => a.idx - b.idx) }
  } catch (e) {
    if (!(e instanceof HttpError && (e.status === 422 || e.status === 502))) await failGuide(db, id, e, 'ready')
    throw e
  }
})
