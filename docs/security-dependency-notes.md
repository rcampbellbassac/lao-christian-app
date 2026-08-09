# Security dependency notes

## PPTXGenJS and `image-size`

As of 2026-08-09, `npm audit` reports the two `image-size` infinite-loop
advisories through `pptxgenjs@4.0.1`. The registry currently offers no patched
`image-size` release, and npm's suggested remediation is a breaking downgrade
to `pptxgenjs@1.1.5`.

The app does not accept ICNS, JXL, or HEIF uploads for slide export. PPTX images
come from the app's controlled PNG/WebP/JPEG theme and logo assets, so the
vulnerable parsers are not reachable through the current user interface. Keep
PPTXGenJS current, monitor the upstream dependency, and remove this exception
as soon as a patched chain is available. Do not use `npm audit fix --force` to
downgrade the exporter.
