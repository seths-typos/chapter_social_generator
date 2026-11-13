import { useSyncExternalStore } from "react";
import type { TextCardDraft } from "@/store/draft";
import { TEXT_CARD } from "./constants";
import { getTextCardSplit, setTextCardSplit, subscribeTextCardSplit } from "./textCard";
import { REQUIRED_MARK, FIELD_LABEL, CHECK_ROW, CHECKBOX, INPUT } from "./formStyles";
import { Card } from "./Card";

interface Props {
  card: TextCardDraft;
  onCard: (card: TextCardDraft) => void;
}

/** The optional text card's fields. */
export function TextCardEditor({ card, onCard }: Props) {
  return (
    <Card className="flex flex-col gap-2">
      <label className={CHECK_ROW}>
        <input
          type="checkbox"
          className={CHECKBOX}
          checked={card.on}
          onChange={(e) => onCard({ ...card, on: e.target.checked })}
        />
        Add text card
      </label>
      {card.on && (
        <>
          <label className={`flex flex-col gap-1 ${FIELD_LABEL}`}>
            Heading (optional, smaller and italic)
            <input
              type="text"
              value={card.heading}
              onChange={(e) => onCard({ ...card, heading: e.target.value })}
              className={INPUT}
            />
          </label>
          <label className={`flex flex-col gap-1 ${FIELD_LABEL}`}>
            <span>Text{REQUIRED_MARK}</span>
            <input
              type="text"
              value={card.text}
              onChange={(e) => onCard({ ...card, text: e.target.value })}
              className={INPUT}
              aria-required
            />
          </label>
          <SplitTuner />
        </>
      )}
    </Card>
  );
}

/**
 * TEMPORARY: a live slider for how much of the canvas the text area takes, shown with
 * `?tune` in the URL, so the owner can choose it by eye. Nothing here is saved. The chosen
 * value becomes the constant and this slider is removed.
 */
function SplitTuner() {
  const split = useSyncExternalStore(subscribeTextCardSplit, getTextCardSplit, getTextCardSplit);
  if (typeof window === "undefined" || !new URLSearchParams(window.location.search).has("tune"))
    return null;
  return (
    <div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 p-3">
      <p className="text-xs font-medium text-amber-900">
        Text area tuning (temporary). Changes last until you reload.
      </p>
      <div className="flex items-center gap-2">
        <label htmlFor="tune-text-split" className="w-28 text-xs text-neutral-600">
          Text area height
        </label>
        <input
          id="tune-text-split"
          type="range"
          min={0.1}
          max={0.5}
          step={0.005}
          value={split}
          onChange={(e) => setTextCardSplit(Number(e.target.value))}
          className="min-w-0 flex-1"
        />
        <span className="w-12 text-right text-xs text-neutral-900 tabular-nums">
          {(split * 100).toFixed(1)}%
        </span>
      </div>
      <button
        type="button"
        onClick={() => setTextCardSplit(TEXT_CARD.split)}
        className="self-start rounded-md border border-amber-400 px-2 py-1 text-xs font-medium text-amber-900"
      >
        Back to built-in
      </button>
    </div>
  );
}
