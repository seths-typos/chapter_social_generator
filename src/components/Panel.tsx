import type { ReactNode } from "react";

interface PanelProps {
  /** Section heading, set in Druk per the PRD's UI typography note. */
  title: string;
  /** Optional controls shown at the right of the heading (e.g. an Upload button). */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * The titled contents of a drawer: a heading with its controls, then a scrolling body. It
 * has no border or background of its own; the drawer is the surface.
 * See docs/prd.md#generator-ui-notes
 */
export function Panel({ title, actions, children, className = "" }: PanelProps) {
  return (
    <section className={`flex h-full min-h-0 min-w-0 flex-col ${className}`}>
      <header className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
        <h2 className="font-display text-base leading-none font-bold tracking-wide text-neutral-600">
          {title}
        </h2>
        {actions}
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
    </section>
  );
}
