/**
 * The `chapter` wordmark, drawn as vector paths so it stays sharp at any size and can
 * take any fill colour (white on the Cover, black on Info). The paths come straight from
 * `src/assets/wordmark/chapter.svg`.
 */

import chapterSvg from "@/assets/wordmark/chapter.svg?raw";
import type { Rect } from "@/templates/constants";
import type { WordmarkAsset } from "./types";

/** Pull the viewBox size and every path's `d` out of the wordmark SVG. */
export function parseWordmarkSvg(svg: string): { width: number; height: number; d: string[] } {
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1]?.trim().split(/\s+/).map(Number);
  const d = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]!);
  const [, , width, height] = viewBox ?? [];
  if (!width || !height || d.length === 0) throw new Error("Wordmark SVG could not be read");
  return { width, height, d };
}

let cached: WordmarkAsset | undefined;

/** The wordmark asset, built once. Undefined where `Path2D` doesn't exist (unit tests). */
export function getWordmark(): WordmarkAsset | undefined {
  if (cached || typeof Path2D === "undefined") return cached;
  const { width, height, d } = parseWordmarkSvg(chapterSvg);
  cached = { paths: d.map((path) => new Path2D(path)), width, height };
  return cached;
}

/** Fill the wordmark so its box exactly covers `rect`. */
export function drawWordmark(
  ctx: CanvasRenderingContext2D,
  wordmark: WordmarkAsset,
  rect: Rect,
  color: string,
): void {
  ctx.save();
  ctx.translate(rect.x, rect.y);
  ctx.scale(rect.w / wordmark.width, rect.h / wordmark.height);
  ctx.fillStyle = color;
  for (const path of wordmark.paths) ctx.fill(path, "nonzero");
  ctx.restore();
}
