import type { ReactNode } from "react";
import type { InfoFields } from "@/store/draft";
import { EVENT_NUMBER_MAX, EVENT_NUMBER_MIN } from "./constants";
import type { EditorProps } from "./definition";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none";

function Field({
  label,
  hint,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-medium text-neutral-600">
        {label}
        {hint && <span className="font-normal text-neutral-400"> · {hint}</span>}
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
      <Field label="Event no." className="col-span-2">
        <input
          className={inputClass}
          inputMode="numeric"
          placeholder="1"
          value={info.eventNumber ?? ""}
          onChange={(e) => set({ eventNumber: parseEventNumber(e.target.value) })}
        />
      </Field>
      <Field label="Title" className="col-span-4">
        <input
          className={inputClass}
          placeholder="Recess At Night!"
          value={info.title}
          onChange={(e) => set({ title: e.target.value })}
        />
      </Field>
      <Field label="Body" hint="optional" className="col-span-6">
        <textarea
          className={`${inputClass} resize-none`}
          rows={4}
          placeholder="A few sentences about the event."
          value={info.body}
          onChange={(e) => set({ body: e.target.value })}
        />
      </Field>
      <Field label="Date" className="col-span-6">
        <input
          className={inputClass}
          type="date"
          value={info.date}
          onChange={(e) => set({ date: e.target.value })}
        />
      </Field>
      <Field label="Start time" className="col-span-3">
        <input
          className={inputClass}
          type="time"
          value={info.startTime}
          onChange={(e) => set({ startTime: e.target.value })}
        />
      </Field>
      <Field label="End time" hint="optional" className="col-span-3">
        <input
          className={inputClass}
          type="time"
          value={info.endTime}
          onChange={(e) => set({ endTime: e.target.value })}
        />
      </Field>
      <Field label="Location" className="col-span-6">
        <input
          className={inputClass}
          placeholder="Anew Café & Goods, New York, NY"
          value={info.location}
          onChange={(e) => set({ location: e.target.value })}
        />
      </Field>
    </div>
  );
}
