import chSvg from "@/assets/wordmark/ch.svg?raw";

/**
 * The "ch." secondary mark, inlined so it picks up `currentColor`.
 * Size it with a text/height class on the wrapper, e.g. className="h-6".
 */
export function ChMark({ className = "h-6" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block [&>svg]:h-full [&>svg]:w-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: chSvg }}
    />
  );
}
