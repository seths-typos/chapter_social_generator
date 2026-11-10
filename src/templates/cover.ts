import type { RendererFor } from "@/render/types";
import { LIBRARY_TEXTURE, SINGLE_PHOTO_SLOTS } from "./constants";
import type { TemplateDefinition } from "./definition";
import { renderPhoto } from "./photo";
import { slotDraftOps } from "./slots";

/**
 * Cover: the Photo template plus the `chapter` wordmark over the photo.
 * docs/template-spec.md#cover-cover. Wordmark overlay lands in #17.
 */
const renderCover: RendererFor<"cover"> = (ctx, draft, assets) => renderPhoto(ctx, draft, assets);

export const coverTemplate: TemplateDefinition<"cover"> = {
  id: "cover",
  label: "Cover",
  defaultTexture: LIBRARY_TEXTURE.woodDarkWorn,
  ...slotDraftOps("cover", SINGLE_PHOTO_SLOTS),
  render: renderCover,
};
