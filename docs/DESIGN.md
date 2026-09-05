# Frontend design — refactored-couscous

> Source of truth: `drawdesign.md` at the workspace root. This file holds the
> approved frontend portion.

## Goal

Vite + React + TypeScript gallery frontend for Six Kids Crafts, a small
woodworking business. Fast to stand up, shows of finished work. **No
ecommerce.**

## Pages

- `/` — Gallery grid. Reads `GET /api/gallery` and renders cards (image,
  title, category, description). Empty/error/loading states handled.
- `/contact` — Contact page. Email, Etsy shop, and social links (placeholders
  to be filled with real channels).
- `/admin` — Stub route; the content manager (upload + edit pieces) will live
  here in round 2.

## Data flow

- Browser talks only to the frontend.
- Dev: Vite server proxies `/api` and `/uploads` to the backend at
  `http://localhost:8080`, so relative URLs like `/api/gallery` and
  `/uploads/<name>` work unchanged.
- Production: the static build is served next to the API (hosting undecided),
  same relative URLs.

## Structure

```
src/
  api/gallery.ts       types + fetchGallery() -> GalleryItem[]
  pages/GalleryPage.tsx
  pages/ContactPage.tsx
  pages/AdminPage.tsx  (stub)
  App.tsx              nav + routes
  main.tsx             BrowserRouter + root render
```

## Conventions

- React 19 + TypeScript, `react-router-dom` v7, `npm`, oxlint.
- Build/lint: `npm run build` (tsc -b && vite build), `npm run lint` (oxlint).
- Layout/CSS lives in `src/index.css` (single stylesheet).

## Round 2

- Admin login + content manager (upload images, add/edit pieces, ordering,
  publish toggle).
- Article page and video embeds once the backend exposes them.