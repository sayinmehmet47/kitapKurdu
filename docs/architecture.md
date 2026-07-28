# Repository Architecture

This document describes the **current** architecture of the kitapKurdu repository,
not an aspirational design. It is kept in sync with the actual source tree.

## High-level request flow

```
Browser React app  ──>  Vite proxy /api  ──>  Express server  ──>  MongoDB
                             (dev only)         (port 5000)        external services
```

- In local development the [Vite dev server](../client/vite.config.ts) proxies
  `/api` requests to `http://localhost:5000`.
- In production the client is deployed separately and communicates with the
  backend over HTTPS (CORS origins are configured in
  [`backend/app.ts`](../backend/app.ts)).

## Repository structure & entry points

| Path                          | Role                                          |
| ----------------------------- | --------------------------------------------- |
| [`client/src/main.tsx`](../client/src/main.tsx)   | React application entry point           |
| [`client/src/redux/store.ts`](../client/src/redux/store.ts) | Redux store configuration       |
| [`backend/index.ts`](../backend/index.ts)          | Backend entry point — env checks, MongoDB connect, cron, server start |
| [`backend/app.ts`](../backend/app.ts)              | Express app — CORS, Passport, routes, `/healthz`, `/sitemap.xml`, `/og/book/:id` |
| [`backend/routes/index.ts`](../backend/routes/index.ts) | API route aggregator mounted at `/api`   |
| [`backend/controllers/`](../backend/controllers/)   | Request handlers                               |
| [`backend/services/`](../backend/services/)        | Business logic                                 |
| [`backend/models/`](../backend/models/)            | Mongoose schemas (`Books`, `User`, `Messages`, `Rating`, `SearchAnalytics`) |
| [`backend/middleware/`](../backend/middleware/)     | Auth (JWT, admin), error handler, validation    |
| [`backend/metrics.ts`](../backend/metrics.ts)      | Prometheus `/metrics` endpoint                 |
| [`backend/cronJob.ts`](../backend/cronJob.ts)      | Scheduled tasks (daily category update)         |
| [`infra/k8s/`](../infra/k8s/)                      | Kubernetes manifests — production (legacy, reference only) |
| [`infra/k8s-dev/`](../infra/k8s-dev/)              | Kubernetes manifests — dev (legacy, reference only) |
| [`infra/k8s-staging/`](../infra/k8s-staging/)      | Kubernetes manifests — staging (legacy, reference only) |
| [`infra/secrets/`](../infra/secrets/)              | Sealed secrets (legacy)                         |
| [`.github/workflows/`](../.github/workflows/)      | PR checks and deployment automation (current and legacy) |

## Runtime stack & local ports

| Layer        | Technology                                 | Local port |
| ------------ | ------------------------------------------ | ---------- |
| Client       | React 18, Vite 6, TypeScript, Redux Toolkit, Tailwind CSS | 3000 |
| Backend      | Node.js, Express 4, TypeScript             | 5000        |
| Database     | MongoDB (Mongoose ODM)                     | —           |
| Auth         | Passport (JWT, local, Google OAuth 2.0)    | —           |
| Monitoring   | Prometheus, Winston logger                 | —           |
| Scheduling   | node-cron                                   | —           |

## Backend API route groups

All API routes are mounted under `/api` (see [`backend/routes/index.ts`](../backend/routes/index.ts)):

| Route prefix     | Purpose                  | Source                                              |
| ---------------- | ------------------------ | --------------------------------------------------- |
| `/api/books`     | Books CRUD, search       | [`backend/routes/api/books.ts`](../backend/routes/api/books.ts) |
| `/api/user`      | Auth, profile, tokens    | [`backend/routes/api/user.ts`](../backend/routes/api/user.ts)   |
| `/api/messages`  | Comments/messages        | [`backend/routes/api/messages.ts`](../backend/routes/api/messages.ts) |
| `/api/ratings`   | Book ratings             | [`backend/routes/api/ratings.ts`](../backend/routes/api/ratings.ts) |
| `/api/subscription` | Push notifications     | [`backend/routes/api/subscription.ts`](../backend/routes/api/subscription.ts) |
| `/api/analytics` | Usage analytics (admin)  | [`backend/routes/api/analytics.ts`](../backend/routes/api/analytics.ts) |

Non-API endpoints defined in [`backend/app.ts`](../backend/app.ts):

| Path              | Purpose                         |
| ----------------- | ------------------------------- |
| `/healthz`        | Health check (JSON with uptime) |
| `/metrics`        | Prometheus metrics endpoint     |
| `/sitemap.xml`    | Dynamic sitemap for SEO         |
| `/og/book/:id`    | Server-rendered Open Graph meta for social link previews |

## Authentication overview

Authentication uses Passport with three strategies (no session, fully stateless JWT):

- **Local** — username/email + password with bcrypt verification.
- **Google OAuth 2.0** — social login via Google.
- **JWT** — short-lived access tokens and long-lived refresh tokens managed via
  HTTP-only cookies or `Authorization: Bearer` header. Refresh tokens can also
  travel in a query parameter for cross-domain scenarios.

Source: [`backend/src/config/passport.ts`](../backend/src/config/passport.ts) and
[`backend/middleware/auth.ts`](../backend/middleware/auth.ts).

## Environment variables

Only variable **names** are listed; actual values are managed through
environment-specific mechanisms (`.env` for local, Kubernetes sealed secrets
for clusters, platform dashboards for Vercel/Render).

### Backend (`backend/.env.example` + `checkvariables.ts`)

Required at startup:

- `MONGO_URI`
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET_KEY`
- `ACCESS_TOKEN_SECRET_KEY`
- `PORT`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CLIENT_URL`

Also referenced at runtime:

- `GOOGLE_CALLBACK_URL`
- `SERVER_URL`
- `NODE_ENV`

### Client (`client/.env.example`)

- `VITE_LOCAL_API`
- `VITE_DEV_API`
- `VITE_PROD_API`
- `VITE_CLOUDINARY_URL`
- `VITE_PUBLIC_EMAILJS_SERVICE_ID`
- `VITE_PUBLIC_EMAILJS_TEMPLATE_ID`
- `VITE_PUBLIC_EMAILJS_PUBLIC_KEY`

**Important:** `VITE_*` variables are embedded in the JavaScript bundle at build
time and are publicly visible in the browser. They must never contain private
credentials or secrets.

## Deployment topology

### Active deployment targets

| Layer    | Platform | Notes |
| -------- | -------- | ----- |
| Client   | **Vercel** | The client application (`client/vercel.json`) rewrites `/api` requests to the Render backend. |
| Backend  | **Render** | The backend API is served from `https://kitapkurdu.onrender.com`. |

These are the canonical deployment targets. All production traffic flows through
this topology.

### Legacy Kubernetes manifests (reference only)

Kubernetes manifests are retained for historical reference and are **not**
currently used for deployment:

- [`infra/k8s/`](../infra/k8s/) — Production deployment manifests (legacy)
- [`infra/k8s-dev/`](../infra/k8s-dev/) — Dev environment manifests (legacy)
- [`infra/k8s-staging/`](../infra/k8s-staging/) — Staging environment manifests (legacy)
- [`infra/secrets/`](../infra/secrets/) — Sealed secrets (legacy)

These manifests are **not actively deployed**. Agents must not deploy to,
re-enable, or reactivate Kubernetes infrastructure unless an issue
explicitly requests it.

### CI/CD

The [`main.yml`](../.github/workflows/main.yml) workflow (`Pull request quality checks`)
runs on every pull request with no path or branch filters, so required checks
never remain pending on docs-only or config-only PRs. It consists of two
required checks:

| Check name | What it verifies | Technology |
| --- | --- | --- |
| **Backend build and tests** | `npm ci` → `npm run build` → `npm run test:ci -- --runInBand` | Jest, Supertest, mongodb-memory-server (in-memory, no production service) |
| **Client type-check and build** | `npm ci` → `npm run build` (`tsc && vite build`) | TypeScript compiler + Vite production bundle |

The workflow uses `permissions: contents: read` (read-only), npm dependency
caching via `setup-node`, and a concurrency group that cancels redundant
in-progress runs on the same PR branch.

Backend tests use isolated infrastructure (in-memory MongoDB via
mongodb-memory-server) and never target production services. CI runs Jest
serially (`--runInBand`) to prevent parallel first-download lock
contention while still executing the complete test suite. CI pins the
mongodb-memory-server binary to MongoDB 7.0.3 (`MONGOMS_VERSION`) for
Linux runner compatibility (Debian 12). Client unit tests
and Playwright E2E tests are tracked separately in issues
[#315](/sayinmehmet47/kitapKurdu/issues/315) and
[#316](/sayinmehmet47/kitapKurdu/issues/316) respectively and are not yet part
of CI.

Branch protection should require both checks — `Backend build and tests` and
`Client type-check and build` — to pass before merging, after the workflow has
run at least once on the target branch.

Additional legacy Kubernetes deployment workflow files remain present in the
repository and may still have triggers configured. These legacy workflows are
not the canonical deployment path and must not be invoked, repaired, or
reactivated without an explicit issue. Migration and cleanup of deployment
automation is tracked in issue
[#317](/sayinmehmet47/kitapKurdu/issues/317).

The active deployment targets are Vercel (frontend) and Render (backend),
as described in [Deployment topology](#deployment-topology). Preview and
E2E tests may use Vercel preview deployments and may target a dedicated
test/staging backend if one is provisioned in the future, but must never
mutate production data.

## Current test state

| Area       | Status                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| Backend    | Jest + Supertest + mongodb-memory-server. Route integration tests live under [`backend/routes/api/__test__/`](../backend/routes/api/__test__/). Run with `npm test` or `npm run test:ci` in `backend/`. |
| Client     | `@testing-library/*` packages are installed but no working unit-test script is wired up.                 |
| Playwright | Configuration exists at [`client/playwright.config.ts`](../client/playwright.config.ts). First smoke tests are tracked in issue [#316](/sayinmehmet47/kitapKurdu/issues/316). E2E tests are not yet part of CI. |
