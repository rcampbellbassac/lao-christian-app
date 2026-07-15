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

## Environment configuration

Copy `.env.example` to `.env` when you need custom settings.

- `VITE_BASE_PATH`: Vite base path for static hosting.
	- Project-site GitHub Pages: `/REPOSITORY_NAME/`
	- Custom domain or root hosting: `/`
- `VITE_CONTENT_BASE_URL`: optional content origin for relative URLs in `src/assets/data/index.json`.
	- Leave empty to use URL values exactly as stored in `index.json`.

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

The app is served on port `5173` (mapped to container port `8080`).

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

## GitHub Pages deployment

This repo includes a Pages workflow at `.github/workflows/deploy-pages.yml`.

### First deploy now (no custom domain)

Use this flow first so we can verify everything on the default GitHub Pages URL.

1. Push current branch changes to your default branch (`main` or `master`).
2. In GitHub: `Settings -> Pages`, set **Source** to **GitHub Actions**.
3. In GitHub: `Actions`, run or confirm the workflow **Deploy GitHub Pages**.
4. Wait for the `deploy` job to finish, then open the URL shown in:
	- GitHub: `Settings -> Pages`
	- or workflow output `page_url`
5. Validate these URLs in browser:
	- app root (`https://<user>.github.io/<repo>/`)
	- a deep link (for example `/content/...`)
	- presentation route `/present/:fileid/:bookid/:chapterid`
6. If you see stale UI, clear site data once and hard refresh.

After this is stable, we can switch to custom domain configuration.

### Deployment model

- Initial target: **project-site** mode (`https://<user>.github.io/<repo>/`)
- Future target: **custom domain** mode (`https://apps.laochristian.org/`)

The workflow uses `actions/configure-pages` and sets `VITE_BASE_PATH` automatically from the Pages base path output.

### Local simulation of Pages builds

```sh
# Project-site style build (adjust for your repository name)
VITE_BASE_PATH=/lao-christian-app/ npm run build-only

# Root/custom-domain style build
VITE_BASE_PATH=/ npm run build-only
```

### SPA deep links on Pages

History mode is preserved. The app uses:

- `public/404.html` redirect shim
- `index.html` restore script

This keeps deep links such as `/content/1` and `/present/:fileid/:bookid/:chapterid` working on GitHub Pages.

### Custom domain setup (`apps.laochristian.org`)

1. In GitHub Pages settings, set custom domain to `apps.laochristian.org` and enable HTTPS after DNS resolves.
2. Create a DNS `CNAME` record:
	- Host/name: `apps`
	- Target/value: `<your-github-username>.github.io`
3. If DNS is not ready yet, continue using the default `github.io` URL.

### S3 content hosting with Pages

Keep S3 as canonical production content source.

Required CORS guidance:

- Include your Pages origin(s) and local dev origins in S3 CORS.
- Keep `GET`/`HEAD` methods.
- Use `AllowedHeaders: ["*"]` for conditional request headers.
- Expose `ETag` and `Last-Modified` for refresh/invalidation logic.

Example S3 bucket CORS (replace origins as needed):

```json
[
	{
		"AllowedHeaders": ["*"],
		"AllowedMethods": ["GET", "HEAD"],
		"AllowedOrigins": [
			"https://rcampbellbassac.github.io",
			"http://localhost:5173",
			"http://127.0.0.1:5173",
			"http://localhost:5174",
			"http://127.0.0.1:5174"
		],
		"ExposeHeaders": ["ETag", "Last-Modified"],
		"MaxAgeSeconds": 3000
	}
]
```

Notes:

- For GitHub Pages project-site URLs, allow the origin `https://rcampbellbassac.github.io` (no repo path in origin).
- Do not add `OPTIONS` to S3 CORS methods; S3 validates CORS rules and rejects unsupported entries.
- If you later move to a custom domain, add that domain origin as an additional `AllowedOrigins` entry.

Apply with AWS CLI:

```sh
aws s3api put-bucket-cors \
	--bucket laoadventist-media \
	--cors-configuration file://cors.json
```

Quick verification:

```sh
curl -I \
	-H "Origin: https://rcampbellbassac.github.io" \
	"https://laoadventist-media.s3.us-west-2.amazonaws.com/path/to/content.json"
```

You should see `Access-Control-Allow-Origin` in the response for allowed origins.

## Content update tracking

The app now tracks cache metadata per content set and refreshes remote JSON automatically when cached material is stale or when catalog update metadata changes.

- Refresh window: 6 hours
- Conditional request support: ETag / Last-Modified when available
- Offline fallback: cached material is used if refresh fails

This keeps users updated with new materials while preserving resilience in low-connectivity environments.

## Managed S3 content publishing

This repository now includes a content release pipeline for publishing material JSON files to S3 with gzip variants and version metadata.

### Runtime update metadata

The app can load a remote index (manifest) at runtime and use it to detect newer content versions.

Add environment variables when needed:

- `VITE_REMOTE_INDEX_URL`: remote index URL (for example `https://laoadventist-media.s3.us-west-2.amazonaws.com/index.json`)
- `VITE_PREFER_GZIP`: when `true`, use `url_gzip` when present in the index

The store now tracks per-set update state and can prompt users before downloading newer content.

### Build a content release artifact

1. Normalize source data:

```sh
npm run normalize:data
```

2. Build release files (JSON + JSON.GZ + index with version/checksum metadata):

```sh
npm run content:release
```

Default output directory: `dist/content-release`

Optional release build environment variables:

- `CONTENT_SOURCE_DIR` (defaults to `src/assets/data-normalized`, falls back to `src/assets/data`)
- `CONTENT_RELEASE_DIR` (defaults to `dist/content-release`)
- `CONTENT_BASE_URL` (defaults to `https://laoadventist-media.s3.us-west-2.amazonaws.com`)
- `CONTENT_RELEASE_VERSION` (defaults to UTC timestamp)
- `CONTENT_PUBLISHED_AT` (defaults to current ISO timestamp)

### Publish release to S3

Use the publish script (local operator path):

```sh
S3_BUCKET=laoadventist-media npm run content:publish
```

Optional publish environment variables:

- `AWS_REGION` (default `us-west-2`)
- `S3_PREFIX` (optional sub-path such as `staging/`)
- `CONTENT_RELEASE_DIR` (if not using `dist/content-release`)

The publish script uploads:

- `*.json` with `Content-Type: application/json`
- `*.json.gz` with `Content-Type: application/json` and `Content-Encoding: gzip`
- `index.json` with short cache policy for quicker update detection

### Retention and rollback

This workflow assumes S3 bucket versioning is enabled so overwrites of stable keys keep historical object versions.

Enable bucket versioning (one-time):

```sh
aws s3api put-bucket-versioning \
	--bucket laoadventist-media \
	--versioning-configuration Status=Enabled
```

Rollback can then be performed by restoring a prior object version for the affected key(s).

### GitHub Actions publisher (recommended)

Workflow file: `.github/workflows/publish-content.yml`

Required GitHub environment/repository configuration:

- Secret: `AWS_ROLE_ARN`
- Variable: `CONTENT_S3_BUCKET`
- Optional variables: `AWS_REGION`, `CONTENT_S3_PREFIX`, `CONTENT_BASE_URL`

The workflow uses GitHub OIDC (`aws-actions/configure-aws-credentials`) so long-lived AWS keys are not required in GitHub.

Detailed AWS + GitHub bootstrap guide:

- `docs/content-publishing-aws-setup.md`
- IAM templates: `scripts/aws/trust-policy.github-oidc.json` and `scripts/aws/policy.content-publisher.json`

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

# Optional Pages-targeted checks
VITE_BASE_PATH=/lao-christian-app/ npm run build-only
VITE_BASE_PATH=/ npm run build-only
```
