# 0012: Responsive layout, from phones up

- **Date:** 2026-11-12
- **Status:** Accepted

## Context

The interface had a fixed minimum width of 1200px ([0011](0011-ui-ux-pass.md)), and phones were out of scope. Anything narrower scrolled sideways, including a tablet or a small laptop window, and opening a drawer on a mid-sized laptop squeezed the preview.

## Decision

The interface works from 360px wide upwards. This replaces the 1200px minimum and the "phones stay out of scope" consequence in 0011; everything else there stands.

- **The editor lays itself out by its own width**, not the window's (container queries on `main`), so a side drawer taking room changes the arrangement instead of crushing the preview:
  - **One column** (under 30rem): the preview pinned at the top at about two-fifths of the editor's height, the form then the texture scrolling under it, Add to batch and Download PNG pinned at the bottom.
  - **Two zones** (30rem to 60rem): the preview and its actions pinned on the left, the form then the texture scrolling on the right.
  - **Three zones** (60rem and up): texture, preview and actions, form. Nothing scrolls.
- **Drawers follow the window.** At 1024px (`lg`) and up they sit at the left and right edges and push the editor. Below that, their handles are two tabs along the bottom and each opens as a sheet rising from the bottom over a dimmed editor.
- **Touch** (`pointer: coarse`): buttons, checkbox rows and text fields are at least 44px tall, and field text is at least 16px so iOS Safari doesn't zoom on focus.
- **Foundations:** the page height uses `dvh` with a `vh` fallback, the viewport is `viewport-fit=cover` with safe-area padding, and the texture and Photo Library grids fit as many columns as the width allows.

## Consequences

- One DOM serves all three arrangements (flex `order`, `display: contents` and grid placement), so the preview canvas and the form are never mounted twice.
- On a laptop between roughly 1100px and 1400px wide, opening a drawer switches the editor from three zones to two.
- A phone held sideways is usable but cramped: the preview is about 110px wide.
- "Nothing is saved. Download before closing." is hidden below 640px to make room for the title.
- **Known gaps on touch:** swapping photo positions is drag-only and doesn't work (issue #38); the tooltip on a disabled action needs a pointer; pinch-to-zoom on the preview isn't supported (the zoom slider is).
- Checked at emulated sizes in Chromium and WebKit, not on a physical phone.

## Docs affected

- `docs/prd.md`: non-goals, app flow layout, Generator UI notes, open question 4
- `docs/technical-requirements.md`: browser support (mobile), out of scope
