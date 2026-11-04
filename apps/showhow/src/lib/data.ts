// Guide data. Published guides come from Supabase (anon key, RLS: published only).
// Fixtures are used only when no database is configured (offline UI work), and are labelled.
import { FIXTURE_GUIDES } from '../fixtures/guides.js'
import { api, apiRaw } from './api.js'
import type { ChatMsg, ChatReply } from './chat.js'
import { resizePhoto } from './image.js'
import { mediaUrl, supabase } from './supabase.js'
import type { CheckRequest, CheckResult, Guide, Outline } from './types.js'

export { CATEGORIES } from './categories.js'

type StepRow = { idx: number; title: string; instruction: string; tip_quote: string | null; start_s: number; end_s: number; key_part: string; keyframe_path: string | null; outline: Outline | null; image_path: string | null; audio_path: string | null }
type GuideRow = { id: string; title: string; category: string; creator_name: string; kind: 'video' | 'voice'; video_path: string | null; duration_s: number | null; steps: StepRow[] }

const COLS = 'id, title, category, creator_name, kind, video_path, duration_s, steps(idx, title, instruction, tip_quote, start_s, end_s, key_part, keyframe_path, outline, image_path, audio_path)'

const toGuide = (g: GuideRow): Guide => ({
  id: g.id, title: g.title, category: g.category, creatorName: g.creator_name, kind: g.kind,
  videoUrl: g.video_path ? mediaUrl(g.video_path) : undefined, durationS: g.duration_s ?? 0, fixture: false,
  steps: [...g.steps].sort((a, b) => a.idx - b.idx).map(s => ({
    idx: s.idx, title: s.title, instruction: s.instruction, tipQuote: s.tip_quote ?? undefined,
    startS: s.start_s, endS: s.end_s, keyPart: s.key_part, outline: s.outline,
    keyframeUrl: s.keyframe_path ? mediaUrl(s.keyframe_path) : undefined,
    imageUrl: s.image_path ? mediaUrl(s.image_path) : undefined,
    audioUrl: s.audio_path ? mediaUrl(s.audio_path) : undefined,
  })),
})

export async function fetchGuides(): Promise<Guide[]> {
  if (!supabase) return FIXTURE_GUIDES
  const { data, error } = await supabase.from('guides').select(COLS).eq('status', 'published').order('created_at', { ascending: false })
  if (error) throw new Error('Couldn’t load guides. Check your connection.')
  return (data as unknown as GuideRow[]).map(toGuide)
}

export async function fetchGuide(id: string): Promise<Guide | undefined> {
  if (!supabase || id.startsWith('fixture-')) return FIXTURE_GUIDES.find(g => g.id === id)
  if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined // malformed link: "doesn't exist", not a connection error
  const { data, error } = await supabase.from('guides').select(COLS).eq('id', id).eq('status', 'published').maybeSingle()
  if (error) throw new Error('Couldn’t load this guide. Check your connection.')
  return data ? toGuide(data as unknown as GuideRow) : undefined
}

// "I'm stuck": the photo is resized on-device, then sent once, after the learner approved the preview.
export async function checkStep(req: CheckRequest): Promise<CheckResult> {
  if (!supabase || req.guideId.startsWith('fixture-')) {
    await new Promise(r => setTimeout(r, 1200))
    return { mode: 'stuck', fixture: true, outline: null, verdict: { status: 'unclear', differences: [], message: 'TEST FIXTURE: no model was called, so this is not a real comparison.' } }
  }
  const photo = await resizePhoto(req.photo)
  return api<CheckResult>('check', { guideId: req.guideId, stepIdx: req.stepIdx, mode: req.mode, photo, question: req.question })
}

// "Ask about this step" (F13+): answered only from the guide's own steps; the question is not stored.
export async function chatStep(guideId: string, stepIdx: number, messages: ChatMsg[], speak = false): Promise<ChatReply & { audio?: string }> {
  if (!supabase || guideId.startsWith('fixture-')) {
    await new Promise(r => setTimeout(r, 800))
    return { covered: false, answer: '', steps: [], tip: 'TEST FIXTURE: no model was called.' }
  }
  return api('chat', { guideId, stepIdx, messages, speak })
}

// A spoken chat question → text (Voice Transcribe). The audio is sent once and never stored.
export async function listenQuestion(guideId: string, wav: Blob): Promise<string> {
  return (await apiRaw<{ text: string }>('listen', wav, { guideId })).text
}
