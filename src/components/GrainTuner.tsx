import { useSyncExternalStore } from "react";
import { getGrainSettings, setGrainSettings, subscribeGrain } from "@/render/grain";
import { GRAIN } from "@/templates/constants";

/**
 * TEMPORARY: live sliders for the two grain values, shown with `?tune=grain`, so the
 * owner can choose the final numbers by eye. Nothing here is saved: the chosen values go
 * into `GRAIN` in `src/templates/constants.ts`, then this panel is removed.
 */
const TUNE_GRAIN =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("tune") === "grain";

export function GrainTuner() {
  const settings = useSyncExternalStore(subscribeGrain, getGrainSettings, getGrainSettings);
  const row = (
    id: "amplitude" | "opacity",
    label: string,
    max: number,
    step: number,
    digits: number,
  ) => (
    <div className="flex items-center gap-2">
      <label htmlFor={`grain-${id}`} className="w-20 text-xs text-neutral-600">
        {label}
      </label>
      <input
        id={`grain-${id}`}
        type="range"
        min={0}
        max={max}
        step={step}
        value={settings[id]}
        onChange={(e) => setGrainSettings({ [id]: Number(e.target.value) })}
        className="min-w-0 flex-1"
      />
      <span className="w-10 text-right text-xs text-neutral-900 tabular-nums">
        {settings[id].toFixed(digits)}
      </span>
    </div>
  );
  if (!TUNE_GRAIN) return null;
  return (
    <div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 p-3">
      <p className="text-xs font-medium text-amber-900">
        Grain tuning (temporary). Tick “Film grain” on a photo post, then adjust.
      </p>
      {row("opacity", "Opacity", 1, 0.01, 2)}
      {row("amplitude", "Amplitude", 127, 1, 0)}
      <p className="text-xs text-amber-900">
        Current: opacity {settings.opacity.toFixed(2)}, amplitude {settings.amplitude}. Built-in:
        opacity {GRAIN.opacity.toFixed(2)}, amplitude {GRAIN.amplitude}.
      </p>
      <button
        type="button"
        onClick={() => setGrainSettings({ amplitude: GRAIN.amplitude, opacity: GRAIN.opacity })}
        className="self-start rounded-md border border-amber-400 px-2 py-1 text-xs font-medium text-amber-900"
      >
        Back to built-in
      </button>
    </div>
  );
}
