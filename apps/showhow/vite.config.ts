/// <reference types="vitest/config" />
import { existsSync, readFileSync, watch } from 'node:fs'
import { parseEnv } from 'node:util'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// Dev only: serve api/<name>.ts at /api/<name> using the same Web Request → Response
// handlers Vercel runs in production, so `npm run dev` exercises the real routes.
function devApi(): Plugin {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      // Server-only vars stay out of the client. Re-read on change so new access codes work without a restart (F8).
      const loadEnv = () => { if (existsSync('.env.local')) Object.assign(process.env, parseEnv(readFileSync('.env.local', 'utf8'))) }
      loadEnv()
      if (existsSync('.env.local') && !process.env.VITEST) watch('.env.local', () => { loadEnv(); server.config.logger.info('dev-api: reloaded .env.local') }).unref()
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/api\/([a-z0-9-]+)(?:[/?]|$)/)
        if (!match) return next()
        try {
          const mod = await server.ssrLoadModule(`/api/${match[1]}.ts`)
          const handler = mod[req.method ?? 'GET'] ?? mod.default
          if (typeof handler !== 'function') { res.statusCode = 405; return res.end() }
          const chunks: Buffer[] = []
          for await (const c of req) chunks.push(c as Buffer)
          const request = new Request(`http://localhost${req.url}`, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: ['GET', 'HEAD'].includes(req.method ?? 'GET') ? undefined : Buffer.concat(chunks),
          })
          const response: Response = await handler(request)
          res.statusCode = response.status
          response.headers.forEach((v, k) => res.setHeader(k, v))
          if (!response.body) return res.end()
          for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) res.write(chunk) // streams progress (F9)
          res.end()
        } catch (e) {
          server.config.logger.error(`dev-api /api/${match[1]}: ${(e as Error).message}`)
          res.statusCode = 404
          res.end()
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devApi()],
  test: {
    environment: 'jsdom',
    globals: true, // lets Testing Library auto-cleanup between tests
  },
})
