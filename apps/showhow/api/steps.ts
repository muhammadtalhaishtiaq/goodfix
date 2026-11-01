// POST /api/steps {guideId}: narration → steps (T9). See ARCHITECTURE §7.1.
// Transcribe once (turns are saved so a retry skips it), then Muse Spark splits the steps by turn
// index, then our own validation decides. Returns signed upload URLs for each step's keyframe.
import { z } from 'zod'
import { blockedTopic } from '../src/lib/safety.js'
import { stepsJsonSchema, stepsPrompt, validateSteps, type Turn } from '../src/lib/steps.js'
import { serverDb } from './_lib/db.js'
import { claimGuide, failGuide, finishGuide } from './_lib/guide-state.js'
import { HttpError, route } from './_lib/http.js'
import { sparkJson, transcribe } from './_lib/meta.js'

const Body = z.object({ guideId: z.uuid() })

export const POST = route({ name: 'steps', body: Body, accessCode: true }, async ({ body }) => {
  const db = serverDb()
  const id = body.guideId
  const guide = await claimGuide(db, id, ['draft', 'failed'])
  const media = db.storage.from('media')
  const wavPath = `${id}/audio.wav`
  try {
    let turns = guide.turns as Turn[] | null
    if (!turns) {
      const { data: wav } = await media.download(wavPath)
      if (!wav) throw new HttpError(409, 'The audio upload is missing. Please upload the video again.')
      turns = await transcribe(wav)
      await db.from('guides').update({ turns }).eq('id', id)
      await media.remove([wavPath]) // narration is now text; the audio copy has no further use
    }
    if (turns.length < 2) throw new HttpError(422, 'We couldn’t hear enough narration to build steps. Talk through each step as you do it.')
    const topic = blockedTopic(turns.map(t => t.transcript).join(' ')) // same hard rules as voice guides
    if (topic) throw new HttpError(422, `This topic isn’t allowed here (${topic}).`)

    const videoUrl = media.getPublicUrl(`${id}/video.mp4`).data.publicUrl
    const raw = await sparkJson([
      { type: 'input_text', text: stepsPrompt(turns) },
      { type: 'input_video', video_url: videoUrl },
    ], 'steps', stepsJsonSchema)
    const result = validateSteps(raw, turns)
    if (!result.ok) throw new HttpError(422, 'We couldn’t split this video into clear steps. Try narrating each step as you do it.')

    await db.from('steps').delete().eq('guide_id', id) // retry-safe
    const { error } = await db.from('steps').insert(result.steps.map(s => ({
      guide_id: id, idx: s.idx, title: s.title, instruction: s.instruction, tip_quote: s.tipQuote ?? null,
      start_s: s.startS, end_s: s.endS, key_part: s.keyPart, sam_noun: s.samNoun,
    })))
    if (error) throw new Error('steps insert failed')
    // Reference frame near the END of each step (where the result is visible), matching verdictPrompt.
    const keyframeUploads = await Promise.all(result.steps.map(async s => {
      const { data } = await media.createSignedUploadUrl(`${id}/${s.idx}.jpg`)
      if (!data) throw new Error('signed upload url failed')
      return { idx: s.idx, atS: Math.max(s.startS, s.endS - 0.4), path: data.path, token: data.token }
    }))
    await finishGuide(db, id, 'ready', { video_path: `${id}/video.mp4` }) // only after everything above succeeded
    return { steps: result.steps, keyframeUploads }
  } catch (e) {
    await failGuide(db, id, e)
    if (guide.attempts >= 3) await media.remove([wavPath]) // out of retries: don't keep the audio
    throw e
  }
})
