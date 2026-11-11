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

/** How many polaroids a Photo post may hold. */
export type PhotoCount = 1 | 2 | 3 | 4;

/** How many photo slots a slot-based template holds. Cover: exactly one. Photo: one to four. */
export const SINGLE_PHOTO_SLOTS = { min: 1, max: 1 } as const;
export const PHOTO_SLOTS = { min: 1, max: 4 } as const;

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
/** Scroll-to-zoom speed: the zoom is multiplied by e^(−deltaY × this) per wheel event. */
export const WHEEL_ZOOM_RATE = 0.002;
/** Outline of the selected photo position, drawn in the preview only (canvas px). */
export const SELECTION_OUTLINE = { color: "#3B82F6", width: 8 } as const;
/** Step of the zoom slider. */
export const ZOOM_STEP = 0.01;

/**
 * Standard drop shadow for every content object. docs/template-spec.md#drop-shadow
 * `blur` is the canvas shadowBlur value (σ ≈ blur / 2). Tuned by eye with the owner
 * (decision 0008).
 */
export const SHADOW = {
  color: "#000000",
  opacity: 0.6,
  offsetX: 0,
  offsetY: 11,
  blur: 23,
} as const;

/**
 * The film look: one per-post toggle that adds grain, a soft glow and a slight fade to
 * the photo. Values tuned by eye with the owner. docs/template-spec.md#film-look
 *
 * Grain: `amplitude` is how far a grain can sit from mid-grey (0–127); `opacity` is how
 * strongly the noise is overlaid.
 */
export const GRAIN = { seed: 1986, amplitude: 64, opacity: 0.3 } as const;

/** The glow and fade parts of the film look. Fields are described in `PhotoEffects`. */
export const FILM_LOOK = {
  /** Blur of the glow layer in px, for a full-size polaroid. Scales with the polaroid. */
  glowRadius: 14,
  glowStrength: 0.31,
  fadeLift: 0.03,
  fadeHighlights: 0.05,
  fadeDesaturate: 0.42,
} as const;

/** Polaroid object and its photo window. docs/template-spec.md#polaroid */
export const POLAROID = {
  /** Full polaroid size, and its position in Cover and Photo. */
  rect: { x: 116, y: 210, w: 848, h: 1021 } satisfies Rect,
  /** Photo window relative to the polaroid's top-left. Matches the cut in frame.png exactly. */
  window: { x: 60, y: 57, w: 726, h: 753 } satisfies Rect,
  /** Placeholder paper colour while the frame asset isn't loaded. */
  paperColor: "#F2F5EE",
  /** Fill of the photo window before a photo is chosen. Never exported. */
  emptyWindowColor: "#C9CCD1",
} as const;

/**
 * Photo layouts for two to four photos: one fixed preset per photo count. (One photo uses
 * `POLAROID.rect`.) Each slot is a polaroid centre in
 * canvas px and a rotation in degrees (clockwise positive); slot 1 is at the bottom.
 * docs/template-spec.md#photo-photo
 */
export const MULTI_PHOTO_LAYOUT: Record<
  Exclude<PhotoCount, 1>,
  { scale: number; slots: readonly { cx: number; cy: number; rotation: number }[] }
> = {
  2: {
    scale: 0.6,
    slots: [
      { cx: 390, cy: 470, rotation: -4 },
      { cx: 690, cy: 960, rotation: 3 },
    ],
  },
  3: {
    scale: 0.5,
    slots: [
      { cx: 300, cy: 380, rotation: -5 },
      { cx: 760, cy: 560, rotation: 4 },
      { cx: 470, cy: 1030, rotation: -2 },
    ],
  },
  4: {
    scale: 0.46,
    slots: [
      { cx: 290, cy: 360, rotation: -4 },
      { cx: 790, cy: 400, rotation: 3 },
      { cx: 300, cy: 1050, rotation: 3 },
      { cx: 780, cy: 1080, rotation: -5 },
    ],
  },
};
/** The part of a photo that must stay visible: the centre 60% of its window. */
export const FACE_AREA_FRACTION = 0.6;

/** Cover template wordmark. docs/template-spec.md#cover-cover */
export const COVER_WORDMARK = {
  rect: { x: 190, y: 481, w: 700, h: 305 } satisfies Rect,
  /** Light is the reference design. Dark is for photos too light for it to read. */
  fill: { light: "#F4F6F9", dark: "#000000" },
  defaultTone: "light",
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
export const FIXTURE_IMAGE = {
  graphic: `${FIXTURE_IMAGE_PREFIX}graphic`,
  cover: `${FIXTURE_IMAGE_PREFIX}cover`,
  photo: `${FIXTURE_IMAGE_PREFIX}photo`,
} as const;

/** Batch list thumbnails: the real render of the stored post, drawn small. */
export const BATCH_THUMBNAIL = { width: 270, height: 360 } as const;

/** Template picker thumbnails: the real render, drawn small. */
/** They use a flat mid-grey instead of a texture, so the template itself is what stands out. */
export const THUMBNAIL = { width: 180, height: 240, background: "#808080" } as const;

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
  /** No italic face is declared, so the browser slants Druk Medium (or the fallback). */
  drukMediumItalic: {
    family: "Chapter Druk",
    weight: 500,
    style: "italic",
    fallback: DRUK_FALLBACK,
  },
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

/**
 * The optional text card above the photos in Photo and Multi-Photo. The canvas is split
 * at `split` of its height: the card sits in the part above, and the template's usual
 * layout is drawn scaled down into the part below. docs/template-spec.md#text-card
 */
export const TEXT_CARD = {
  /**
   * Share of the canvas height given to the text area: just tall enough for the heading and
   * the one line of text at full size, with the padding. *tune*
   */
  split: 0.26,
  /** Gap between the top of the canvas and the card. */
  marginTop: 48,
  /** Same left edge and width as the polaroid and the Info card. */
  x: 116,
  w: 848,
  fill: INFO_CARD.fill,
  color: INFO_TEXT_COLOR,
  /** Space kept clear between the card's edges and its text. */
  padding: 36,
  font: FONTS.drukMedium,
  headingFont: FONTS.drukMediumItalic,
  size: 120,
  minSize: 40,
  /** The heading is 16% smaller than the text. */
  headingScale: 0.84,
  lineHeightRatio: 1.15,
  /** Baselines sit this far (in em) below an even split around the card's centre. */
  baselineShiftEm: 0.36,
} as const;

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
