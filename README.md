# LaoChristian.org App

LaoChristian.org is a Vue 3 + Vite SPA/PWA that presents Lao Christian materials from remote JSON files and caches content locally for offline-friendly reading.

## Core architecture

- Frontend: Vue 3, Vue Router, Pinia
- Bundler: Vite
- PWA: vite-plugin-pwa + manifest in `public/site.webmanifest`
- Local content cache: localforage (IndexedDB)
- Runtime content catalog: `src/assets/data/index.json`

## Requirements

- Node.js 22 LTS (or Node.js 24)
- npm 10+
- Docker + Docker Compose (for containerized workflows)

## Local development

Install dependencies with a reproducible lockfile install:

```sh
npm ci
```

Run Vite dev server:

```sh
npm run dev
```

Build production assets:

```sh
npm run build
```

Other useful commands:

```sh
npm run test:unit
npm run lint
npm run format
```

## Docker workflows

This repo uses a multi-stage Dockerfile:

- `dev` stage: Vite development server
- `build` stage: production asset compilation
- `prod` stage: nginx static serving with SPA fallback

### Production-like container (default Compose service)

```sh
docker compose up -d --build
```

The app is served on port `5173` (mapped to nginx port `80` in the container).

### Containerized dev server with HMR

```sh
docker compose --profile dev up -d --build app-dev
```

The dev service is exposed on port `5174` (mapped to Vite port `5173` inside the container), so it can run alongside the production-like service.

Or use helper scripts:

```sh
npm run docker:up
npm run docker:dev
```

## Content update tracking

The app now tracks cache metadata per content set and refreshes remote JSON automatically when cached material is stale or when catalog update metadata changes.

- Refresh window: 6 hours
- Conditional request support: ETag / Last-Modified when available
- Offline fallback: cached material is used if refresh fails

This keeps users updated with new materials while preserving resilience in low-connectivity environments.

## Presentation mode and slide export

Each chapter now includes a **Presentation mode** entry. Presentation mode provides:

- Full-screen slide-style rendering
- Keyboard navigation (`Left` / `Right`, `PageUp` / `PageDown`, `Space`)
- Quick PNG export for the current slide
- Batch PNG export for all generated slides

Route format:

```text
/present/:fileid/:bookid/:chapterid
```

## Notes for maintainers

- Keep Lao text and source JSON schema stable unless intentionally versioned.
- Prefer `npm ci` in CI/CD and Docker builds.
- Avoid global npm package installs inside Docker images.
- For future feature work (advanced slide theming, templates, PPTX export, diff feeds), add dedicated utilities/modules instead of overloading view components.

## Verification checklist

```sh
npm run lint
npm run test:unit -- --run
npm run build
docker compose build app app-dev
docker compose up -d app
curl -I http://127.0.0.1:5173/
docker compose --profile dev up -d app-dev
curl -I http://127.0.0.1:5174/
```
