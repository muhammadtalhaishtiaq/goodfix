// Calls our own /api routes. Errors carry the server's plain-language message.
export async function api<T>(name: string, body: unknown, accessCode?: string): Promise<T> {
  const res = await fetch(`/api/${name}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(accessCode ? { 'x-access-code': accessCode } : {}) },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new Error(data.error ?? 'Something went wrong. Please try again.')
  return data as T
}

// Raw file upload (e.g. audio/wav) with JSON details in the x-meta header.
export async function apiRaw<T>(name: string, file: Blob, meta: unknown, accessCode?: string): Promise<T> {
  const res = await fetch(`/api/${name}`, {
    method: 'POST',
    headers: { 'content-type': file.type, 'x-meta': encodeURIComponent(JSON.stringify(meta)), ...(accessCode ? { 'x-access-code': accessCode } : {}) },
    body: file,
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new Error(data.error ?? 'Something went wrong. Please try again.')
  return data as T
}

// Progress stream reader (F9): calls onStage for each event and resolves with the final result.
export type StageEvent = { stage: string; [k: string]: unknown }
export async function apiStream<T>(name: string, opts: { json?: unknown; file?: Blob; meta?: unknown }, accessCode: string, onStage: (e: StageEvent) => void): Promise<T> {
  const headers: Record<string, string> = { 'x-access-code': accessCode }
  let body: BodyInit
  if (opts.file) {
    headers['content-type'] = opts.file.type
    headers['x-meta'] = encodeURIComponent(JSON.stringify(opts.meta))
    body = opts.file
  } else {
    headers['content-type'] = 'application/json'
    body = JSON.stringify(opts.json)
  }
  const res = await fetch(`/api/${name}`, { method: 'POST', headers, body })
  if (!res.ok || !res.body) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? 'Something went wrong. Please try again.')
  }
  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let buf = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    for (let i = buf.indexOf('\n'); i >= 0; i = buf.indexOf('\n')) {
      const line = buf.slice(0, i).trim()
      buf = buf.slice(i + 1)
      if (!line) continue
      const e = JSON.parse(line) as StageEvent & { result?: T; error?: string }
      if (e.stage === 'done') return e.result as T
      if (e.stage === 'error') throw new Error(e.error ?? 'Something went wrong. Please try again.')
      onStage(e)
    }
  }
  throw new Error('The connection ended early. Nothing was published. Please try again.')
}
