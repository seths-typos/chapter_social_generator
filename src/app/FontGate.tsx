import { useEffect, useState, type ReactNode } from "react";
import { ensureFonts, type RequiredFont } from "./fonts";

type GateState =
  | { status: "loading" }
  | { status: "ready"; missingLocal: RequiredFont[] }
  | { status: "error"; missing: RequiredFont[] };

interface FontGateProps {
  /** Rendered once fonts are settled. `missingLocal` lists fonts not installed on this computer. */
  children: (fonts: { missingLocal: RequiredFont[] }) => ReactNode;
}

/**
 * Blocks the app until the bundled template fonts are confirmed loaded, and reports which
 * local fonts (Druk) aren't installed. See docs/technical-requirements.md#fonts.
 * Nothing renders or exports behind a failed gate.
 */
export function FontGate({ children }: FontGateProps) {
  const [state, setState] = useState<GateState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    void ensureFonts().then((result) => {
      if (cancelled) return;
      setState(
        result.ok
          ? { status: "ready", missingLocal: result.missingLocal }
          : { status: "error", missing: result.missing },
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "ready") return children({ missingLocal: state.missingLocal });

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 p-6 text-neutral-900">
      {state.status === "loading" ? (
        <p className="text-sm text-neutral-500" role="status">
          Loading fonts…
        </p>
      ) : (
        <div className="max-w-md" role="alert">
          <h1 className="text-3xl font-bold">Fonts didn’t load</h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-700">
            The generator can’t make posts without its fonts, so nothing can be rendered or
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
