---
name: code-review
description: Review pull requests for lao-christian-app (Vue 3 + Vite PWA serving Lao Christian content). Use when reviewing a PR or diff in this repository.
---

# Code review: lao-christian-app

This is a static, offline-capable Vue 3 + Vite PWA for Lao-speaking Christian communities. It has no backend, database or user accounts. Flag real problems; skip style nits that ESLint and Prettier already enforce.

## Check these first

1. **Lao text and bilingual strings**
   - Every key added to `src/locales/static.en.json` must also exist in `static.lo.json`, and the reverse.
   - Lao strings must be real Lao script. Flag machine-looking or garbled text, and any use of invisible spacing characters (zero-width spaces) as a typography trick; the project deliberately avoids them.
   - The Sabbath spelling used across the project is ວັນຊະບາໂຕ. Flag inconsistent variants in new text.
   - UI text goes through `useStaticText` / `useUiText`, not hard-coded strings in components.
   - Text needs to look right at 320 px width, in dark mode, and with the larger Lao reading fonts.

2. **Security and privacy**
   - The CSP in `nginx/default.conf` and `caddy/Caddyfile` is strict (`script-src 'self'`, no frames). Flag inline scripts, new third-party script origins, `v-html` with untrusted content, or CSP loosening.
   - Remote content (`src/assets/data/index.json`, content JSON) is untrusted. It must be sanitized before rendering and links must keep `rel="noopener noreferrer"`.
   - No secrets, tokens, `.env` files or personal data in the diff, fixtures or logs.
   - New third-party links and images must be intentional, attributed to their owner where appropriate, and external-site wording must not imply LaoChristian.org owns them. Prefer bundling images locally over hotlinking.
   - Do not add analytics, trackers or cookies without updating the cookie and privacy policy views.

3. **PWA and offline behaviour**
   - Changes to routes, `vite.config.ts`, the service worker or caching must keep deep links working (`public/404.html`, `restore-route.js`) and the configured base path (`VITE_BASE_PATH`).
   - Cached content must not be lost when the network is unavailable.
   - Flag large new assets; the precache is already several MB.

4. **Correctness and types**
   - Vue/Pinia state: no lost reactivity, no stale state across content changes.
   - Strict TypeScript: no new `any` or non-null assertions without a reason.
   - Accessibility: meaningful `alt` text, labels on controls, visible keyboard focus, enough colour contrast in light and dark themes.

5. **Tests and CI**
   - New logic needs a Vitest unit test next to the code (`*.spec.ts`). UI flows that change should have Playwright coverage where practical.
   - CI requires `verify`, `analyze-javascript-typescript` and CodeQL to pass. Commands: `npm run lint`, `npm run test:unit`, `npm run build`.

6. **Dependencies and workflows**
   - Dependency PRs: check the lockfile changes only what `package.json` says, and be cautious with major and 0.x bumps.
   - Changes under `.github/workflows/` need extra scrutiny: pinned or trusted actions, least-privilege `permissions`, no secrets exposed to forks.

## How to report

- Lead with correctness and security issues; group minor items at the end.
- Quote the file and line, say what breaks and for whom, and suggest a fix.
- If Lao wording is changed or added, ask for a review by a Lao reader instead of approving the translation yourself.
- If nothing is wrong, say so plainly.
