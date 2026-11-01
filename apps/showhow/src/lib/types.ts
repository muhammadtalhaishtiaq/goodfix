// Coordinates are in source-frame pixels, exactly as SAM 3.1 returned them.
export type Outline = {
  frameW: number
  frameH: number
  box: [x: number, y: number, w: number, h: number]
  score?: number
}

export type Step = {
  idx: number
  title: string
  instruction: string
  tipQuote?: string
  startS: number
  endS: number
  keyPart: string
  keyframeUrl?: string
  outline: Outline | null
}

export type Guide = {
  id: string
  title: string
  category: string
  creatorName: string
  videoUrl?: string
  durationS: number
  steps: Step[]
  fixture: boolean
  isNew?: boolean
}

import type { ModelVerdict } from './verdict'

export type Verdict = ModelVerdict

export type CheckRequest = {
  guideId: string
  stepIdx: number
  mode: 'stuck' | 'where'
  photo: Blob
  question?: string
}

export type CheckResult =
  | { mode: 'stuck'; verdict: Verdict; outline: Outline | null; fixture: boolean }
  | { mode: 'where'; stepIdx: number; reason: string; fixture: boolean }
