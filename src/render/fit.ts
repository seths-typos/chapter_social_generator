/**
 * Pure fit math. No canvas access, fully unit-tested.
 * See docs/template-spec.md#background-texture and #polaroid.
 */

import type { Rect } from "@/templates/constants";
import { ZOOM_MAX, ZOOM_MIN } from "@/templates/constants";

export interface Size {
  w: number;
  h: number;
}

/** Scale `src` so it fully covers `dst`, centred; the overflow is cropped by the caller. */
export function coverFit(src: Size, dst: Rect): Rect {
  const scale = Math.max(dst.w / src.w, dst.h / src.h);
  const w = src.w * scale;
  const h = src.h * scale;
  return { x: dst.x + (dst.w - w) / 2, y: dst.y + (dst.h - h) / 2, w, h };
}

/** Scale `src` so it fits entirely inside `dst`, centred. */
export function containFit(src: Size, dst: Rect): Rect {
  const scale = Math.min(dst.w / src.w, dst.h / src.h);
  const w = src.w * scale;
  const h = src.h * scale;
  return { x: dst.x + (dst.w - w) / 2, y: dst.y + (dst.h - h) / 2, w, h };
}

export interface View {
  /** −1..1; 0 = centred. ±1 = the photo's edge meets the slot's edge on that side. */
  panX: number;
  panY: number;
  /** 1 = cover-fit; larger zooms in. */
  zoom: number;
}

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export function clampView(view: View): View {
  return {
    panX: clamp(view.panX, -1, 1),
    panY: clamp(view.panY, -1, 1),
    zoom: clamp(view.zoom, ZOOM_MIN, ZOOM_MAX),
  };
}

/**
 * Where to draw a photo inside a slot so it covers the slot at the given pan/zoom.
 * Pan is expressed as a fraction of the available overflow on each axis, so any pan in
 * −1..1 keeps the slot fully covered: a photo can never be panned to leave a gap.
 */
export function viewFit(src: Size, slot: Rect, view: View): Rect {
  const v = clampView(view);
  const base = coverFit(src, slot);
  const w = base.w * v.zoom;
  const h = base.h * v.zoom;
  const overflowX = (w - slot.w) / 2;
  const overflowY = (h - slot.h) / 2;
  return {
    x: slot.x - overflowX - v.panX * overflowX,
    y: slot.y - overflowY - v.panY * overflowY,
    w,
    h,
  };
}

/**
 * The view that draws the photo with its top-left at (`x`, `y`) at `zoom`, clamped so the
 * slot stays covered. The inverse of `viewFit`.
 */
export function viewForOrigin(src: Size, slot: Rect, x: number, y: number, zoom: number): View {
  const z = clamp(zoom, ZOOM_MIN, ZOOM_MAX);
  const base = coverFit(src, slot);
  const overflowX = (base.w * z - slot.w) / 2;
  const overflowY = (base.h * z - slot.h) / 2;
  // Below a hundredth of a pixel there is nothing to pan across.
  const pan = (origin: number, start: number, overflow: number) =>
    overflow < 0.01 ? 0 : clamp((start - overflow - origin) / overflow, -1, 1);
  return { panX: pan(x, slot.x, overflowX), panY: pan(y, slot.y, overflowY), zoom: z };
}

/** Drag the photo by (`dx`, `dy`) slot pixels. It stops at the slot's edges. */
export function panByPixels(src: Size, slot: Rect, view: View, dx: number, dy: number): View {
  const r = viewFit(src, slot, view);
  return viewForOrigin(src, slot, r.x + dx, r.y + dy, view.zoom);
}

/** Change the zoom, keeping the part of the photo at the slot's centre where it is (when it can). */
export function zoomTo(src: Size, slot: Rect, view: View, zoom: number): View {
  const r = viewFit(src, slot, view);
  const cx = slot.x + slot.w / 2;
  const cy = slot.y + slot.h / 2;
  const u = (cx - r.x) / r.w;
  const v = (cy - r.y) / r.h;
  const z = clamp(zoom, ZOOM_MIN, ZOOM_MAX);
  const base = coverFit(src, slot);
  return viewForOrigin(src, slot, cx - u * base.w * z, cy - v * base.h * z, z);
}

/** True when `inner` lies entirely within `outer` (with a small tolerance for float error). */
export function covers(inner: Rect, outer: Rect, eps = 1e-6): boolean {
  return (
    inner.x <= outer.x + eps &&
    inner.y <= outer.y + eps &&
    inner.x + inner.w >= outer.x + outer.w - eps &&
    inner.y + inner.h >= outer.y + outer.h - eps
  );
}

/** Offset a rect. */
export const translateRect = (r: Rect, dx: number, dy: number): Rect => ({
  ...r,
  x: r.x + dx,
  y: r.y + dy,
});
