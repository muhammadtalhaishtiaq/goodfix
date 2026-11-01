import type { Outline } from './types.js'

// Box tokens look like <|box;x1=..;y1=..;x2=..;y2=..;w=..;h=..;c=..|> (xyxy, source pixels).
// Masks are ignored until their mapping onto the frame is verified (see DECISIONS 2026-10-30).
export function parseSamBoxes(text: string): Outline[] {
  const out: Outline[] = []
  for (const [, body] of text.matchAll(/<\|box;([^|]*)\|>/g)) {
    const f = Object.fromEntries(body.split(';').map(kv => kv.split('=')).map(([k, v]) => [k, Number(v)]))
    const { x1, y1, x2, y2, w, h, c } = f
    if (![x1, y1, x2, y2, w, h].every(Number.isFinite)) continue
    out.push({ frameW: w, frameH: h, box: [x1, y1, x2 - x1, y2 - y1], score: Number.isFinite(c) ? c : undefined })
  }
  return out
}

// ponytail: fixed thresholds picked before measuring; tune from the T0 spike results.
const MIN_SCORE = 0.5
const MIN_LEAD = 0.15

// One confident, clearly-best match or nothing — never a guess between look-alikes.
export function bestOutline(boxes: Outline[]): Outline | null {
  const ranked = boxes.filter(b => (b.score ?? 0) >= MIN_SCORE).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  if (!ranked.length) return null
  if (ranked.length > 1 && (ranked[0].score ?? 0) - (ranked[1].score ?? 0) < MIN_LEAD) return null
  return ranked[0]
}
