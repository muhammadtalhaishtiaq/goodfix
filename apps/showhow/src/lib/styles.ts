// Illustration styles for voice guides. Samples in public/styles/ were generated once with these prompts.
export const STYLES = {
  realistic: { label: 'Realistic photo', prompt: 'Realistic product photograph, soft natural light, shallow depth of field.' },
  lineart: { label: 'Line art', prompt: 'Clean black line-art technical illustration, thin even strokes, white background.' },
  flat: { label: 'Flat colour', prompt: 'Flat vector illustration, simple shapes, muted warm palette, no gradients.' },
  blueprint: { label: 'Blueprint', prompt: 'Blueprint technical drawing, white lines on deep blue paper.' },
  watercolor: { label: 'Watercolour', prompt: 'Soft watercolor illustration, gentle washes, paper texture.' },
  clay: { label: '3D clay', prompt: '3D clay render, soft rounded shapes, studio lighting, pastel colors.' },
} as const
export type StyleId = keyof typeof STYLES
export const STYLE_IDS = Object.keys(STYLES) as StyleId[]
