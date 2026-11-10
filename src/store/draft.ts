/**
 * The editor's working state: one post in progress, shaped like the `Post` it will
 * become but with required inputs still allowed to be empty. A Draft exists only after
 * a template has been chosen (`null` in the store means "at the template picker").
 *
 * `toPost` turns a complete Draft into a `Post`; `fromPost` loads a batch item for
 * editing; `convertDraft` switches template, carrying over only compatible inputs
 * (texture, and photos between the photo templates). See docs/decisions/0001-*.md
 */

import { MULTI_PHOTO_MAX, MULTI_PHOTO_MIN, type MultiPhotoCount } from "@/templates/constants";
import { DEFAULT_TEXTURE } from "@/templates/meta";
import type { PhotoSlot, Post, TemplateId, TextureRef } from "./types";

export interface DraftSlot {
  photoId: string | null;
  panX: number;
  panY: number;
  zoom: number;
}

export interface InfoFields {
  eventNumber: number | null;
  title: string;
  body: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
}

interface DraftBase {
  texture: TextureRef;
  /** True once the user has picked a texture for this draft (stops template defaults overriding it). */
  textureChosen: boolean;
}

export type Draft =
  | (DraftBase & { template: "cover" | "photo"; slots: [DraftSlot]; grain: boolean })
  | (DraftBase & { template: "multi-photo"; slots: DraftSlot[] /* 2–4 */; grain: boolean })
  | (DraftBase & { template: "graphic"; graphicId: string | null })
  | (DraftBase & { template: "info"; info: InfoFields });

export type PhotoDraft = Extract<Draft, { slots: DraftSlot[] }>;

export const emptySlot = (): DraftSlot => ({ photoId: null, panX: 0, panY: 0, zoom: 1 });

export const emptyInfo = (): InfoFields => ({
  eventNumber: null,
  title: "",
  body: "",
  date: "",
  startTime: "",
  endTime: "",
  location: "",
});

export function hasSlots(draft: Draft): draft is PhotoDraft {
  return "slots" in draft;
}

/** A fresh, empty draft for a template. Uses the template's default texture unless one is given. */
export function newDraft(template: TemplateId, texture?: TextureRef): Draft {
  const base: DraftBase = { texture: texture ?? DEFAULT_TEXTURE[template], textureChosen: false };
  switch (template) {
    case "cover":
    case "photo":
      return { ...base, template, slots: [emptySlot()], grain: false };
    case "multi-photo":
      return { ...base, template, slots: [emptySlot(), emptySlot()], grain: false };
    case "graphic":
      return { ...base, template, graphicId: null };
    case "info":
      return { ...base, template, info: emptyInfo() };
  }
}

/**
 * Switch an in-progress draft to another template. Carries the texture (when chosen or
 * carried over from the session) and photos between the photo templates; drops the rest.
 */
export function convertDraft(
  draft: Draft,
  template: TemplateId,
  opts: { lastUsedTexture: TextureRef | null },
): Draft {
  if (draft.template === template) return draft;
  const keepTexture = draft.textureChosen || opts.lastUsedTexture !== null;
  const next = newDraft(template, keepTexture ? draft.texture : undefined);
  next.textureChosen = draft.textureChosen;
  if (hasSlots(draft) && hasSlots(next)) {
    next.grain = draft.grain;
    const carried = draft.slots.filter((s) => s.photoId !== null).map((s) => ({ ...s }));
    if (next.template === "multi-photo") {
      const n = Math.min(MULTI_PHOTO_MAX, Math.max(MULTI_PHOTO_MIN, carried.length));
      next.slots = Array.from({ length: n }, (_, i) => carried[i] ?? emptySlot());
    } else if (carried[0]) {
      next.slots = [carried[0]];
    }
  }
  return next;
}

/** How many photo slots the draft's template uses. */
export function slotCount(draft: Draft): number {
  return hasSlots(draft) ? draft.slots.length : 0;
}

/** Resize a Multi-Photo draft's slots, keeping existing photos. */
export function withPhotoCount(draft: Draft, count: MultiPhotoCount): Draft {
  if (draft.template !== "multi-photo") return draft;
  const n = Math.min(MULTI_PHOTO_MAX, Math.max(MULTI_PHOTO_MIN, count));
  return { ...draft, slots: Array.from({ length: n }, (_, i) => draft.slots[i] ?? emptySlot()) };
}

function toSlot(s: DraftSlot): PhotoSlot | null {
  return s.photoId === null
    ? null
    : { photoId: s.photoId, panX: s.panX, panY: s.panY, zoom: s.zoom };
}

/** Which required inputs are still missing. Empty when the draft is complete. */
export function missingInputs(draft: Draft): string[] {
  const missing: string[] = [];
  switch (draft.template) {
    case "cover":
    case "photo":
    case "multi-photo": {
      const n = draft.slots.length;
      const empty = draft.slots.filter((s) => s.photoId === null).length;
      if (empty > 0) missing.push(n === 1 ? "photo" : `${empty} of ${n} photos`);
      break;
    }
    case "graphic":
      if (!draft.graphicId) missing.push("graphic");
      break;
    case "info": {
      const i = draft.info;
      if (i.eventNumber === null) missing.push("event number");
      if (!i.title.trim()) missing.push("title");
      if (!i.date) missing.push("date");
      if (!i.startTime) missing.push("start time");
      if (!i.location.trim()) missing.push("location");
      break;
    }
  }
  return missing;
}

/** A complete, renderable Post, or null if any required input is missing. */
export function toPost(draft: Draft): Post | null {
  if (missingInputs(draft).length > 0) return null;
  switch (draft.template) {
    case "cover":
    case "photo": {
      const slot = toSlot(draft.slots[0]);
      if (!slot) return null;
      return {
        template: draft.template,
        slots: [slot],
        texture: draft.texture,
        grain: draft.grain,
      };
    }
    case "multi-photo": {
      const slots = draft.slots.map(toSlot);
      if (slots.some((s) => s === null)) return null;
      return {
        template: "multi-photo",
        slots: slots as PhotoSlot[],
        texture: draft.texture,
        grain: draft.grain,
      };
    }
    case "graphic":
      return { template: "graphic", graphicId: draft.graphicId!, texture: draft.texture };
    case "info": {
      const i = draft.info;
      return {
        template: "info",
        eventNumber: i.eventNumber!,
        title: i.title,
        body: i.body,
        date: i.date,
        startTime: i.startTime,
        ...(i.endTime ? { endTime: i.endTime } : {}),
        location: i.location,
        texture: draft.texture,
      };
    }
  }
}

/** Load a stored Post back into an editable Draft. Its texture counts as chosen. */
export function fromPost(post: Post): Draft {
  const base: DraftBase = { texture: post.texture, textureChosen: true };
  switch (post.template) {
    case "cover":
    case "photo":
      return { ...base, template: post.template, slots: [{ ...post.slots[0] }], grain: post.grain };
    case "multi-photo":
      return {
        ...base,
        template: "multi-photo",
        slots: post.slots.map((s) => ({ ...s })),
        grain: post.grain,
      };
    case "graphic":
      return { ...base, template: "graphic", graphicId: post.graphicId };
    case "info":
      return {
        ...base,
        template: "info",
        info: {
          eventNumber: post.eventNumber,
          title: post.title,
          body: post.body,
          date: post.date,
          startTime: post.startTime,
          endTime: post.endTime ?? "",
          location: post.location,
        },
      };
  }
}
