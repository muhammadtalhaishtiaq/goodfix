// POST /api/publish {guideId, edits}: apply the creator's text edits and make the guide public (T11).
// No model calls. Edits only touch title/instruction (and dropping an AI image), never times or geometry.
import { z } from 'zod'
import { serverDb } from './_lib/db'
import { HttpError, route } from './_lib/http'

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
  for (const e of body.edits) {
    await db.from('steps').update({ title: e.title, instruction: e.instruction, ...(e.dropAiImage ? { image_path: null } : {}) })
      .eq('guide_id', id).eq('idx', e.idx)
  }
  const { data: won } = await db.from('guides').update({ status: 'published' }).eq('id', id).eq('status', 'ready').select('id')
  if (!won?.length) throw new HttpError(409, 'This guide changed while publishing. Please try again.')
  return { id, path: `#/guide/${id}/1` }
})
