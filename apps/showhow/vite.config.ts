/// <reference types="vitest/config" />
import { existsSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// Dev only: serve api/<name>.ts at /api/<name> using the same Web Request → Response
// handlers Vercel runs in production, so `npm run dev` exercises the real routes.
function devApi(): Plugin {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      if (existsSync('.env.local')) process.loadEnvFile('.env.local') // server-only vars stay out of the client
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
          res.end(Buffer.from(await response.arrayBuffer()))
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
