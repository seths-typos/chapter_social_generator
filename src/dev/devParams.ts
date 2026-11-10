/**
 * Dev-only URL parameters, so a state can be reached by URL while building.
 * Stripped from production builds via `import.meta.env.DEV`.
 *
 *   ?template=info            start with that template's draft open
 *   ?template=info&fixture    ...filled with the inputs of its reference render
 *   ?compare=info             the comparison view (handled in main.tsx, see CompareView)
 *   ?nodruk                   behave as if Druk weren't installed, to see the fallback
 */

import { LOCAL_FONTS } from "@/app/fonts";
import { appStore } from "@/store/store";
import { TEMPLATE_IDS, templateFor } from "@/templates/registry";
import type { TemplateId } from "@/store/types";

export function applyDevParams(search = window.location.search): void {
  if (import.meta.env.DEV) {
    const params = new URLSearchParams(search);
    const template = params.get("template");
    if (template && (TEMPLATE_IDS as readonly string[]).includes(template)) {
      const id = template as TemplateId;
      appStore.getState().setTemplate(id);
      const fixture = templateFor(id).fixture;
      if (params.has("fixture") && fixture) {
        appStore.getState().editDraft(id, fixture);
        // Imported on demand so the fixture images never reach a production bundle.
        void import("./fixtures").then((m) => m.loadFixtureImages({ addToPool: true }));
      }
    }
  }
}

/**
 * `?nodruk`: remove the Druk @font-face rules from the page's stylesheets, so the app takes
 * its not-installed path even on a computer that has Druk.
 */
export function simulateMissingDruk(search = window.location.search): void {
  if (import.meta.env.DEV && new URLSearchParams(search).has("nodruk")) {
    const families = new Set(LOCAL_FONTS.map((f) => f.family));
    for (const sheet of document.styleSheets) {
      for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
        const rule = sheet.cssRules[i];
        if (
          rule instanceof CSSFontFaceRule &&
          families.has(rule.style.getPropertyValue("font-family").replace(/["']/g, ""))
        ) {
          sheet.deleteRule(i);
        }
      }
    }
  }
}
