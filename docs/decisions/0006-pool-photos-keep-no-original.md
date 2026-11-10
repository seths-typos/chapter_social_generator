# 0006: Pool photos keep a bitmap and a thumbnail, not the original file

- **Date:** 2026-11-10
- **Status:** Accepted

## Context

The data model gave `PoolPhoto` a `file: Blob` holding the original upload, while the
technical requirements said the original is released after downscaling. A session can
hold 50 photos, and a phone photo is 3–10 MB on top of its decoded bitmap. Nothing reads
the original after import: the renderer, the export and the scan crop all use the
downscaled bitmap (3000 px long edge).

## Decision

- `PoolPhoto.file` is replaced by `thumbnail: Blob` (240 px wide, WebP) and `name`
  (the original file name, for labels).
- The full image exists only as the downscaled `ImageBitmap` in the asset cache, keyed
  by the photo's id. `width` and `height` describe that bitmap.

## Consequences

- Lower memory per photo; the original file can be garbage-collected after import.
- A photo can't be re-decoded at a higher resolution later. If a feature ever needs more
  than 3000 px, raise `MAX_LONG_EDGE` in `src/image/limits.ts`.
