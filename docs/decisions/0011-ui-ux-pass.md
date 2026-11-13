# 0011: One-screen editor with drawers, and a shared UI style

- **Date:** 2026-11-12
- **Status:** Accepted

## Context

The first interface was three equal panels: the photo pool, the editor and the batch. Making a post is the main job; filling the pool and reviewing the batch are secondary, but they took as much room as the editor, and the editor's form scrolled. The interface was also wireframe-level, with no shared styles for buttons, fields or labels, and no accessibility pass.

## Decision

- **Layout.** The editor is one screen that never scrolls at laptop sizes: the template picker on top, then the texture picker, the preview and the template's form side by side. Add to batch and Download PNG sit under the preview's bottom corners. The preview is as large as the space allows.
- **Drawers.** The photo pool (now "Photo Library") and the batch are drawers at the left and right edges. Both start closed, each shows its count on its handle, and only one is open at a time so the preview keeps its room. The Photo Library is tinted pink (`#f8eef7`) and the batch green (`#e7f4e5`).
- **Name.** The interface is titled "Chapter Post Generator" (browser tab: "Ch. Post Generator"). The project and repository keep the name Chapter Social Generator.
- **Templates.** The picker order is Photo(s), Graphic, Info, Cover.
- **Form.** Each input is its own white card. Options are phrased so that unchecked is the default: "Add film filter", "Remove polaroid frames" (frames are on by default), "Add text card". Required fields are marked with an asterisk instead of a "still needed" line, and a disabled action button explains itself in a tooltip.
- **Shared styles.** Colours, labels, fields and buttons come from `src/templates/formStyles.ts`. Card headings are Druk, 18px, uppercase. The primary button is light blue with a blue border; the secondary is white with a grey border; the two mirror each other's corner radii. On hover a darker shade of the border colour wipes in from the left over 150ms and the text turns white; on press the button scales to 90%.
- **Motion.** A card animates its height when its contents grow or shrink, and the polaroids in the preview tween to a new layout, both over 300ms with `cubic-bezier(0.843, 0.166, 0, 1.079)` (`LAYOUT_MOTION` in `constants.ts`). The tween is preview-only: `renderPost` takes an optional layout that the export never passes.
- **Accessibility.** The target is WCAG 2.2 AA: text at 4.5:1 or better, field and button borders at 3:1, a visible 2px focus ring, `aria-required` on required inputs, a screen-reader description of why an action is disabled, and no motion when the system asks for reduced motion.

## Consequences

- The page has a minimum width of 1200px and does not reflow below it. Phones stay out of scope.
- **Known gap:** swapping photo positions and repositioning a photo in the preview are drag-only, so they have no keyboard equivalent yet. Disabled buttons are deliberately below 4.5:1 (WCAG exempts them).
- `TemplateDefinition` gains an optional `layout(draft)` so the preview can tween between placements; only Photo implements it.
- New UI should use the constants in `formStyles.ts` rather than one-off classes.

## Docs affected

- `docs/prd.md`: app flow layout, option names, template order, Generator UI notes
- `docs/technical-requirements.md`: repository layout, preview layout tween, mobile note
