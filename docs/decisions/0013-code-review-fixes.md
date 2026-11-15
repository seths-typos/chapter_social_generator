# 0013: Code review fixes

- **Date:** 2026-11-15
- **Status:** Accepted

## Context

After the UI pass ([0011](0011-ui-ux-pass.md)) and the responsive layout ([0012](0012-responsive-layout.md)) landed quickly, the whole project was reviewed by two independent reviewers. Their findings were checked against the code and in a browser before anything was changed. Neither found a security problem. This record covers the fixes that changed how the tool behaves or how it is built.

## Decision

- **Source order is the reading order.** The editor's markup is always template picker, preview, form, texture, actions. Phones and tablets show it in that order; the three-zone layout places the columns by grid position. This replaces the 0012 approach of reordering with flex `order`, which sent keyboard and screen-reader users to the texture and the action buttons before the form.
- **A bottom sheet is a dialog.** Below 1024px an open drawer takes focus, makes the editor behind it inert, closes on Escape and returns focus to its tab.
- **A text card needs its text.** With the card on, the line of text is required and the heading is optional, so a heading on its own no longer passes.
- **Asset loads can fail visibly.** A texture or the polaroid frame that fails to download is reported with "Try again" in the editor and the batch, instead of "Still loading" for the rest of the session. Textures used by batch posts are loaded even when no post is open.
- **Textures are released when unused.** A decoded library texture (about 25 MB) is kept while the draft, a batch post or a template default uses it, plus the two most recently used; the rest are freed and reloaded on demand. Uploaded textures are downscaled to a 2880px long edge. Textures are still decoded at full size, so exported pixels are unchanged.
- **Thumbnails redraw only for their own assets.** A batch thumbnail is keyed on the texture, photos and frame its post draws with; template thumbnails on the frame and wordmark.
- **The status line names what happened.** The store records the last action that returned the editor to the picker (added, saved, cancelled, removed).
- **Dropping files opens the Photo Library**, since progress and failures are shown there.
- **One implementation of each slot edit.** The forms' edits live in `src/templates/slotEdits.ts` with tests. The store's unused copies (`setGrain`, `setPhotoCount`, `setSlotPhoto`, `resetSlotView`, `setGraphic`, `setInfo`, `clearDraft`) and `withPhotoCount` are removed; forms edit through `editDraft`.

## Consequences

- A template file must not import `registry.ts` (it would be a circular import, since the registry imports every template). Shared slot logic goes in `slotEdits.ts`.
- Going back to a texture tried more than two choices ago shows the stand-in for a moment while it reloads.
- The photo count is no longer clamped in the store; the form only offers 1–4.
- Behaviour that needs a DOM (focus, the dialog, scroll padding, wrapping) has no automated test, in line with testing pure logic only. It was checked in Chromium and WebKit by script.
- **Left as they were:**
  - focus is not moved after Add to batch, Cancel or Remove take the focused control away;
  - layout sizes in `AppShell.tsx` restate the heights of the picker and the action row;
  - workflow actions are pinned by major tag rather than commit;
  - the drag-only and hover-only gaps recorded in 0011 and 0012.

## Docs affected

- `docs/prd.md`: text card requirement, accessibility note
- `docs/template-spec.md`: text card overflow, texture loading
- `docs/technical-requirements.md`: template definition fields, batch thumbnails, waiting for assets, testing
- `docs/decisions/0012-responsive-layout.md`: pointer to this record
