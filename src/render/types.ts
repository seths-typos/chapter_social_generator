import type { Rect } from "@/templates/constants";
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
  /** The `chapter` wordmark, pre-rasterised for the Cover (white) and Info (black) templates. */
  wordmark?: { light: CanvasImageSource; dark: CanvasImageSource };
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

/** Common shape of a pool photo slot as the renderer sees it (a Draft's slot may be empty). */
export interface SlotInput {
  photoId: string | null;
  panX: number;
  panY: number;
  zoom: number;
}

/**
 * What the renderer draws from. Both a complete `Post` and an in-progress `Draft`
 * normalise to this, so the live preview can show a half-filled post.
 */
export type RenderInput =
  | {
      template: "cover" | "photo";
      slots: readonly SlotInput[];
      texture: TextureRef;
      grain: boolean;
    }
  | { template: "multi-photo"; slots: readonly SlotInput[]; texture: TextureRef; grain: boolean }
  | { template: "graphic"; graphicId: string | null; texture: TextureRef }
  | {
      template: "info";
      eventNumber: number | null;
      title: string;
      body: string;
      date: string;
      startTime: string;
      endTime: string;
      location: string;
      texture: TextureRef;
    };

/** The RenderInput variant for a template (or set of templates). */
export type InputFor<K extends TemplateId> = RenderInput & { template: K };

/** One template's drawing routine. The texture is already drawn when this runs. */
export type TemplateRenderer<T extends RenderInput = RenderInput> = (
  ctx: CanvasRenderingContext2D,
  input: T,
  assets: RenderAssets,
) => FitWarning[];

/** Renderer typed to one template's input variant. */
export type RendererFor<K extends TemplateId> = TemplateRenderer<InputFor<K>>;

export type { Rect };
