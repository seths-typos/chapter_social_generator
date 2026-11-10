import { AppShell } from "./AppShell";
import { FontGate } from "./FontGate";

export function App() {
  return (
    <FontGate>
      <AppShell />
    </FontGate>
  );
}
