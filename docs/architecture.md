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
| [`infra/workflows-legacy/`](../infra/workflows-legacy/) | Archived Kubernetes/Rancher deployment workflows (non-executable) |
| [`.github/workflows/`](../.github/workflows/)      | PR checks, E2E, code-simplifier workflows       |

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

Optional (email features silently degrade if unset):

- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_SECURE`
- `EMAIL_FROM`
- `EMAIL_FROM_NAME`

**Note:** The backend `build` script (`tsc -p tsconfig.build.json`) is
compile-only. Dependency installation (`npm ci`) is performed externally
by Render (via `buildCommand` in `render.yaml`) or CI before the build step.

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
| Client   | **Vercel** | The client application (`client/vercel.json`) rewrites `/api` requests to the Render backend. Root Directory is `client`, build command is `npm run build`, output directory is `build`, and Node is pinned to `20.x` via `client/package.json` `engines.node`. |
| Backend  | **Render** | The backend API is served from `https://kitapkurdu.onrender.com`. Configured via `render.yaml` (Blueprint) at the repository root: runtime `node`, root directory `backend`, build command `npm ci && npm run build`, start command `npm run start`, health check `/healthz`, plan `free`, region `oregon`, branch `main`, auto-deploy `off`, previews generation `automatic`. |

These are the canonical deployment targets. All production traffic flows through
this topology.

**Important:** Adding `render.yaml` alone does **not** deploy the service. The
Blueprint must be reviewed and manually adopted/synced in the Render dashboard
to avoid creating a duplicate service.

#### API same-origin strategy

The client uses a shared `apiBaseUrl` constant (exported from
`client/src/redux/common.api.ts`). In development (`import.meta.env.DEV`) it
resolves to `/api` (Vite proxy → `localhost:5000`). In production
(`import.meta.env.PROD`) it defaults to `/api`, which is rewritten to
`https://kitapkurdu.onrender.com/api` by Vercel's `vercel.json` rewrite rule.
The optional `VITE_PROD_API` build-time variable can override this, but for the
canonical Vercel deployment the default `/api` (or leaving `VITE_PROD_API`
unset) is preferred — do **not** store the Render URL as a secret. All
`VITE_*` variables are embedded in the public JavaScript bundle.

#### Free-tier cold starts

The Render free plan spins down after inactivity. The legacy `keepalive.yml`
GitHub Actions cron workflow that pinged `/healthz` every 5 minutes has been
removed. Expect cold starts on first request after idle periods.

### Legacy Kubernetes manifests (reference only)

Kubernetes manifests and deployment workflows are retained for historical reference and are **not**
currently used for deployment:

- [`infra/k8s/`](../infra/k8s/) — Production deployment manifests (legacy)
- [`infra/k8s-dev/`](../infra/k8s-dev/) — Dev environment manifests (legacy)
- [`infra/k8s-staging/`](../infra/k8s-staging/) — Staging environment manifests (legacy)
- [`infra/secrets/`](../infra/secrets/) — Sealed secrets (legacy)
- [`infra/workflows-legacy/`](../infra/workflows-legacy/) — Archived K8s/Rancher deployment workflows (non-executable, moved from `.github/workflows/`)

These manifests and workflows are **not actively deployed**. Agents must not deploy to,
re-enable, or reactivate Kubernetes infrastructure unless an issue
explicitly requests it. The workflow files in `infra/workflows-legacy/` must
not be moved back into `.github/workflows/` without an explicit issue and review.

### CI/CD

The [`main.yml`](../.github/workflows/main.yml) workflow (`Pull request quality checks`)
runs on every pull request with no path or branch filters, so required checks
never remain pending on docs-only or config-only PRs. It consists of two
required checks:

| Check name | What it verifies | Technology |
| --- | --- | --- |
| **Backend build and tests** | `npm ci` → `npm run build` → `npm run test:ci -- --runInBand` | Jest, Supertest, mongodb-memory-server (in-memory, no production service) |
| **Client type-check and build** | `npm ci` → `npm test` → `npm run build` (`tsc && vite build`) | Vitest, jsdom, Testing Library + TypeScript compiler + Vite production bundle |

The workflow uses `permissions: contents: read` (read-only), npm dependency
caching via `setup-node`, and a concurrency group that cancels redundant
in-progress runs on the same PR branch.

Backend tests use isolated infrastructure (in-memory MongoDB via
mongodb-memory-server) and never target production services. CI runs Jest
serially (`--runInBand`) to prevent parallel first-download lock
contention while still executing the complete test suite. CI pins the
mongodb-memory-server binary to MongoDB 7.0.3 (`MONGOMS_VERSION`) for
Linux runner compatibility (Debian 12).

Client unit tests use Vitest with jsdom and Testing Library and avoid
production services.

#### Playwright E2E smoke (`e2e.yml`)

A separate [`e2e.yml`](../.github/workflows/e2e.yml) workflow runs Playwright
smoke tests on pull requests targeting `main` when `client/**` or the workflow
itself changes. It can also be triggered manually via `workflow_dispatch`.

| Aspect | Detail |
| --- | --- |
| **Browsers** | Chromium-only (Desktop Chrome). No Firefox or WebKit on PRs. |
| **API strategy** | Every API call is intercepted at `page.route()` level with deterministic fixture JSON. No backend, MongoDB, Cloudinary, Render, or Vercel is required. |
| **External services** | Google Analytics/Tag Manager, production Render API, Pexels, unpkg, and service worker registrations are blocked at the route level. |
| **Isolation** | Fully mocked frontend-only; no network calls leave the browser except Vite dev-server requests for HTML/JS/CSS assets. |
| **Artifacts** | `test-results/` and `playwright-report/` are uploaded only when the job fails (retention 7 days). |
| **Concurrency** | Grouped by workflow + ref; in-progress runs on the same PR are cancelled. |
| **Run command** | `npm run test:e2e` in `client/`. Prerequisite: `npx playwright install chromium`. |

**Important:** These are **frontend smoke tests**, not a full-stack E2E suite.
They validate that critical UI flows render correctly with mocked API responses.
A future true full-stack E2E environment must use isolated test/staging
resources and must never target production services or data.

Branch protection should require both checks — `Backend build and tests` and
`Client type-check and build` — to pass before merging, after the workflow has
run at least once on the target branch.

Legacy Kubernetes/Rancher deployment workflows (`deploy-backend.yaml`,
`deploy-client.yaml`, `deploy-manifests.yaml`, `deploy-staging-backend.yaml`,
`deploy-staging-client.yaml`, `dev-backend.yml`, `dev-client.yml`) have been
moved to [`infra/workflows-legacy/`](../infra/workflows-legacy/) and are
non-executable. The `keepalive.yml` cron workflow has been deleted.

The active deployment targets are Vercel (frontend) and Render (backend),
as described in [Deployment topology](#deployment-topology). Preview and
E2E tests may use Vercel preview deployments and may target a dedicated
test/staging backend if one is provisioned in the future, but must never
mutate production data.

### Biome

A single root [`biome.json`](../biome.json) (Biome 2.5.6) runs through root npm
scripts in [`package.json`](../package.json). It handles formatting, linting, and
import organization for supported file types (JS, TS, JSX, TSX, JSON, CSS).
Markdown and YAML are not supported by Biome and are excluded from the
configuration.

| Script | Scope | Behavior |
| --- | --- | --- |
| `npm run check` | Staged files only | Reports format/lint issues without modifying files |
| `npm run check:write` | Staged files only | Applies formatting and safe fixes; review and re-stage before committing |
| `npm run check:ci` | Changed files vs `origin/main` | Read-only (non-mutating); used in CI with `fetch-depth: 0` |
| `npm run check:all` | All supported files | Full audit; currently reports legacy debt not yet addressed |

The incremental staged/local workflow (`check:write` → manual review → `check`)
keeps the migration deliberate. The changed-file CI strategy (`check:ci`)
requires `fetch-depth: 0` so Biome can diff against the base branch without a
shallow-clone error.

#### CI job

| Check name | What it verifies | Technology |
| --- | --- | --- |
| **Biome code quality** | `npm ci` → `npm run check:ci` (read-only, changed files) | Biome 2.5.6 |

This job (`id: code-quality`) is independent and is **not** branch-protection-required
yet. The existing protected check names — **Backend build and tests** and
**Client type-check and build** — remain unchanged.

## Current test state

| Area       | Status                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| Backend    | Jest + Supertest + mongodb-memory-server. Route integration tests live under [`backend/routes/api/__test__/`](../backend/routes/api/__test__/). Run with `npm test` or `npm run test:ci` in `backend/`. |
| Client     | Vitest + jsdom + Testing Library. Unit tests live under `client/src/` in `__tests__` directories. Run with `npm test` in `client/`. |
| Playwright | Smoke specs under `client/tests/`. Fully mocked API fixtures (no backend, database, or external services). Chromium-only. Run with `npm run test:e2e` in `client/`. CI via [`e2e.yml`](../.github/workflows/e2e.yml). |

## Provider dashboard configuration checklist

These settings must be manually verified in the provider dashboards after any
deployment-configuration change. Actual values are managed in-platform, not in
this repository.

### Vercel

- [ ] **Root Directory**: Set to `client`
- [ ] **Build Command**: `npm run build`
- [ ] **Output Directory**: `build`
- [ ] **Node.js Version**: Pinned to `20.x` via `engines.node` in `client/package.json`
- [ ] **Environment Variables**: Remove or set `VITE_PROD_API` to `/api` (do not store the Render URL as a Vercel secret; `VITE_*` variables are public)

### Render

- [ ] **Blueprint Adoption**: Review and manually adopt `render.yaml` from the repository root (`repo` → `Blueprint` in dashboard). Adding the file alone does **not** deploy — manual sync is required to avoid creating a duplicate service.
- [ ] **Auto Deploy**: Verify set to `off` (controlled via `autoDeploy` in `render.yaml`)
- [ ] **Health Check**: `/healthz`
- [ ] **Plan**: Free; **Region**: Oregon
- [ ] **Root Directory**: `backend`
- [ ] All env vars listed in `render.yaml` are configured with values in the dashboard (names only in the file)
