import { drawShadow } from "@/render/shadow";
import type { RendererFor } from "@/render/types";
import { FIXTURE_IMAGE, GRAPHIC, LIBRARY_TEXTURE, type Rect } from "./constants";
import type { TemplateDefinition } from "./definition";
import { GraphicEditor } from "./GraphicEditor";

/**
 * Where a graphic of the given pixel size sits: 847 wide at its own aspect ratio, or
 * 1240 tall if that would be taller, centred on the reference slot's centre.
 */
export function graphicRect(size: { width: number; height: number }): Rect {
  const aspect = size.width / size.height;
  let w: number = GRAPHIC.width;
  let h = w / aspect;
  if (h > GRAPHIC.maxHeight) {
    h = GRAPHIC.maxHeight;
    w = h * aspect;
  }
  return { x: GRAPHIC.centerX - w / 2, y: GRAPHIC.centerY - h / 2, w, h };
}

/** Graphic: an uploaded event graphic on a texture. docs/template-spec.md#graphic-graphic */
const renderGraphic: RendererFor<"graphic"> = (ctx, draft, assets) => {
  const image = draft.graphicId ? assets.photos.get(draft.graphicId) : undefined;
  if (!image) {
    // Nothing chosen yet (or still decoding): a blank card in the reference slot.
    const r = GRAPHIC.referenceRect;
    drawShadow(ctx, r);
    ctx.fillStyle = GRAPHIC.placeholderColor;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    return [];
  }
  const r = graphicRect(image);
  drawShadow(ctx, r);
  ctx.drawImage(image, r.x, r.y, r.w, r.h);
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
  Editor: GraphicEditor,
  // The graphic placed in GraphicPost.ai. The image itself is only loaded in dev builds.
  fixture: (draft) => ({ ...draft, graphicId: FIXTURE_IMAGE.graphic }),
};
