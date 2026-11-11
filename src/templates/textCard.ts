/**
 * The optional text card for Photo: a white card with a heading and one line of text in the
 * top part of the canvas, with the template's usual layout scaled down into the rest.
 * docs/template-spec.md#text-card
 */

import type { PolaroidPlacement } from "@/render/polaroid";
import { drawShadow } from "@/render/shadow";
import { drawLines, measureLine, type DrawContext, type MeasureContext } from "@/render/text";
import type { FitWarning } from "@/render/types";
import type { Draft, TextCardDraft } from "@/store/draft";
import type { TextCard } from "@/store/types";
import { CANVAS_HEIGHT, CANVAS_WIDTH, TEXT_CARD, type Rect } from "./constants";

// TEMPORARY: the split in use. It starts as the constant; the tuning slider (`?tune`)
// changes it live so the final number can be chosen by eye.
let split: number = TEXT_CARD.split;
const listeners = new Set<() => void>();
export const getTextCardSplit = (): number => split;
export function subscribeTextCardSplit(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function setTextCardSplit(next: number): void {
  split = next;
  for (const l of listeners) l();
}

/** The draft's text card when it has one switched on. */
export function activeTextCard(draft: Draft): TextCardDraft | null {
  return "textCard" in draft && draft.textCard.on ? draft.textCard : null;
}

/** True when the card has anything to draw. */
export const hasCardText = (card: TextCard): boolean => cardLines(card).length > 0;

/** The lines to draw, heading first. Blank ones are dropped. */
export function cardLines(card: TextCard): { text: string; heading: boolean }[] {
  const clean = (s: string) => s.trim().split(/\s+/).filter(Boolean).join(" ");
  return [
    { text: clean(card.heading), heading: true },
    { text: clean(card.text), heading: false },
  ].filter((l) => l.text !== "");
}

/** The card's rectangle: from the top margin down to the split line. */
export function textCardRect(at = split): Rect {
  const bottom = CANVAS_HEIGHT * at;
  return {
    x: TEXT_CARD.x,
    y: TEXT_CARD.marginTop,
    w: TEXT_CARD.w,
    h: bottom - TEXT_CARD.marginTop,
  };
}

/**
 * A full-canvas placement moved into the area below the split: the whole layout is scaled
 * by the area's share of the height and centred horizontally, so its own margins shrink
 * with it. Unchanged when `on` is false.
 */
export function condense(placement: PolaroidPlacement, on: boolean, at = split): PolaroidPlacement {
  if (!on) return placement;
  const s = 1 - at;
  return {
    ...placement,
    cx: CANVAS_WIDTH / 2 + (placement.cx - CANVAS_WIDTH / 2) * s,
    cy: CANVAS_HEIGHT * at + placement.cy * s,
    scale: placement.scale * s,
  };
}

export interface CardFit {
  /** Size of the text line. The heading is `headingScale` of it. */
  size: number;
  /** Each line's own size and baseline, in the order given. */
  lines: { size: number; baseline: number }[];
  fits: boolean;
}

/**
 * The largest size at which every line fits the card's width and the lines together fit
 * its height. Lines are never wrapped. The block is centred vertically in the card.
 */
export function fitCard(
  ctx: MeasureContext,
  lines: readonly { text: string; heading: boolean }[],
  rect: Rect,
): CardFit {
  const t = TEXT_CARD;
  const maxWidth = rect.w - 2 * t.padding;
  const maxHeight = rect.h - 2 * t.padding;
  const sizeOf = (l: { heading: boolean }, size: number) => size * (l.heading ? t.headingScale : 1);
  const heightAt = (size: number) =>
    lines.reduce((sum, l) => sum + sizeOf(l, size) * t.lineHeightRatio, 0);
  const fitsAt = (size: number): boolean =>
    heightAt(size) <= maxHeight &&
    lines.every(
      (l) =>
        measureLine(ctx, l.text, l.heading ? t.headingFont : t.font, sizeOf(l, size)).width <=
        maxWidth,
    );
  let size: number = t.size;
  while (size > t.minSize && !fitsAt(size)) size -= 1;
  let top = rect.y + rect.h / 2 - heightAt(size) / 2;
  const placed = lines.map((l) => {
    const lineSize = sizeOf(l, size);
    const lineHeight = lineSize * t.lineHeightRatio;
    const baseline = top + lineHeight / 2 + lineSize * t.baselineShiftEm;
    top += lineHeight;
    return { size: lineSize, baseline };
  });
  return { size, lines: placed, fits: fitsAt(size) };
}

/** Draw the card and its text. Returns a blocking warning when the text doesn't fit. */
export function drawTextCard(
  ctx: CanvasRenderingContext2D & DrawContext,
  card: TextCard,
): FitWarning[] {
  const t = TEXT_CARD;
  const rect = textCardRect();
  drawShadow(ctx, rect);
  ctx.fillStyle = t.fill;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  const lines = cardLines(card);
  if (lines.length === 0) return [];
  const fit = fitCard(ctx, lines, rect);
  lines.forEach((line, i) => {
    const placed = fit.lines[i];
    if (!placed) return;
    drawLines(ctx, [line.text], {
      font: line.heading ? t.headingFont : t.font,
      size: placed.size,
      lineHeight: placed.size * t.lineHeightRatio,
      x: rect.x + rect.w / 2,
      baseline: placed.baseline,
      align: "center",
      color: t.color,
    });
  });
  return fit.fits
    ? []
    : [
        {
          field: "textCard",
          message: "The card text is too long to fit.",
          blocking: true,
        },
      ];
}
