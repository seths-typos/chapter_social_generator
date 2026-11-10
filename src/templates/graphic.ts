import { drawShadow } from "@/render/shadow";
import type { RendererFor } from "@/render/types";
import { GRAPHIC } from "./constants";

/**
 * Graphic: an uploaded event graphic on a texture. docs/template-spec.md#graphic-graphic
 * Placeholder until #11: shadow and a blank rect at the reference slot.
 */
export const renderGraphic: RendererFor<"graphic"> = (ctx) => {
  const r = GRAPHIC.referenceRect;
  drawShadow(ctx, r);
  ctx.fillStyle = GRAPHIC.placeholderColor;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  return [];
};
