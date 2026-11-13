import { useCallback, useState } from "react";
import { BatchList } from "@/components/BatchList";
import { ChMark } from "@/components/ChMark";
import { Drawer } from "@/components/Drawer";
import { PostActions, RequiredNote, TemplateForm } from "@/components/Editor";
import { FontNotice } from "@/components/FontNotice";
import { PhotoPool } from "@/components/PhotoPool";
import { Preview } from "@/components/Preview";
import { TemplatePicker } from "@/components/TemplatePicker";
import { TexturePicker } from "@/components/TexturePicker";
import { useRenderAssets } from "@/render/assets";
import type { FitWarning, RenderResult } from "@/render/types";
import { useAppStore } from "@/store/store";
import type { RequiredFont } from "./fonts";

const sameWarnings = (a: readonly FitWarning[], b: readonly FitWarning[]) =>
  a.length === b.length && a.every((w, i) => w.field === b[i]?.field && w.message === b[i].message);

// Widths of the columns beside the preview, the gap between the three, and the room kept
// under the preview for its buttons and status line, in px.
const TEXTURE_COLUMN = 280;
const FORM_COLUMN = 300;
const COLUMN_GAP = 36;
const ACTIONS_HEIGHT = 84;
/**
 * The preview is 3:4 and as large as fits: limited by the row's height (less the actions
 * under it) or by the width left between the two columns, whichever is smaller.
 */
const PREVIEW_WIDTH = `max(0px, min((100cqh - ${ACTIONS_HEIGHT}px) * 0.75, 100cqw - ${
  TEXTURE_COLUMN + FORM_COLUMN + 2 * COLUMN_GAP
}px))`;

// The drawers are tinted so they read as separate from the editor: pink for the photo
// library, green for the batch.
const PHOTOS_TINT = {
  panel: "#f8eef7",
  handle: "#f0dcee",
  handleHover: "#e8cbe5",
  edge: "#e6cfe3",
};
const BATCH_TINT = { panel: "#e7f4e5", handle: "#d5ebd2", handleHover: "#c3e0bf", edge: "#c6dfc2" };

const columnClass = "flex min-h-0 shrink-0 flex-col gap-3 overflow-y-auto";

/**
 * The one-screen layout from docs/prd.md#app-flow:
 *   left   – session photo pool, in a drawer
 *   center – template picker, then texture | live preview with Add to batch and
 *            Download PNG under it | the template's form
 *   right  – batch list and Download all, in a drawer
 */
export function AppShell({ missingFonts }: { missingFonts: readonly RequiredFont[] }) {
  // The renderer is the only thing that knows whether text fits, so the preview reports
  // its warnings here and the editor uses them to block Add to batch.
  const assets = useRenderAssets();
  const [warnings, setWarnings] = useState<readonly FitWarning[]>([]);
  const onResult = useCallback(
    (result: RenderResult) =>
      setWarnings((prev) => (sameWarnings(prev, result.warnings) ? prev : result.warnings)),
    [],
  );
  // Photos and Batch are secondary to making a post, so they live in drawers at the edges.
  // Only one is open at a time, so the preview keeps its room on a narrow window.
  const [openDrawer, setOpenDrawer] = useState<"photos" | "batch" | null>(null);
  const toggle = (drawer: "photos" | "batch") =>
    setOpenDrawer((open) => (open === drawer ? null : drawer));
  const photosOpen = openDrawer === "photos";
  const batchOpen = openDrawer === "batch";
  const photoCount = useAppStore((s) => s.pool.length);
  const batchCount = useAppStore((s) => s.batch.length);

  return (
    <div className="flex h-screen min-w-[1200px] flex-col bg-[#fffff9] text-[#191919]">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#191919] text-white">
          <ChMark className="block h-4" />
        </span>
        {/* Druk's capitals sit above the middle of its line box, so the title is nudged down
            to centre on the logo. */}
        <h1 className="font-display translate-y-[2px] text-2xl leading-none font-bold tracking-wide">
          Chapter Post Generator
        </h1>
        <span className="ml-auto text-xs text-[#707070]">
          Nothing is saved. Download before closing.
        </span>
      </header>
      <FontNotice missing={missingFonts} />

      <div className="flex min-h-0 flex-1">
        <Drawer
          side="left"
          label="Photo Library"
          count={photoCount}
          width={240}
          tint={PHOTOS_TINT}
          open={photosOpen}
          onToggle={() => toggle("photos")}
        >
          <PhotoPool />
        </Drawer>

        {/* No scrolling: template picker on top, then texture | preview and actions | the form. */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 p-4">
          <TemplatePicker assets={assets} />
          <div className="flex min-h-0 flex-1 justify-center gap-9 [container-type:size]">
            <section className={columnClass} style={{ width: TEXTURE_COLUMN }}>
              <TexturePicker />
            </section>
            {/* The preview with its actions tucked under its bottom corners. */}
            <div className="flex shrink-0 flex-col gap-4" style={{ width: PREVIEW_WIDTH }}>
              <Preview assets={assets} onResult={onResult} />
              <PostActions warnings={warnings} assets={assets} />
            </div>
            <section className={columnClass} style={{ width: FORM_COLUMN }}>
              <TemplateForm />
              <RequiredNote />
            </section>
          </div>
        </main>

        <Drawer
          side="right"
          label="Batch"
          count={batchCount}
          width={300}
          tint={BATCH_TINT}
          open={batchOpen}
          onToggle={() => toggle("batch")}
        >
          <BatchList assets={assets} />
        </Drawer>
      </div>
    </div>
  );
}
