# 0008: A softer drop shadow than the reference files

**Date:** 2026-11-10
**Status:** Accepted

## Context

The first build matched the shadow in `InfoPost.ai`: black, opacity 0.75, offset 6 px down, canvas `shadowBlur` 12. Measured against `docs/reference/info.png`, that render was within a few percent of the reference falloff on all four sides. Issue #31 called for the shadow to be confirmed by eye.

## Decision

The owner tuned the shadow with live sliders and chose **opacity 0.60, offset 11 px down, `shadowBlur` 23**: lighter, wider and lower, so objects sit further off the texture. The same shadow still applies to every polaroid, graphic and Info card, and still scales with the polaroid in Multi-Photo.

## Consequences

- The shadow no longer matches the Illustrator reference files; in the comparison view it will read as softer. That is intended.
- The Multi-Photo bounds tests use the shadow constants, so the presets are still checked to keep each shadow on the canvas.
- The temporary tuning panel (`?tune`) is removed.
