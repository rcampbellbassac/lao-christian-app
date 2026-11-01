# Content editor — design plan

Robert's ask: a content creator/editor for the LaoChristian apps platform,
designed around the JSON data files as they actually are.

Written 2026-08-25 after reading `scripts/normalize-content.mjs`,
`scripts/publish-content.sh`, `docs/content-publishing-aws-setup.md`,
`src/assets/data/index.json`, and a live pull of `LaoSongs.json`.

## The data, as it is

`index.json` is a catalogue of collections, each pointing at a JSON file on S3
(`laoadventist-media.s3.us-west-2.amazonaws.com`). There are six collections
(LaoBible, LaoSongs, LaoBibleStudies, LaoEGW, LaoHealthBooks, LaoStories), but
only three `content_type` values: `bible`, `songs` and `studies`. LaoEGW,
LaoHealthBooks and LaoStories are all `studies`, and the app's
`_normalizeContentType` (`src/stores/content.ts`) maps anything else to
`default`. The editor must therefore key on **collection identity** (the file)
for which collection it is editing, and on **`content_type`** only for the
schema and renderer; the two are not the same thing.

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
3. **Display order is array order today, not `sortorder`.** `FileView.vue`
   iterates `contentSet.unit` and `BookView.vue` iterates `book.contents` as
   they come, and the content store does not sort on load. `sortorder` is
   carried along (gaps are normal) but nothing reads it. A reorder must
   therefore **move the array elements and rewrite `sortorder` to match**, so
   the file is right whichever one a future reader trusts.

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
   → GitHub Actions workflow (changed, see below)
   → OIDC → S3 (bucket versioning already on)
```

**The current workflow cannot carry an edit as it is.**
`.github/workflows/publish-content.yml` starts with "Fetch source content from
S3", which overwrites all six files in `src/assets/data` with the S3 copies,
and normalization then regenerates `src/assets/data-normalized` from those. An
editor export committed to either directory would be replaced by the old S3
content before it is published. Before Phase 5, the workflow must change so
that the repo is the source for any collection changed in the commit, for
example by fetching from S3 only the files the commit does not touch, or by
making the repo the source of truth for all six and dropping the fetch.

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

**Phase 2 — safe edits.** Title/name and order only (reordering moves the
array elements and rewrites `sortorder`, see observation 3). No HTML editing.
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
