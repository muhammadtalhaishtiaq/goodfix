import { isValidOutline, outlinePath } from '../lib/geometry'
import type { Outline } from '../lib/types'

// Sits on top of media rendered with object-fit: contain, so `meet` lines the frames up.
export function OutlineOverlay({ outline, label }: { outline: Outline; label: string }) {
  if (!isValidOutline(outline)) return null
  return (
    <svg className="overlay" viewBox={`0 0 ${outline.frameW} ${outline.frameH}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Outlined: ${label}`}>
      <path className="sam" d={outlinePath(outline)} />
    </svg>
  )
}
