/**
 * The editor's working state. Unlike `Post`, a Draft may be incomplete (no photo chosen
 * yet, empty title). It carries the inputs for every template at once so switching
 * templates keeps compatible inputs (docs/prd.md#template-selection-and-editing).
 * `toPost` turns a complete Draft into a `Post`; `fromPost` loads a batch item for editing.
 */

import { MULTI_PHOTO_MAX, type MultiPhotoCount } from "@/templates/constants";
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

export interface Draft {
  template: TemplateId;
  /** Always MULTI_PHOTO_MAX long; templates read the first `slotCount(draft)` entries. */
  slots: DraftSlot[];
  photoCount: MultiPhotoCount;
  texture: TextureRef;
  /** True once the user has picked a texture for this draft (stops template defaults overriding it). */
  textureChosen: boolean;
  grain: boolean;
  graphicId: string | null;
  info: InfoFields;
}

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

export function newDraft(template: TemplateId = "photo", texture?: TextureRef): Draft {
  return {
    template,
    slots: Array.from({ length: MULTI_PHOTO_MAX }, emptySlot),
    photoCount: 2,
    texture: texture ?? DEFAULT_TEXTURE[template],
    textureChosen: texture !== undefined,
    grain: false,
    graphicId: null,
    info: emptyInfo(),
  };
}

/** How many photo slots the draft's template uses. */
export function slotCount(draft: Pick<Draft, "template" | "photoCount">): number {
  switch (draft.template) {
    case "cover":
    case "photo":
      return 1;
    case "multi-photo":
      return draft.photoCount;
    default:
      return 0;
  }
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
      const n = slotCount(draft);
      const empty = draft.slots.slice(0, n).filter((s) => s.photoId === null).length;
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
      const slot = toSlot(draft.slots[0]!);
      if (!slot) return null;
      return {
        template: draft.template,
        slots: [slot],
        texture: draft.texture,
        grain: draft.grain,
      };
    }
    case "multi-photo": {
      const slots = draft.slots.slice(0, draft.photoCount).map(toSlot);
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

/** Load a stored Post back into an editable Draft. */
export function fromPost(post: Post): Draft {
  const draft = newDraft(post.template, post.texture);
  switch (post.template) {
    case "cover":
    case "photo":
    case "multi-photo":
      post.slots.forEach((s, i) => {
        draft.slots[i] = { ...s };
      });
      if (post.template === "multi-photo") {
        draft.photoCount = post.slots.length as MultiPhotoCount;
      }
      draft.grain = post.grain;
      break;
    case "graphic":
      draft.graphicId = post.graphicId;
      break;
    case "info":
      draft.info = {
        eventNumber: post.eventNumber,
        title: post.title,
        body: post.body,
        date: post.date,
        startTime: post.startTime,
        endTime: post.endTime ?? "",
        location: post.location,
      };
      break;
  }
  return draft;
}
