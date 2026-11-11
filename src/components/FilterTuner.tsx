import { useSyncExternalStore } from "react";
import { getGrainSettings, setGrainSettings, subscribeGrain } from "@/render/grain";
import {
  getPhotoEffects,
  setPhotoEffects,
  subscribePhotoEffects,
  type PhotoEffects,
} from "@/render/photoEffects";
import { FILM_LOOK, GRAIN } from "@/templates/constants";

/**
 * TEMPORARY: live sliders for the photo looks, shown with `?tune` in the URL, so the
 * owner can choose values by eye. Nothing here is saved. Chosen values become constants
 * and this panel is removed.
 */
const TUNING =
  typeof window !== "undefined" && new URLSearchParams(window.location.search).has("tune");

interface SliderProps {
  label: string;
  value: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

function Slider({ label, value, max, step, onChange }: SliderProps) {
  const id = `tune-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="w-28 text-xs text-neutral-600">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-w-0 flex-1"
      />
      <span className="w-10 text-right text-xs text-neutral-900 tabular-nums">
        {step >= 1 ? value : value.toFixed(2)}
      </span>
    </div>
  );
}

const EFFECT_SLIDERS: readonly {
  key: keyof PhotoEffects;
  label: string;
  max: number;
  step: number;
}[] = [
  { key: "glowRadius", label: "Glow radius", max: 60, step: 1 },
  { key: "glowStrength", label: "Glow strength", max: 1, step: 0.01 },
  { key: "fadeLift", label: "Fade blacks", max: 0.5, step: 0.01 },
  { key: "fadeHighlights", label: "Fade whites", max: 0.5, step: 0.01 },
  { key: "fadeDesaturate", label: "Fade colour", max: 1, step: 0.01 },
];

export function FilterTuner() {
  const grain = useSyncExternalStore(subscribeGrain, getGrainSettings, getGrainSettings);
  const effects = useSyncExternalStore(subscribePhotoEffects, getPhotoEffects, getPhotoEffects);
  if (!TUNING) return null;

  const heading = "text-xs font-medium tracking-wide text-amber-900 uppercase";
  return (
    <div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 p-3">
      <p className="text-xs font-medium text-amber-900">
        Film look tuning (temporary). Tick “Film look” on a post to see it. Changes last until you
        reload.
      </p>

      <p className={heading}>Soft glow and faded film</p>
      {EFFECT_SLIDERS.map(({ key, label, max, step }) => (
        <Slider
          key={key}
          label={label}
          value={effects[key]}
          max={max}
          step={step}
          onChange={(value) => setPhotoEffects({ [key]: value })}
        />
      ))}

      <p className={heading}>Grain</p>
      <Slider
        label="Opacity"
        value={grain.opacity}
        max={1}
        step={0.01}
        onChange={(opacity) => setGrainSettings({ opacity })}
      />
      <Slider
        label="Amplitude"
        value={grain.amplitude}
        max={127}
        step={1}
        onChange={(amplitude) => setGrainSettings({ amplitude })}
      />

      <button
        type="button"
        onClick={() => {
          setPhotoEffects(FILM_LOOK);
          setGrainSettings({ amplitude: GRAIN.amplitude, opacity: GRAIN.opacity });
        }}
        className="self-start rounded-md border border-amber-400 px-2 py-1 text-xs font-medium text-amber-900"
      >
        Back to built-in
      </button>
    </div>
  );
}
