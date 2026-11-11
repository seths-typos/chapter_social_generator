import { drawPolaroid, placementFromRect, type PolaroidPlacement } from "@/render/polaroid";
import type { RenderAssets, RendererFor } from "@/render/types";
import type { DraftFor } from "@/store/draft";
import {
  FIXTURE_IMAGE,
  LIBRARY_TEXTURE,
  MULTI_PHOTO_LAYOUT,
  PHOTO_SLOTS,
  POLAROID,
  type PhotoCount,
} from "./constants";
import type { PhotoTarget, TemplateDefinition } from "./definition";
import { PhotoEditor } from "./PhotoEditor";
import { slotDraftOps } from "./slots";
import { activeTextCard, condense, drawTextCard } from "./textCard";

/** The nearest allowed photo count. */
export const photoCount = (n: number): PhotoCount =>
  Math.min(PHOTO_SLOTS.max, Math.max(PHOTO_SLOTS.min, Math.round(n))) as PhotoCount;

/**
 * Where each polaroid sits for a photo count, slot 1 (the bottom one) first. One photo is
 * the full-size polaroid; two to four are the scattered presets. With the text card on,
 * the whole layout is condensed into the area below it.
 */
export function photoPlacements(count: number, withCard = false): PolaroidPlacement[] {
  const n = photoCount(count);
  if (n === 1) return [condense(placementFromRect(POLAROID.rect), withCard)];
  const layout = MULTI_PHOTO_LAYOUT[n];
  return layout.slots.map((slot) => condense({ ...slot, scale: layout.scale }, withCard));
}

type PhotoLike = DraftFor<"photo" | "cover">;

const placementsFor = (draft: PhotoLike): PolaroidPlacement[] =>
  photoPlacements(draft.slots.length, activeTextCard(draft) !== null);

/**
 * Photo: one polaroid, or two to four scattered ones, on a texture. Cover draws its one
 * polaroid through this too. docs/template-spec.md#photo-photo
 */
export const renderPhoto: RendererFor<"photo" | "cover"> = (ctx, draft, assets) => {
  placementsFor(draft).forEach((placement, i) => {
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
  const card = activeTextCard(draft);
  return card ? drawTextCard(ctx, card) : [];
};

/** Every filled position, for dragging and zooming in the preview. Shared by Cover. */
export function photoTargets(draft: PhotoLike, assets: RenderAssets): PhotoTarget[] {
  return placementsFor(draft).flatMap((placement, slot) => {
    const id = draft.slots[slot]?.photoId;
    const photo = id ? assets.photos.get(id) : undefined;
    return photo ? [{ slot, placement, photo }] : [];
  });
}

export const photoTemplate: TemplateDefinition<"photo"> = {
  id: "photo",
  label: "Photo",
  defaultTexture: LIBRARY_TEXTURE.woodDarkWorn,
  ...slotDraftOps("photo", PHOTO_SLOTS, { textCard: true }),
  Editor: PhotoEditor,
  render: renderPhoto,
  photoTargets,
  // One polaroid needs no selecting, so it gets no outline in the preview.
  slotPlacements: (draft) => (draft.slots.length > 1 ? placementsFor(draft) : []),
  // The photo in `polaroidArtboard 3@2x.png`. The image itself is only loaded in dev builds.
  fixture: (draft) => photoTemplate.acceptPhoto(draft, FIXTURE_IMAGE.photo),
};
