# Security dependency notes

## Resolved: PPTXGenJS and `image-size`

On 2026-08-09, Dependabot reported two high-severity infinite-loop advisories
in `image-size`, installed transitively by `pptxgenjs@4.0.1`. Every published
`image-size` release was affected, so there was no safe version to override.

The app removed PptxGenJS and now writes its image-only PowerPoint packages
directly as standards-based OOXML using JSZip. This matches the existing export
model—one already-rendered PNG per slide—without installing or invoking a
general-purpose image parser. `pptxgenjs` and `image-size` are absent from the
dependency tree, and `npm audit` reports zero vulnerabilities.
