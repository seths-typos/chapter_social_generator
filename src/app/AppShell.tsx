import { useCallback, useState, type CSSProperties } from "react";
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

// Room kept under the preview for its buttons and status line, in px.
const ACTIONS_HEIGHT = 84;
// The template picker and the gap under it, in px.
const PICKER_HEIGHT = 150;
/**
 * How wide the 3:4 preview is in each layout. `cqw`/`cqh` are measured against the nearest
 * sized ancestor: the row of three zones when there are three, otherwise the editor itself.
 */
const PREVIEW_WIDTHS = {
  // One column: pinned above the controls, about two-fifths of the editor's height.
  "--preview-one": "min(100%, clamp(11rem, 38cqh, 26rem) * 0.75)",
  // Preview | controls: as tall as the editor allows with the template picker above it
  // and the actions below, and under half its width. The floor keeps it usable on a
  // phone held sideways, where the picker scrolls away instead.
  "--preview-two": `max(7rem, min(45cqw, (100cqh - ${ACTIONS_HEIGHT + PICKER_HEIGHT}px) * 0.75))`,
  // Texture | preview | form: as large as fits between the two 280px and 300px columns
  // and their 36px gaps.
  "--preview-three": `max(0px, min((100cqh - ${ACTIONS_HEIGHT}px) * 0.75, 100cqw - 652px))`,
} as CSSProperties;

// The drawers are tinted so they read as separate from the editor: pink for the photo
// library, green for the batch.
const PHOTOS_TINT = {
  panel: "#f8eef7",
  handle: "#f0dcee",
  handleHover: "#e8cbe5",
  edge: "#e6cfe3",
};
const BATCH_TINT = { panel: "#e7f4e5", handle: "#d5ebd2", handleHover: "#c3e0bf", edge: "#c6dfc2" };

// A column of cards beside (or, on a narrow screen, under) the preview.
const columnClass =
  "flex w-full max-w-[35rem] shrink-0 flex-col gap-3 self-center @two:max-w-none @two:self-auto @three:min-h-0 @three:overflow-y-auto";

/**
 * The one-screen layout from docs/prd.md#app-flow. The editor (template picker, texture,
 * preview with its actions, the template's form) arranges itself by its own width:
 *   three zones – texture | preview and actions | form, nothing scrolls
 *   two zones   – preview and actions pinned on the left | form then texture, scrolling
 *   one column  – preview pinned on top, form then texture scrolling under it, actions
 *                 pinned at the bottom
 * The photo pool and the batch are drawers: at the left and right edges on a wide screen,
 * sheets rising from a bar of two tabs along the bottom on a narrower one.
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
    <div className="isolate flex h-screen flex-col bg-[#fffff9] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] text-[#191919] supports-[height:100dvh]:h-dvh">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4 sm:px-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#191919] text-white">
          <ChMark className="block h-4" />
        </span>
        {/* Druk's capitals sit above the middle of its line box, so the title is nudged down
            to centre on the logo. */}
        <h1 className="font-display min-w-0 translate-y-[2px] truncate text-xl leading-none font-bold tracking-wide sm:text-2xl">
          Chapter Post Generator
        </h1>
        <span className="ml-auto hidden text-xs text-[#707070] sm:inline">
          Nothing is saved. Download before closing.
        </span>
      </header>
      <FontNotice missing={missingFonts} />

      {/* Narrow: the editor above a bar of two drawer tabs. Wide: drawer | editor | drawer. */}
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-[minmax(0,1fr)_auto] lg:flex">
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

        <main
          className="col-span-2 row-start-1 flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-x-clip overflow-y-auto p-4 [container-type:size]"
          style={PREVIEW_WIDTHS}
        >
          <TemplatePicker assets={assets} />
          <div className="contents @two:grid @two:shrink-0 @two:grid-cols-[auto_minmax(0,1fr)] @two:items-start @two:gap-x-6 @two:gap-y-3 @three:flex @three:min-h-0 @three:flex-1 @three:items-stretch @three:justify-center @three:gap-9 @three:[container-type:size]">
            <section
              className={`order-3 @two:order-none @two:col-start-2 @two:row-start-2 @three:w-[280px] ${columnClass}`}
            >
              <TexturePicker />
            </section>

            {/* The preview with its actions under its bottom corners. In one column the two
                come apart: the preview pins to the top and the actions to the bottom. */}
            <div className="contents @two:sticky @two:top-0 @two:col-start-1 @two:row-span-2 @two:row-start-1 @two:flex @two:w-(--preview-two) @two:flex-col @two:gap-4 @three:static @three:w-(--preview-three) @three:shrink-0">
              <div className="sticky -top-4 z-1 order-1 -mx-4 -my-2 flex shrink-0 justify-center bg-[#fffff9] px-4 py-2 @two:static @two:order-none @two:m-0 @two:block @two:p-0">
                <div className="w-(--preview-one) @two:w-full">
                  <Preview assets={assets} onResult={onResult} />
                </div>
              </div>
              <div className="sticky -bottom-4 z-1 order-5 -mx-4 -mb-4 shrink-0 border-t border-neutral-200 bg-[#fffff9] px-4 py-3 @two:static @two:order-none @two:m-0 @two:border-t-0 @two:p-0">
                <PostActions warnings={warnings} assets={assets} />
              </div>
            </div>

            <section
              className={`order-2 @two:order-none @two:col-start-2 @two:row-start-1 @three:w-[300px] ${columnClass}`}
            >
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
