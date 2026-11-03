// Muse Image prompts for voice-guide illustrations (T17, reworked 2026-11-03).
// "object": every step edits one base picture, so the object stays identical. "scene": each step is drawn
// fresh in a shared setting and style, so a routine's steps actually look different.
import type { PictureMode } from './steps.js'

// Positive wording on purpose: image models draw whatever a prompt names, including after "no".
export const QUALITY = 'Natural proportions and anatomy; any hands have five fingers and are attached to forearms entering from the edge of the frame; people only seen from behind or below the shoulders. One clear subject, sharp focus, coherent light and shadows, uncluttered composition, plain surfaces free of writing.'

export type PictureInput = { mode: PictureMode; picture?: string | null; instruction: string; setting?: string | null; stylePrompt: string }

// The creator's sentence is only a fallback (older guides): Spark's picture brief is what describes the frame.
const what = (p: PictureInput) => p.picture?.trim() || p.instruction

export function basePrompt(subject: string, stylePrompt: string): string {
  return `${subject}, the whole object in view, three-quarter view, centred, on a plain light surface with an empty background. Style: ${stylePrompt} ${QUALITY}`
}

export function stepPrompt(p: PictureInput): string {
  return p.mode === 'object'
    ? `Same object, colours, materials and style as the reference image; the camera may move closer or change angle to show this moment. Show: ${what(p)} ${QUALITY}`
    : `${what(p)} Setting: ${p.setting?.trim() || 'a tidy, softly lit room at home'}. Style: ${p.stylePrompt} ${QUALITY}`
}
