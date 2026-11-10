/**
 * Canvases the renderer draws on outside the visible preview (PNG export, thumbnails).
 *
 * Canvas text takes its smoothing from the canvas element's CSS, and only when the
 * element is in the document. A detached canvas ignores it and draws text visibly heavier
 * on macOS (about 5% more ink on headlines, over 20% on body text), which would make an
 * exported PNG differ from the preview. So every render canvas is attached, hidden, and
 * carries the same smoothing as the preview. docs/technical-requirements.md#rendering-engine
 */

import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/templates/constants";

/** Tailwind's `antialiased` utility: the smoothing every render canvas must use. */
export const RENDER_CANVAS_CLASS = "antialiased";

/**
 * A hidden 1080×1440 canvas attached to the document, with the preview's text smoothing.
 * The caller removes it when done (`canvas.remove()`), unless it is kept for reuse.
 */
export function createRenderCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  canvas.style.display = "none";
  canvas.style.setProperty("-webkit-font-smoothing", "antialiased");
  canvas.style.setProperty("-moz-osx-font-smoothing", "grayscale");
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);
  return canvas;
}
