# Frontend design — refactored-couscous

> Source of truth: `drawdesign.md` at the workspace root. This file holds the
> approved frontend portion.

## Goal

Vite + React + TypeScript gallery frontend for Six Kids Crafts, a small
woodworking business. Fast to stand up, shows off finished work. **No
ecommerce.**

## Pages

- `/` — Gallery grid with category tabs ("All" + each category). Reads
  `GET /api/gallery` and `GET /api/categories`; renders cards (image, title,
  description, category). Empty/error/loading states handled.
- `/gallery/:id` — Gallery piece detail. Reads `GET /api/gallery/{id}` and shows
  every attached photo (thumbnail `src`/`srcSet` per photo, videos as `<video>`),
  the title, category and description, plus a back link. Empty/error/not-found
  states handled.
- `/articles` — Article list. Reads `GET /api/articles`; each card links to the
  article's detail route.
- `/articles/:slug` — Article detail. Reads `GET /api/articles/{slug}`, renders
  the Markdown body, an optional featured image, and a thumbnail strip when
  several photos are attached.
- `/contact` — Contact page driven by `GET /api/settings` (email, Etsy shop,
  Instagram, Facebook). Shows a "coming soon" note until settings load.
- `/admin` — Admin console: login (Basic auth against the seeded admin
  credentials; fallbacks `bloodwolf`/`NeedToChange`), then tabs for Photo
  library, Gallery pieces, Articles, Gallery tabs, and Site settings, plus an
  Account tab to change the admin password. Logout ends the session.

## Data flow

- Browser talks only to the frontend.
- Dev: Vite server proxies `/api` and `/uploads` to the backend at
  `http://localhost:8080`, so relative URLs like `/api/gallery` and
  `/uploads/<name>` work unchanged.
- Production: the static build is served next to the API (hosting undecided),
  same relative URLs.
- Admin auth: the client stores `base64(user:pass)` in `sessionStorage` under
  `adminAuth`; `/api/admin/**` calls add `Authorization: Basic …`. A 401 clears
  the stored credential and throws `UnauthorizedError`.

## Structure

```
src/
  api/client.ts        apiFetch(), credentials, ApiError/UnauthorizedError
  api/gallery.ts       public + admin gallery calls (multipart for image upload)
  api/media.ts         photo-library calls (upload/delete/list)
  api/categories.ts    category calls
  api/articles.ts      article list/detail + admin save/delete
  api/settings.ts      public/admin settings calls
  components/
    SiteSettingsContext.tsx  loads GET /api/settings; settings drive shell
    Markdown.tsx             tiny renderer (bold/italic/links/h1-h3/lists)
    PhotoPicker.tsx          shared photo-library grid (upload, remove, select)
  pages/
    GalleryPage.tsx
    GalleryItemPage.tsx   piece detail: all photos, video, back link
    ArticlesPage.tsx      exports formatDate()
    ArticlePage.tsx
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

## Reusable UI

- `PhotoPicker` is the single implementation of the photo library: it shows
  the grid, uploads new files (auto-selecting the created asset), removes
  assets from the library, and reports the selection count. Gallery, article
  and site panels all reuse it with `selectedIds` + `onToggle`.

## Round 2

Implemented in PR #3: admin console (login + 5 panels) and the settings-driven
public shell (title/background), category tabs, article list/detail, and the
settings-driven contact page. Scope: no ecommerce; admin remains env-credential
Basic auth (no user accounts table yet).

## Round 3 (ideas)

- Video embeds once the backend exposes them.
- Multi-image ordering UI for a piece.
- App-user accounts replacing Basic auth.