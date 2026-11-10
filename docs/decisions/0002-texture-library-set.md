# 0002: Texture library set and new template defaults

- **Date:** 2026-11-09
- **Status:** Accepted

## Context

The Template Spec planned 10 textures supplied later in the build, with solid-colour
placeholders named `wood-parquet` and `tile-white` as the template defaults. The owner
supplied 16 Unsplash photos before the texture picker was built, and none of them is a
parquet floor or a white tile wall.

## Decision

- The library ships with the 16 supplied textures, processed to 2160×2880 JPEG (centre
  3:4 crop, sRGB, quality ≤85, under 1.5 MB) with 240×320 thumbnails.
- Template defaults change to the closest matches: **`wood-dark-worn`** for Cover, Photo
  and Multi-Photo; **`plaster-white`** for Graphic and Info.
- Colour placeholders are dropped from the manifest. The renderer keeps support for a
  `{ kind: "color" }` texture asset as a fallback and for tests.
- Attribution for each photo is kept in `public/textures/ATTRIBUTION.md` (Unsplash
  licence doesn't require it, but it's cheap to keep).

## Consequences

- #32 (6.3 Real texture library) is largely done early; it remains open for swapping in
  textures shot at real venues, which the brief prefers.
- The reference renders still use the designer's tile and parquet, so the comparison view
  will show a different background than the generator; compare the content, not the
  texture.

## Docs affected

- `docs/template-spec.md`: texture library table (count, defaults, placeholder row removed).
- `docs/implementation-plan.md`: 6.3 note.
