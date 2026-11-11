/**
 * The glow and fade parts of the film look (grain is in `grain.ts`). The values in use
 * start as `FILM_LOOK`; the temporary tuning panel (`?tune`) can change them live.
 * docs/template-spec.md#film-look
 */

import { FILM_LOOK } from "@/templates/constants";

export interface PhotoEffects {
  /** Soft glow: blur radius of the glow layer in px, for a full-size polaroid. */
  glowRadius: number;
  /** Soft glow: how strongly the blurred copy is screened over the photo, 0–1. */
  glowStrength: number;
  /** Faded film: how far blacks are lifted toward grey, 0–1 (0.2 = a clear fade). */
  fadeLift: number;
  /** Faded film: how much the whites are pulled down, 0–1. */
  fadeHighlights: number;
  /** Faded film: how much colour is taken out, 0–1 (1 = black and white). */
  fadeDesaturate: number;
}

let effects: PhotoEffects = { ...FILM_LOOK };
const listeners = new Set<() => void>();

export const getPhotoEffects = (): PhotoEffects => effects;

export function subscribePhotoEffects(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setPhotoEffects(next: Partial<PhotoEffects>): void {
  effects = { ...effects, ...next };
  for (const l of listeners) l();
}

const grey = (level: number): string => {
  const v = Math.round(255 * Math.min(1, Math.max(0, level)));
  return `rgb(${v}, ${v}, ${v})`;
};

/**
 * Soft glow: the photo drawn again, blurred, and screened over itself, so bright areas
 * bloom. `draw` must draw the photo exactly as it was first drawn. Needs canvas filters
 * (Chrome, Firefox); where they don't exist the glow is skipped. `scale` is the polaroid's.
 */
export function drawGlow(
  ctx: CanvasRenderingContext2D,
  effects: PhotoEffects,
  scale: number,
  draw: () => void,
): void {
  if (effects.glowStrength <= 0 || effects.glowRadius <= 0 || !("filter" in ctx)) return;
  ctx.save();
  // The blur is in canvas px, so it is scaled to keep the same look on a smaller polaroid.
  ctx.filter = `blur(${effects.glowRadius * scale}px)`;
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = Math.min(1, effects.glowStrength);
  draw();
  ctx.restore();
}

/**
 * Faded film over whatever the current clip allows: blacks lifted (screen with a dark
 * grey), whites pulled down (multiply with a light grey), colour muted.
 */
export function drawFade(
  ctx: CanvasRenderingContext2D,
  effects: PhotoEffects,
  width: number,
  height: number,
): void {
  const fill = (operation: GlobalCompositeOperation, color: string, alpha = 1) => {
    ctx.globalCompositeOperation = operation;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
  };
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (effects.fadeDesaturate > 0)
    fill("saturation", grey(0.5), Math.min(1, effects.fadeDesaturate));
  if (effects.fadeHighlights > 0) fill("multiply", grey(1 - effects.fadeHighlights));
  if (effects.fadeLift > 0) fill("screen", grey(effects.fadeLift));
  ctx.restore();
}
