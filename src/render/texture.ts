import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/templates/constants";
import { coverFit } from "./fit";
import type { TextureAsset } from "./types";

/** Fallback when a texture isn't in the assets map (e.g. a removed upload). */
const MISSING_TEXTURE_COLOR = "#BFBFBF";

/**
 * Layer 1: the background texture, cover-fit and centred on the whole canvas.
 * A colour asset (the pre-library placeholder) just fills the canvas.
 * docs/template-spec.md#background-texture
 */
export function drawTexture(
  ctx: CanvasRenderingContext2D,
  texture: TextureAsset | undefined,
): void {
  const canvas = { x: 0, y: 0, w: CANVAS_WIDTH, h: CANVAS_HEIGHT };
  if (!texture || texture.kind === "color") {
    ctx.fillStyle = texture?.color ?? MISSING_TEXTURE_COLOR;
    ctx.fillRect(0, 0, canvas.w, canvas.h);
    return;
  }
  const r = coverFit({ w: texture.width, h: texture.height }, canvas);
  ctx.drawImage(texture.image, r.x, r.y, r.w, r.h);
}
