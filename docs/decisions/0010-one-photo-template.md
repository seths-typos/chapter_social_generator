# 0010: Photo and Multi-Photo are one template

**Date:** 2026-11-11
**Status:** Accepted

## Context

Photo was one polaroid; Multi-Photo was two to four. They shared the slot editor, the film look and the text card, and differed only in the count. The founder had to pick between them up front and switch template when the number of photos changed. Graphic is a related idea (an image without the frame), which raised the question of one template for all three.

## Decision

**Photo holds one to four polaroids**, with the count chosen in the editor, and the `multi-photo` template is removed. One photo uses the full-size polaroid; two to four use the scattered presets. A per-post option to drop the polaroid frame is added separately. **Graphic stays its own template**: it shows finished artwork uncropped at its own proportions, with no pan, zoom or film look, which is a different behaviour from a photo position.

## Consequences

- The picker has four templates: Cover, Photo, Graphic and Info.
- `Post` no longer has a `multi-photo` variant; `photo` holds 1–4 slots.
- Cover still draws its one polaroid through the Photo renderer.
- Folding Graphic in is left open until unframed images are meant to keep their own proportions, which would need new layouts.
