import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/** A drawer's colours: the panel behind its content, and darker shades for the handle. */
export interface DrawerTint {
  panel: string;
  handle: string;
  handleHover: string;
  edge: string;
}

interface DrawerProps {
  /** Which screen edge the drawer is attached to on a wide screen. */
  side: "left" | "right";
  label: string;
  /** Shown on the handle, so a closed drawer still says how much is in it. */
  count: number;
  /** Width of the open drawer's content on a wide screen, in px. */
  width: number;
  tint: DrawerTint;
  /** True on a narrower screen, where the drawer is a bottom sheet over the editor. */
  sheet: boolean;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/**
 * A secondary panel that opens and closes. Its handle is always visible, and the content
 * stays mounted while closed so uploads, exports and drag targets keep working.
 *
 * - Wide screens (`lg` and up): attached to a screen edge; the content slides open beside
 *   the handle and pushes the editor over.
 * - Narrower screens: the handle is a tab in the bar along the bottom, and the content is a
 *   sheet that rises from the bottom over the editor, above that bar.
 */
export function Drawer({
  side,
  label,
  count,
  width,
  tint,
  sheet,
  open,
  onToggle,
  children,
}: DrawerProps) {
  const left = side === "left";
  const handleRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // An open sheet covers the editor, so it behaves as a dialog: focus moves into it,
  // Escape closes it, and closing hands focus back to its tab.
  const modal = sheet && open;
  useEffect(() => {
    if (!modal) return;
    const content = contentRef.current;
    const tab = handleRef.current;
    // The sheet can't take focus while it is still hidden, which lasts a frame or two into
    // its slide, so keep trying for a moment.
    let frame = 0;
    let tries = 0;
    const takeFocus = () => {
      content?.focus();
      if (document.activeElement !== content && tries++ < 30) {
        frame = requestAnimationFrame(takeFocus);
      }
    };
    frame = requestAnimationFrame(takeFocus);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onToggle();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
      // Only if focus was left in the sheet (now inert) or nowhere: the other tab may have
      // just been pressed, and it keeps focus.
      const active = document.activeElement;
      if (!active || active === document.body || content?.contains(active)) tab?.focus();
    };
  }, [modal, onToggle]);

  // The chevron points the way the drawer will move.
  const sideChevron = left === open ? "‹" : "›";
  const sheetChevron = open ? "⌄" : "⌃";

  const action = `${open ? "Close" : "Open"} ${label}`;
  const handle = (
    <button
      ref={handleRef}
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      // The label replaces the button's contents for a screen reader, so it carries the count.
      aria-label={count > 0 ? `${action} (${count})` : action}
      title={action}
      className={`relative z-4 flex min-h-12 w-full shrink-0 items-center justify-center gap-2 border-t border-(--edge) bg-(--handle) pb-[env(safe-area-inset-bottom)] text-[#555] hover:bg-(--handle-hover) hover:text-neutral-900 lg:min-h-0 lg:w-9 lg:flex-col lg:justify-start lg:gap-3 lg:border-t-0 lg:py-3 ${
        left ? "lg:border-r" : "lg:border-l"
      }`}
    >
      <span className="hidden text-base leading-none lg:inline">{sideChevron}</span>
      <span className="text-base leading-none lg:hidden">{sheetChevron}</span>
      <span className="text-xs font-medium tracking-wide lg:[writing-mode:vertical-rl]">
        {label}
      </span>
      {count > 0 && (
        <span className="flex size-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] leading-none font-medium text-white">
          {count}
        </span>
      )}
    </button>
  );

  const content = (
    <div
      ref={contentRef}
      tabIndex={-1}
      role={sheet ? "dialog" : undefined}
      aria-modal={modal ? true : undefined}
      aria-label={sheet ? label : undefined}
      className={`outline-none fixed inset-x-0 bottom-(--tab-bar) z-3 h-[min(80dvh,100dvh-7rem)] overflow-hidden rounded-t-xl bg-(--panel) shadow-[0_-8px_24px_rgb(0_0_0/0.18)] transition-[translate,visibility] duration-200 ease-out lg:static lg:z-auto lg:h-auto lg:min-h-0 lg:w-(--open-width) lg:translate-y-0 lg:rounded-none lg:shadow-none lg:transition-[width] ${
        open ? "visible translate-y-0" : "invisible translate-y-full lg:visible"
      }`}
      inert={!open}
    >
      {/* Fixed width on a wide screen, so the content slides rather than reflowing. */}
      <div className={`flex h-full w-full lg:w-(--full-width) ${left ? "lg:justify-end" : ""}`}>
        <div className="flex h-full min-h-0 w-full shrink-0 flex-col lg:w-(--full-width)">
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <aside
      className={`flex min-h-0 bg-(--panel) lg:shrink-0 ${
        left ? "col-start-1 row-start-2" : "col-start-2 row-start-2"
      }`}
      style={
        {
          "--panel": tint.panel,
          "--handle": tint.handle,
          "--handle-hover": tint.handleHover,
          "--edge": tint.edge,
          "--full-width": `${width}px`,
          "--open-width": open ? `${width}px` : "0px",
          // The height of the bar of tabs along the bottom of a narrow screen.
          "--tab-bar": "calc(3rem + env(safe-area-inset-bottom))",
        } as CSSProperties
      }
      aria-label={label}
    >
      {/* Narrow screens only: dims the editor behind the open sheet; a tap closes it. */}
      {open && (
        <div
          aria-hidden="true"
          onClick={onToggle}
          className="fixed inset-x-0 top-0 bottom-(--tab-bar) z-2 bg-black/30 lg:hidden"
        />
      )}
      {left ? content : handle}
      {left ? handle : content}
    </aside>
  );
}
