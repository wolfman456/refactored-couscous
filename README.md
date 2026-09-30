# refactored-couscous

Vite + React + TypeScript frontend for **Six Kids Crafts**, a small woodworking
business. No ecommerce.

- **Public site** — landing page (settings-driven background + nav), gallery grid
  with category tabs, piece detail with click-to-zoom lightbox, article journal,
  and a contact page driven by site settings.
- **Admin console** at `/admin` — full content management against the API: photo
  library, gallery pieces, articles, gallery tabs, site settings and password
  management.
- **SEO** — per-page meta tags, `robots.txt`, `sitemap.xml`.

The API lives in a separate repo: [`scaling-octo-eureka`](../scaling-octo-eureka)
(Spring Boot, runs on `localhost:8080`).

- **Design, page map and conventions:** [`docs/DESIGN.md`](docs/DESIGN.md)

## Tech

React 19 · TypeScript · Vite 8 · `react-router-dom` v7 · oxlint · Vitest +
Testing Library (jsdom).

## Development

```sh
npm install
npm run dev        # http://localhost:5173, proxies /api + /uploads to :8080
```

The Vite dev server proxies `/api` and `/uploads` to the backend on
`localhost:8080`, so the app only ever uses relative URLs. **Start the backend
first**, or every page will show its error state.

The admin console logs in with the credential seeded by the backend on its first
boot — see its README for `ADMIN_USER` / `ADMIN_PASSWORD`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 5173 |
| `npm run build` | Type-check (`tsc -b`) then production build to `dist/` |
| `npm run lint` | oxlint |
| `npm test` | Vitest, single run |
| `npm run test:coverage` | Vitest with a v8 coverage report and the ≥90% gate |
| `npm run preview` | Serve the built `dist/` locally |

## Deployment

`Dockerfile` builds the bundle and serves it from nginx, reverse-proxying `/api`
and `/uploads` to the backend service. Configured at container start via
`PORT`, `API_HOST` and `API_PORT`; details and caching rationale are in
[`docs/DESIGN.md`](docs/DESIGN.md).

## CI

GitHub Actions (`.github/workflows/node-ci.yml`) runs `npm ci`, `npm run lint`,
`npm run test:coverage` and `npm run build` on every push to `master` and
`develop` and on every PR into either — so the 90% coverage floor is enforced on
every build.
