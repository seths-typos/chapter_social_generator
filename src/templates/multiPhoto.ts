import { drawPolaroid, type PolaroidPlacement } from "@/render/polaroid";
import type { RenderAssets, RendererFor } from "@/render/types";
import type { DraftFor } from "@/store/draft";
import {
  FIXTURE_IMAGE,
  LIBRARY_TEXTURE,
  MULTI_PHOTO_LAYOUT,
  MULTI_PHOTO_MAX,
  MULTI_PHOTO_MIN,
  MULTI_PHOTO_SLOTS,
  type MultiPhotoCount,
} from "./constants";
import type { PhotoTarget, TemplateDefinition } from "./definition";
import { MultiPhotoEditor } from "./MultiPhotoEditor";
import { slotDraftOps } from "./slots";

/** The nearest allowed photo count. */
export const multiPhotoCount = (n: number): MultiPhotoCount =>
  Math.min(MULTI_PHOTO_MAX, Math.max(MULTI_PHOTO_MIN, Math.round(n))) as MultiPhotoCount;

/** Where each polaroid sits for a photo count, slot 1 (the bottom one) first. */
export function multiPhotoPlacements(count: number): PolaroidPlacement[] {
  const layout = MULTI_PHOTO_LAYOUT[multiPhotoCount(count)];
  return layout.slots.map((slot) => ({ ...slot, scale: layout.scale }));
}

/**
 * Multi-Photo: 2–4 scattered polaroids, slightly rotated and overlapping.
 * docs/template-spec.md#multi-photo-multi-photo
 */
const renderMultiPhoto: RendererFor<"multi-photo"> = (ctx, draft, assets) => {
  multiPhotoPlacements(draft.slots.length).forEach((placement, i) => {
    const slot = draft.slots[i];
    if (!slot) return;
    drawPolaroid(ctx, {
      placement,
      photo: slot.photoId ? assets.photos.get(slot.photoId) : undefined,
      view: slot,
      frame: assets.frame,
      grain: draft.grain ? assets.grain : undefined,
      effects: draft.grain ? assets.effects : undefined,
    });
  });
  return [];
};

function photoTargets(draft: DraftFor<"multi-photo">, assets: RenderAssets): PhotoTarget[] {
  return multiPhotoPlacements(draft.slots.length).flatMap((placement, slot) => {
    const id = draft.slots[slot]?.photoId;
    const photo = id ? assets.photos.get(id) : undefined;
    return photo ? [{ slot, placement, photo }] : [];
  });
}

export const multiPhotoTemplate: TemplateDefinition<"multi-photo"> = {
  id: "multi-photo",
  label: "Multi-Photo",
  defaultTexture: LIBRARY_TEXTURE.woodDarkWorn,
  ...slotDraftOps("multi-photo", MULTI_PHOTO_SLOTS),
  render: renderMultiPhoto,
  photoTargets,
  slotPlacements: (draft) => multiPhotoPlacements(draft.slots.length),
  Editor: MultiPhotoEditor,
  // No reference design exists; the two fixture photos just show the layout (dev builds only).
  fixture: (draft) =>
    [FIXTURE_IMAGE.cover, FIXTURE_IMAGE.photo].reduce(
      (d, id) => multiPhotoTemplate.acceptPhoto(d, id),
      draft,
    ),
};
