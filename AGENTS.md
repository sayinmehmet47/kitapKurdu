# Agent Instructions

This file applies repository-wide. Nested, more specific instructions (e.g. per-directory
`AGENTS.md` files added later) take precedence over this top-level file.

## Repository overview

| Layer       | Tech                                             |
| ----------- | ------------------------------------------------ |
| Client      | React (Vite), TypeScript, Redux Toolkit, Tailwind |
| Backend     | Express, TypeScript, MongoDB (Mongoose), Passport |
| Infra       | Kubernetes manifests (legacy, reference only), Docker Compose |
| CI/CD       | GitHub Actions                                   |

## Repository map

```
kitapKurdu/
├── client/                  # React/Vite frontend
│   ├── src/main.tsx         # Entry point
│   ├── src/pages/           # Route-level components
│   ├── src/components/      # Shared UI components
│   ├── src/redux/           # Redux store, slices, API helper
│   └── vite.config.ts       # Vite config (port 3000, /api proxy)
├── backend/                 # Express API
│   ├── index.ts             # Entry point (env checks, MongoDB connect)
│   ├── app.ts               # Express app (routes, CORS, healthz, sitemap, OG)
│   ├── routes/api/          # Route handlers (/api/books, /api/user, etc.)
│   ├── controllers/         # Request handlers
│   ├── services/            # Business logic
│   ├── models/              # Mongoose models (Books, User, etc.)
│   ├── middleware/           # Auth, error handler, validation
│   ├── src/config/passport.ts  # Passport (local, Google, JWT)
│   ├── metrics.ts           # Prometheus /metrics endpoint
│   └── test/setup.ts        # Jest setup (mongodb-memory-server)
├── infra/                   # Kubernetes manifests
│   ├── k8s/                 # Production manifests
│   ├── k8s-dev/             # Dev manifests
│   ├── k8s-staging/         # Staging manifests
│   └── secrets/             # Sealed secrets
├── .github/workflows/       # CI/CD pipelines
├── package.json             # Root npm scripts
└── docker-compose.yaml
```

## Verified commands

Only run commands that exist in the actual `package.json` scripts. Do not invent or
guess commands.

### Root

| Command              | Script                                    |
| -------------------- | ----------------------------------------- |
| `npm run local`      | Starts frontend + backend via Forego |
| `npm run local:frontend` | `npm --prefix ./client start`        |
| `npm run local:backend`  | `PORT=5000 npm --prefix ./backend run dev` |
| `npm test`           | Placeholder (`echo "Error: no test specified" && exit 1`) — **do not use for verification.** |

### Client (`client/`)

| Command              | Script                                |
| -------------------- | ------------------------------------- |
| `npm start`          | `vite` (dev server, port 3000)        |
| `npm run build`      | `tsc && vite build`                   |
| `npm run preview`    | `vite preview`                        |

### Backend (`backend/`)

| Command              | Script                                         |
| -------------------- | -----------------------------------------------|
| `npm run dev`        | `ts-node-dev ... index.ts` (watch mode)       |
| `npm run build`      | `npm install && tsc -p tsconfig.build.json`    |
| `npm test`           | `jest --no-cache`                              |
| `npm run test:ci`    | `jest`                                         |
| `npm start`          | `node ./dist/index.js` (requires `npm run build` first) |

### Install dependencies

When lockfiles have not changed, install with `npm ci` separately in `./`, `./client`,
and `./backend` as needed.

## Local runtime

| Service  | Port |
| -------- | ---- |
| Client   | 3000 |
| Backend  | 5000 |

The Vite dev server proxies `/api` requests to `http://localhost:5000`.

## Agent workflow

1. **One issue per branch.** Create a dedicated branch from `main`.
2. **Bounded changes.** Only modify files and directories that the issue scope
   authorises. Do not refactor unrelated code, update dependencies, or reformat
   files outside scope.
3. **Do not commit directly to main.** Always work on a feature branch.
4. **Link the PR** with `Closes #<number>` in the PR description.
5. **Report verification.** After changes, run the closest applicable checks and
   report the command and outcome. For documentation-only changes, builds are
   not required; validating markdown and relative links is sufficient.
6. **Never merge, push, deploy, or open a PR unless explicitly requested.**
   Only the operator triggers these actions.
7. **Do not deploy to or alter Kubernetes infrastructure.** Kubernetes manifests
   in `infra/` are legacy artifacts retained for reference. Do not deploy to,
   re-enable, or reactivate them unless an issue explicitly requests it.
   The canonical deployment targets are Vercel (frontend) and Render (backend).

## Security boundaries

- **Never read, display, or commit actual secret values.** Refer to environment
  variable **names only**.
- **Never alter `.env` files**, secret manifests (`infra/secrets/`), CI/CD
  workflow definitions, deployment manifests, dependency files
  (`package.json`, lockfiles), or generated code (`dist/`, `build/`,
  `node_modules/`) unless the issue scope **explicitly** requires it.
- **Never weaken or skip tests.** Keep existing test assertions intact and
  passing.
- **Client `VITE_*` variables are public at build time.** They are embedded in
  JavaScript bundles and must never contain private credentials.

## Testing guidance (current state)

| Area      | Status                                                        |
| --------- | ------------------------------------------------------------- |
| Backend   | Jest + Supertest + mongodb-memory-server. Route tests under `backend/routes/api/__test__/`. Run with `npm test` or `npm run test:ci` in `backend/`. |
| Client    | No working unit-test script. `@testing-library/*` packages are installed but the test infrastructure is incomplete. |
| Playwright | Config exists (`client/playwright.config.ts`). First smoke tests are tracked in a separate issue (#316). |

When verifying changes, run the **closest relevant check** for the layer you
touched. For documentation-only edits, a build is not necessary.

CI tests must use isolated test infrastructure (e.g., in-memory MongoDB via
mongodb-memory-server) and must never target production services. Preview and
E2E tests may use a dedicated test/staging backend if one is provisioned in the
future, but must not mutate production data.

## Definition of done

- [ ] The issue's acceptance criteria are met.
- [ ] The diff is minimal (no unrelated changes).
- [ ] Applicable tests/checks pass (or documentation validity confirmed).
- [ ] Documentation is updated if the PR changes architecture, APIs, or workflows.
- [ ] No secret values are present in the diff.
- [ ] The PR description includes a summary, risks (if any), and follow-up items.
