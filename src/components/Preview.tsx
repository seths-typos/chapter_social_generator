import { useEffect, useEffectEvent, useRef } from "react";
import { RENDER_CANVAS_CLASS } from "@/render/canvas";
import { renderPost } from "@/render/renderPost";
import type { RenderAssets, RenderResult } from "@/render/types";
import { useAppStore } from "@/store/store";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/templates/constants";

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
    });
    return () => cancelAnimationFrame(frame);
  }, [draft, assets]);

  // One canvas in both states: as a replaced element it keeps 3:4 however the panel is shaped.
  return (
    <div className="relative flex h-full min-h-0 items-center justify-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className={`${RENDER_CANVAS_CLASS} max-h-full max-w-full rounded-sm ${draft ? "shadow-sm" : "bg-neutral-200"}`}
        aria-label={`Post preview, ${CANVAS_WIDTH} by ${CANVAS_HEIGHT}`}
      />
      {!draft && (
        <span className="absolute text-sm text-neutral-500">Choose a template to start</span>
      )}
    </div>
  );
}
