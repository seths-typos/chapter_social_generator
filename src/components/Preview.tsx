import { useEffect, useEffectEvent, useRef, useState, type PointerEvent } from "react";
import { RENDER_CANVAS_CLASS } from "@/render/canvas";
import { cubicBezier } from "@/render/easing";
import { renderPost } from "@/render/renderPost";
import type { RenderAssets, RenderResult } from "@/render/types";
import { panByPixels, zoomTo, type Size, type View } from "@/render/fit";
import {
  deltaToPolaroidSpace,
  isOverPolaroid,
  isOverWindow,
  polaroidCorners,
  type PolaroidPlacement,
} from "@/render/polaroid";
import { hasSlots } from "@/store/draft";
import { appStore, useAppStore } from "@/store/store";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  LAYOUT_MOTION,
  POLAROID,
  SELECTION_OUTLINE,
  WHEEL_ZOOM_RATE,
} from "@/templates/constants";
import type { PhotoTarget } from "@/templates/definition";
import { layoutOf, photoTargets, slotPlacements } from "@/templates/registry";

const ease = cubicBezier(...LAYOUT_MOTION.curve);

const samePlacements = (a: readonly PolaroidPlacement[], b: readonly PolaroidPlacement[]) =>
  a.length === b.length &&
  a.every((p, i) => {
    const q = b[i]!;
    return p.cx === q.cx && p.cy === q.cy && p.rotation === q.rotation && p.scale === q.scale;
  });

/** Only moves between framed and framed (or unframed and unframed) can be tweened. */
/** Whether the system asks for less motion; the layout then changes without a tween. */
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const canAnimate = (from: readonly PolaroidPlacement[], to: readonly PolaroidPlacement[]) =>
  from.length > 0 && to.length > 0 && Boolean(from[0]!.frameless) === Boolean(to[0]!.frameless);

/** Each polaroid part-way to its new place. One that has just been added starts in place. */
const tween = (from: readonly PolaroidPlacement[], to: readonly PolaroidPlacement[], k: number) =>
  to.map((end, i) => {
    const begin = from[i] ?? end;
    const mix = (a: number, b: number) => a + (b - a) * k;
    return {
      ...end,
      cx: mix(begin.cx, end.cx),
      cy: mix(begin.cy, end.cy),
      rotation: mix(begin.rotation, end.rotation),
      scale: mix(begin.scale, end.scale),
    };
  });

interface PreviewProps {
  assets: RenderAssets;
  /** Called after each render with the renderer's fit warnings. */
  onResult?: (result: RenderResult) => void;
}

/**
 * The live preview: a real 1080×1440 canvas scaled down with CSS, so what's shown is
 * pixel-for-pixel what export produces. Re-renders on the next animation frame after
 * any draft change; intermediate changes within a frame are coalesced. When the layout
 * changes, the polaroids are animated to their new places.
 * docs/technical-requirements.md#rendering-engine
 */
export function Preview({ assets, onResult }: PreviewProps) {
  const draft = useAppStore((s) => s.draft);
  const activeSlot = useAppStore((s) => s.activeSlot);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const emitResult = useEffectEvent((result: RenderResult) => onResult?.(result));

  // Layout changes (more photos, the text card) are animated: the polaroids travel from
  // where they are drawn now to where the draft wants them.
  const motion = useRef<{
    template: string;
    target: PolaroidPlacement[];
    drawn: PolaroidPlacement[];
    from: PolaroidPlacement[] | null;
    start: number | null;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (!draft) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      motion.current = null;
      return;
    }
    const target = layoutOf(draft);
    const last = motion.current;
    if (
      !last ||
      last.template !== draft.template ||
      !canAnimate(last.drawn, target) ||
      prefersReducedMotion()
    ) {
      motion.current = { template: draft.template, target, drawn: target, from: null, start: null };
    } else if (!samePlacements(last.target, target)) {
      motion.current = { ...last, target, from: last.drawn, start: null };
    }

    let frame = requestAnimationFrame(function draw(now) {
      const m = motion.current!;
      let layout = m.target;
      if (m.from) {
        m.start ??= now;
        const progress = (now - m.start) / LAYOUT_MOTION.duration;
        if (progress >= 1) m.from = null;
        else layout = tween(m.from, m.target, ease(progress));
      }
      m.drawn = layout;
      const result = renderPost(ctx, draft, assets, layout.length > 0 ? layout : undefined);
      emitResult(result);
      // Preview only: outline the selected position. Export renders on its own canvas.
      const selectable = slotPlacements(draft).length > 0;
      const selected = selectable ? (layout[activeSlot] ?? undefined) : undefined;
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
      if (m.from) frame = requestAnimationFrame(draw);
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

  // One canvas in both states: it fills the width the shell gives it and keeps 3:4.
  return (
    <div className="relative flex justify-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className={`${RENDER_CANVAS_CLASS} block h-auto w-full touch-none rounded-sm ${draft ? "shadow-sm" : "bg-neutral-200"} ${overPhoto ? "cursor-grab active:cursor-grabbing" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => !drag.current && setOverPhoto(false)}
        aria-label={`Post preview, ${CANVAS_WIDTH} by ${CANVAS_HEIGHT}`}
      />
      {!draft && (
        <span className="font-display absolute top-1/3 text-[29px] leading-none font-bold tracking-wide text-[#555]">
          Choose a template to start
        </span>
      )}
    </div>
  );
}
