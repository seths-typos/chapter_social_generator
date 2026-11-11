/**
 * The polaroid primitive, regular mode: shadow, the photo cover-fit into the window, then
 * the scanned frame on top. docs/template-spec.md#polaroid
 *
 * A polaroid is always 848×1021 in its own space. Where it lands on the canvas is a
 * `PolaroidPlacement`: a centre, a rotation and a uniform scale. Cover and Photo use one
 * unrotated polaroid at scale 1; Multi-Photo scatters several.
 */

import { CANVAS_HEIGHT, CANVAS_WIDTH, POLAROID, type Rect } from "@/templates/constants";
import { viewFit, type View } from "./fit";
import { drawGrain, type GrainAsset } from "./grain";
import { drawFade, drawGlow, type PhotoEffects } from "./photoEffects";
import { drawShadow } from "./shadow";

export interface PolaroidPlacement {
  /** Canvas position of the polaroid's centre. */
  cx: number;
  cy: number;
  /** Clockwise, in degrees. */
  rotation: number;
  /** 1 = 848×1021. */
  scale: number;
}

const SIZE = { w: POLAROID.rect.w, h: POLAROID.rect.h };

/** The placement that makes an unrotated polaroid fill `rect` (its width sets the scale). */
export const placementFromRect = (rect: Rect): PolaroidPlacement => ({
  cx: rect.x + rect.w / 2,
  cy: rect.y + rect.h / 2,
  rotation: 0,
  scale: rect.w / SIZE.w,
});

/** Where the photo is drawn, in the polaroid's own space, for a pan and zoom. */
export const photoRectInPolaroid = (photo: { width: number; height: number }, view: View): Rect =>
  viewFit({ w: photo.width, h: photo.height }, POLAROID.window, view);

/** A point in the polaroid's own space, on the canvas. The inverse of `toPolaroidSpace`. */
export function toCanvasSpace(
  placement: PolaroidPlacement,
  point: { x: number; y: number },
): { x: number; y: number } {
  const a = (placement.rotation * Math.PI) / 180;
  const x = (point.x - SIZE.w / 2) * placement.scale;
  const y = (point.y - SIZE.h / 2) * placement.scale;
  return {
    x: placement.cx + x * Math.cos(a) - y * Math.sin(a),
    y: placement.cy + x * Math.sin(a) + y * Math.cos(a),
  };
}

/** The polaroid's four corners on the canvas: TL, TR, BR, BL. */
export const polaroidCorners = (placement: PolaroidPlacement): { x: number; y: number }[] =>
  [
    { x: 0, y: 0 },
    { x: SIZE.w, y: 0 },
    { x: SIZE.w, y: SIZE.h },
    { x: 0, y: SIZE.h },
  ].map((corner) => toCanvasSpace(placement, corner));

/** True when a canvas point is on the polaroid (frame or photo). */
export function isOverPolaroid(
  placement: PolaroidPlacement,
  point: { x: number; y: number },
): boolean {
  const p = toPolaroidSpace(placement, point);
  return p.x >= 0 && p.x <= SIZE.w && p.y >= 0 && p.y <= SIZE.h;
}

/** A canvas point in the polaroid's own 848×1021 space. */
export function toPolaroidSpace(
  placement: PolaroidPlacement,
  point: { x: number; y: number },
): { x: number; y: number } {
  const d = deltaToPolaroidSpace(placement, point.x - placement.cx, point.y - placement.cy);
  return { x: d.x + SIZE.w / 2, y: d.y + SIZE.h / 2 };
}

/** A canvas-space movement expressed in the polaroid's own space (undoing rotation and scale). */
export function deltaToPolaroidSpace(
  placement: PolaroidPlacement,
  dx: number,
  dy: number,
): { x: number; y: number } {
  const a = (-placement.rotation * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return {
    x: (dx * cos - dy * sin) / placement.scale,
    y: (dx * sin + dy * cos) / placement.scale,
  };
}

/** True when a canvas point is over the polaroid's photo window. */
export function isOverWindow(
  placement: PolaroidPlacement,
  point: { x: number; y: number },
): boolean {
  const p = toPolaroidSpace(placement, point);
  const w = POLAROID.window;
  return p.x >= w.x && p.x <= w.x + w.w && p.y >= w.y && p.y <= w.y + w.h;
}

export interface PolaroidOptions {
  placement: PolaroidPlacement;
  /** The photo for the window. Without one the window is a flat grey. */
  photo?: (CanvasImageSource & { width: number; height: number }) | undefined;
  /** Pan and zoom of the photo inside the window. */
  view: View;
  /** The grain field to blend over the photo (not the frame). Omit for no grain. */
  grain?: GrainAsset | undefined;
  /** The glow and fade of the film look. Omit for none. */
  effects?: PhotoEffects | undefined;
  /** The scanned frame with its window cut out. Without it a flat paper colour is drawn. */
  frame?: CanvasImageSource | undefined;
}

export function drawPolaroid(ctx: CanvasRenderingContext2D, opts: PolaroidOptions): void {
  const { placement, photo, view, frame, grain, effects } = opts;
  const win = POLAROID.window;

  ctx.save();
  ctx.translate(placement.cx, placement.cy);
  ctx.rotate((placement.rotation * Math.PI) / 180);
  ctx.scale(placement.scale, placement.scale);
  ctx.translate(-SIZE.w / 2, -SIZE.h / 2);

  drawShadow(ctx, { x: 0, y: 0, ...SIZE }, placement.scale);

  // The photo, clipped to the window so nothing shows past the frame's cut.
  ctx.save();
  ctx.beginPath();
  ctx.rect(win.x, win.y, win.w, win.h);
  ctx.clip();
  if (photo) {
    const r = photoRectInPolaroid(photo, view);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const drawPhoto = () => ctx.drawImage(photo, r.x, r.y, r.w, r.h);
    drawPhoto();
    if (effects) {
      drawGlow(ctx, effects, placement.scale, drawPhoto);
      drawFade(ctx, effects, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    if (grain) drawGrain(ctx, grain);
  } else {
    ctx.fillStyle = POLAROID.emptyWindowColor;
    ctx.fillRect(win.x, win.y, win.w, win.h);
  }
  ctx.restore();

  if (frame) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(frame, 0, 0, SIZE.w, SIZE.h);
  } else {
    // Stand-in while frame.png loads: flat paper around the window.
    ctx.fillStyle = POLAROID.paperColor;
    ctx.beginPath();
    ctx.rect(0, 0, SIZE.w, SIZE.h);
    ctx.rect(win.x, win.y, win.w, win.h);
    ctx.fill("evenodd");
  }
  ctx.restore();
}
