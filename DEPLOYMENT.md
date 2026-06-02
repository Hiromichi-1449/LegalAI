# LegalAI — Railway Deployment Guide

This project deploys two independent services on Railway from the same monorepo: **backend** (FastAPI) and **frontend** (React/nginx). Each service has its own `railway.toml` and `Dockerfile`.

---

## Prerequisites

- Railway account with a project created
- Both services added to the project and pointed at this repo
- Backend service root: `backend/`
- Frontend service root: `frontend/`

---

## Backend

### Build & start

Railway reads `backend/railway.toml` and builds `backend/Dockerfile`. When the container starts, Docker internally runs (via `/bin/sh` inside the Linux container — **not** a command you type):

```
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Alembic runs first on every deploy. If migrations fail, the container exits non-zero and Railway restarts it — no traffic reaches a stale schema. Once migrations pass, uvicorn starts and serves the API.

### Health check

`GET /health` — Railway waits up to 60 seconds. If it never returns 200 the deploy is marked failed and the previous container stays up.

### Required environment variables

Set these in **Railway → backend service → Variables**:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string (Supabase or Railway Postgres) |
| `SECRET_KEY` | Long random string for internal signing |
| `AUTH0_DOMAIN` | e.g. `yourapp.us.auth0.com` |
| `AUTH0_AUDIENCE` | Auth0 API identifier |
| `SUPABASE_URL` | From Supabase project settings |
| `SUPABASE_KEY` | Supabase service role key |
| `SENDGRID_API_KEY` | From SendGrid dashboard |
| `ANTHROPIC_API_KEY` | From Anthropic console |
| `OPENAI_API_KEY` | From OpenAI (if using OpenAI provider) |
| `SPLUNK_ENABLED` | `true` to activate Splunk emission |
| `SPLUNK_HEC_URL` | `https://your-splunk:8088/services/collector` |
| `SPLUNK_HEC_TOKEN` | HEC token from Splunk |
| `SPLUNK_INDEX` | `legalai` |
| `SPLUNK_SOURCE` | `legalai-backend` |
| `SPLUNK_SOURCETYPE` | `legalai:json` |
| `SPLUNK_ALERT_SECRET` | Shared secret for webhook signature validation |
| `SPLUNK_API_URL` | `https://your-splunk:8089` (REST API for investigation assistant) |
| `SPLUNK_API_TOKEN` | Splunk REST API token |

### Verifying migrations ran

In **Deployments → latest → View Logs** you should see:

```
INFO  [alembic.runtime.migration] Running upgrade 002 -> 003, add splunk_alerts table
INFO:     Application startup complete.
```

---

## Frontend

### Build & start

Railway reads `frontend/railway.toml`, builds `frontend/Dockerfile` in two stages:

1. **Builder** (`node:20-alpine`): receives `VITE_API_URL` as a Docker build ARG, sets it as an ENV, then runs `npm run build`. Vite bakes the value into the JS bundle at compile time — there is no runtime server.
2. **Nginx** (`nginx:alpine`): serves the compiled `dist/` on port 80.

### Health check

`GET /` — nginx always serves `index.html` here; passes as long as the build succeeded.

### Required build variable

`VITE_API_URL` must be set **before** the first deploy so Vite can bake it into the bundle.

In **Railway → frontend service → Variables**, add:

| Variable | Value |
|---|---|
| `VITE_API_URL` | Public URL of the backend service, e.g. `https://legalai-backend.up.railway.app` |

Railway injects this as a Docker build arg automatically for `VITE_*`-prefixed variables. Setting it as a plain runtime env var is not enough — the bundle is already compiled by the time nginx starts.

---

## Deploy order

1. Deploy **backend** first — wait for health check to pass.
2. Copy the backend's public URL from **Settings → Public Networking**.
3. Set `VITE_API_URL` on the frontend service to that URL.
4. Deploy **frontend**.

On subsequent pushes to `main`, Railway redeploys both services automatically. The backend always runs `alembic upgrade head`, so new migrations apply on every deploy without manual intervention.

---

## Rollback

Railway keeps prior deployments. To roll back, go to **Deployments**, click the previous successful deploy, and click **Redeploy**. Note: rolling back the backend does not undo Alembic migrations — schema changes are forward-only.
