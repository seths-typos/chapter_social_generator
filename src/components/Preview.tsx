import { useEffect, useEffectEvent, useRef, useState, type PointerEvent } from "react";
import { RENDER_CANVAS_CLASS } from "@/render/canvas";
import { renderPost } from "@/render/renderPost";
import type { RenderAssets, RenderResult } from "@/render/types";
import { panByPixels, zoomTo, type Size, type View } from "@/render/fit";
import {
  deltaToPolaroidSpace,
  isOverPolaroid,
  isOverWindow,
  polaroidCorners,
} from "@/render/polaroid";
import { hasSlots } from "@/store/draft";
import { appStore, useAppStore } from "@/store/store";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  POLAROID,
  SELECTION_OUTLINE,
  WHEEL_ZOOM_RATE,
} from "@/templates/constants";
import type { PhotoTarget } from "@/templates/definition";
import { photoTargets, slotPlacements } from "@/templates/registry";

interface PreviewProps {
  assets: RenderAssets;
  /** Called after each render with the renderer's fit warnings. */
  onResult?: (result: RenderResult) => void;
}

/**
 * The live preview: a real 1080×1440 canvas scaled down with CSS, so what's shown is
 * pixel-for-pixel what export produces. Re-renders on the next animation frame after
 * any draft change; intermediate changes within a frame are coalesced.
 * docs/technical-requirements.md#rendering-engine
 */
export function Preview({ assets, onResult }: PreviewProps) {
  const draft = useAppStore((s) => s.draft);
  const activeSlot = useAppStore((s) => s.activeSlot);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const emitResult = useEffectEvent((result: RenderResult) => onResult?.(result));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (!draft) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const frame = requestAnimationFrame(() => {
      const result = renderPost(ctx, draft, assets);
      emitResult(result);
      // Preview only: outline the selected position. Export renders on its own canvas.
      const selected = slotPlacements(draft)[activeSlot];
      if (selected) {
        const [first, ...rest] = polaroidCorners(selected);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(first!.x, first!.y);
        for (const corner of rest) ctx.lineTo(corner.x, corner.y);
        ctx.closePath();
        ctx.lineJoin = "round";
        ctx.strokeStyle = SELECTION_OUTLINE.color;
        ctx.lineWidth = SELECTION_OUTLINE.width;
        ctx.stroke();
        ctx.restore();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [draft, assets, activeSlot]);

  // Drag a photo to reposition it, scroll over it to zoom. docs/prd.md#template-selection-and-editing
  const [overPhoto, setOverPhoto] = useState(false);
  const drag = useRef<{ target: PhotoTarget; x: number; y: number } | null>(null);

  /** Pointer position in canvas pixels (the canvas is shown scaled down). */
  const canvasPoint = (e: { clientX: number; clientY: number }) => {
    const box = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - box.left) / box.width) * CANVAS_WIDTH,
      y: ((e.clientY - box.top) / box.height) * CANVAS_HEIGHT,
    };
  };
  /** The topmost adjustable photo under a canvas point. */
  const targetAt = (point: { x: number; y: number }): PhotoTarget | undefined => {
    const current = appStore.getState().draft;
    if (!current) return undefined;
    return photoTargets(current, assets)
      .reverse()
      .find((t) => isOverWindow(t.placement, point));
  };
  /** Apply `change` to the current view of a target's slot. */
  const adjust = (target: PhotoTarget, change: (size: Size, view: View) => View) => {
    const { draft: current, setSlotView } = appStore.getState();
    const slot = current && hasSlots(current) ? current.slots[target.slot] : undefined;
    if (!slot) return;
    setSlotView(target.slot, change({ w: target.photo.width, h: target.photo.height }, slot));
  };

  function onPointerDown(e: PointerEvent<HTMLCanvasElement>) {
    if (e.button !== 0) return;
    const point = canvasPoint(e);
    // Clicking a polaroid (photo or frame, filled or empty) selects its position.
    const { draft: current, setActiveSlot } = appStore.getState();
    const placements = current ? slotPlacements(current) : [];
    // Later positions sit on top, so the last match is the one under the pointer.
    const clicked = placements.map((p) => isOverPolaroid(p, point)).lastIndexOf(true);
    if (clicked !== -1) setActiveSlot(clicked);
    const target = targetAt(point);
    if (!target) return;
    drag.current = { target, ...point };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: PointerEvent<HTMLCanvasElement>) {
    const point = canvasPoint(e);
    const d = drag.current;
    if (!d) {
      setOverPhoto(targetAt(point) !== undefined);
      return;
    }
    const delta = deltaToPolaroidSpace(d.target.placement, point.x - d.x, point.y - d.y);
    drag.current = { ...d, ...point };
    adjust(d.target, (size, view) => panByPixels(size, POLAROID.window, view, delta.x, delta.y));
  }
  function endDrag() {
    drag.current = null;
  }

  // React's wheel listener is passive, so the page would scroll too; attach our own.
  const onWheel = useEffectEvent((e: WheelEvent) => {
    const target = targetAt(canvasPoint(e));
    if (!target) return;
    e.preventDefault();
    adjust(target, (size, view) =>
      zoomTo(size, POLAROID.window, view, view.zoom * Math.exp(-e.deltaY * WHEEL_ZOOM_RATE)),
    );
  });
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const listener = (e: WheelEvent) => onWheel(e);
    canvas.addEventListener("wheel", listener, { passive: false });
    return () => canvas.removeEventListener("wheel", listener);
  }, []);

  // One canvas in both states: as a replaced element it keeps 3:4 however the panel is shaped.
  return (
    <div className="relative flex h-full min-h-0 items-center justify-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className={`${RENDER_CANVAS_CLASS} max-h-full max-w-full touch-none rounded-sm ${draft ? "shadow-sm" : "bg-neutral-200"} ${overPhoto ? "cursor-grab active:cursor-grabbing" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => !drag.current && setOverPhoto(false)}
        aria-label={`Post preview, ${CANVAS_WIDTH} by ${CANVAS_HEIGHT}`}
      />
      {!draft && (
        <span className="absolute text-sm text-neutral-500">Choose a template to start</span>
      )}
    </div>
  );
}
