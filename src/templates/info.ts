import { drawShadow } from "@/render/shadow";
import type { RendererFor } from "@/render/types";
import { INFO_CARD } from "./constants";

/**
 * Info: event details on a card. docs/template-spec.md#info-info
 * The card and its shadow are final; badge and text land in #10.
 */
export const renderInfo: RendererFor<"info"> = (ctx) => {
  const r = INFO_CARD.rect;
  drawShadow(ctx, r);
  ctx.fillStyle = INFO_CARD.fill;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  return [];
};
