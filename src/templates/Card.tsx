import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { LAYOUT_MOTION } from "./constants";
import { CARD_FRAME, CARD_PADDING } from "./formStyles";

const TRANSITION = `height ${LAYOUT_MOTION.duration}ms cubic-bezier(${LAYOUT_MOTION.curve.join(", ")})`;

/**
 * A card whose height animates when its contents grow or shrink (more photo positions,
 * the text card's fields), so the cards below slide instead of jumping.
 */
export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  // The first measurement sets the height without animating from nothing.
  const [animate, setAnimate] = useState(false);

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const frame = el.parentElement!;
    const measure = () => setHeight(el.offsetHeight + frame.offsetHeight - frame.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    const ready = requestAnimationFrame(() => setAnimate(true));
    return () => {
      observer.disconnect();
      cancelAnimationFrame(ready);
    };
  }, []);

  return (
    <div
      className={`shrink-0 overflow-hidden ${CARD_FRAME}`}
      style={{ height: height ?? undefined, transition: animate ? TRANSITION : undefined }}
    >
      <div ref={inner} className={`${CARD_PADDING} ${className}`}>
        {children}
      </div>
    </div>
  );
}
