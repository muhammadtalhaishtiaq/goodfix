# Deploy checklist (T13)

**Written:** 2026-11-02 · **Status:** not deployed. Nothing below has been run on Vercel yet.
Sources: [`.github/workflows/deploy.yml`](../../../.github/workflows/deploy.yml), [`ci.yml`](../../../.github/workflows/ci.yml), [`cleanup.yml`](../../../.github/workflows/cleanup.yml), [`vercel.json`](../vercel.json), ARCHITECTURE §10/§13.

🔒 = needs Talha's explicit OK before doing it. Names only here; **never write a value into this file, Git, logs, chat or screenshots.**

## 1. Before pushing

- [ ] Local gates green in `apps/showhow/`: `npm ci && npm run lint && npm run typecheck && npm test && npm run build && node scripts/scan-bundle.ts`.
- [ ] Production rehearsal: `npm run preview` with the `vercel.json` headers; no CSP violations on `/`, a guide, `/create`, `/create/voice`, `/privacy` (repeat after T19 adds IBM Plex from Google Fonts).
- [ ] Git history reviewed for secrets (gitleaks runs in CI on the full history; it also contains older Vault commits).
- [ ] Dated public-exposure decision written in `DECISIONS.md` **before the URL is shared** (Terms §10.1(i) question still pending in Discord). 🔒

## 2. Vercel project 🔒

- [ ] Talha creates/links a Vercel Hobby project for this repo.
- [ ] Framework comes from `vercel.json` (`vite`, `npm run build`, `dist`, `api/*.ts` `maxDuration: 300`).
- [ ] **Root Directory:** the workflow runs the CLI *inside* `apps/showhow/`. Confirm the project setting matches that (if Root Directory is also set to `apps/showhow`, the CLI may look for `apps/showhow/apps/showhow`). Check on the first deploy.
- [ ] Vercel env vars, **Production** environment (`vercel pull --environment=production` reads these; `VITE_*` must be present at build time):

| Name | Kind | Note |
|---|---|---|
| `VITE_SUPABASE_URL` | public | Project URL only; trim the trailing `/rest/v1/` |
| `VITE_SUPABASE_ANON_KEY` | public | RLS protects data |
| `META_API_KEY` | secret | Server only; never `VITE_` |
| `SUPABASE_SERVICE_ROLE_KEY` | secret | Server only |
| `CREATE_ACCESS_CODES` | secret | Comma-separated; see below |
| `IP_SALT` | secret | **Required on Vercel** (`api/_lib/http.ts` throws without it). Long random |
| `WIT_TOKEN` | secret | Read aloud at publish (best effort) |

- [ ] **Access codes:** fresh, long random production codes (e.g. `openssl rand -base64 24`, one per person: Talha, judges). No dev codes (short test codes from `.env.local`) in production. The judges' code goes only in the private submission notes. 🔒
- [ ] Never set `SUPABASE_ACCESS_TOKEN` on Vercel (local `apply-schema` only); revoke it once the schema is final.

## 3. Supabase

- [ ] `supabase/schema.sql` applied, including the 2026-11-01 additions (`auto_title`, `auto_category`, `frames_ok`, `claimed_at`, `similar_guides` + `pg_trgm`). T20 Ask is expected to need no schema change (its cap uses the `usage` counters); confirm when T20 lands.
- [ ] `node scripts/check-db.ts` passes (RLS: anon reads published guides only; drafts and `usage` hidden).
- [ ] Bucket `media`: public read, 50 MB/file, mp4/wav/jpeg/mpeg only.
- [ ] Test guides and fixtures removed from the published gallery (or clearly labelled `TEST FIXTURE`) before judging.
- [ ] Free project must not pause through judging (2026-11-05 → 11-09): the daily `cleanup.yml` run keeps it awake.

## 4. GitHub 🔒

- [ ] Push to `main` (asks first, per CLAUDE.md). CI must be green before Deploy runs.
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

- [ ] Deploy runs after CI on `main` (or `workflow_dispatch`): `vercel pull` → `vercel build --prod` → bundle scan on `.vercel/output/static` → `vercel deploy --prebuilt --prod`. 🔒
- [ ] Fallback: `vercel deploy --prod` from `apps/showhow/` on Talha's machine. 🔒

## 6. Smoke checks on the live URL (log each in `HACKATHON-LOG.md` with the date)

- [ ] `GET /api/health` → `{ok:true}`.
- [ ] Response headers include the CSP, `X-Frame-Options: DENY`, `Permissions-Policy` (`curl -sI <url>/`).
- [ ] Gallery loads published guides from Supabase; a guide plays its step segment; images load from `*.supabase.co`.
- [ ] IBM Plex renders and DevTools shows **no CSP violations** (stylesheet from `fonts.googleapis.com`, files from `fonts.gstatic.com`).
- [ ] One "I'm stuck" check with a staged photo: preview → Send → verdict (+ box if `differs`); camera permission prompt works.
- [ ] One Ask on a published guide (T20): a covered question answers from the steps; an uncovered one says so.
- [ ] Create with a production access code: wrong code → 401 message; one video guide end to end (confirms `/api/steps` duration and the Spark `video_url` fetch on Vercel); one voice guide end to end.
- [ ] Bundle scan in the deploy log is clean.
- [ ] Then T14: failure drill (ARCHITECTURE §12) on the live URL.

## 7. Rollback

- Bad deploy: Vercel dashboard → Deployments → promote the previous production deployment (or `vercel rollback`). 🔒
- Credits at risk: rotate `META_API_KEY` at Meta and remove it from Vercel; model routes should then fail with honest errors while viewing still works (verify if it is ever used).
- Stop new guides: replace `CREATE_ACCESS_CODES` with one new code only Talha knows, then redeploy.
- Leaked secret: rotate it at the provider first, then update Vercel/GitHub; record what happened in `HACKATHON-LOG.md`.
