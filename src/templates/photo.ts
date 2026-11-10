import { drawPolaroid, placementFromRect } from "@/render/polaroid";
import type { RendererFor } from "@/render/types";
import { FIXTURE_IMAGE, LIBRARY_TEXTURE, POLAROID, SINGLE_PHOTO_SLOTS } from "./constants";
import type { TemplateDefinition } from "./definition";
import { slotDraftOps } from "./slots";

/** Photo: one polaroid on a texture. docs/template-spec.md#photo-photo */
export const renderPhoto: RendererFor<"photo" | "cover"> = (ctx, draft, assets) => {
  const slot = draft.slots[0];
  drawPolaroid(ctx, {
    placement: placementFromRect(POLAROID.rect),
    photo: slot?.photoId ? assets.photos.get(slot.photoId) : undefined,
    view: slot ?? { panX: 0, panY: 0, zoom: 1 },
    frame: assets.frame,
  });
  return [];
};

export const photoTemplate: TemplateDefinition<"photo"> = {
  id: "photo",
  label: "Photo",
  defaultTexture: LIBRARY_TEXTURE.woodDarkWorn,
  ...slotDraftOps("photo", SINGLE_PHOTO_SLOTS),
  render: renderPhoto,
  // The photo in `polaroidArtboard 3@2x.png`. The image itself is only loaded in dev builds.
  fixture: (draft) => photoTemplate.acceptPhoto(draft, FIXTURE_IMAGE.photo),
};
