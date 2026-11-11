/**
 * Film grain for photos: a fixed field of monochrome noise, blended over the photo with
 * "overlay". The seed is fixed, so the preview and the export get exactly the same grain.
 * docs/template-spec.md#film-look
 */

import { CANVAS_HEIGHT, CANVAS_WIDTH, GRAIN } from "@/templates/constants";

/** A small seeded random number generator: the same seed always gives the same sequence in 0..1. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * `count` grey levels (0–255) centred on mid-grey, which "overlay" leaves unchanged.
 * Two random numbers are averaged so most grains are subtle and a few are strong.
 */
export function grainLevels(
  count: number,
  seed: number = GRAIN.seed,
  amplitude: number = GRAIN.amplitude,
): Uint8ClampedArray {
  const random = mulberry32(seed);
  const levels = new Uint8ClampedArray(count);
  for (let i = 0; i < count; i++) {
    levels[i] = 128 + (random() + random() - 1) * amplitude;
  }
  return levels;
}

/** The grain ready to draw: the noise field and how strongly to overlay it. */
export interface GrainAsset {
  field: CanvasImageSource;
  opacity: number;
}

let asset: GrainAsset | undefined;

function buildField(amplitude: number): HTMLCanvasElement | undefined {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  const image = ctx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
  const levels = grainLevels(CANVAS_WIDTH * CANVAS_HEIGHT, GRAIN.seed, amplitude);
  for (let i = 0; i < levels.length; i++) {
    const v = levels[i]!;
    image.data[i * 4] = v;
    image.data[i * 4 + 1] = v;
    image.data[i * 4 + 2] = v;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/** The grain asset, one noise value per canvas pixel, built once. Undefined outside a browser. */
export function getGrain(): GrainAsset | undefined {
  if (asset || typeof document === "undefined") return asset;
  const field = buildField(GRAIN.amplitude);
  asset = field && { field, opacity: GRAIN.opacity };
  return asset;
}

/**
 * Blend the grain over whatever the current clip allows. It is drawn in canvas pixels,
 * ignoring the current transform, so the grain is the same size on a small, rotated
 * polaroid as on a large one.
 */
export function drawGrain(ctx: CanvasRenderingContext2D, grain: GrainAsset): void {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = grain.opacity;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(grain.field, 0, 0);
  ctx.restore();
}
