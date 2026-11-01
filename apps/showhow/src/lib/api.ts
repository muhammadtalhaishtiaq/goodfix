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
export async function apiRaw<T>(name: string, file: Blob, meta: unknown, accessCode: string): Promise<T> {
  const res = await fetch(`/api/${name}`, {
    method: 'POST',
    headers: { 'content-type': file.type, 'x-meta': encodeURIComponent(JSON.stringify(meta)), 'x-access-code': accessCode },
    body: file,
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new Error(data.error ?? 'Something went wrong. Please try again.')
  return data as T
}
