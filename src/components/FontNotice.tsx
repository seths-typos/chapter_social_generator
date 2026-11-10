import type { RequiredFont } from "@/app/fonts";

/**
 * Shown when Druk isn't installed on this computer. Posts still render and export, on the
 * fallback typeface, so the user needs to know they aren't on-brand.
 */
export function FontNotice({ missing }: { missing: readonly RequiredFont[] }) {
  if (missing.length === 0) return null;
  const names = missing.map((f) => f.label).join(" and ");
  const plural = missing.length > 1;
  return (
    <p
      role="status"
      className="shrink-0 border-b border-amber-200 bg-amber-50 px-5 py-2 text-sm text-amber-900"
    >
      <strong className="font-medium">
        {names} {plural ? "aren’t" : "isn’t"} installed on this computer.
      </strong>{" "}
      Headlines are using a substitute typeface, so posts won’t match the brand. Install{" "}
      {plural ? "them" : "it"}, then reload this page.
    </p>
  );
}
