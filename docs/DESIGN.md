# Frontend design — refactored-couscous

> **This file is the source of truth for the frontend.** The workspace-root
> `drawdesign.md` is a cross-repo index and deliberately holds no detail here —
> if you need the page map, structure or conventions, they are in this file.
> The API contract it consumes lives in the backend repo's
> [`docs/DESIGN.md`](../scaling-octo-eureka/docs/DESIGN.md).

## Goal

Vite + React + TypeScript frontend for Six Kids Crafts, a small woodworking
business. Fast to stand up, shows off finished work. **No ecommerce.**

## Pages

- `/` — Landing page. Renders `null`: the settings-driven background photo and
  the header nav tabs come from the shell, so the landing page deliberately
  shows no content of its own. Gallery content appears when the Gallery tab is
  chosen.
- `/gallery` — Gallery grid with category tabs ("All" + each category). Reads
  `GET /api/gallery` and `GET /api/categories`; renders cards (image, title,
  description, category) with `srcSet` thumbnails. Empty/error/loading states
  handled.
- `/gallery/:id` — Gallery piece detail. Reads `GET /api/gallery/{id}` and shows
  every attached photo (thumbnail `src`/`srcSet` per photo, videos as `<video>`),
  the title, category and description, plus a back link. Clicking a photo opens
  the **lightbox**. Empty/error/not-found states handled.
- `/articles` — Article list. Reads `GET /api/articles`; each card links to the
  article's detail route.
- `/articles/:slug` — Article detail. Reads `GET /api/articles/{slug}`, renders
  the Markdown body, an optional featured image, and a thumbnail strip when
  several photos are attached.
- `/contact` — Contact page driven by `GET /api/settings` (email, Etsy shop,
  Instagram, Facebook). Shows a "coming soon" note until settings load.
- `/admin` — Admin console: login (Basic auth against the seeded admin
  credentials; fallbacks `bloodwolf`/`NeedToChange`), then tabs for Photo
  library, Gallery pieces, Articles, Gallery tabs and Site settings, plus an
  Account tab to change the admin password. Logout ends the session.
- `*` — redirects to `/gallery`.

## Data flow

- Browser talks only to the frontend.
- Dev: Vite server proxies `/api` and `/uploads` to the backend at
  `http://localhost:8080`, so relative URLs like `/api/gallery` and
  `/uploads/<name>` work unchanged.
- Production: the static build is served by nginx, which reverse-proxies `/api`
  and `/uploads` to the API service — same relative URLs, no rebuild needed
  when a backend URL changes.
- Admin auth: the client stores `base64(user:pass)` in `sessionStorage` under
  `adminAuth`; `/api/admin/**` calls add `Authorization: Basic …`. A 401 clears
  the stored credential, throws `UnauthorizedError` **and** dispatches
  `UNAUTHORIZED_EVENT` (`sixkids:unauthorized`) so an already-mounted console
  returns to the login screen instead of failing silently panel by panel.

## Structure

```
src/
  api/client.ts        apiFetch(), credentials, ApiError/UnauthorizedError
  api/gallery.ts       public + admin gallery calls (multipart for image upload)
  api/media.ts         photo-library calls (upload/delete/list)
  api/categories.ts    category calls
  api/articles.ts      article list/detail + admin save/delete
  api/settings.ts      public/admin settings calls
  api/auth.ts          changePassword()
  api/ai.ts            describeImage(), draftArticle() — optional AI helpers
  components/
    SiteSettingsContext.tsx  loads GET /api/settings; settings drive shell
    Markdown.tsx             tiny renderer (bold/italic/links/h1-h3/lists)
    markdownUtils.ts         parser behind Markdown (URL scheme allow-list)
    PhotoPicker.tsx          shared photo-library grid (upload, remove, select)
    Lightbox.tsx             full-size image viewer: keys, focus, scroll lock
  lib/
    media.ts             isVideoUrl(), imageSrcSet()
    seo.ts               useSeo(), metaDescription(), plainText()
  pages/
    HomePage.tsx         renders null; SEO title from settings
    GalleryPage.tsx
    GalleryItemPage.tsx   piece detail: all photos, video, lightbox, back link
    ArticlesPage.tsx
    ArticlePage.tsx
    articleUtils.ts      formatDate()
    ContactPage.tsx
    AdminPage.tsx         login gate + panel tabs + logout
  admin/
    AdminLogin.tsx
    PhotosPanel.tsx
    GalleryPanel.tsx      multipart: item JSON + optional cover image upload
    ArticlesPanel.tsx     auto slug until manually edited, cover select
    TabsPanel.tsx
    SitePanel.tsx         title, background photo, contact links
    PasswordPanel.tsx     current/new/confirm password change
  App.tsx                 Shell (nav + settings title/background) + routes
  main.tsx                BrowserRouter + root render
```

## Conventions

- React 19 + TypeScript, `react-router-dom` v7, `npm`, oxlint.
- Build/lint/test: `npm run build` (tsc -b && vite build), `npm run lint`,
  `npm run test:coverage`. TypeScript flags unused locals/params and requires
  explicit `import type`; constructor parameter properties are disallowed
  (`erasableSyntaxOnly`).
- Layout/CSS lives in `src/index.css` (single stylesheet).
- Tests: Vitest + `jsdom` + Testing Library; `testing-library jest-dom`
  matchers; global `fetch` stubbed via `vi.stubGlobal`. Helpers in
  `src/test/testUtils.ts` (`mockFetch`, `jsonResponse`, `noContent`, samples,
  `rowText` — a `span`-only text matcher used to avoid container-row false
  matches). Coverage gate ≥ 90% on statements/branches/functions/lines.
  20 test files; async assertions that touch `document.title` must wait for it
  (`waitFor`) rather than asserting synchronously.

## SEO & meta

- `index.html` holds sensible static defaults (title, description, canonical,
  Open Graph/Twitter tags, theme-color) so non-JS crawlers and link unfurlers get
  something useful.
- `src/lib/seo.ts` exports `useSeo({ title, description, image, type, noindex })`
  plus `metaDescription()` and `plainText()` helpers. Each public page calls
  `useSeo` to set a unique `<title>`, description, canonical URL and
  `og:`/`twitter:` tags; `/admin` is `noindex, nofollow`.
- Social images are made absolute; a custom image gets
  `twitter:card=summary_large_image`, otherwise the default
  `/apple-touch-icon.png` + `summary` is used.
- `public/robots.txt` allows the site, disallows `/admin` and points at
  `public/sitemap.xml`.
- Note: the site is a client-rendered SPA, so per-page tags are applied in the
  browser. The static `sitemap.xml` currently lists only the fixed routes —
  gallery pieces and articles are added to it as the content grows.

## Reusable UI

- `PhotoPicker` is the single implementation of the photo library: it shows
  the grid, uploads new files (auto-selecting the created asset), removes
  assets from the library, and reports the selection count. Gallery, article
  and site panels all reuse it with `selectedIds` + `onToggle`.
- `Lightbox` is used by `GalleryItemPage` only. It opens on the clicked photo,
  closes on `Escape` or the close button, steps with `ArrowLeft`/`ArrowRight`
  (wrapping at both ends), locks `document.body` scroll while open and moves
  focus to the close button. It renders nothing for a negative `initialIndex`.

## AI helpers (optional)

`api/ai.ts` wraps two admin-only, stateless backend endpoints:

| Panel | Call | Behaviour |
|---|---|---|
| `GalleryPanel` | `describeImage(file)` | Generates a description for a picked photo and drops it into the description field |
| `ArticlesPanel` | `draftArticle({ topic, mediaIds })` | Fills title, Markdown body and a slug derived from the generated title |

The buttons are always rendered. When the backend has no `OPENAI_API_KEY`
configured it answers **503**, and the panel surfaces the failure in its normal
form-error area rather than failing silently — the rest of the form keeps
working, so the feature degrades to "the admin writes it themselves".

## Deployment

`Dockerfile` is a two-stage build (`node:24-alpine` → `nginx:alpine`) that
serves the built bundle and reverse-proxies `/api` and `/uploads` to the backend
Railway service. `nginx.conf.template` is templated at container start with:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `80` | nginx listen port (Railway assigns this) |
| `API_HOST` | `127.0.0.1` | Backend hostname |
| `API_PORT` | `8080` | Backend port |

The upstream is resolved **per request** against the Railway container DNS
address in `resolver [fd12::10]:53` rather than resolved once at startup, so a
backend redeploy that changes its address is picked up without rebuilding this
service.

Caching: `/assets/*.{css,js}` is `public, max-age=31536000, immutable`
(fingerprinted filenames), `index.html` is `no-cache` so a new deploy is picked
up immediately, `client_max_body_size` is 25m to match the backend's multipart
cap, and `try_files … /index.html` makes client-side routes survive a hard
refresh.

## Shipped features

- **Public site** — landing page (background + tabs), gallery grid with category
  tabs, piece detail with lightbox, article list and detail, contact page.
- **Admin console** — login plus six panels: photo library, gallery pieces,
  articles, gallery tabs, site settings, account/password. Saving a new gallery
  piece navigates to its detail page.
- **Content operations** — shared photo library with in-use protection, image
  downscaling and 480px grid thumbnails via `srcSet`, auto-uniquified article
  slugs, draft/publish state.
- **SEO** — per-page meta, robots, sitemap, favicon.
- **Deploy** — nginx image with API proxying, paired with the API-only backend
  service.

Not built: video embeds (the backend's `media_asset.asset_type` anticipates them
but exposes nothing yet), a drag-to-reorder UI for a piece's photos, and
app-user accounts (admin is a single seeded Basic-auth credential). See the
backend design doc for the API side of those.
