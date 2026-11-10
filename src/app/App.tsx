import { FontGate } from "./FontGate";

export function App() {
  return (
    <FontGate>
      <main className="flex min-h-screen items-center justify-center bg-neutral-100 p-6 text-neutral-900">
        <div className="text-center">
          <h1 className="font-display text-5xl font-bold">chapter social generator</h1>
          <p className="mt-3 text-sm text-neutral-500">
            Scaffold in place. App shell comes in 0.5.
          </p>
          <p className="mt-6 font-serif text-2xl text-neutral-700">
            Take a break from all the hard work and wintertime blues.
          </p>
        </div>
      </main>
    </FontGate>
  );
}
