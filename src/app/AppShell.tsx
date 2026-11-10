import { ChMark } from "@/components/ChMark";
import { Panel, Placeholder } from "@/components/Panel";
import { Preview } from "@/components/Preview";

/**
 * The one-screen layout from docs/prd.md#app-flow:
 *   left   – session photo pool
 *   center – live preview + the selected template's controls
 *   right  – batch list and Download all
 * Everything inside the panels is a placeholder until its issue lands.
 */
export function AppShell() {
  return (
    <div className="flex h-screen min-w-[1100px] flex-col bg-neutral-100 text-neutral-900">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-5">
        <ChMark className="h-6" />
        <h1 className="font-display text-2xl leading-none font-bold tracking-wide">
          Social Generator
        </h1>
        <span className="ml-auto text-xs text-neutral-400">
          Nothing is saved. Download before closing.
        </span>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)_340px] gap-4 p-4">
        <Panel title="Photos">
          <Placeholder label="Session photo pool" issue="#14 import · #15 pool panel" />
        </Panel>

        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-4">
          <Panel title="Preview">
            <Preview />
          </Panel>
          <Panel title="Template" className="h-56">
            <Placeholder
              label="Template picker and controls"
              issue="#12 picker · #8 textures · #10 Info fields"
            />
          </Panel>
        </div>

        <Panel
          title="Batch"
          actions={
            <button
              type="button"
              disabled
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Download all
            </button>
          }
        >
          <Placeholder label="Posts in this session" issue="#23 batch list · #25 ZIP export" />
        </Panel>
      </div>
    </div>
  );
}
