# Deployment Guide

## Overview

This guide covers deploying the Travel Agency Marketplace to production. The platform is a two-service monorepo: a Next.js frontend and a FastAPI backend, backed by Neon PostgreSQL and external providers (Resend, Groq, Stripe, Vapi).

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   Frontend       │      │   Backend        │      │   Neon           │
│   Next.js 16     │─────▶│   FastAPI        │─────▶│   PostgreSQL     │
│   Vercel         │  API │   Render/Railway │      │   (pooler)       │
│   Edge runtime   │      │   Python 3.14    │      └──────────────────┘
└──────────────────┘      └──────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
               ┌────────┐   ┌────────┐   ┌────────┐
               │Resend  │   │ Groq   │   │ Stripe │
               │(email) │   │ (AI)   │   │(payments)
               └────────┘   └────────┘   └────────┘
```

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | ≥ 22 | Frontend build (`engines` in `frontend/package.json`) |
| Python | 3.14 | Matches `python:3.14-slim` in the Dockerfile |
| Neon account | — | Free tier sufficient for demo |
| Resend account | — | Email verification (optional in dev) |
| Groq account | — | AI chat features (optional in dev) |
| Stripe account | — | Payments (optional in dev) |
| Docker | — | Only for container-based deploys |

## Environment Variables

Secrets live in platform environment variables — **never** in source control. `.env` files are gitignored; `.env.example` files are the templates.

### Backend (`backend/.env`)

| Variable | Required (prod) | Default | Purpose |
|----------|-----------------|---------|---------|
| `ENVIRONMENT` | yes | `development` | `production` enables HSTS + startup guards |
| `JWT_SECRET` | **yes** | `change-me-in-production` | App **refuses to start** in prod with the default |
| `JWT_ALGORITHM` | no | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | no | `30` | Access token TTL |
| `DATABASE_URL` | **yes** | — | Neon URL, must include `?sslmode=require` |
| `DB_POOL_SIZE` | no | `5` | SQLAlchemy pool size |
| `DB_MAX_OVERFLOW` | no | `10` | Pool overflow |
| `FRONTEND_ORIGINS` | **yes** | localhost | CORS allowlist (comma-separated) |
| `RESEND_API_KEY` | yes* | — | Email verification (dev no-op if unset) |
| `EMAIL_FROM` | no | `Travel Agency <onboarding@resend.dev>` | Sender identity |
| `APP_BASE_URL` | **yes** | `http://localhost:3000` | Base URL for email links |
| `EMAIL_VERIFICATION_EXPIRE_MINUTES` | no | `30` | Verification token TTL |
| `REQUIRE_EMAIL_VERIFICATION` | no | `true` | Gate signups on verification |
| `GROQ_API_KEY` | yes* | — | AI chatbot (disabled if unset) |
| `COHERE_API_KEY` | no | — | Alternate AI provider |
| `STRIPE_SECRET_KEY` | yes* | — | Checkout (endpoints return 503 if unset) |
| `STRIPE_WEBHOOK_SECRET` | yes* | — | Webhook signature verification |
| `STRIPE_CURRENCY` | no | `USD` | Charge currency |

\* Required only if that feature is enabled.

### Frontend (`frontend/.env`)

All frontend vars are `NEXT_PUBLIC_` and ship in the browser bundle — **no secrets here**.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend base URL (e.g. `https://api.example.com`) |
| `NEXT_PUBLIC_APP_URL` | Public frontend URL (share links / redirects) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe.js publishable key |
| `BETTER_AUTH_SECRET` | Auth session secret (`openssl rand -hex 32`) |
| `DATABASE_URL` | Same Neon URL as backend (server-side only usage) |
| `NEXT_PUBLIC_VAPI_PUBLIC_KEY` | Vapi voice assistant (button shows "coming soon" if unset) |
| `NEXT_PUBLIC_VAPI_ASSISTANT_ID` | Optional server-managed Vapi assistant |

### Generating secrets

```bash
# JWT_SECRET / BETTER_AUTH_SECRET
openssl rand -hex 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Database Setup

Run once per environment (from `backend/`, venv activated):

```bash
# 1. Create schema — idempotent (checkfirst=True), safe to re-run
python create_tables.py

# 2. Optional: UUID/currency defaults migration
python migrate_001_uuid_defaults.py

# 3. Seed demo destinations — idempotent (skips existing)
python seed_destinations.py
python seed_destinations.py --reset   # wipe + reseed demo tenant
```

> **Neon note**: the app auto-converts `postgresql://` → `postgresql+asyncpg://`, strips libpq-only params (`sslmode`, `channel_binding`, `sslrootcertificate`), and disables statement caching when the URL contains `neon.tech` or `pooler` — required for Neon's PgBouncer-style pooler.

## Local Development

```bash
# Terminal 1 — backend
cd backend
venv/Scripts/activate          # Windows; source venv/bin/activate on Unix
uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev                    # http://localhost:3000
```

Startup logs confirm configuration: DB connection, Resend/Groq/Stripe key presence, and a hard failure if `JWT_SECRET` is still default in production.

## Docker (Backend)

The backend ships with a production image; secrets come from platform env vars, never baked in.

```bash
cd backend
docker build -t travel-api .
docker run --rm -p 8000:8000 \
  -e ENVIRONMENT=production \
  -e JWT_SECRET="$(openssl rand -hex 32)" \
  -e DATABASE_URL="postgresql://...?sslmode=require" \
  -e FRONTEND_ORIGINS="https://your-domain.com" \
  travel-api
# $PORT is injected by Render/Railway; 8000 fallback for local runs
```

Image properties:
- `python:3.14-slim`, pinned `requirements.txt` (exact versions — prevents build drift)
- Non-root `appuser`, `PYTHONDONTWRITEBYTECODE`, pip cache disabled
- `.dockerignore` excludes `venv/`, `.env*`, `__pycache__/`, `*.log`

## Platform Deployment

### Backend — Render / Railway

The `Procfile` (`web: uvicorn main:app --host 0.0.0.0 --port $PORT`) works on both; `$PORT` is injected by the platform.

**Render (Docker):**
1. New Web Service → connect repo → `backend/` as root
2. Build: `docker build . -t travel-api` (or use the Dockerfile directly)
3. Set env vars from the table above
4. Health check path: `/health`

**Railway:**
1. New service → deploy from repo → `backend/` directory
2. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT` (or Procfile)
3. Add Neon database add-on → copy `DATABASE_URL` into vars
4. Set remaining env vars

### Frontend — Vercel

1. New project → connect repo → root directory `frontend/`
2. Framework preset: Next.js, Node ≥ 22
3. Build: `npm run build`, Output: `.next`
4. Set frontend env vars (all `NEXT_PUBLIC_*` + `BETTER_AUTH_SECRET` + `DATABASE_URL`)
5. Domains: add production domain; set `FRONTEND_ORIGINS` on the backend to match

### Post-deploy verification

```bash
curl https://api.example.com/health        # {"status":"ok","environment":"production",...}
curl https://api.example.com/health/ready  # {"status":"healthy","database":"up"} (503 if DB down)
curl -I https://your-domain.com/           # 307 → /demo (Edge proxy, before any render)
```

## Scaling Notes

| Component | Behavior | Guidance |
|-----------|----------|----------|
| Rate limiter | In-memory fixed window, per-instance, keyed by last `X-Forwarded-For` hop | Swap for a shared store (Redis/Upstash) when running >1 instance |
| DB pool | `pool_size=5`, `max_overflow=10`, `pool_pre_ping` | Tune via `DB_POOL_SIZE`/`DB_MAX_OVERFLOW`; watch Neon connection limits |
| Serverless workers | Short-lived processes | Use `use_null_pool()` (`NullPool`) to avoid idle connections |
| Neon pooler | Prepared statements unsupported | Handled automatically (`statement_cache_size=0`) |
| Frontend | Vercel Edge network | No scaling config needed |

## Secret Rotation

Per the [security boundaries](security-boundaries.md) doc, rotation procedure:

| Secret | Rotation Steps | Blast Radius |
|--------|----------------|--------------|
| `JWT_SECRET` | 1. Generate new secret<br>2. Deploy new value<br>3. All sessions invalidated — users re-login | All active sessions |
| `BETTER_AUTH_SECRET` | Same as JWT (frontend redeploy) | All frontend sessions |
| `DATABASE_URL` | 1. Rotate in Neon dashboard<br>2. Update backend + frontend vars<br>3. Brief reconnect window | Seconds of downtime |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Rotate in Stripe Dashboard → update vars | Payment processing paused until updated |
| `RESEND_API_KEY` | Rotate in Resend dashboard → update var | Email sending paused |
| `API_KEY` | Generate new → update consumers | API clients until updated |

Rotation is a deploy event: change the env var, redeploy, verify `/health/ready`.

## Go-Live Checklist

- [ ] `ENVIRONMENT=production` set on backend
- [ ] `JWT_SECRET` is a generated 64-char hex (not the default)
- [ ] `DATABASE_URL` includes `?sslmode=require`
- [ ] `FRONTEND_ORIGINS` lists the production domain(s) only
- [ ] `APP_BASE_URL` matches the production frontend URL
- [ ] `RESEND_API_KEY`, `GROQ_API_KEY`, `STRIPE_*` set for enabled features
- [ ] Schema initialized (`create_tables.py` ran)
- [ ] `/health` and `/health/ready` return 200
- [ ] HSTS header present on responses (automatic in production)
- [ ] Root URL 307-redirects to `/demo`
- [ ] Rate limiter shared store configured (if multi-instance)
- [ ] No `.env` files committed (`git status` clean of secrets)

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Startup: "Database connection FAILED" | Bad/missing `DATABASE_URL` | Neon URL must include `?sslmode=require` |
| Startup: "JWT_SECRET is still the default" | Production guard triggered | Set a generated `JWT_SECRET` |
| Payment endpoints return 503 | `STRIPE_SECRET_KEY` unset | Set the key; webhooks need `STRIPE_WEBHOOK_SECRET` |
| AI chatbot disabled | `GROQ_API_KEY` unset | Set the key and redeploy |
| Verification emails never arrive | `RESEND_API_KEY` unset (dev no-op) | Set key + `EMAIL_FROM` + `APP_BASE_URL` |
| CORS errors in browser | `FRONTEND_ORIGINS` mismatch | Add the exact production origin (scheme + host, no trailing slash) |
| 429 responses under load | Per-instance rate limiter budget spent | Raise limits or move to a shared store |
| Prepared-statement errors on Neon | Pooler incompatibility | Already handled; ensure URL contains `neon.tech` or `pooler` |
| Frontend redirect loops | `NEXT_PUBLIC_APP_URL` unset/wrong | Set to the canonical production URL |

## Rollback

1. **Platform rollback**: Render/Railway/Vercel all keep prior deploy history — redeploy the previous release.
2. **Schema**: `create_tables.py` is additive-only (`checkfirst=True`); migrations are forward-only — restore from Neon branch/backup for destructive changes.
3. **Config**: env var changes take effect on redeploy; revert the var and redeploy.

## Known Gaps (To Address)

1. [ ] Shared rate-limit store (Redis/Upstash) for multi-instance deploys
2. [ ] Automated secret rotation
3. [ ] CI/CD pipeline with dependency scanning
4. [ ] Distributed tracing (OpenTelemetry) for deploy diagnostics
5. [ ] CDN/WAF rules in front of the API
