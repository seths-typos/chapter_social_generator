import type { RendererFor } from "@/render/types";
import { LIBRARY_TEXTURE, MULTI_PHOTO_SLOTS } from "./constants";
import type { TemplateDefinition } from "./definition";
import { slotDraftOps } from "./slots";

/**
 * Multi-Photo: 2–4 scattered polaroids. docs/template-spec.md#multi-photo-multi-photo
 * Placeholder until #28: texture only.
 */
const renderMultiPhoto: RendererFor<"multi-photo"> = () => [];

export const multiPhotoTemplate: TemplateDefinition<"multi-photo"> = {
  id: "multi-photo",
  label: "Multi-Photo",
  defaultTexture: LIBRARY_TEXTURE.woodDarkWorn,
  ...slotDraftOps("multi-photo", MULTI_PHOTO_SLOTS),
  render: renderMultiPhoto,
};
