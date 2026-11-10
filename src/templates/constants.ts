/**
 * Canvas and layout constants. Every value here mirrors docs/template-spec.md.
 * Change the spec and this file together.
 */

import type { TextureRef } from "@/store/types";

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

/** How many photo slots a slot-based template holds. Cover and Photo: exactly one. */
export const SINGLE_PHOTO_SLOTS = { min: 1, max: 1 } as const;
export const MULTI_PHOTO_SLOTS = { min: MULTI_PHOTO_MIN, max: MULTI_PHOTO_MAX } as const;

/**
 * Library textures the code refers to by id (the template defaults).
 * Ids must exist in public/textures/textures.json. docs/template-spec.md#texture-library
 */
export const LIBRARY_TEXTURE = {
  woodDarkWorn: { kind: "library", id: "wood-dark-worn" },
  plasterWhite: { kind: "library", id: "plaster-white" },
} as const satisfies Record<string, TextureRef>;

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
  centerY: 708,
  maxHeight: 1240,
  /** The reference slot, used as the placeholder before a graphic is chosen. */
  referenceRect: { x: 117, y: 278, w: 847, h: 861 } satisfies Rect,
  placeholderColor: "#C9CCD1",
} as const;

/**
 * Pool-photo ids the template fixtures refer to. In dev builds each one is loaded from
 * `docs/reference/fixtures/{name}.png`; the id is `fixture-{name}`.
 */
export const FIXTURE_IMAGE_PREFIX = "fixture-";
export const FIXTURE_IMAGE = { graphic: `${FIXTURE_IMAGE_PREFIX}graphic` } as const;

/** Template picker thumbnails: the real render, drawn small. */
export const THUMBNAIL = { width: 180, height: 240 } as const;

/**
 * What Druk text falls back to on a computer where Druk isn't installed: the closest
 * heavy condensed faces that ship with macOS and Windows. docs/technical-requirements.md#fonts
 */
export const DRUK_FALLBACK = 'Impact, "Arial Narrow", sans-serif';

/**
 * Fonts the templates draw text with. Families match `src/app/fonts.css`. Instrument Serif
 * is bundled and gated (`REQUIRED_FONTS`); Druk is used from the computer when installed
 * (`LOCAL_FONTS`). docs/template-spec.md#assets
 */
export const FONTS = {
  drukMedium: { family: "Chapter Druk", weight: 500, fallback: DRUK_FALLBACK },
  drukBold: { family: "Chapter Druk", weight: 700, fallback: DRUK_FALLBACK },
  instrumentSerif: { family: "Instrument Serif", weight: 400 },
} as const;

/**
 * Info template. docs/template-spec.md#info-info
 * Positions are measured from `InfoPost.ai`. Text is placed by baseline.
 */
export const INFO_CARD = {
  rect: { x: 116, y: 120, w: 848, h: 1200 } satisfies Rect,
  fill: "#FDFFFD",
} as const;

export const INFO_TEXT_COLOR = "#000000";

/** The `ch. N` badge. The stroke is centred on the circle's edge, so the outer diameter is 213. */
export const INFO_BADGE = {
  centerX: 148.5,
  centerY: 172,
  diameter: 204,
  fill: "#EBCBFE",
  stroke: "#CB7FF8",
  strokeWidth: 9,
  text: {
    font: FONTS.drukBold,
    size: 108,
    minSize: 72,
    maxWidth: 170,
    baseline: 209,
  },
} as const;

/** The fixed "chapter presents" line: the wordmark, then "presents" on the same baseline. */
export const INFO_LOCKUP = {
  wordmark: { x: 292.4, y: 217.4, w: 226, h: 98.3 } satisfies Rect,
  presents: {
    text: "presents",
    font: FONTS.drukBold,
    size: 104,
    x: 529.8,
    baseline: 295.9,
    /** The design outlines "presents" to match the wordmark's heavier weight. */
    strokeWidth: 0.75,
  },
} as const;

export const INFO_TITLE = {
  font: FONTS.drukMedium,
  size: 167,
  minSize: 120,
  maxWidth: 772,
  centerX: 540,
  baseline: 511,
  maxLines: 2,
  wrappedLineHeightRatio: 0.95,
  /** First baseline when wrapped to two lines, so the pair sits where the single line did. *tune* */
  wrappedBaseline: 437,
} as const;

export const INFO_RULES = {
  x: 154,
  w: 772,
  ys: [589, 1047],
  thickness: 1,
  color: "#231F20",
} as const;

export const INFO_BODY = {
  font: FONTS.instrumentSerif,
  size: 45,
  minSize: 36,
  lineHeightRatio: 1.2,
  x: 216,
  maxWidth: 648,
  maxHeight: 430,
  /** Midpoint between the two rules; the block is centred on it. */
  centerY: 818,
  /**
   * Baselines sit this far (in em) below an even split around `centerY`, which puts the
   * reference's five lines on its baselines (720.5 … 936.5).
   */
  baselineShiftEm: 0.233,
} as const;

const INFO_DETAIL_LINE = {
  font: FONTS.drukMedium,
  size: 65,
  minSize: 48,
  maxWidth: 772,
  centerX: 540,
} as const;

export const INFO_DATE = { ...INFO_DETAIL_LINE, baseline: 1155 } as const;
export const INFO_LOCATION = { ...INFO_DETAIL_LINE, baseline: 1233 } as const;

/** Event number limits. docs/template-spec.md#fields-and-overflow */
export const EVENT_NUMBER_MIN = 1;
export const EVENT_NUMBER_MAX = 999;
