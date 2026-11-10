/**
 * The one renderer. Preview and export both call this on a 1080×1440 canvas, so they
 * can't drift apart. docs/technical-requirements.md#rendering-engine
 *
 * Pure: output depends only on `input` and `assets`. No store, DOM or clock access.
 */

import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/templates/constants";
import { TEMPLATE_RENDERERS } from "@/templates/registry";
import type { Draft } from "@/store/draft";
import type { Post } from "@/store/types";
import { drawTexture } from "./texture";
import { textureKey, type RenderAssets, type RenderInput, type RenderResult } from "./types";

/** Both a complete Post and an in-progress Draft render; a Draft just has blanks. */
export function toRenderInput(x: Post | Draft): RenderInput {
  switch (x.template) {
    case "cover":
    case "photo":
    case "multi-photo":
      return { template: x.template, slots: x.slots, texture: x.texture, grain: x.grain };
    case "graphic":
      return { template: "graphic", graphicId: x.graphicId, texture: x.texture };
    case "info": {
      const i = "info" in x ? x.info : x;
      return {
        template: "info",
        eventNumber: i.eventNumber,
        title: i.title,
        body: i.body,
        date: i.date,
        startTime: i.startTime,
        endTime: i.endTime ?? "",
        location: i.location,
        texture: x.texture,
      };
    }
  }
}

export function renderPost(
  ctx: CanvasRenderingContext2D,
  post: Post | Draft,
  assets: RenderAssets,
): RenderResult {
  const input = toRenderInput(post);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Layer 1: texture. Layers 2+ belong to the template.
  drawTexture(ctx, assets.textures.get(textureKey(input.texture)));
  const render = TEMPLATE_RENDERERS[input.template] as (
    c: CanvasRenderingContext2D,
    i: RenderInput,
    a: RenderAssets,
  ) => RenderResult["warnings"];
  const warnings = render(ctx, input, assets);

  ctx.restore();
  return { warnings };
}
