import { useSyncExternalStore } from "react";
import {
  getShadowSettings,
  setShadowSettings,
  subscribeShadow,
  type ShadowSettings,
} from "@/render/shadow";
import { SHADOW } from "@/templates/constants";

/**
 * TEMPORARY: live sliders for the drop shadow, shown with `?tune` in the URL, so the
 * owner can choose values by eye. Nothing here is saved. Chosen values become constants
 * and this panel is removed.
 */
const SLIDERS: readonly { key: keyof ShadowSettings; label: string; max: number; step: number }[] =
  [
    { key: "opacity", label: "Opacity", max: 1, step: 0.01 },
    { key: "blur", label: "Blur", max: 80, step: 1 },
    { key: "offsetY", label: "Offset down", max: 40, step: 1 },
  ];

export function FilterTuner() {
  const shadow = useSyncExternalStore(subscribeShadow, getShadowSettings, getShadowSettings);
  if (typeof window === "undefined" || !new URLSearchParams(window.location.search).has("tune"))
    return null;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 p-3">
      <p className="text-xs font-medium text-amber-900">
        Shadow tuning (temporary). Applies to every polaroid, graphic and Info card. Changes last
        until you reload.
      </p>
      {SLIDERS.map(({ key, label, max, step }) => {
        const id = `tune-shadow-${key}`;
        return (
          <div key={key} className="flex items-center gap-2">
            <label htmlFor={id} className="w-28 text-xs text-neutral-600">
              {label}
            </label>
            <input
              id={id}
              type="range"
              min={0}
              max={max}
              step={step}
              value={shadow[key]}
              onChange={(e) => setShadowSettings({ [key]: Number(e.target.value) })}
              className="min-w-0 flex-1"
            />
            <span className="w-10 text-right text-xs text-neutral-900 tabular-nums">
              {step >= 1 ? shadow[key] : shadow[key].toFixed(2)}
            </span>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() =>
          setShadowSettings({ opacity: SHADOW.opacity, offsetY: SHADOW.offsetY, blur: SHADOW.blur })
        }
        className="self-start rounded-md border border-amber-400 px-2 py-1 text-xs font-medium text-amber-900"
      >
        Back to built-in
      </button>
    </div>
  );
}
