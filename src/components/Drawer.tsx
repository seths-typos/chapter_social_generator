import type { CSSProperties, ReactNode } from "react";

/** A drawer's colours: the panel behind its content, and darker shades for the handle. */
export interface DrawerTint {
  panel: string;
  handle: string;
  handleHover: string;
  edge: string;
}

interface DrawerProps {
  /** Which screen edge the drawer is attached to. */
  side: "left" | "right";
  label: string;
  /** Shown on the handle, so a closed drawer still says how much is in it. */
  count: number;
  /** Width of the open drawer's content, in px. */
  width: number;
  tint: DrawerTint;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/**
 * A secondary panel attached to a screen edge that slides open and closed. The handle on
 * its inner edge is always visible; the content stays mounted while closed so uploads,
 * exports and drag targets keep working.
 */
export function Drawer({ side, label, count, width, tint, open, onToggle, children }: DrawerProps) {
  const left = side === "left";
  // The chevron points the way the drawer will move.
  const chevron = left === open ? "‹" : "›";

  const handle = (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={`${open ? "Close" : "Open"} ${label}`}
      title={`${open ? "Close" : "Open"} ${label}`}
      className={`flex w-9 shrink-0 flex-col items-center gap-3 bg-(--handle) py-3 text-[#555] hover:bg-(--handle-hover) hover:text-neutral-900 ${
        left ? "border-r" : "border-l"
      } border-(--edge)`}
    >
      <span className="text-base leading-none">{chevron}</span>
      <span className="text-xs font-medium tracking-wide [writing-mode:vertical-rl]">{label}</span>
      {count > 0 && (
        <span className="flex size-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] leading-none font-medium text-white">
          {count}
        </span>
      )}
    </button>
  );

  const content = (
    <div
      className="min-h-0 overflow-hidden transition-[width] duration-200 ease-out"
      style={{ width: open ? width : 0 }}
      inert={!open}
    >
      {/* Fixed width, so the content slides rather than reflowing as the drawer moves. */}
      <div className={`flex h-full ${left ? "justify-end" : ""}`} style={{ width }}>
        <div className="flex h-full min-h-0 shrink-0 flex-col" style={{ width }}>
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <aside
      className="flex min-h-0 shrink-0 bg-(--panel)"
      style={
        {
          "--panel": tint.panel,
          "--handle": tint.handle,
          "--handle-hover": tint.handleHover,
          "--edge": tint.edge,
        } as CSSProperties
      }
      aria-label={label}
    >
      {left ? content : handle}
      {left ? handle : content}
    </aside>
  );
}
