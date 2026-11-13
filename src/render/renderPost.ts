/**
 * The one renderer. Preview and export both call this on a 1080×1440 canvas, so they
 * can't drift apart. docs/technical-requirements.md#rendering-engine
 *
 * Pure: output depends only on its arguments. No store, DOM or clock access. `layout` is
 * for the preview alone, to draw a layout change mid-animation.
 */

import { isDraft, type Draft } from "@/store/draft";
import type { Post } from "@/store/types";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/templates/constants";
import { fromPost, templateFor } from "@/templates/registry";
import type { PolaroidPlacement } from "./polaroid";
import { drawTexture } from "./texture";
import { textureKey, type RenderAssets, type RenderResult } from "./types";

/**
 * Templates draw from a Draft, so a half-filled post can be previewed. A stored Post is
 * loaded into a Draft first; both routes reach the same drawing code.
 */
export function renderPost(
  ctx: CanvasRenderingContext2D,
  post: Post | Draft,
  assets: RenderAssets,
  layout?: readonly PolaroidPlacement[],
): RenderResult {
  const draft = isDraft(post) ? post : fromPost(post);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Layer 1: texture. Layers 2+ belong to the template.
  drawTexture(ctx, assets.textures.get(textureKey(draft.texture)));
  const warnings = templateFor(draft.template).render(ctx, draft, assets, layout);

  ctx.restore();
  return { warnings };
}
