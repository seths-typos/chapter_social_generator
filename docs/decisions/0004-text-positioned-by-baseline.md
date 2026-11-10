# 0004: Template text is positioned by baseline

- **Date:** 2026-11-10
- **Status:** Accepted

## Context

The Template Spec gave each Info text item a "glyph box top" (title 335, date 1087,
location 1165), and the plan was to place text by measuring its ink with
`actualBoundingBoxAscent`.

Building the Info template showed two problems. Those y values are not ink tops: they
are the tops of Illustrator's text boxes, which sit a font-ascender (1.054 em) above the
baseline, well above any ink. And an ink-top position moves with what is typed: "moon"
would sit higher than "Moon".

Reading `InfoPost.ai` directly gives the baseline of every text item.

## Decision

- Text is drawn by **baseline**. The spec lists each item's baseline, measured from the
  design file. `drawLines` in `src/render/text.ts` takes a `baseline`.
- When text shrinks to fit, its baseline does not move.
- Corrections to the Info spec found by the same measurement:
  - The badge circle is 204 across with the 9 px stroke centred on its edge (213 outside),
    not 205 including the stroke.
  - "presents" carries a 0.75 px black outline in the design, to match the wordmark's weight.
  - The body block is centred on y 818 with baselines moved down 0.233 em, which
    reproduces the reference's baselines.
- The wordmark is drawn from vector paths (`Path2D`) rather than a pre-rasterised image.

## Consequences

- With the reference inputs, every text item lands within 1 px of `docs/reference/info.png`.
  Two deliberate differences remain: the title and the badge text are truly centred (the
  reference has a stray leading space in the title and an off-centre badge label).
- A line's vertical position is the same whatever is typed.
- Future templates should take baselines from their design files the same way.

## Docs affected

- `docs/template-spec.md`: Info layers table (baselines, badge, lockup, body centring).
- `docs/technical-requirements.md`: `text.ts` and new `wordmark.ts` rows; `Editor` and
  `fixture` in the template definition table.
