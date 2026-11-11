import { SHADOW, type Rect } from "@/templates/constants";

/** Far enough that the shape itself always lands off-canvas. */
const OFFSCREEN = 100_000;

/**
 * Layer 2: the standard drop shadow for a content rectangle, drawn on its own.
 * The content is drawn afterwards without a shadow, exactly covering the rect.
 * docs/template-spec.md#drop-shadow
 *
 * Only the shadow is painted: the shape is drawn far off-canvas and the shadow is offset
 * back by the same amount. The offset is applied in device space, so this works inside a
 * rotated/scaled transform (scattered polaroids) with the shadow still falling straight down.
 *
 * @param scale  Multiplies blur and offset (scattered polaroids are scaled down).
 */
export function drawShadow(ctx: CanvasRenderingContext2D, rect: Rect, scale = 1): void {
  ctx.save();
  // Pre-translate in device space so the shape lands off-canvas regardless of the CTM.
  const m = ctx.getTransform();
  ctx.setTransform(new DOMMatrix().translate(-OFFSCREEN, 0).multiply(m));
  ctx.shadowColor = rgba(SHADOW.color, SHADOW.opacity);
  ctx.shadowBlur = SHADOW.blur * scale;
  ctx.shadowOffsetX = OFFSCREEN + SHADOW.offsetX * scale;
  ctx.shadowOffsetY = SHADOW.offsetY * scale;
  ctx.fillStyle = "#000";
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
