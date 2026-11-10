import type { RendererFor } from "@/render/types";
import { drawWordmark } from "@/render/wordmark";
import { COVER_WORDMARK, FIXTURE_IMAGE, LIBRARY_TEXTURE, SINGLE_PHOTO_SLOTS } from "./constants";
import type { TemplateDefinition } from "./definition";
import { renderPhoto } from "./photo";
import { slotDraftOps } from "./slots";

/**
 * Cover: the Photo template plus the `chapter` wordmark over the photo.
 * docs/template-spec.md#cover-cover
 */
const renderCover: RendererFor<"cover"> = (ctx, draft, assets) => {
  const warnings = renderPhoto(ctx, draft, assets);
  if (assets.wordmark) {
    drawWordmark(ctx, assets.wordmark, COVER_WORDMARK.rect, COVER_WORDMARK.fill);
  }
  return warnings;
};

export const coverTemplate: TemplateDefinition<"cover"> = {
  id: "cover",
  label: "Cover",
  defaultTexture: LIBRARY_TEXTURE.woodDarkWorn,
  ...slotDraftOps("cover", SINGLE_PHOTO_SLOTS),
  render: renderCover,
  // The photo inside the polaroid scan in CoverPost.ai. Only loaded in dev builds.
  fixture: (draft) => coverTemplate.acceptPhoto(draft, FIXTURE_IMAGE.cover),
};
