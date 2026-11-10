/**
 * Text engine: measure, word-wrap, shrink-to-fit and baseline-positioned drawing.
 * docs/template-spec.md#fields-and-overflow · docs/technical-requirements.md#primitives-srcrender
 *
 * This module holds no layout values. Templates pass sizes, widths and minimums from
 * `src/templates/constants.ts`. The fit functions only need `measureText`, so they are
 * unit-tested with a fake context.
 */

import type { FitWarning } from "./types";

export interface TextFont {
  /** CSS font-family as declared in fonts.css */
  family: string;
  weight: number;
  /** CSS family list used when `family` isn't available (a font that is only used if installed). */
  fallback?: string;
}

/** The slice of a 2D context the fit functions use. Tests pass a fake. */
export interface MeasureContext {
  font: string;
  textBaseline: CanvasTextBaseline;
  measureText(
    text: string,
  ): Pick<TextMetrics, "width" | "actualBoundingBoxAscent" | "actualBoundingBoxDescent">;
}

/** The slice of a 2D context the draw function uses. */
export type DrawContext = MeasureContext &
  Pick<
    CanvasRenderingContext2D,
    | "save"
    | "restore"
    | "fillText"
    | "strokeText"
    | "fillStyle"
    | "strokeStyle"
    | "lineWidth"
    | "lineJoin"
    | "textAlign"
  >;

export interface LineMetrics {
  /** Advance width. */
  width: number;
  /** Baseline to the top of the glyph box (the ink of this exact string). */
  ascent: number;
  /** Baseline to the bottom of the glyph box. */
  descent: number;
}

/** The outcome of fitting a piece of text. Feed it to `drawLines`. */
export interface TextFit {
  /** Font size chosen, in px. */
  size: number;
  /** Baseline-to-baseline distance, in px. */
  lineHeight: number;
  /** Lines to draw. Empty when the text is blank. */
  lines: string[];
  /** Width of the widest line. */
  width: number;
  /** `lines.length × lineHeight`. */
  height: number;
  /** False when the text still overflows at the minimum size. */
  fits: boolean;
}

/** CSS font shorthand for canvas `ctx.font`. */
export const fontString = (font: TextFont, size: number): string =>
  `${font.weight} ${size}px "${font.family}"${font.fallback ? `, ${font.fallback}` : ""}`;

/** Unify line endings and drop leading/trailing whitespace (including blank lines). */
const normalize = (text: string): string => text.replace(/\r\n?/g, "\n").trim();

/** Collapse a single line's whitespace runs to one space. */
const collapse = (text: string): string => normalize(text).split(/\s+/).filter(Boolean).join(" ");

function setFont(ctx: MeasureContext, font: TextFont, size: number): void {
  ctx.font = fontString(font, size);
  ctx.textBaseline = "alphabetic";
}

/** Measure one line. Sets `ctx.font` and `ctx.textBaseline` as a side effect. */
export function measureLine(
  ctx: MeasureContext,
  text: string,
  font: TextFont,
  size: number,
): LineMetrics {
  setFont(ctx, font, size);
  const m = ctx.measureText(text);
  return { width: m.width, ascent: m.actualBoundingBoxAscent, descent: m.actualBoundingBoxDescent };
}

const widthOf = (ctx: MeasureContext, text: string): number =>
  text === "" ? 0 : ctx.measureText(text).width;

/**
 * Greedy word-wrap. Explicit newlines start a new line and blank lines are kept (as "").
 * A single word wider than `maxWidth` stays whole on its own line; the caller detects
 * that overflow by measuring.
 */
export function wrapText(
  ctx: MeasureContext,
  text: string,
  font: TextFont,
  size: number,
  maxWidth: number,
): string[] {
  const clean = normalize(text);
  if (clean === "") return [];
  setFont(ctx, font, size);
  const lines: string[] = [];
  for (const paragraph of clean.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = words[0] ?? "";
    for (const word of words.slice(1)) {
      const candidate = `${line} ${word}`;
      if (widthOf(ctx, candidate) <= maxWidth) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

/** Build a TextFit for `lines` at `size`; `ctx.font` must already be set for that size. */
function result(
  ctx: MeasureContext,
  lines: string[],
  size: number,
  lineHeight: number,
  fits: boolean,
): TextFit {
  const width = lines.reduce((max, l) => Math.max(max, widthOf(ctx, l)), 0);
  return { size, lineHeight, lines, width, height: lines.length * lineHeight, fits };
}

export interface LineFitOptions {
  font: TextFont;
  /** Preferred size. */
  maxSize: number;
  /** Smallest allowed size. */
  minSize: number;
  maxWidth: number;
}

/**
 * Fit one line: start at `maxSize` and shrink in 1 px steps until it is no wider than
 * `maxWidth`. At `minSize` and still too wide: `fits` is false.
 */
export function fitLine(ctx: MeasureContext, text: string, opts: LineFitOptions): TextFit {
  const { font, maxSize, minSize, maxWidth } = opts;
  const line = collapse(text);
  const lines = line === "" ? [] : [line];
  for (let size = maxSize; size >= minSize; size--) {
    setFont(ctx, font, size);
    if (widthOf(ctx, line) <= maxWidth) return result(ctx, lines, size, size, true);
  }
  setFont(ctx, font, minSize);
  return result(ctx, lines, minSize, minSize, false);
}

export interface HeadlineFitOptions extends LineFitOptions {
  /** How many lines the headline may wrap to at `minSize`. */
  maxLines: number;
  /** Line-height as a multiple of the font size, used once wrapped. */
  wrappedLineHeightRatio: number;
}

/**
 * Fit a headline (the Info title rule): shrink on one line down to `minSize`; if it is
 * still too wide, wrap at `minSize` to at most `maxLines` lines. A two-line result is
 * rebalanced so the lines are as even as possible. Still overflowing: `fits` is false.
 */
export function fitHeadline(ctx: MeasureContext, text: string, opts: HeadlineFitOptions): TextFit {
  const single = fitLine(ctx, text, opts);
  if (single.fits || opts.maxLines < 2) return single;

  const { font, minSize, maxWidth, maxLines, wrappedLineHeightRatio } = opts;
  const lineHeight = minSize * wrappedLineHeightRatio;
  let lines = wrapText(ctx, collapse(text), font, minSize, maxWidth);
  if (lines.length === 2) lines = balanceTwoLines(ctx, lines.join(" "));
  const fit = result(ctx, lines, minSize, lineHeight, true);
  return { ...fit, fits: lines.length <= maxLines && fit.width <= maxWidth };
}

/** Split into two lines at the word break that makes the wider line as narrow as possible. */
function balanceTwoLines(ctx: MeasureContext, text: string): string[] {
  const words = text.split(" ");
  let best: string[] = [text];
  let bestWidth = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const w = Math.max(widthOf(ctx, a), widthOf(ctx, b));
    if (w < bestWidth) {
      bestWidth = w;
      best = [a, b];
    }
  }
  return best;
}

export interface BlockFitOptions extends LineFitOptions {
  maxHeight: number;
  /** Line-height as a multiple of the font size (constant while shrinking). */
  lineHeightRatio: number;
}

/**
 * Fit a wrapped block (the Info body rule): wrap at `maxSize`; if the block is taller than
 * `maxHeight`, shrink in 1 px steps down to `minSize`, re-wrapping each time. Still too
 * tall (or a single word too wide): `fits` is false.
 */
export function fitBlock(ctx: MeasureContext, text: string, opts: BlockFitOptions): TextFit {
  const { font, maxSize, minSize, maxWidth, maxHeight, lineHeightRatio } = opts;
  let fit: TextFit | undefined;
  for (let size = maxSize; size >= minSize; size--) {
    const lines = wrapText(ctx, text, font, size, maxWidth);
    setFont(ctx, font, size);
    fit = result(ctx, lines, size, size * lineHeightRatio, true);
    if (fit.height <= maxHeight && fit.width <= maxWidth) return fit;
  }
  return { ...(fit ?? result(ctx, [], minSize, minSize * lineHeightRatio, true)), fits: false };
}

/** A blocking FitWarning when the text didn't fit, otherwise nothing. Spread into the template's warnings. */
export function fitWarnings(fit: TextFit, field: string, message: string): FitWarning[] {
  return fit.fits ? [] : [{ field, message, blocking: true }];
}

export interface DrawTextOptions {
  font: TextFont;
  size: number;
  lineHeight: number;
  /** Anchor x: the left edge, centre or right edge, per `align`. */
  x: number;
  /** y of the first line's baseline. Later baselines step down by `lineHeight`. */
  baseline: number;
  align: "left" | "center" | "right";
  color: string;
  /** Outline the glyphs with a stroke this wide (px) in the same colour, to thicken them. */
  strokeWidth?: number;
}

/**
 * Draw lines by baseline. Baselines are what the design files give for every text item,
 * and they don't move with what is typed (an ink-top position would shift between
 * "MOON" and "moon"). docs/decisions/0004-text-positioned-by-baseline.md
 */
export function drawLines(ctx: DrawContext, lines: readonly string[], opts: DrawTextOptions): void {
  if (lines.length === 0) return;
  ctx.save();
  setFont(ctx, opts.font, opts.size);
  ctx.textAlign = opts.align;
  ctx.fillStyle = opts.color;
  if (opts.strokeWidth) {
    ctx.strokeStyle = opts.color;
    ctx.lineWidth = opts.strokeWidth;
    ctx.lineJoin = "round";
  }
  lines.forEach((line, i) => {
    if (line === "") return;
    const y = opts.baseline + i * opts.lineHeight;
    ctx.fillText(line, opts.x, y);
    if (opts.strokeWidth) ctx.strokeText(line, opts.x, y);
  });
  ctx.restore();
}
