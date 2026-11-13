/**
 * Shared styles for the editor UI: every label, hint, input and button around the preview
 * uses these, so the look is set in one place.
 */

/** Each input group sits on its own white card, on the app's off-white background. */
export const CARD_FRAME = "rounded-lg border border-[#bdbdbd] bg-white";
export const CARD_PADDING = "p-3";
export const CARD = `${CARD_FRAME} ${CARD_PADDING}`;

/** The mark after a required field's label. */
export const REQUIRED_MARK = " *";

const UI_TEXT = "text-[13px] leading-[1.3]";

/** A card's heading: TEXTURE, PHOTOS. */
export const LABEL =
  "font-display text-lg leading-none font-bold tracking-wide text-[#191919] uppercase";
/** Text only a screen reader gets. */
export const SR_ONLY = "sr-only";

/** The label above a text input. */
export const FIELD_LABEL = `${UI_TEXT} text-[#555]`;
/** Helper text under a control. */
/** Muted text that still passes WCAG AA on white (4.95:1). */
export const MUTED = "text-[#707070]";
export const HINT = `${UI_TEXT} ${MUTED}`;
export const ERROR_TEXT = `${UI_TEXT} text-red-700`;

/** A checkbox with its label. */
export const CHECK_ROW = `flex items-center gap-2 ${UI_TEXT} text-[#191919]`;
export const CHECKBOX = "size-[13px] accent-[#2f78ff]";

/** The border is 3.36:1 on white, so the field's edge is visible (WCAG 1.4.11). */
export const INPUT = `w-full rounded-lg border border-[#8c8c8c] bg-white px-[9px] py-[7px] ${UI_TEXT} text-[#191919] placeholder:text-[#707070] focus:border-[#2f78ff] focus:outline-none`;

/** A small button inside a card: Upload photo…, Reset. Its corners match the secondary button. */
export const COMPACT_BUTTON = `wipe rounded-tl-[2px] rounded-tr-lg rounded-br-[2px] rounded-bl-lg border border-[#8c8c8c] bg-white px-2 py-1 [--wipe:#6b6b6b] ${UI_TEXT} text-[#191919] enabled:hover:border-[#6b6b6b] enabled:hover:text-white disabled:opacity-40`;

/** One choice in a row of choices: the photo count, the wordmark colour. */
export const segment = (selected: boolean) =>
  `rounded-sm px-2 py-1 ${UI_TEXT} ${
    selected
      ? "border border-[#191919] bg-[#191919] text-white"
      : "wipe border border-[#8c8c8c] bg-white text-[#555] [--wipe:#6b6b6b] hover:border-[#6b6b6b] hover:text-white"
  }`;

/** The frame around a thumbnail that can be chosen: templates, textures. */
export const thumbFrame = (selected: boolean) =>
  `rounded-sm outline-2 -outline-offset-2 ${
    selected ? "outline-[#191919]" : "outline-transparent hover:outline-[#d1d1d1]"
  }`;

const ACTION = `wipe min-w-[116px] px-3 py-2 text-center ${UI_TEXT}`;
/** Download PNG, under the preview's right corner: its two outer corners are nearly square. Light blue with a blue border and dark blue text (6.06:1); disabled is a pale cool grey with a faint grey-blue border and greyed text (about 2.8:1; WCAG exempts disabled controls). The active state passes AA. */
export const PRIMARY_BUTTON = `${ACTION} rounded-tl-lg rounded-tr-[2px] rounded-br-lg rounded-bl-[2px] border border-[#2f78ff] bg-[#d6e4ff] text-[#174ab8] [--wipe:#1f5fe0] enabled:hover:border-[#1f5fe0] enabled:hover:text-white disabled:border-[#d3d9e3] disabled:bg-[#f1f3f6] disabled:text-[#8b93a1]`;
/** Add to batch and Cancel, under the left corner: the mirror image of the primary. */
export const SECONDARY_BUTTON = `${ACTION} rounded-tl-[2px] rounded-tr-lg rounded-br-[2px] rounded-bl-lg border border-[#8c8c8c] bg-white text-[#191919] [--wipe:#6b6b6b] enabled:hover:border-[#6b6b6b] enabled:hover:text-white disabled:border-[#eee] disabled:text-[#aaa]`;

/**
 * A tooltip above a disabled button, shown while its `group relative` wrapper is hovered.
 * Add `left-0` or `right-0` to line it up with the button.
 */
export const TOOLTIP =
  "pointer-events-none absolute bottom-full z-10 mb-1.5 hidden rounded-sm bg-[#191919] px-2 py-1 text-xs whitespace-nowrap text-white group-hover:block";
