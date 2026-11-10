import type { RendererFor } from "@/render/types";
import { drawWordmark } from "@/render/wordmark";
import { COVER_WORDMARK, FIXTURE_IMAGE, LIBRARY_TEXTURE, SINGLE_PHOTO_SLOTS } from "./constants";
import { CoverEditor } from "./CoverEditor";
import type { TemplateDefinition } from "./definition";
import { renderPhoto, singlePhotoTargets } from "./photo";
import { slotDraftOps } from "./slots";

/**
 * Cover: the Photo template plus the `chapter` wordmark over the photo, light or dark.
 * docs/template-spec.md#cover-cover
 */
const renderCover: RendererFor<"cover"> = (ctx, draft, assets) => {
  const warnings = renderPhoto(ctx, draft, assets);
  if (assets.wordmark) {
    drawWordmark(ctx, assets.wordmark, COVER_WORDMARK.rect, COVER_WORDMARK.fill[draft.wordmark]);
  }
  return warnings;
};

const slotOps = slotDraftOps("cover", SINGLE_PHOTO_SLOTS);

export const coverTemplate: TemplateDefinition<"cover"> = {
  id: "cover",
  label: "Cover",
  defaultTexture: LIBRARY_TEXTURE.woodDarkWorn,
  ...slotOps,
  // The slot operations don't know about the wordmark colour, so it is added around them.
  newDraft: (base) => ({ ...slotOps.newDraft(base), wordmark: COVER_WORDMARK.defaultTone }),
  toPost: (draft) => {
    const post = slotOps.toPost(draft);
    return post && { ...post, wordmark: draft.wordmark };
  },
  fromPost: (post, base) => ({ ...slotOps.fromPost(post, base), wordmark: post.wordmark }),
  render: renderCover,
  photoTargets: singlePhotoTargets,
  Editor: CoverEditor,
  // The photo inside the polaroid scan in CoverPost.ai. Only loaded in dev builds.
  fixture: (draft) => coverTemplate.acceptPhoto(draft, FIXTURE_IMAGE.cover),
};
