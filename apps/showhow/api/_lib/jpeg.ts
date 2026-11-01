// Read a JPEG's pixel size from its SOF header, so AI-enhanced stills keep the real frame's shape.
export function jpegSize(buf: Uint8Array): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null
  let i = 2
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null
    const marker = buf[i + 1]
    const len = (buf[i + 2] << 8) | buf[i + 3]
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: (buf[i + 5] << 8) | buf[i + 6], width: (buf[i + 7] << 8) | buf[i + 8] }
    }
    i += 2 + len
  }
  return null
}

// Muse Image's `size` sets only the aspect ratio; keep the long side at 1792.
export function sizeLike(s: { width: number; height: number } | null): string {
  if (!s) return '1536x1024'
  const long = 1792
  const round16 = (n: number) => Math.round(n / 16) * 16
  return s.width >= s.height ? `${long}x${round16((long * s.height) / s.width)}` : `${round16((long * s.width) / s.height)}x${long}`
}
