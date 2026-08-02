# LaoChristian.org DNS cutover runbook

## Final hosting topology

| Host | GitHub Pages repository | Purpose |
| --- | --- | --- |
| `www.laochristian.org` | `rcampbellbassac/laochristian.org` | Canonical public website |
| `laochristian.org` | `rcampbellbassac/laochristian.org` | Apex; GitHub redirects to `www` |
| `apps.laochristian.org` | `rcampbellbassac/lao-christian-app` | Bible and resource application |
| `web.laochristian.org` | none | Retired; delete the Google Sites CNAME |

Both repositories deploy with GitHub Actions. The main site has the Pages
custom domain `www.laochristian.org`; this repository has
`apps.laochristian.org`. GitHub domain verification for `laochristian.org`
must complete before the routing cutover.

## Before changing routing

1. Export the complete GoDaddy DNS zone from the domain-owner account. A PAT
   created by a delegate account does not expose the owner's zone through the
   API.
2. Preserve all MX, TXT, CAA, SRV, NS, DKIM, SPF, and DMARC records unchanged.
3. Confirm both Pages workflows succeed after their custom domains are saved.
4. Confirm the app's custom-domain build uses `VITE_BASE_PATH=/`, with root
   manifest, service-worker, icons, SPA 404 shim, and deep links.
5. Confirm the `laoadventist-media` S3 CORS policy permits
   `https://apps.laochristian.org` and `https://laochristian.org`.
6. Encourage existing project-URL users to export a JSON backup. Browser data
   is origin-bound and the same Pages repository redirects its project URL
   after a custom domain is assigned, so a long dual-origin transfer window is
   not available.

## Intended routing records

Replace only the website-routing records. Use a short TTL such as 600 seconds
during the transition.

### Apex (`@`)

Create the four GitHub Pages IPv4 records:

- `185.199.108.153`
- `185.199.109.153`
- `185.199.110.153`
- `185.199.111.153`

The previous apex value is `159.89.208.44`; retain it in the private rollback
snapshot, then remove it from the active record set at cutover.

### Subdomains

- `CNAME www` → `rcampbellbassac.github.io`
- `CNAME apps` → `rcampbellbassac.github.io`
- delete `CNAME web` → `ghs.googlehosted.com`

Do not include a repository path in either CNAME value.

## Cutover validation

1. Read the affected records back from GoDaddy immediately after the API call.
2. Query GoDaddy's authoritative nameservers and at least two public resolvers.
3. Confirm GitHub reports the correct custom domain on each repository.
4. Wait for both TLS certificates, then enable **Enforce HTTPS** on both Pages
   sites.
5. Verify:
   - apex redirects to `https://www.laochristian.org/`;
   - the main site's representative pages and language routes load;
   - the app root and direct `/content/...` routes load;
   - manifest and service worker return 200 with the correct content types;
   - all six S3 libraries load and reopen offline;
   - PNG, ZIP, and PPTX exports work;
   - presenter and audience windows synchronize;
   - browser console has no CORS, mixed-content, manifest, or asset 404 errors;
   - `web.laochristian.org` no longer resolves after caches expire.

## Rollback

If either site fails before DNS caches settle:

1. Restore the exact routing records from the pre-cutover zone snapshot,
   including apex `A` → `159.89.208.44`, `www` → `laochristian.org`,
   `apps` → `laochristian.org`, and `web` → `ghs.googlehosted.com`.
2. Read the restored records back through the API and authoritative DNS.
3. Remove the affected Pages custom domain only if the project URL also needs
   to become directly reachable again.
4. Never replace the entire zone from a hand-written list; preserve unrelated
   mail and verification records.

After a successful observation window, restore normal TTLs, remove the
temporary PAT file, and revoke the migration PAT in GoDaddy.
