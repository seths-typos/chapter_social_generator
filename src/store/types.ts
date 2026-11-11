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
  /** Original file name, for labels. May be empty. */
  name: string;
  /** Small encoded preview (240 px wide) for the UI. The full image is a cached bitmap, keyed by `id`. */
  thumbnail: Blob;
  /** Size of the kept bitmap, after downscaling on import. */
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

/**
 * The optional text card above the photos (Photo and Multi-Photo).
 * docs/template-spec.md#text-card
 */
export interface TextCard {
  /** Optional first line, drawn smaller and in italic. */
  heading: string;
  /** The one line of text. */
  text: string;
}

/** Colour of the Cover wordmark: light on dark photos, dark on light photos. */
export type WordmarkTone = "light" | "dark";

export type TemplateId = "cover" | "photo" | "multi-photo" | "graphic" | "info";

export type Post =
  | {
      template: "cover";
      slots: [PhotoSlot];
      texture: TextureRef;
      /** The film look (grain, soft glow, slight fade) on the photo. Named for its first part. */
      grain: boolean;
      /** Light for dark photos (the default), dark for light photos. */
      wordmark: WordmarkTone;
    }
  | {
      template: "photo";
      slots: [PhotoSlot];
      texture: TextureRef;
      grain: boolean;
      textCard?: TextCard;
    }
  | {
      template: "multi-photo";
      slots: PhotoSlot[] /* 2–4 */;
      texture: TextureRef;
      grain: boolean;
      textCard?: TextCard;
    }
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

/** The Post variant for one template. */
export type PostFor<K extends TemplateId> = Post & { template: K };

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
  /** Object URL for the picker thumbnail. Revoked when the page unloads. */
  previewUrl?: string;
}
