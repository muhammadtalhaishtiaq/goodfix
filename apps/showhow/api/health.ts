// GET /api/health: proves the function runtime is up. Reveals nothing about configuration.
export function GET() {
  return Response.json({ ok: true })
}
