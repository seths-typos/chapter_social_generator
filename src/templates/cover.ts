import type { RendererFor } from "@/render/types";
import { renderPhoto } from "./photo";

/**
 * Cover: the Photo template plus the `chapter` wordmark over the photo.
 * docs/template-spec.md#cover-cover. Wordmark overlay lands in #17.
 */
export const renderCover: RendererFor<"cover"> = (ctx, input, assets) =>
  renderPhoto(ctx, input, assets);
