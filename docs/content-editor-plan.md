# Content editor — design plan

Robert's ask: a content creator/editor for the LaoChristian apps platform,
designed around the JSON data files as they actually are.

Written 2026-08-25 after reading `scripts/normalize-content.mjs`,
`scripts/publish-content.sh`, `docs/content-publishing-aws-setup.md`,
`src/assets/data/index.json`, and a live pull of `LaoSongs.json`.

## The data, as it is

`index.json` is a catalogue of collections, each pointing at a JSON file on S3
(`laoadventist-media.s3.us-west-2.amazonaws.com`) with a `content_type` of
`bible`, `songs`, `studies`, `egw`, `health` or `stories`.

Each collection file is a **three-level tree**, and this shape is what the
editor has to be built around:

```
Collection            id, title, description(HTML), imageurl, enabled,
                      language, lang, sortorder, series, created_at, updated_at
└── unit[]            id, name, content(HTML), books_id, enabled, sortorder
    ├── toc[]         id, name, content, type, units_id, sortorder
    └── contents[]    id, name, content(HTML), sortorder, units_id,
                      pdfurl, audiourl, videourl, audioembed, videoembed
```

Three observations that drive the whole design:

1. **It is a relational export wearing a JSON coat.** `books_id`, `units_id`,
   integer `id`s, and MySQL-style `created_at` strings. IDs are globally unique
   within a file and referenced by children. An editor must preserve them, not
   regenerate them — the apps cache by ID, and reassigning IDs silently breaks
   every offline copy in the field.
2. **`content` is HTML, and it is already dirty.** `normalize-content.mjs`
   exists because the source had inline styles, `<font>` tags, colour
   attributes, stray `&nbsp;`, and span wrappers — the fingerprints of content
   pasted out of Word over a decade. The editor must not add more.
3. **`sortorder` is the display order**, not array position. Reordering means
   rewriting `sortorder`, and gaps in it are normal.

## What the editor should be

**A new route inside this app, not a separate application.**

The Vue 3 + Vite + Pinia + Tailwind stack, the Lao font loading
(Noto Sans Lao, Phetsarath), the `dompurify` dependency, and the existing
localforage offline layer are all things an editor needs and this repo already
has. A standalone editor would duplicate the hardest parts — Lao text rendering
and the content schema — and then drift from them.

Proposed: `/editor` route, excluded from the PWA precache and from the public
nav, built into the same bundle.

## How publishing should work

**Reuse the pipeline that already exists.** Do not add a second write path to
S3.

```
edit in browser
   → export collection JSON
   → commit to the repo (branch + PR)
   → existing GitHub Actions workflow
   → OIDC → S3 (bucket versioning already on)
```

Why this and not direct-to-S3:

- The OIDC role is already scoped and audited; a browser-side credential would
  be a second, weaker path to the same bucket.
- Every change becomes a **reviewable diff**. For scripture and hymn text
  edited by non-developers, that review step is the entire safety mechanism.
- Bucket versioning plus git history gives two independent rollbacks.
- No new secrets anywhere.

The cost is that publishing is not instant. For this content — which changed
twice in ten years — that is the correct trade.

## Build order

**Phase 1 — read-only browser.** Load a collection, render the three-level
tree, view any node's HTML. No editing. This is where the schema assumptions
get tested against all six files, and it is genuinely useful on its own.

**Phase 2 — safe edits.** Title/name and `sortorder` only. No HTML editing.
Export the modified collection, diff it against the original, download.
Small surface, and it proves the round-trip preserves IDs byte-for-byte.

**Phase 3 — content editing.** A constrained rich-text editor emitting only the
tags `normalize-content.mjs` allows: `p, br, em, strong, i, b, sup, sub, span,
u, small, a, h1-h6, blockquote, ul, ol, li, table…`. Run the normalizer's rules
**in the browser before save**, so the editor cannot introduce what the
pipeline would strip.

**Phase 4 — create.** New units and content items, with IDs allocated as
`max(existing id) + 1` per file. Add a `contentEditorVersion` marker to the
file so a bad generation is identifiable later.

**Phase 5 — publish.** GitHub PR creation from the browser via a fine-grained
token, or simply "download the file and commit it" if that stays simpler.

## Things that will bite

- **Lao line breaking.** Lao has no spaces between words. The app already loads
  specific Lao fonts for this reason; any editor textarea must use them, or
  editors will see different line breaks than readers do.
- **`LaoBible.json` is large.** Loading a whole collection into a browser
  editor may need virtualised rendering or per-unit lazy loading. Check its
  size before assuming Phase 1 is trivial.
- **Gzip.** `normalize-content.mjs` calls `parseJsonMaybeGzip`, so at least one
  source file is stored gzipped. The loader must handle both.
- **Concurrent edits.** Two people editing the same collection will produce
  conflicting whole-file exports. Git will catch it as a conflict, which is
  survivable but ugly. Worth a "who is editing what" convention early.
- **Never regenerate IDs.** Repeating for emphasis — this is the one mistake
  that would be invisible in review and break every offline app copy.

## Open questions for Robert

1. **Who edits?** Just him, or Lao-speaking contributors too? That decides
   whether Phase 5 needs GitHub accounts for editors or a simpler
   download-and-hand-over flow.
2. **Which collection first?** `LaoSongs` is the smallest and best understood.
   `LaoBible` is the most used and the least forgiving.
3. **Is there still an upstream database?** The `books_id`/`units_id` shape
   suggests these files were generated from one. If it still exists, editing
   the JSON directly creates a fork.
