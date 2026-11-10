/**
 * Dev-only URL parameters, so a state can be reached by URL while building.
 * Stripped from production builds via `import.meta.env.DEV`.
 *
 *   ?template=info            start with that template's draft open
 *   ?template=info&fixture    ...filled with the inputs of its reference render
 */

import { appStore } from "@/store/store";
import { TEMPLATE_IDS, templateFor } from "@/templates/registry";
import type { TemplateId } from "@/store/types";

export function applyDevParams(search = window.location.search): void {
  if (!import.meta.env.DEV) return;
  const params = new URLSearchParams(search);
  const template = params.get("template");
  if (template && (TEMPLATE_IDS as readonly string[]).includes(template)) {
    const id = template as TemplateId;
    appStore.getState().setTemplate(id);
    const fixture = templateFor(id).fixture;
    if (params.has("fixture") && fixture) appStore.getState().editDraft(id, fixture);
  }
}
