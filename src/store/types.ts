/**
 * Data model. Mirrors docs/template-spec.md#post-data-model exactly.
 *
 * A `Post` is always complete and renderable: it's what a batch item stores and what
 * the renderer consumes. The editor works on a looser `Draft` (see draft.ts) that is
 * converted to a `Post` only when every required input is present.
 */

export interface Pt {
  x: number;
  y: number;
}

export type PhotoMode = "regular" | "scan";

export interface PoolPhoto {
  id: string;
  /** Original upload (HEIC converted to JPEG on import). */
  file: Blob;
  width: number;
  height: number;
  mode: PhotoMode;
  /** TL, TR, BR, BL in source px. Required when mode = "scan". */
  scanCorners?: [Pt, Pt, Pt, Pt];
}

export interface PhotoSlot {
  photoId: string;
  /** −1..1, 0 = centered */
  panX: number;
  /** −1..1, 0 = centered */
  panY: number;
  /** 1.0..3.0 */
  zoom: number;
}

export interface TextureRef {
  kind: "library" | "upload";
  id: string;
}

export type TemplateId = "cover" | "photo" | "multi-photo" | "graphic" | "info";

export type Post =
  | { template: "cover" | "photo"; slots: [PhotoSlot]; texture: TextureRef; grain: boolean }
  | { template: "multi-photo"; slots: PhotoSlot[] /* 2–4 */; texture: TextureRef; grain: boolean }
  | { template: "graphic"; graphicId: string; texture: TextureRef }
  | {
      template: "info";
      eventNumber: number;
      title: string;
      body: string;
      /** YYYY-MM-DD */
      date: string;
      /** HH:mm (24h) */
      startTime: string;
      /** HH:mm (24h) */
      endTime?: string;
      location: string;
      texture: TextureRef;
    };

export interface BatchItem {
  id: string;
  /** Editable; becomes the export filename. Defaults to `{template}-{n}`. */
  name: string;
  /** Instagram caption, exported to captions.txt. */
  caption: string;
  post: Post;
}

/** A texture uploaded during this session. Never persisted. */
export interface SessionTexture {
  id: string;
  name: string;
  file: Blob;
  width: number;
  height: number;
}

/** Every pool photo id a post references (photo slots or the graphic). */
export function photoIdsInPost(post: Post): string[] {
  switch (post.template) {
    case "cover":
    case "photo":
    case "multi-photo":
      return post.slots.map((s) => s.photoId);
    case "graphic":
      return [post.graphicId];
    case "info":
      return [];
  }
}
