import { useEffect, useRef } from "react";
import { scratchRenderCanvas } from "@/render/canvas";
import { renderPost } from "@/render/renderPost";
import { textureKey, type RenderAssets } from "@/render/types";
import { useAppStore } from "@/store/store";
import type { TemplateId } from "@/store/types";
import { THUMBNAIL } from "@/templates/constants";
import { losesTypedText, TEMPLATE_LIST, templateFor, fixtureDraft } from "@/templates/registry";
import { LABEL, FIELD_LABEL, thumbFrame } from "@/templates/formStyles";

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
    // The fixture has no photos and a flat colour for a texture, so of everything in
    // `assets` only the frame and the wordmark can change what is drawn. Redrawing on
    // every photo import would be four full-size renders each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, [template, assets.frame, assets.wordmark]);

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
    <div className="flex shrink-0 flex-col items-center gap-2">
      <h2 id="template-heading" className={LABEL}>
        Template
      </h2>
      <div
        role="group"
        aria-labelledby="template-heading"
        className="flex justify-center gap-[11px]"
      >
        {TEMPLATE_LIST.map((t) => {
          const active = draft?.template === t.id;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={active}
              title={t.label}
              onClick={() => choose(t.id)}
              className="flex w-[66px] flex-col items-center gap-1"
            >
              <span className={`block w-full overflow-hidden ${thumbFrame(active)}`}>
                <Thumbnail template={t.id} assets={assets} />
              </span>
              <span className={FIELD_LABEL}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
