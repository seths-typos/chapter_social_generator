import { useEffect, useRef, useState } from "react";
import { useRenderAssets } from "@/render/assets";
import { renderPost } from "@/render/renderPost";
import type { FitWarning } from "@/render/types";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/templates/constants";
import { fixtureDraft, templateFor } from "@/templates/registry";
import { COMPARE_IDS, ZOOMS, type CompareId, type ZoomId } from "./compare";
import { loadFixtureImages } from "./fixtures";

const references = import.meta.glob<string>("../../docs/reference/*.png", {
  query: "?url",
  import: "default",
  eager: true,
});
const referenceUrl = (id: CompareId): string | undefined =>
  Object.entries(references).find(([path]) => path.endsWith(`/${id}.png`))?.[1];

const controlClass = "flex items-center gap-2 text-sm text-neutral-700";

/**
 * Dev only: `?compare={template}`. Renders the template from its fixture inputs and lays
 * the reference render over it, to check a template by eye.
 * docs/technical-requirements.md#visual-review-aid
 */
export function CompareView({ template }: { template: CompareId }) {
  const assets = useRenderAssets();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [opacity, setOpacity] = useState(50);
  const [difference, setDifference] = useState(false);
  const [zoom, setZoom] = useState<ZoomId>("fit");
  const [warnings, setWarnings] = useState<FitWarning[]>([]);
  const definition = templateFor(template);
  const reference = referenceUrl(template);
  const scale = ZOOMS.find((z) => z.id === zoom)?.scale ?? null;

  useEffect(() => {
    void loadFixtureImages();
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const frame = requestAnimationFrame(() => {
      setWarnings(renderPost(ctx, fixtureDraft(template), assets).warnings);
    });
    return () => cancelAnimationFrame(frame);
  }, [template, assets]);

  // Fit: the stack is sized by the canvas, which scales to the available height at 3:4.
  // 100% / 200%: a fixed pixel size inside a scrolling area.
  const size =
    scale === null
      ? { className: "max-h-full max-w-full" }
      : {
          className: "max-w-none",
          style: { width: CANVAS_WIDTH * scale, height: CANVAS_HEIGHT * scale },
        };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-neutral-100 text-neutral-900">
      <header className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 border-b border-neutral-200 bg-white px-5 py-3">
        <h1 className="font-display text-2xl leading-none font-bold tracking-wide">Compare</h1>
        <nav className="flex gap-1" aria-label="Template">
          {COMPARE_IDS.map((id) => (
            <a
              key={id}
              href={`?compare=${id}`}
              aria-current={id === template ? "page" : undefined}
              className={`rounded-md px-2.5 py-1 text-sm ${
                id === template
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {templateFor(id).label}
            </a>
          ))}
        </nav>
        <label className={controlClass}>
          Reference
          <input
            type="range"
            min={0}
            max={100}
            value={opacity}
            disabled={difference}
            onChange={(e) => setOpacity(Number(e.target.value))}
          />
          <span className="w-10 tabular-nums">{difference ? "diff" : `${opacity}%`}</span>
        </label>
        <label className={controlClass}>
          <input
            type="checkbox"
            checked={difference}
            onChange={(e) => setDifference(e.target.checked)}
          />
          Difference
        </label>
        <label className={controlClass}>
          Zoom
          <select
            value={zoom}
            onChange={(e) => setZoom(e.target.value as ZoomId)}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1"
          >
            {ZOOMS.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </select>
        </label>
        <a href="?" className="ml-auto text-sm text-neutral-500 underline">
          Back to the app
        </a>
      </header>

      <p className="shrink-0 px-5 pt-3 text-xs text-neutral-500">
        {definition.fixture
          ? "Rendered from the template’s fixture inputs."
          : "This template has no fixture yet, so it renders empty."}{" "}
        {definition.placeholder && "Its render is still a stand-in. "}
        The background texture differs from the reference by design. In Difference, black means
        identical.
        {warnings.length > 0 && ` Fit warnings: ${warnings.map((w) => w.message).join(" ")}`}
      </p>

      <main
        className={`min-h-0 flex-1 p-5 ${
          scale === null ? "flex items-center justify-center" : "overflow-auto"
        }`}
      >
        <div className={`relative ${scale === null ? "flex h-full min-h-0" : "inline-block"}`}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            aria-label={`${definition.label} render`}
            {...size}
            className={`block ${size.className}`}
          />
          {reference ? (
            <img
              src={reference}
              alt={`${definition.label} reference`}
              className="pointer-events-none absolute inset-0 h-full w-full"
              style={difference ? { mixBlendMode: "difference" } : { opacity: opacity / 100 }}
            />
          ) : (
            <p className="absolute inset-x-0 top-2 text-center text-sm text-red-700">
              No reference image at docs/reference/{template}.png
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
