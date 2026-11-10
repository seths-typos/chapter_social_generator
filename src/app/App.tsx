import { AppShell } from "./AppShell";
import { FontGate } from "./FontGate";

export function App() {
  return <FontGate>{(fonts) => <AppShell missingFonts={fonts.missingLocal} />}</FontGate>;
}
