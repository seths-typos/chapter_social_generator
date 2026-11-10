import { drawPolaroid, placementFromRect } from "@/render/polaroid";
import type { RenderAssets, RendererFor } from "@/render/types";
import type { DraftFor } from "@/store/draft";
import { FIXTURE_IMAGE, LIBRARY_TEXTURE, POLAROID, SINGLE_PHOTO_SLOTS } from "./constants";
import type { PhotoTarget, TemplateDefinition } from "./definition";
import { slotDraftOps } from "./slots";

/** Photo: one polaroid on a texture. docs/template-spec.md#photo-photo */
export const renderPhoto: RendererFor<"photo" | "cover"> = (ctx, draft, assets) => {
  const slot = draft.slots[0];
  drawPolaroid(ctx, {
    placement: placementFromRect(POLAROID.rect),
    photo: slot?.photoId ? assets.photos.get(slot.photoId) : undefined,
    view: slot ?? { panX: 0, panY: 0, zoom: 1 },
    frame: assets.frame,
    grain: draft.grain ? assets.grain : undefined,
  });
  return [];
};

/** The one polaroid's photo, once it has one. Shared by Cover. */
export function singlePhotoTargets(
  draft: DraftFor<"photo" | "cover">,
  assets: RenderAssets,
): PhotoTarget[] {
  const id = draft.slots[0]?.photoId;
  const photo = id ? assets.photos.get(id) : undefined;
  return photo ? [{ slot: 0, placement: placementFromRect(POLAROID.rect), photo }] : [];
}

export const photoTemplate: TemplateDefinition<"photo"> = {
  id: "photo",
  label: "Photo",
  defaultTexture: LIBRARY_TEXTURE.woodDarkWorn,
  ...slotDraftOps("photo", SINGLE_PHOTO_SLOTS),
  render: renderPhoto,
  photoTargets: singlePhotoTargets,
  // The photo in `polaroidArtboard 3@2x.png`. The image itself is only loaded in dev builds.
  fixture: (draft) => photoTemplate.acceptPhoto(draft, FIXTURE_IMAGE.photo),
};
