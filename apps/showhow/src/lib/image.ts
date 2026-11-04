// Browser-only image helpers: keyframes from the local video, and learner-photo resizing.
// Never wait forever: some phone browsers simply never fire media events on a hidden <video>.
const once = (el: EventTarget, ev: string, ms = 15_000) => new Promise<void>((ok, bad) => {
  const t = setTimeout(() => bad(new Error('This browser didn’t load the video frame. Try again, or use desktop Chrome.')), ms)
  el.addEventListener(ev, () => { clearTimeout(t); ok() }, { once: true })
  el.addEventListener('error', () => { clearTimeout(t); bad(new Error('Couldn’t read this media.')) }, { once: true })
})

const toJpeg = (c: HTMLCanvasElement, q = 0.85) =>
  new Promise<Blob>((ok, bad) => c.toBlob(b => (b ? ok(b) : bad(new Error('Couldn’t encode the image.'))), 'image/jpeg', q))

function canvasFor(w: number, h: number, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(w, h))
  const c = document.createElement('canvas')
  c.width = Math.round(w * scale)
  c.height = Math.round(h * scale)
  return c
}

// Fallback frame grab via <video> (lib/shrink.ts frameAt is tried first).
export async function captureFrame(videoUrl: string, atS: number, maxSide = 1280): Promise<Blob> {
  const v = document.createElement('video')
  v.muted = true
  v.playsInline = true
  v.preload = 'auto'
  v.src = videoUrl
  await once(v, 'loadeddata')
  v.currentTime = Math.max(0, Math.min(atS, v.duration - 0.05))
  await once(v, 'seeked')
  const c = canvasFor(v.videoWidth, v.videoHeight, maxSide)
  c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height)
  return toJpeg(c)
}

// Learner photo → JPEG data URL, longest side ≤1600 px, phone orientation respected.
export async function resizePhoto(file: Blob, maxSide = 1600): Promise<string> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const c = canvasFor(bmp.width, bmp.height, maxSide)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  bmp.close()
  const blob = await toJpeg(c, 0.82)
  return new Promise((ok, bad) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => bad(r.error); r.readAsDataURL(blob) })
}
