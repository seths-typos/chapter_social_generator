import { useEffect, useRef } from "react";
import { scratchRenderCanvas } from "@/render/canvas";
import { renderPost } from "@/render/renderPost";
import { textureKey, type RenderAssets } from "@/render/types";
import { useAppStore } from "@/store/store";
import type { TemplateId } from "@/store/types";
import { THUMBNAIL } from "@/templates/constants";
import { losesTypedText, TEMPLATE_LIST, templateFor, fixtureDraft } from "@/templates/registry";

/** A template's thumbnail: the real renderer on a plain grey background, drawn at full size and scaled down. */
function Thumbnail({ template, assets }: { template: TemplateId; assets: RenderAssets }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const out = ref.current?.getContext("2d");
    if (!out) return;
    const scratch = scratchRenderCanvas();
    const ctx = scratch.getContext("2d");
    if (!ctx) return;
    const draft = fixtureDraft(template);
    // A flat grey stands in for whichever texture the draft names.
    const textures = new Map([
      [textureKey(draft.texture), { kind: "color", color: THUMBNAIL.background } as const],
    ]);
    renderPost(ctx, draft, { ...assets, textures });
    out.imageSmoothingQuality = "high";
    out.drawImage(scratch, 0, 0, THUMBNAIL.width, THUMBNAIL.height);
  }, [template, assets]);

  return (
    <canvas
      ref={ref}
      width={THUMBNAIL.width}
      height={THUMBNAIL.height}
      className="block h-auto w-full"
    />
  );
}

/**
 * Choose the post's template. Always visible: with no draft it starts one, and with a
 * draft it switches template, keeping what carries over. Switching away from typed text
 * asks first. docs/prd.md#template-selection-and-editing
 */
export function TemplatePicker({ assets }: { assets: RenderAssets }) {
  const draft = useAppStore((s) => s.draft);
  const setTemplate = useAppStore((s) => s.setTemplate);

  function choose(id: TemplateId) {
    if (draft && losesTypedText(draft, id)) {
      const ok = window.confirm(
        `Switch to ${templateFor(id).label}? The text you typed won’t carry over.`,
      );
      if (!ok) return;
    }
    setTemplate(id);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium tracking-wide text-neutral-500 uppercase">Template</span>
      <div className="grid grid-cols-5 gap-2">
        {TEMPLATE_LIST.map((t) => {
          const active = draft?.template === t.id;
          return (
            <button
              key={t.id}
              type="button"
              disabled={t.placeholder}
              aria-pressed={active}
              title={t.placeholder ? `${t.label}: coming soon` : t.label}
              onClick={() => choose(t.id)}
              className="group flex flex-col items-center gap-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span
                className={`block w-full overflow-hidden rounded-sm border ${
                  active
                    ? "border-neutral-900 ring-2 ring-neutral-900 ring-offset-1"
                    : "border-neutral-200 group-enabled:group-hover:border-neutral-400"
                }`}
              >
                <Thumbnail template={t.id} assets={assets} />
              </span>
              <span className="text-[11px] leading-tight text-neutral-600">
                {t.label}
                {t.placeholder && <span className="block text-neutral-400">Soon</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
