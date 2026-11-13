import type { ReactNode } from "react";
import type { InfoFields } from "@/store/draft";
import { EVENT_NUMBER_MAX, EVENT_NUMBER_MIN } from "./constants";
import type { EditorProps } from "./definition";
import { CARD, REQUIRED_MARK, FIELD_LABEL, INPUT, MUTED } from "./formStyles";

function Field({
  label,
  hint,
  required,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${CARD} ${className}`}>
      <span className={FIELD_LABEL}>
        {label}
        {required && REQUIRED_MARK}
        {hint && <span className={MUTED}> · {hint}</span>}
      </span>
      {children}
    </label>
  );
}

/** Digits only, clamped to the allowed range. Blank clears the number. */
function parseEventNumber(raw: string): number | null {
  const digits = raw.replace(/\D/g, "");
  if (digits === "") return null;
  return Math.min(EVENT_NUMBER_MAX, Math.max(EVENT_NUMBER_MIN, Number(digits)));
}

/** The Info template's form. docs/prd.md#template-selection-and-editing */
export function InfoEditor({ draft, onChange }: EditorProps<"info">) {
  const { info } = draft;
  const set = (patch: Partial<InfoFields>) =>
    onChange((d) => ({ ...d, info: { ...d.info, ...patch } }));

  return (
    <div className="grid grid-cols-6 gap-3">
      <Field label="Event no." required className="col-span-2">
        <input
          className={INPUT}
          aria-required
          inputMode="numeric"
          placeholder="1"
          value={info.eventNumber ?? ""}
          onChange={(e) => set({ eventNumber: parseEventNumber(e.target.value) })}
        />
      </Field>
      <Field label="Title" required className="col-span-4">
        <input
          className={INPUT}
          aria-required
          placeholder="Recess At Night!"
          value={info.title}
          onChange={(e) => set({ title: e.target.value })}
        />
      </Field>
      <Field label="Body" hint="optional" className="col-span-6">
        <textarea
          className={`${INPUT} resize-none`}
          rows={4}
          placeholder="A few sentences about the event."
          value={info.body}
          onChange={(e) => set({ body: e.target.value })}
        />
      </Field>
      <Field label="Date" required className="col-span-6">
        <input
          className={INPUT}
          aria-required
          type="date"
          value={info.date}
          onChange={(e) => set({ date: e.target.value })}
        />
      </Field>
      <Field label="Start time" required className="col-span-3">
        <input
          className={INPUT}
          aria-required
          type="time"
          value={info.startTime}
          onChange={(e) => set({ startTime: e.target.value })}
        />
      </Field>
      <Field label="End time" hint="optional" className="col-span-3">
        <input
          className={INPUT}
          type="time"
          value={info.endTime}
          onChange={(e) => set({ endTime: e.target.value })}
        />
      </Field>
      <Field label="Location" required className="col-span-6">
        <input
          className={INPUT}
          aria-required
          placeholder="Anew Café & Goods, New York, NY"
          value={info.location}
          onChange={(e) => set({ location: e.target.value })}
        />
      </Field>
    </div>
  );
}
