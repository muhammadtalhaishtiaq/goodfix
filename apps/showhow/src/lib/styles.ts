// Illustration styles for voice guides. Samples in public/styles/ were generated once with these prompts.
export const STYLES = {
  realistic: { label: 'Realistic photo', prompt: 'Natural documentary photograph taken in a real lived-in home, true-to-life materials and colours, soft window daylight, 35 mm lens at eye level, gentle depth of field.' },
  lineart: { label: 'Line art', prompt: 'Clean black line-art technical illustration, thin even strokes, white background, like an instruction manual.' },
  flat: { label: 'Flat colour', prompt: 'Flat vector illustration, simple geometric shapes, muted warm palette, solid fills, clear silhouettes.' },
  blueprint: { label: 'Blueprint', prompt: 'Blueprint technical drawing, crisp white lines on deep blue paper, clear outlines.' },
  watercolor: { label: 'Watercolour', prompt: 'Soft watercolour illustration, gentle washes, visible paper texture, clear readable shapes.' },
  clay: { label: '3D clay', prompt: '3D clay render, soft rounded shapes, studio lighting, pastel colours, matte finish.' },
} as const
export type StyleId = keyof typeof STYLES
export const STYLE_IDS = Object.keys(STYLES) as StyleId[]
