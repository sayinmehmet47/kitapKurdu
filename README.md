# KitapKurdu

A full-stack book search and sharing application with user authentication, book uploads,
comments, and ratings. Built with React, Express, and MongoDB.

**Live**

- Frontend: [https://kitap-kurdu-bx87.vercel.app](https://kitap-kurdu-bx87.vercel.app)
- Backend health: [https://kitapkurdu.onrender.com/healthz](https://kitapkurdu.onrender.com/healthz)
- Actions workflows: [repository Actions tab](https://github.com/sayinmehmet47/kitapKurdu/actions)

---

## Overview

| Layer      | Technology                                                            |
| ---------- | --------------------------------------------------------------------- |
| Client     | React 18, Vite 6, TypeScript, Redux Toolkit, Tailwind CSS, Radix UI   |
| Backend    | Express 4, TypeScript, Mongoose (MongoDB), Passport (JWT, local, Google OAuth 2.0) |
| Database   | MongoDB                                                               |
| CI/CD      | GitHub Actions                                                        |
| Formatting | Biome 2.5.6                                                           |
| Deployment | Vercel (frontend), Render (backend)                                   |
| Infra      | Kubernetes manifests (legacy, reference only)                         |

## Request flow

Both development and production use a same-origin `/api` strategy:

| Environment | `/api` resolution                                           |
| ----------- | ----------------------------------------------------------- |
| Dev         | Vite proxy → `http://localhost:5000`                         |
| Prod        | Vercel rewrite → `https://kitapkurdu.onrender.com/api`      |

The client always sends API requests to the same origin with `/api` as the base path.
The canonical configuration relies on the Vite proxy in development and the
[`vercel.json`](client/vercel.json) rewrite rule in production. The optional
`VITE_PROD_API` build-time variable can override the path, but leaving it unset
(defaults to `/api`) is the recommended configuration.

## Prerequisites

- [Git](https://git-scm.com)
- [Node.js](https://nodejs.org) 20.x (pinned via `engines.node` in both `client/package.json` and `backend/package.json`)
- [MongoDB](https://www.mongodb.com) (local instance or [Atlas](https://www.mongodb.com/atlas))
- [Forego](https://github.com/ddollar/forego) (required only for the combined `npm run local` command). Install via `brew install forego` on macOS, or follow the [official build instructions](https://github.com/ddollar/forego#installation). Contributors without Forego can use the separate `npm run local:backend` and `npm run local:frontend` terminals instead.
- A [Google Cloud](https://console.cloud.google.com) OAuth 2.0 client (for social login). **Required** by backend startup validation even if you only use local/password auth — the backend won't start without `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
- [Cloudinary](https://cloudinary.com) account (for book cover uploads). Optional for local browsing.
- [EmailJS](https://www.emailjs.com) account (for contact form). Optional.

## Quick start

```bash
# Clone the repository
git clone https://github.com/sayinmehmet47/kitapKurdu.git
cd kitapKurdu

# Install dependencies (three workspaces)
npm ci                          # root (Biome)
npm ci --prefix client          # client
npm ci --prefix backend         # backend

# Copy and fill environment files
cp client/.env.example client/.env
cp backend/.env.example backend/.env
```

Edit both `.env` files and fill in the required values (see [Environment
variables](#environment-variables) below). The backend validates these eight
variables at startup and exits if any are missing: `MONGO_URI`,
`ACCESS_TOKEN_SECRET_KEY`, `REFRESH_TOKEN_SECRET_KEY`, `JWT_SECRET`, `PORT`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `CLIENT_URL`.

```bash
# Start both frontend and backend
npm run local
```

This requires [Forego](https://github.com/ddollar/forego) (see [Prerequisites](#prerequisites) for
install instructions). It launches the frontend and backend in parallel
(see [`Procfile.local`](Procfile.local)).

If you don't have Forego, start each service independently in separate terminals:

```bash
# Terminal 1 — Backend (port 5000)
npm run local:backend

# Terminal 2 — Frontend (port 3000)
npm run local:frontend
```

| Service | URL                        | Notes                                      |
| ------- | -------------------------- | ------------------------------------------ |
| Client  | http://localhost:3000      | Vite dev server, hot reload                 |
| Backend | http://localhost:5000      | ts-node-dev with watch mode                 |

> **Note:** The backend `npm start` script runs the compiled output (`node ./dist/index.js`)
> and requires `npm run build` first. For local development, use `npm run dev` instead.

## Environment variables

Only variable **names** are listed. Actual values are managed through `.env` files
(local), platform dashboards (Vercel/Render), or CI secrets — never commit them.

### Backend

**Required at startup** (backend exits if any are missing):

| Variable                     | Purpose                                                 |
| ---------------------------- | ------------------------------------------------------- |
| `MONGO_URI`                  | MongoDB connection string                               |
| `ACCESS_TOKEN_SECRET_KEY`    | JWT access token signing secret                         |
| `REFRESH_TOKEN_SECRET_KEY`   | JWT refresh token signing secret                        |
| `JWT_SECRET`                 | Legacy startup-validation requirement (token logic uses access/refresh keys above) |
| `PORT`                       | Server port (Render injects automatically; set manually for local dev) |
| `GOOGLE_CLIENT_ID`           | Google OAuth 2.0 client ID                              |
| `GOOGLE_CLIENT_SECRET`       | Google OAuth 2.0 client secret                          |
| `CLIENT_URL`                 | Frontend URL for redirects and OAuth callbacks                 |

**Operational** (referenced at runtime but not validated at startup):

| Variable                | Purpose                                            |
| ----------------------- | -------------------------------------------------- |
| `NODE_ENV`              | Node environment (`production`, `development`, `test`) |
| `SERVER_URL`            | Public URL of the backend (OAuth callbacks, sitemap) |
| `GOOGLE_CALLBACK_URL`   | Google OAuth redirect URI                           |

**Optional — Email** (features silently degrade if unset; `EMAIL_USER` and `EMAIL_PASS`
are both required for SMTP auth when enabled):

| Variable           | Purpose                | Note                      |
| ------------------ | ---------------------- | ------------------------- |
| `EMAIL_USER`       | SMTP username          | Required if email enabled |
| `EMAIL_PASS`       | SMTP password          | Required if email enabled |
| `EMAIL_HOST`       | SMTP host              |                           |
| `EMAIL_PORT`       | SMTP port              |                           |
| `EMAIL_FROM`       | From address           |                           |
| `EMAIL_FROM_NAME`  | From display name      |                           |

### Client

All `VITE_*` variables are embedded in the JavaScript bundle at build time
and are **publicly visible** in the browser. Never store private credentials in them.

**Actively consumed:**

| Variable                              | Purpose                                        | Default                  |
| ------------------------------------- | ---------------------------------------------- | ------------------------ |
| `VITE_PROD_API`                       | Override API base path in production            | unset → `/api`           |
| `VITE_CLOUDINARY_URL`                 | Cloudinary base URL for image uploads          | (required for uploads)   |
| `VITE_PUBLIC_EMAILJS_SERVICE_ID`      | EmailJS service ID (contact form)               | (required for contact form) |
| `VITE_PUBLIC_EMAILJS_TEMPLATE_ID`     | EmailJS template ID (contact form)              | (required for contact form) |
| `VITE_PUBLIC_EMAILJS_PUBLIC_KEY`      | EmailJS public key (contact form)               | (required for contact form) |

`VITE_PROD_API` is optional. When unset, the production API path defaults to `/api`
and is rewritten to the Render backend by the Vercel rewrite rule. Setting it to a full
URL stores that URL in the public bundle — prefer leaving it unset unless you have a
specific reason.

The variables `VITE_LOCAL_API` and `VITE_DEV_API` are no longer actively consumed by the
codebase and should not be relied upon.

### Test-only

The backend test suite uses isolated in-memory MongoDB via `mongodb-memory-server`.
Optionally, you can override this with:

| Variable          | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `TEST_MONGO_URI`  | Custom MongoDB URI for test isolation     |
| `TEST_MONGO_DB`   | Custom database name for test isolation   |

These are not required. Without them, tests default to an ephemeral in-memory instance.

## Commands

### Root

| Command                    | Script                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `npm run local`            | Starts frontend + backend via Forego                                                      |
| `npm run local:frontend`   | `npm --prefix ./client start`                                                             |
| `npm run local:backend`    | `PORT=5000 npm --prefix ./backend run dev`                                                 |
| `npm run check`            | Reports format/lint issues on staged files (`biome check --staged --no-errors-on-unmatched .`) |
| `npm run check:write`      | Formats and applies safe fixes to staged files (`biome check --write --staged --no-errors-on-unmatched .`) |
| `npm run check:ci`         | Read-only check of changed files vs `origin/main` (`biome ci --changed --since=origin/main --no-errors-on-unmatched .`) |
| `npm run check:all`        | Audits all supported files; currently reports legacy debt (`biome check .`)                  |

> `npm test` at the root is a placeholder and must not be used for verification.

### Client (`client/`)

| Command                  | Script                     |
| ------------------------ | -------------------------- |
| `npm start`              | `vite` (dev, port 3000)    |
| `npm run build`          | `tsc && vite build`        |
| `npm run preview`        | `vite preview`             |
| `npm test`               | `vitest run`               |
| `npm run test:watch`     | `vitest` (watch mode)      |
| `npm run test:e2e`       | `playwright test`          |

### Backend (`backend/`)

| Command              | Script                                                              |
| -------------------- | ------------------------------------------------------------------- |
| `npm run dev`        | `ts-node-dev --respawn --transpile-only --ignore-watch node_modules index.ts` (watch mode)  |
| `npm run build`      | `tsc -p tsconfig.build.json`                                        |
| `npm start`          | `node ./dist/index.js` (**requires `npm run build` first**)          |
| `npm test`           | `jest --no-cache`                                                   |
| `npm run test:ci`    | `jest`                                                              |

## Testing

| Area       | Stack                                                   | Command (in directory)   |
| ---------- | ------------------------------------------------------- | ------------------------ |
| Backend    | Jest, Supertest, mongodb-memory-server                  | `npm test` in `backend/` |
| Client     | Vitest, jsdom, Testing Library                          | `npm test` in `client/`  |
| Playwright | Chromium-only, fully mocked API fixtures, no external services | `npm run test:e2e` in `client/` |

**Playwright prerequisite:** Install Chromium before running E2E tests:

```bash
npx playwright install chromium
```

Backend tests use isolated in-memory MongoDB and never target production services.
Client unit tests avoid production/external resources.

CI runs backend tests serially (`--runInBand`) with `MONGOMS_VERSION` pinned to MongoDB
7.0.3 for Linux runner compatibility. E2E tests run via a separate
[`e2e.yml`](.github/workflows/e2e.yml) workflow, triggered on PRs when client files
change or manually via `workflow_dispatch`.

## Code quality

Biome 2.5.6 handles formatting, linting, and import organization from a single root
[`biome.json`](biome.json). Type-checking is performed separately by `tsc` during
`npm run build` in both `client/` and `backend/`.

**Before committing:**

1. Stage the files you intend to commit.
2. Run `npm run check:write` to apply formatting and safe auto-fixes.
3. Review and re-stage any automatic changes.
4. Run `npm run check` to verify no issues remain.

There is no pre-commit hook. Formatting is manual and deliberate. CI runs
`npm run check:ci` in read-only (non-mutating) mode.

`npm run check:all` audits all supported files and currently reports legacy debt tracked
in issue [#328](https://github.com/sayinmehmet47/kitapKurdu/issues/328).

## GitHub / OpenCode workflow

1. **One issue per branch.** Create a dedicated branch from `main`.
2. **Read [`AGENTS.md`](AGENTS.md) first.** It defines verified commands, security
   boundaries, and the definition of done.
3. **Bounded changes.** Only modify files and directories that the issue scope
   authorises.
4. **PR description** must include `Closes #<number>`.
5. **Required checks** — _Backend build and tests_ and _Client type-check and build_ —
   run on every PR. Review the CI results and preview deployments before requesting a
   merge.
6. **The operator merges.** Agents and automation do not merge, push, or deploy without
   explicit operator approval.

The [`.opencode/`](.opencode/) project overrides (in `.opencode/agents/`) reduce agent prompt
confirms but do not authorise merge, deploy, or secret access.

## Deployment

### Vercel (frontend)

The client is deployed to Vercel with the following configuration (mirrored in
[`client/vercel.json`](client/vercel.json)):

| Setting            | Value                                                  |
| ------------------ | ------------------------------------------------------ |
| Root Directory     | `client`                                               |
| Build Command      | `npm run build`                                         |
| Output Directory   | `build`                                                |
| Node.js Version    | 20.x (pinned via `engines.node` in `client/package.json`) |
| Rewrites           | `/api/:path*` → `https://kitapkurdu.onrender.com/api/:path*` |

Merging to `main` triggers an automatic Vercel deployment. Frontend-only PRs receive
preview URLs for manual verification.

### Render (backend)

The backend is deployed to Render via the Blueprint defined in
[`render.yaml`](render.yaml):

| Setting            | Value                                         |
| ------------------ | --------------------------------------------- |
| Type               | Web service                                   |
| Runtime            | Node                                          |
| Root Directory     | `backend`                                     |
| Build Command      | `npm ci && npm run build`                      |
| Start Command      | `npm run start`                                |
| Health Check       | `/healthz`                                     |
| Plan               | Free                                          |
| Region             | Oregon                                        |
| Auto Deploy        | Off                                           |
| Previews           | Automatic                                     |

**Important:** Adding `render.yaml` alone does not deploy the service. The Blueprint
must be reviewed and manually adopted in the Render dashboard to avoid creating a
duplicate service. After adoption, sync the environment variables from the dashboard
(names only in the file).

**Free-tier cold starts:** The Render free plan spins down after inactivity. Expect a
delay on the first request after idle periods.

### Kubernetes (legacy, reference only)

Manifests under [`infra/k8s/`](infra/k8s/), [`infra/k8s-dev/`](infra/k8s-dev/),
[`infra/k8s-staging/`](infra/k8s-staging/), [`infra/secrets/`](infra/secrets/), and
[`infra/workflows-legacy/`](infra/workflows-legacy/) are retained for historical
reference and are **not** actively deployed. Do not re-enable or reactivate them unless
an explicit issue requests it.

## Troubleshooting

**Backend fails to start — missing environment variables.**
Ensure `backend/.env` exists and all required variables are set. The backend validates
`MONGO_URI`, `ACCESS_TOKEN_SECRET_KEY`, `REFRESH_TOKEN_SECRET_KEY`, `JWT_SECRET`,
`PORT`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `CLIENT_URL` at startup.

**MongoDB connection refused.**
Verify MongoDB is running locally (`mongod`) or your Atlas cluster is accessible.
Check that `MONGO_URI` is correct and network access allows the connection.

**Port 3000 or 5000 already in use.**
Free the port (`lsof -i :3000` / `lsof -i :5000` → `kill -9 <PID>`) or override with
environment variables. In `backend/.env`, set `PORT` to a free port and adjust the Vite
proxy target in [`client/vite.config.ts`](client/vite.config.ts) accordingly.

**Render deployment: cold start or health check failures.**
The free plan spins down after inactivity — the first request may be slow. If the service
is permanently down, check the Render dashboard for crash logs, verify environment
variables, and confirm `/healthz` returns 200. The `keepalive.yml` cron workflow has
been removed; cold starts are expected.

**CORS errors in the browser.**
Allowed cross-origin origins are defined by the explicit allowlist in
[`backend/app.ts`](backend/app.ts) (line 29), not by `CLIENT_URL`. `CLIENT_URL` is
validated at startup and used for redirects and links, but adding a new frontend
origin to the application requires a reviewed change to the `origin` array in
`backend/app.ts`.

**API requests failing in production — wrong base URL.**
The canonical Vercel deployment uses the same-origin `/api` path rewritten to Render.
If you set `VITE_PROD_API`, that value overrides the path and is embedded in the public
bundle. Prefer leaving it unset. Clear the Vercel dashboard environment variable if it
was set previously.

**Playwright tests fail — browser not found.**
Run `npx playwright install chromium` in the `client/` directory. CI installs the
required system dependencies automatically.

**Biome doesn't see your files — no issues reported.**
Biome runs against staged files by default (`check` / `check:write`). Verify your files
are staged (`git status`). If they are and still ignored, check the `includes` patterns
in [`biome.json`](biome.json).

## Documentation

- [`AGENTS.md`](AGENTS.md) — Commands, workflow, security boundaries, testing guidance
- [`docs/architecture.md`](docs/architecture.md) — Architecture, data flow, API routes,
  environment variables, deployment topology
- [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/) — Issue templates
- [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md) — PR template
- [`render.yaml`](render.yaml) — Render Blueprint configuration
- [`client/vercel.json`](client/vercel.json) — Vercel deployment configuration
- [`biome.json`](biome.json) — Biome formatting and linting configuration
