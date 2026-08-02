# Custom-domain migration runbook

Target: `https://apps.laochristian.org/`

Browser storage is isolated by origin. GitHub Pages data under `https://rcampbellbassac.github.io` cannot automatically appear under `https://apps.laochristian.org` after a DNS change. The app therefore includes `/migrate`, an origin-checked, browser-to-browser transfer that never uploads notes or decks to a server, plus JSON export/import as a fallback.

## Hosting prerequisite

Automatic transfer requires the old and new origins to be reachable at the same time. Assigning a custom domain directly to this same GitHub Pages site normally redirects its `github.io` URL, so it does **not** provide a long overlap window. Before DNS cutover, deploy the same verified artifact to the target platform at `apps.laochristian.org` while leaving this GitHub Pages project URL intact. A separate Pages deployment repository is also suitable. If dual-origin hosting is not available, use the JSON export/import fallback and announce the export step before cutover.

## Stage 1 — preflight

1. Keep GitHub Pages on the project URL and verify the production workflow, deep links, offline libraries, presentation pop-outs, and JSON backup restore.
2. Deploy the verified build to the target platform and add `apps.laochristian.org` to the S3 content bucket CORS allowlist.
3. Lower the DNS TTL at least one day before cutover.
4. Set the GitHub Pages environment variable `VITE_MIGRATION_TARGET_URL=https://apps.laochristian.org/` and deploy while the project URL is still canonical. This activates the transfer button on the old origin.
5. Confirm `/migrate` opens only the configured target and that the target accepts messages only from `https://rcampbellbassac.github.io`.

## Stage 2 — custom-domain cutover

1. Add the DNS CNAME: `apps` → `rcampbellbassac.github.io`.
2. Configure `apps.laochristian.org` on the selected target platform. If a separate GitHub Pages deployment hosts the target, wait for its DNS check and enforce HTTPS.
3. Keep this repository’s project-site deployment unchanged throughout the overlap window.
4. Confirm the deployment builds with `VITE_BASE_PATH=/` and that the generated manifest, service worker, icons, root route, and deep links use the root base.
5. Test `/migrate?receive=1` from the old-origin transfer window before publicizing the new URL.

## Stage 3 — transition window

Keep the old-origin deployment and migration path available for at least 30 days. Announce the new address and ask existing users to use **Move app data** before clearing the old site’s browser storage. The transfer merges by record/deck identity and newest update timestamp; it does not overwrite newer target-origin data. Only retire or redirect the old Pages project after that window.

## Rollback

If validation fails, remove the Pages custom domain and restore the previous CNAME state. Do not delete either origin’s browser data. Users can continue on the project URL while the issue is corrected, and JSON backups remain portable in either direction.

## Final checks

- HTTPS and certificate valid
- root and representative deep links load directly
- service worker installs and updates
- online/offline indicator behaves correctly
- all six libraries download and reopen offline
- bookmarks, highlights, notes, history, decks, and preferences transfer
- presenter/audience windows synchronize
- S3 content CORS and integrity checks pass
- GitHub Actions, Dependabot, and `npm audit` are clean
