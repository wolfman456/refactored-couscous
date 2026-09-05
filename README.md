# refactored-couscous

Vite + React gallery frontend for Six Kids Crafts, a small woodworking
business.

- Public gallery that reads from the backend API (`/api/gallery`).
- Contact page (email / Etsy / social links).
- Admin route stubbed for the future content manager.

## Development

```sh
npm install
npm run dev        # http://localhost:5173, proxies /api + /uploads to :8080
npm run build
npm run lint
```

The backend lives in the `scaling-octo-eureka` repo (Spring Boot, runs on
localhost:8080).