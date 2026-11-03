// POST /api/publish {guideId, edits}: apply the creator's text edits and make the guide public (T11).
// Edits only touch title/instruction (and dropping an AI image), never times or geometry. Then the
// read-aloud audio is made from the FINAL text (Wit.ai, best effort).
import { z } from 'zod'
import { CATEGORIES } from '../src/lib/categories.js'
import { serverDb } from './_lib/db.js'
import { HttpError, route } from './_lib/http.js'
import { addReadAloud } from './_lib/read-aloud.js'
import { blockedMatch, blockedMessage } from '../src/lib/safety.js'

const Body = z.object({
  guideId: z.uuid(),
  title: z.string().trim().min(1).max(120).optional(),   // creator's final title (may replace the AI's)
  category: z.enum(CATEGORIES).optional(),
  edits: z.array(z.object({
    idx: z.number().int().min(0).max(7),
    title: z.string().trim().min(1).max(60),
    instruction: z.string().trim().min(1).max(300),
    dropAiImage: z.boolean().optional(), // creator rejected the AI image for this step
  })).max(8),
})

export const POST = route({ name: 'publish', body: Body, accessCode: true }, async ({ body }) => {
  const db = serverDb()
  const id = body.guideId
  const { data: g } = await db.from('guides').select('id, status, kind, frames_ok').eq('id', id).maybeSingle()
  if (!g) throw new HttpError(404, 'That guide doesn’t exist.')
  if (g.status !== 'ready') throw new HttpError(409, g.status === 'published' ? 'This guide is already published.' : 'This guide isn’t ready to publish yet.')
  if (g.kind === 'video' && !g.frames_ok) throw new HttpError(409, 'The video’s frames haven’t passed the content check yet.')
  const edited = [body.title ?? '', ...body.edits.map(e => `${e.title} ${e.instruction}`)].join(' ')
  const hit = blockedMatch(edited) // creator edits can't sneak past the topic rules
  if (hit) throw new HttpError(422, blockedMessage(hit, 'Your edit mentions a topic that'))
  for (const e of body.edits) {
    await db.from('steps').update({ title: e.title, instruction: e.instruction, ...(e.dropAiImage ? { image_path: null } : {}) })
      .eq('guide_id', id).eq('idx', e.idx)
  }
  if (body.title || body.category) await db.from('guides').update({ ...(body.title ? { title: body.title } : {}), ...(body.category ? { category: body.category } : {}) }).eq('id', id)
  const readAloud = await addReadAloud(db, id)
  const { data: won } = await db.from('guides').update({ status: 'published' }).eq('id', id).eq('status', 'ready').select('id')
  if (!won?.length) throw new HttpError(409, 'This guide changed while publishing. Please try again.')
  return { id, path: `#/guide/${id}/1`, readAloud }
})
