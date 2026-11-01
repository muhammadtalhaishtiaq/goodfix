// Wit.ai text-to-speech (Meta-owned; not part of the hackathon Model API). Step TEXT only, never user media.
// Verified live 2026-10-30: voice "Rebecca" → MP3 in ~3 s.
export async function speak(text: string): Promise<Buffer> {
  const token = process.env.WIT_TOKEN
  if (!token) throw new Error('WIT_TOKEN is not configured')
  const res = await fetch('https://api.wit.ai/synthesize?v=20240304', {
    method: 'POST', signal: AbortSignal.timeout(30_000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ q: text, voice: 'Rebecca' }),
  })
  if (!res.ok) throw new Error(`Wit synthesize ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}
