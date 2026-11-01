// In-memory stand-in for the Supabase server client, covering only the calls our routes make.
// Test helper only (never imported by routes).
type Row = Record<string, unknown>

export function fakeDb(seed: { guides?: Row[]; steps?: Row[]; files?: Record<string, Blob> } = {}) {
  const tables: Record<string, Row[]> = { guides: seed.guides ?? [], steps: seed.steps ?? [] }
  const files: Record<string, Blob> = { ...seed.files }

  function query(table: string) {
    const filters: [string, unknown][] = []
    let op: 'select' | 'update' | 'delete' | 'insert' = 'select'
    let patch: Row = {}
    let returning = false
    const match = (r: Row) => filters.every(([k, v]) => r[k] === v)
    const run = () => {
      const rows = tables[table]
      if (op === 'update') { const hit = rows.filter(match); hit.forEach(r => Object.assign(r, patch)); return { data: returning ? hit : null, error: null } }
      if (op === 'delete') { tables[table] = rows.filter(r => !match(r)); return { data: null, error: null } }
      return { data: rows.filter(match), error: null }
    }
    const q = {
      select: () => { if (op !== 'select') returning = true; return q },
      update: (p: Row) => { op = 'update'; patch = p; return q },
      delete: () => { op = 'delete'; return q },
      insert: (r: Row | Row[]) => { tables[table].push(...(Array.isArray(r) ? r : [r])); return Promise.resolve({ error: null }) },
      eq: (k: string, v: unknown) => { filters.push([k, v]); return q },
      maybeSingle: async () => ({ data: (run().data as Row[])[0] ?? null, error: null }),
      then: (ok: (v: unknown) => unknown, bad?: (e: unknown) => unknown) => Promise.resolve(run()).then(ok, bad),
    }
    return q
  }

  return {
    tables, files,
    from: (t: string) => query(t),
    storage: {
      from: () => ({
        list: async (dir: string) => ({ data: Object.keys(files).filter(k => k.startsWith(dir + '/')).map(k => ({ name: k.slice(dir.length + 1) })), error: null }),
        upload: async (p: string, body: Blob | Buffer) => { files[p] = body instanceof Blob ? body : new Blob([new Uint8Array(body)]); return { data: { path: p }, error: null } },
        download: async (p: string) => ({ data: files[p] ?? null, error: files[p] ? null : { message: 'not found' } }),
        remove: async (ps: string[]) => { ps.forEach(p => delete files[p]); return { error: null } },
        getPublicUrl: (p: string) => ({ data: { publicUrl: `https://storage.test/media/${p}` } }),
        createSignedUploadUrl: async (p: string) => ({ data: { path: p, token: `tok-${p}` }, error: null }),
      }),
    },
  }
}
