import type { Outline } from './types'

const inFrame = (x: number, y: number, o: Outline) =>
  Number.isFinite(x) && Number.isFinite(y) && x >= 0 && y >= 0 && x <= o.frameW && y <= o.frameH

// Only geometry that fits the frame it came from may be drawn.
export function isValidOutline(o: Outline): boolean {
  if (!(o.frameW > 0 && o.frameH > 0)) return false
  const [x, y, w, h] = o.box
  return w > 0 && h > 0 && inFrame(x, y, o) && inFrame(x + w, y + h, o)
}

// SAM's box as an SVG path in source-frame units; the overlay's viewBox does the scaling.
export function outlinePath(o: Outline): string {
  const [x, y, w, h] = o.box
  return `M${x} ${y}H${x + w}V${y + h}H${x}Z`
}
