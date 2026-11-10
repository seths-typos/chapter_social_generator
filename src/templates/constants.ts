/**
 * Canvas and layout constants. Every value here mirrors docs/template-spec.md.
 * Change the spec and this file together.
 */

export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1440;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Multi-Photo template: how many polaroids a post may hold. */
export const MULTI_PHOTO_MIN = 2;
export const MULTI_PHOTO_MAX = 4;
export type MultiPhotoCount = 2 | 3 | 4;

/** Photo slot pan/zoom limits. See docs/template-spec.md#polaroid */
export const ZOOM_MIN = 1.0;
export const ZOOM_MAX = 3.0;

/**
 * Standard drop shadow for every content object. docs/template-spec.md#drop-shadow
 * `blur` is the canvas shadowBlur value (σ ≈ blur / 2). Marked *tune* in the spec.
 */
export const SHADOW = {
  color: "#000000",
  opacity: 0.75,
  offsetX: 0,
  offsetY: 6,
  blur: 12,
} as const;

/** Polaroid object and its photo window. docs/template-spec.md#polaroid */
export const POLAROID = {
  /** Full polaroid size, and its position in Cover and Photo. */
  rect: { x: 116, y: 210, w: 848, h: 1021 } satisfies Rect,
  /** Photo window relative to the polaroid's top-left. Matches the cut in frame.png exactly. */
  window: { x: 60, y: 57, w: 726, h: 753 } satisfies Rect,
  /** Placeholder paper colour while the frame asset isn't loaded. */
  paperColor: "#F2F5EE",
} as const;

/** Cover template wordmark. docs/template-spec.md#cover-cover */
export const COVER_WORDMARK = {
  rect: { x: 190, y: 481, w: 700, h: 305 } satisfies Rect,
  fill: "#F4F6F9",
} as const;

/** Graphic template. docs/template-spec.md#graphic-graphic */
export const GRAPHIC = {
  width: 847,
  centerX: 540,
  centerY: 709,
  maxHeight: 1240,
  /** The reference slot, used as the placeholder before a graphic is chosen. */
  referenceRect: { x: 117, y: 278, w: 847, h: 861 } satisfies Rect,
  placeholderColor: "#C9CCD1",
} as const;

/** Info template card. docs/template-spec.md#info-info */
export const INFO_CARD = {
  rect: { x: 116, y: 120, w: 848, h: 1200 } satisfies Rect,
  fill: "#FDFFFD",
} as const;
