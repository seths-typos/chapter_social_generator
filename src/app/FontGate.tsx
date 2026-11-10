import { useEffect, useState, type ReactNode } from "react";
import { ensureFonts, type RequiredFont } from "./fonts";

type GateState =
  { status: "loading" } | { status: "ready" } | { status: "error"; missing: RequiredFont[] };

/**
 * Blocks the app until the template fonts are confirmed loaded.
 * See docs/technical-requirements.md#fonts. Nothing renders or exports behind a failed gate.
 */
export function FontGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    void ensureFonts().then((result) => {
      if (cancelled) return;
      setState(result.ok ? { status: "ready" } : { status: "error", missing: result.missing });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "ready") return children;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 p-6 text-neutral-900">
      {state.status === "loading" ? (
        <p className="text-sm text-neutral-500" role="status">
          Loading fonts…
        </p>
      ) : (
        <div className="max-w-md" role="alert">
          <h1 className="font-display text-3xl font-bold">Fonts didn’t load</h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-700">
            The generator can’t make posts without the brand fonts, so nothing can be rendered or
            exported. Reload the page to try again. If it keeps happening, check your connection.
          </p>
          <p className="mt-3 text-sm text-neutral-500">
            Missing: {state.missing.map((f) => f.label).join(", ")}
          </p>
        </div>
      )}
    </main>
  );
}
