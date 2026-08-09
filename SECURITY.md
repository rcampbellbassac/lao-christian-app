# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability affecting this repository or
[apps.laochristian.org](https://apps.laochristian.org/), please report it
privately rather than opening a public issue:

- **Email:** [laohollandsda@gmail.com](mailto:laohollandsda@gmail.com)
- Or use GitHub's [private vulnerability reporting](https://github.com/rcampbellbassac/lao-christian-app/security/advisories/new) for this repository.

Please include as much detail as you can, including steps to reproduce,
potential impact, and affected files, features, or URLs, so we can investigate
quickly. Please avoid including sensitive personal information or ministry
data beyond what is necessary to explain the issue.

We'll acknowledge reports as soon as possible, keep you updated as we work on
a fix, and coordinate disclosure after a fix is available.

## Scope

This repository builds and deploys a static Vue progressive web app. It has no
backend service, database, or user authentication. Relevant reports are most
likely to concern:

- the build, content-publishing, or deployment pipelines in `.github/workflows/`;
- third-party dependencies in `package.json` and `package-lock.json`;
- PWA caching, client-side storage, or content rendering and sanitization; or
- content and assets actually served by the app.

Dependency updates are tracked automatically through
[Dependabot](https://github.com/rcampbellbassac/lao-christian-app/security/dependabot).

## Supported Version

Security fixes are applied to the current production version on the default
branch. Older deployments and locally modified copies are not maintained.
