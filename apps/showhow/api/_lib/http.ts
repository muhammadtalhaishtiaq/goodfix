// Shared plumbing for every /api route: body limits, zod validation, access code, safe errors, redacted logs.
// Files under api/_lib are not deployed as routes (Vercel skips paths starting with "_").
import { createHash, timingSafeEqual } from 'node:crypto'
import type { z } from 'zod'

export class HttpError extends Error {
  readonly status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

export function checkAccessCode(given: string | null, configured: string | undefined): boolean {
  if (!given || !configured) return false
  const a = Buffer.from(given)
  return configured.split(',').map(c => c.trim()).filter(Boolean)
    .some(code => { const b = Buffer.from(code); return a.length === b.length && timingSafeEqual(a, b) })
}

// Per-IP limits store only a salted hash, never the address.
export const hashIp = (ip: string, salt: string) => createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 24)

const LOG_FIELDS = ['route', 'status', 'ms', 'model', 'requestId', 'code'] as const
export function redact(fields: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(fields).filter(([k]) => (LOG_FIELDS as readonly string[]).includes(k)))
}
const log = (fields: Record<string, unknown>) => console.log(JSON.stringify(redact(fields)))

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })

type Options<S extends z.ZodType> = { name: string; body: S; accessCode?: boolean; maxBytes?: number }
type Ctx<S extends z.ZodType> = { body: z.infer<S>; req: Request; ip: string }

export function route<S extends z.ZodType>(opts: Options<S>, fn: (ctx: Ctx<S>) => Promise<unknown>) {
  const maxBytes = opts.maxBytes ?? 4_000_000 // Vercel's request body limit is ~4.5 MB
  return async (req: Request): Promise<Response> => {
    const t0 = Date.now()
    const requestId = crypto.randomUUID().slice(0, 8)
    const done = (res: Response, code?: string) => { log({ route: opts.name, status: res.status, ms: Date.now() - t0, requestId, code }); return res }
    try {
      if (req.method !== 'POST') return done(json(405, { error: 'Use POST.' }))
      if (opts.accessCode && !checkAccessCode(req.headers.get('x-access-code'), process.env.CREATE_ACCESS_CODES)) {
        return done(json(401, { error: 'That access code isn’t valid.' }))
      }
      const raw = await req.text()
      if (Buffer.byteLength(raw) > maxBytes) return done(json(413, { error: 'That upload is too large.' }))
      let parsed: unknown
      try { parsed = JSON.parse(raw) } catch { return done(json(400, { error: 'Request body must be JSON.' })) }
      const body = opts.body.safeParse(parsed)
      if (!body.success) return done(json(400, { error: 'Request didn’t match what this endpoint expects.' }))
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
      return done(json(200, await fn({ body: body.data, req, ip })))
    } catch (e) {
      if (e instanceof HttpError) return done(json(e.status, { error: e.message }))
      return done(json(500, { error: 'Something went wrong on our side. Nothing was saved. Please try again.' }), 'unhandled')
    }
  }
}
