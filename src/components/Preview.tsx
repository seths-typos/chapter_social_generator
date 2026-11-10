import { useEffect, useEffectEvent, useRef } from "react";
import { useRenderAssets } from "@/render/assets";
import { renderPost } from "@/render/renderPost";
import type { RenderResult } from "@/render/types";
import { useAppStore } from "@/store/store";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/templates/constants";
import { Placeholder } from "./Panel";

interface PreviewProps {
  /** Called after each render with the renderer's fit warnings. */
  onResult?: (result: RenderResult) => void;
}

/**
 * The live preview: a real 1080×1440 canvas scaled down with CSS, so what's shown is
 * pixel-for-pixel what export produces. Re-renders on the next animation frame after
 * any draft change; intermediate changes within a frame are coalesced.
 * docs/technical-requirements.md#rendering-engine
 */
export function Preview({ onResult }: PreviewProps) {
  const draft = useAppStore((s) => s.draft);
  const assets = useRenderAssets();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const emitResult = useEffectEvent((result: RenderResult) => onResult?.(result));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !draft) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const frame = requestAnimationFrame(() => {
      const result = renderPost(ctx, draft, assets);
      emitResult(result);
    });
    return () => cancelAnimationFrame(frame);
  }, [draft, assets]);

  const frameStyle = { aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`, height: "100%" };

  if (!draft) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-h-full rounded-sm bg-neutral-200" style={frameStyle}>
          <Placeholder label="Choose a template to start" issue="" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="max-h-full max-w-full rounded-sm shadow-sm"
        style={{ ...frameStyle, width: "auto" }}
        aria-label={`Post preview, ${CANVAS_WIDTH} by ${CANVAS_HEIGHT}`}
      />
    </div>
  );
}
