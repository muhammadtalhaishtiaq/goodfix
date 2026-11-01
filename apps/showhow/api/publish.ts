// POST /api/publish {guideId, edits}: apply the creator's text edits and make the guide public (T11).
// Edits only touch title/instruction (and dropping an AI image), never times or geometry. Then the
// read-aloud audio is made from the FINAL text (Wit.ai, best effort).
import { z } from 'zod'
import { serverDb } from './_lib/db.js'
import { HttpError, route } from './_lib/http.js'
import { addReadAloud } from './_lib/read-aloud.js'
import { blockedTopic } from '../src/lib/safety.js'

const Body = z.object({
  guideId: z.uuid(),
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
  const { data: g } = await db.from('guides').select('id, status').eq('id', id).maybeSingle()
  if (!g) throw new HttpError(404, 'That guide doesn’t exist.')
  if (g.status !== 'ready') throw new HttpError(409, g.status === 'published' ? 'This guide is already published.' : 'This guide isn’t ready to publish yet.')
  const edited = body.edits.map(e => `${e.title} ${e.instruction}`).join(' ')
  const topic = blockedTopic(edited) // creator edits can't sneak past the topic rules
  if (topic) throw new HttpError(422, `This edit mentions a topic that isn’t allowed here (${topic}).`)
  for (const e of body.edits) {
    await db.from('steps').update({ title: e.title, instruction: e.instruction, ...(e.dropAiImage ? { image_path: null } : {}) })
      .eq('guide_id', id).eq('idx', e.idx)
  }
  const readAloud = await addReadAloud(db, id)
  const { data: won } = await db.from('guides').update({ status: 'published' }).eq('id', id).eq('status', 'ready').select('id')
  if (!won?.length) throw new HttpError(409, 'This guide changed while publishing. Please try again.')
  return { id, path: `#/guide/${id}/1`, readAloud }
})
