# KitapKurdu Client

React 18 frontend for the KitapKurdu book search and sharing application. Built with Vite 6,
TypeScript, Redux Toolkit, Tailwind CSS, and Radix UI.

- [Root README](../README.md) — Full project overview, setup, deployment
- [`docs/architecture.md`](../docs/architecture.md) — Architecture, data flow, API routes

## Prerequisites

- [Node.js](https://nodejs.org) 20.x (pinned via `engines.node` in `package.json`)
- Backend running on port 5000 (see [root quick start](../README.md#quick-start))

## Setup

```bash
cd client
npm ci
cp .env.example .env   # fill in Cloudinary/EmailJS values (optional)
npm start              # Vite dev server on port 3000
```

The Vite dev server proxies `/api` requests to `http://localhost:5000`. The canonical
API path is `/api` in both development and production — see the [request flow
explanation](../README.md#request-flow) in the root README.

## Scripts

| Command                  | Purpose                                                |
| ------------------------ | ------------------------------------------------------ |
| `npm start`              | Vite dev server (port 3000, hot reload)                 |
| `npm run build`          | TypeScript check + production bundle (`tsc && vite build`) |
| `npm run preview`        | Preview the production build locally                     |
| `npm test`               | Run Vitest unit tests                                    |
| `npm run test:watch`     | Run Vitest in watch mode                                 |
| `npm run test:e2e`       | Run Playwright smoke tests                               |

## Directory map

```
client/
├── src/
│   ├── main.tsx            # Entry point
│   ├── pages/              # Route-level components (Home, Books, Login, etc.)
│   ├── components/         # Shared UI components (Navbar, Footer, Search, etc.)
│   ├── redux/              # Redux store, slices, API helper
│   ├── helpers/            # Utility functions
│   ├── constants/          # Application constants
│   ├── lib/                # Shared library code
│   └── book-table/         # Book table components
├── tests/                  # Playwright E2E specs
├── vite.config.ts          # Vite config (port 3000, /api proxy, build)
└── vercel.json             # Vercel deployment config
```

## Environment variables

All `VITE_*` variables are embedded in the JavaScript bundle at build time and are
**publicly visible** in the browser. Never store private credentials in them.

| Variable                              | Purpose                                        | Default                  |
| ------------------------------------- | ---------------------------------------------- | ------------------------ |
| `VITE_PROD_API`                       | Override API base path in production            | unset → `/api`           |
| `VITE_CLOUDINARY_URL`                 | Cloudinary base URL for image uploads          | (required for uploads)   |
| `VITE_PUBLIC_EMAILJS_SERVICE_ID`      | EmailJS service ID (contact form)               | (required for contact form) |
| `VITE_PUBLIC_EMAILJS_TEMPLATE_ID`     | EmailJS template ID (contact form)              | (required for contact form) |
| `VITE_PUBLIC_EMAILJS_PUBLIC_KEY`      | EmailJS public key (contact form)               | (required for contact form) |

`VITE_PROD_API` is optional. When unset, the production API path defaults to `/api` and
is rewritten to the Render backend by the Vercel rewrite rule in
[`vercel.json`](vercel.json). Setting it to a full URL stores that URL in the public
bundle — prefer leaving it unset.

The variables `VITE_LOCAL_API` and `VITE_DEV_API` are **not** actively consumed by the
codebase and should not be relied upon.

## Testing

### Unit tests (Vitest)

```bash
npm test              # single run
npm run test:watch    # watch mode
```

- **Framework:** Vitest with jsdom environment
- **Utilities:** Testing Library (React, jest-dom, user-event)
- Tests live in `__tests__` directories under `src/`

### E2E smoke tests (Playwright)

```bash
npx playwright install chromium   # prerequisite (one-time)
npm run test:e2e
```

- **Browsers:** Chromium only
- **API strategy:** All API calls are intercepted at `page.route()` level with
  deterministic fixture JSON — no backend, database, Cloudinary, or external
  services required
- **External services blocked:** Google Analytics, Tag Manager, production Render
  API, Pexels, unpkg, and service worker registrations
- **Isolation:** Fully mocked frontend-only. No network calls leave the browser
  except Vite dev-server asset requests

## Deployment

The client is deployed to Vercel. See [the root README's Deployment
section](../README.md#vercel-frontend) for the complete configuration and the
[`vercel.json`](vercel.json) file for the build and rewrite rules.

| Setting            | Value                          |
| ------------------ | ------------------------------ |
| Root Directory     | `client`                       |
| Build Command      | `npm run build`                 |
| Output Directory   | `build`                        |
| Node.js Version    | 20.x                           |

Merging to `main` triggers an automatic deployment. Frontend-only PRs receive preview
URLs.

The backend runs on Render (`https://kitapkurdu.onrender.com`). API requests are
rewritten by Vercel to the backend — the client does not reference the Render URL
directly in its source code (unless `VITE_PROD_API` is explicitly overridden).

## Troubleshooting

**API requests return 404 or CORS errors.**
The Vite dev server must be running (port 3000) and proxying to the backend (port 5000).
Verify the backend is up at `http://localhost:5000/healthz`. For CORS errors in
production, verify that the Vercel domain is in the explicit origin allowlist in
`backend/app.ts`; `CLIENT_URL` controls redirects/OAuth/email links and does not
dynamically update CORS.

**Production builds hitting the wrong API URL.**
Check the Vercel dashboard environment variables. If `VITE_PROD_API` is set, it
overrides the canonical `/api` path. Remove it or set it back to `/api`. Remember that
all `VITE_*` values are public — do not store the Render URL as a secret.

**Playwright tests fail — browser not found.**
Run `npx playwright install chromium` in the `client/` directory to install the
required browser binary.

**Biome formatting (from repo root).**
Biome operates from the repository root via the root `package.json` scripts. Run
`npm run check:write` and `npm run check` from the root directory — not from
`client/`.
