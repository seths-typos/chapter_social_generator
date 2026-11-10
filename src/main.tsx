import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { FontGate } from "./app/FontGate";
import "./app/index.css";
import { parseCompareParam } from "./dev/compare";
import { applyDevParams } from "./dev/devParams";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

/** The app, or in dev builds the comparison view when the URL asks for it (`?compare=info`). */
async function content(): Promise<ReactNode> {
  if (import.meta.env.DEV) {
    const params = new URLSearchParams(window.location.search);
    if (params.has("compare")) {
      // Imported on demand so the view and the reference images never reach a production bundle.
      const { CompareView } = await import("./dev/CompareView");
      return (
        <FontGate>
          <CompareView template={parseCompareParam(params.get("compare")) ?? "info"} />
        </FontGate>
      );
    }
  }
  applyDevParams();
  return <App />;
}

void content().then((node) => createRoot(root).render(<StrictMode>{node}</StrictMode>));
