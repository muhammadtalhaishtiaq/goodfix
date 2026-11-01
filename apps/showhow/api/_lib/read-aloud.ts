// "Read aloud" MP3s (T16), made at publish AFTER the creator's edits so the audio always matches the
// published text. Best effort: a failure never blocks publishing; that step just has no Read aloud button.
import type { serverDb } from './db'
import { speak } from './wit'

type Db = ReturnType<typeof serverDb>

export async function addReadAloud(db: Db, id: string): Promise<{ idx: number; ok: boolean }[]> {
  const { data: steps } = await db.from('steps').select('idx, title, instruction').eq('guide_id', id)
  const media = db.storage.from('media')
  const results = await Promise.all((steps ?? []).map(async (s: { idx: number; title: string; instruction: string }) => {
    try {
      const mp3 = await speak(`Step ${s.idx + 1}. ${s.title}. ${s.instruction}`)
      await media.upload(`${id}/${s.idx}.mp3`, mp3, { contentType: 'audio/mpeg', upsert: true })
      await db.from('steps').update({ audio_path: `${id}/${s.idx}.mp3` }).eq('guide_id', id).eq('idx', s.idx)
      return { idx: s.idx, ok: true }
    } catch {
      return { idx: s.idx, ok: false }
    }
  }))
  return results.sort((a, b) => a.idx - b.idx)
}
