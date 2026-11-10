/**
 * The editor's working state: one post in progress, shaped like the `Post` it will
 * become but with required inputs still allowed to be empty. A Draft exists only after
 * a template has been chosen (`null` in the store means "at the template picker").
 * See docs/decisions/0001-*.md
 *
 * This file holds the shapes only. What each template does with its draft (create it,
 * check it, turn it into a Post) lives in that template's definition in `src/templates/`,
 * and `src/templates/registry.ts` dispatches to it. See docs/decisions/0003-*.md
 */

import type { Post, TemplateId, TextureRef, WordmarkTone } from "./types";

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

export interface DraftBase {
  texture: TextureRef;
  /** True once the user has picked a texture for this draft (stops template defaults overriding it). */
  textureChosen: boolean;
}

export type Draft =
  | (DraftBase & { template: "cover"; slots: [DraftSlot]; grain: boolean; wordmark: WordmarkTone })
  | (DraftBase & { template: "photo"; slots: [DraftSlot]; grain: boolean })
  | (DraftBase & { template: "multi-photo"; slots: DraftSlot[] /* 2–4 */; grain: boolean })
  | (DraftBase & { template: "graphic"; graphicId: string | null })
  | (DraftBase & { template: "info"; info: InfoFields });

/** The Draft variant for one template. */
export type DraftFor<K extends TemplateId> = Draft & { template: K };

export type PhotoDraft = Extract<Draft, { slots: DraftSlot[] }>;

export const emptySlot = (): DraftSlot => ({ photoId: null, panX: 0, panY: 0, zoom: 1 });

export function hasSlots(draft: Draft): draft is PhotoDraft {
  return "slots" in draft;
}

/** How many photo slots the draft's template uses. */
export function slotCount(draft: Draft): number {
  return hasSlots(draft) ? draft.slots.length : 0;
}

/** Tell an in-progress Draft from a stored Post. */
export function isDraft(x: Post | Draft): x is Draft {
  return "textureChosen" in x;
}
