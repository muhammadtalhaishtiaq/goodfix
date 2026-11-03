import { isValidOutline, outlinePath } from '../lib/geometry'
import type { Outline } from '../lib/types'

// Sits on top of media whose box shrink-wraps the picture (F11, own aspect); `meet` also lines the frames up if letterboxed.
export function OutlineOverlay({ outline, label }: { outline: Outline; label: string }) {
  if (!isValidOutline(outline)) return null
  return (
    <svg className="overlay" viewBox={`0 0 ${outline.frameW} ${outline.frameH}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Outlined: ${label}`}>
      <path className="sam" d={outlinePath(outline)} />
    </svg>
  )
}
