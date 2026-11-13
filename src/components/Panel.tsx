import type { ReactNode } from "react";

interface PanelProps {
  /** Section heading, set in Druk per the PRD's UI typography note. */
  title: string;
  /** Optional controls shown at the right of the heading (e.g. an Upload button). */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Inside a drawer: no card border or corners, the drawer is the surface. */
  flat?: boolean;
}

/**
 * A titled region of the app shell. Plain by design: the UI is a tool, not a template,
 * and the real visual pass happens in 6.4. See docs/prd.md#generator-ui-notes
 */
export function Panel({ title, actions, children, className = "", flat }: PanelProps) {
  return (
    <section
      className={`flex min-h-0 min-w-0 flex-col ${
        flat ? "h-full" : "rounded-lg border border-neutral-200 bg-white"
      } ${className}`}
    >
      <header className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
        <h2
          className={`font-display leading-none font-bold tracking-wide ${
            flat ? "text-base text-neutral-600" : "text-xl"
          }`}
        >
          {title}
        </h2>
        {actions}
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
    </section>
  );
}

/** Dashed placeholder for a region whose real content arrives in a later issue. */
export function Placeholder({ label, issue }: { label: string; issue: string }) {
  return (
    <div className="flex h-full min-h-24 items-center justify-center rounded-md border border-dashed border-neutral-300 p-4 text-center text-sm text-[#666]">
      <span>
        {label}
        <br />
        <span className="text-xs">{issue}</span>
      </span>
    </div>
  );
}
