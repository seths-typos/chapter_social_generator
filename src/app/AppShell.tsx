import { useCallback, useState } from "react";
import { BatchList } from "@/components/BatchList";
import { GrainTuner } from "@/components/GrainTuner";
import { ChMark } from "@/components/ChMark";
import { Editor } from "@/components/Editor";
import { FontNotice } from "@/components/FontNotice";
import { Panel } from "@/components/Panel";
import { PhotoPool } from "@/components/PhotoPool";
import { Preview } from "@/components/Preview";
import { TemplatePicker } from "@/components/TemplatePicker";
import { TexturePicker } from "@/components/TexturePicker";
import { useRenderAssets } from "@/render/assets";
import type { FitWarning, RenderResult } from "@/render/types";
import type { RequiredFont } from "./fonts";

const sameWarnings = (a: readonly FitWarning[], b: readonly FitWarning[]) =>
  a.length === b.length && a.every((w, i) => w.field === b[i]?.field && w.message === b[i].message);

/**
 * The one-screen layout from docs/prd.md#app-flow:
 *   left   – session photo pool
 *   center – live preview, with the selected template's controls beside it
 *   right  – batch list and Download all
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

  return (
    <div className="flex h-screen min-w-[1200px] flex-col bg-neutral-100 text-neutral-900">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-5">
        <ChMark className="h-6" />
        <h1 className="font-display text-2xl leading-none font-bold tracking-wide">
          Social Generator
        </h1>
        <span className="ml-auto text-xs text-neutral-400">
          Nothing is saved. Download before closing.
        </span>
      </header>
      <FontNotice missing={missingFonts} />

      <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)_300px] gap-4 p-4">
        <PhotoPool />

        <div className="grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)_minmax(340px,400px)] gap-4">
          <Panel title="Preview">
            <Preview assets={assets} onResult={onResult} />
          </Panel>
          <Panel title="Template">
            <div className="flex flex-col gap-3">
              <TemplatePicker assets={assets} />
              <TexturePicker />
              <Editor warnings={warnings} assets={assets} />
              <GrainTuner />
            </div>
          </Panel>
        </div>

        <BatchList assets={assets} />
      </div>
    </div>
  );
}
