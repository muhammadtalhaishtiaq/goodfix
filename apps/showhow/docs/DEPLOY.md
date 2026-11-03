# Deploy checklist (T13)

**Written:** 2026-11-02 · **Status:** deployed 2026-11-02 at https://goodfix-alpha.vercel.app (Vercel project `goodfix`). Deploys come from **Vercel's Git integration** on push to `main`; the GitHub Actions deploy job has no `VERCEL_*` secrets and skips. Boxes ticked only where `HACKATHON-LOG.md` (2026-11-02) records it.
Sources: [`.github/workflows/deploy.yml`](../../../.github/workflows/deploy.yml), [`ci.yml`](../../../.github/workflows/ci.yml), [`cleanup.yml`](../../../.github/workflows/cleanup.yml), [`vercel.json`](../vercel.json), ARCHITECTURE §10/§13.

🔒 = needs Talha's explicit OK before doing it. Names only here; **never write a value into this file, Git, logs, chat or screenshots.**

## 1. Before pushing

- [ ] Local gates green in `apps/showhow/`: `npm ci && npm run lint && npm run typecheck && npm test && npm run build && node scripts/scan-bundle.ts`.
- [ ] Production rehearsal: `npm run preview` with the `vercel.json` headers; no CSP violations on `/`, a guide, `/create`, `/create/voice`, `/privacy` (repeat after T19 adds IBM Plex from Google Fonts).
- [ ] Git history reviewed for secrets (gitleaks runs in CI on the full history; it also contains older Vault commits).
- [x] Dated public-exposure decision written in `DECISIONS.md` (2026-11-03).

## 2. Vercel project 🔒

- [x] Talha created the Vercel Hobby project `goodfix`, linked to this repo (2026-11-02).
- [x] Framework comes from `vercel.json` (`vite`, `npm run build`, `dist`, `api/*.ts` `maxDuration: 300`).
- [x] **Root Directory = `apps/showhow`**, Node 22.x, Vite preset (fixed 2026-11-02: it was `.`, and the first two deploys built nothing). Note for the fallback GitHub job: it runs the CLI *inside* `apps/showhow/`, so with this setting it may look for `apps/showhow/apps/showhow`; check before using it.
- [x] Vercel env vars, **Production** environment (2026-11-02; final set should be exactly these seven: `CREATE_ACCESS_CODES`, `IP_SALT`, `META_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_URL`, `WIT_TOKEN`; the imported extras `SUPABASE_PASSWORD`, `SUPABASE_ACCESS_TOKEN`, `VERCEL_OIDC_TOKEN`, `WIW_VERSION` were removed by Talha and production redeployed, 2026-11-02) (`vercel pull --environment=production` reads these; `VITE_*` must be present at build time):

| Name | Kind | Note |
|---|---|---|
| `VITE_SUPABASE_URL` | public | Project URL only; trim the trailing `/rest/v1/` |
| `VITE_SUPABASE_ANON_KEY` | public | RLS protects data |
| `META_API_KEY` | secret | Server only; never `VITE_` |
| `SUPABASE_SERVICE_ROLE_KEY` | secret | Server only |
| `CREATE_ACCESS_CODES` | secret | Comma-separated; see below |
| `IP_SALT` | secret | **Required on Vercel** (`api/_lib/http.ts` throws without it). Long random |
| `WIT_TOKEN` | secret | Read aloud at publish (best effort) |

- [x] **Access codes** (2026-11-02; kept in a private file outside the repo; dev codes → 401 on production): fresh, long random production codes (e.g. `openssl rand -base64 24`, one per person: Talha, judges). No dev codes (short test codes from `.env.local`) in production. The judges' code goes only in the private submission notes. 🔒
- [ ] Never set `SUPABASE_ACCESS_TOKEN` on Vercel (local `apply-schema` only); revoke it once the schema is final.

## 3. Supabase

- [ ] `supabase/schema.sql` applied, including the 2026-11-01 additions (`auto_title`, `auto_category`, `frames_ok`, `claimed_at`, `similar_guides` + `pg_trgm`). T20 Ask needs no schema change (its cap uses the `usage` counters).
- [ ] `node scripts/check-db.ts` passes (RLS: anon reads published guides only; drafts and `usage` hidden).
- [ ] Bucket `media`: public read, 50 MB/file, mp4/wav/jpeg/mpeg only.
- [ ] Test guides and fixtures removed from the published gallery (or clearly labelled `TEST FIXTURE`) before judging.
- [ ] Free project must not pause through judging (2026-11-05 → 11-09): the daily `cleanup.yml` run keeps it awake.

## 4. GitHub 🔒

- [x] Push to `main` (2026-11-02; Vercel's Git integration deploys from it). CI status on GitHub not yet logged.
- [ ] Environment **`production`** (both `deploy.yml` and `cleanup.yml` use it) with these secrets:

| Secret | Used by |
|---|---|
| `VERCEL_TOKEN` | deploy |
| `VERCEL_ORG_ID` | deploy |
| `VERCEL_PROJECT_ID` | deploy |
| `VITE_SUPABASE_URL` | cleanup |
| `SUPABASE_SERVICE_ROLE_KEY` | cleanup |

  Without them the jobs skip cleanly (they print "not configured; skipping"). CI itself uses fake canaries only.
- [ ] Optional: required reviewer on the `production` environment so each deploy waits for Talha.
- [ ] Run `Cleanup drafts` once by hand (`workflow_dispatch`) to prove the secrets work.

## 5. Deploy

- [ ] *(Not used: Vercel's Git integration deploys instead; this job skips without secrets.)* Deploy runs after CI on `main` (or `workflow_dispatch`): `vercel pull` → `vercel build --prod` → bundle scan on `.vercel/output/static` → `vercel deploy --prebuilt --prod`. 🔒
- [ ] Fallback: `vercel deploy --prod` from `apps/showhow/` on Talha's machine. 🔒

## 6. Smoke checks on the live URL (log each in `HACKATHON-LOG.md` with the date)

- [x] `GET /api/health` → `{ok:true}` (2026-11-02).
- [x] Response headers include the CSP, `X-Frame-Options: DENY`, `Permissions-Policy` (`curl -sI <url>/`) (2026-11-02).
- [x] *(2026-11-02: gallery + a voice guide with real data, headless Chrome; a video guide's segment not yet seen live.)* Gallery loads published guides from Supabase; a guide plays its step segment; images load from `*.supabase.co`.
- [ ] *(2026-11-02: headless Chrome console on production showed no CSP violations on gallery, a voice guide, Create, voice Create, Privacy. Not covered: the shrink worker during a real upload, and a check in Talha's own browser.)* IBM Plex renders and DevTools shows **no CSP violations** (stylesheet from `fonts.googleapis.com`, files from `fonts.gstatic.com`).
- [ ] One "I'm stuck" check with a staged photo: preview → Send → verdict (+ box if `differs`); camera permission prompt works.
- [x] One Ask on a published guide (T20): covered → the creator's step quoted (production 2026-11-02, 8.1 s and 8.6 s). The uncovered case ran on dev 2026-11-02, not yet on production.
- [ ] *(2026-11-02: dev codes → 401 and the new judges code accepted; no create run yet.)* Create with a production access code: wrong code → 401 message; one video guide end to end (confirms `/api/steps` duration and the Spark `video_url` fetch on Vercel); one voice guide end to end.
- [ ] Bundle scan in the deploy log is clean.
- [ ] Then T14: failure drill (ARCHITECTURE §12) on the live URL. *(Partly run 2026-11-02 with curl: 422/404/400/413/401/405 paths all honest, no model called. Still to do: the drill items that need a real create.)*

## 7. Rollback

- Bad deploy: Vercel dashboard → Deployments → promote the previous production deployment (or `vercel rollback`). 🔒
- Credits at risk: rotate `META_API_KEY` at Meta and remove it from Vercel; model routes should then fail with honest errors while viewing still works (verify if it is ever used).
- Stop new guides: replace `CREATE_ACCESS_CODES` with one new code only Talha knows, then redeploy.
- Leaked secret: rotate it at the provider first, then update Vercel/GitHub; record what happened in `HACKATHON-LOG.md`.
