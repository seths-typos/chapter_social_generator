import { drawShadow } from "@/render/shadow";
import type { RendererFor } from "@/render/types";
import { GRAPHIC, LIBRARY_TEXTURE } from "./constants";
import type { TemplateDefinition } from "./definition";

/**
 * Graphic: an uploaded event graphic on a texture. docs/template-spec.md#graphic-graphic
 * Placeholder until #11: shadow and a blank rect at the reference slot.
 */
const renderGraphic: RendererFor<"graphic"> = (ctx) => {
  const r = GRAPHIC.referenceRect;
  drawShadow(ctx, r);
  ctx.fillStyle = GRAPHIC.placeholderColor;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  return [];
};

export const graphicTemplate: TemplateDefinition<"graphic"> = {
  id: "graphic",
  label: "Graphic",
  defaultTexture: LIBRARY_TEXTURE.plasterWhite,
  newDraft: (base) => ({ ...base, template: "graphic", graphicId: null }),
  missingInputs: (draft) => (draft.graphicId ? [] : ["graphic"]),
  toPost: (draft) =>
    draft.graphicId
      ? { template: "graphic", graphicId: draft.graphicId, texture: draft.texture }
      : null,
  fromPost: (post, base) => ({ ...base, template: "graphic", graphicId: post.graphicId }),
  photoIds: (post) => [post.graphicId],
  clearPhoto: (draft, photoId) =>
    draft.graphicId === photoId ? { ...draft, graphicId: null } : draft,
  render: renderGraphic,
};
