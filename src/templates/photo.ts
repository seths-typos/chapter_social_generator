import { drawShadow } from "@/render/shadow";
import type { RendererFor } from "@/render/types";
import { POLAROID } from "./constants";

/**
 * Photo: one polaroid on a texture. docs/template-spec.md#photo-photo
 * Placeholder until #16 (polaroid primitive) and #17: draws the shadow and a blank
 * polaroid-shaped card so the layout and shadow can be checked now.
 */
export const renderPhoto: RendererFor<"photo" | "cover"> = (ctx) => {
  const r = POLAROID.rect;
  drawShadow(ctx, r);
  ctx.fillStyle = POLAROID.paperColor;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  return [];
};
