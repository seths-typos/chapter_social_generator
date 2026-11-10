import type { Rect } from "@/templates/constants";
import type { GrainAsset } from "./grain";
import type { Draft, DraftFor } from "@/store/draft";
import type { TemplateId, TextureRef } from "@/store/types";

/** A bundled or uploaded texture ready to draw, or a solid-colour placeholder. */
export type TextureAsset =
  | { kind: "image"; image: CanvasImageSource; width: number; height: number }
  | { kind: "color"; color: string };

/** Everything the renderer needs besides the post itself. Loaded once, reused across renders. */
export interface RenderAssets {
  /** Keyed by `${texture.kind}:${texture.id}`. See `textureKey`. */
  textures: ReadonlyMap<string, TextureAsset>;
  /** Decoded pool photos (regular mode: the photo; scan mode: the warped scan), keyed by photo id. */
  photos: ReadonlyMap<string, ImageBitmap>;
  /** The polaroid frame with its window cut out. */
  frame?: CanvasImageSource;
  /** The film-grain noise field and its strength. Absent outside a browser. */
  grain?: GrainAsset | undefined;
  /** The `chapter` wordmark as vector paths. Absent outside a browser (unit tests). */
  wordmark?: WordmarkAsset | undefined;
}

/** The `chapter` wordmark: glyph paths in a `width`×`height` box, filled in any colour at draw time. */
export interface WordmarkAsset {
  paths: readonly Path2D[];
  width: number;
  height: number;
}

export const textureKey = (t: TextureRef): string => `${t.kind}:${t.id}`;

/** A fit problem the renderer hit, e.g. a title that doesn't fit even at the minimum size. */
export interface FitWarning {
  field: string;
  message: string;
  /** Blocking warnings stop "Add to batch". */
  blocking: boolean;
}

export interface RenderResult {
  warnings: FitWarning[];
}

/** One template's drawing routine. The texture is already drawn when this runs. */
export type TemplateRenderer<D extends Draft = Draft> = (
  ctx: CanvasRenderingContext2D,
  draft: D,
  assets: RenderAssets,
) => FitWarning[];

/**
 * Renderer typed to one template's Draft variant. Templates draw from a Draft (a Post is
 * loaded into one first), so the live preview can show a half-filled post.
 */
export type RendererFor<K extends TemplateId> = TemplateRenderer<DraftFor<K>>;

export type { Rect };
