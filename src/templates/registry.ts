/**
 * The template registry, and the template-agnostic operations built on it. Everything
 * outside `src/templates/` that needs to act on "whichever template this is" calls these
 * instead of switching on the template id. docs/decisions/0003-template-definitions.md
 */

import type { PolaroidPlacement } from "@/render/polaroid";
import type { RenderAssets } from "@/render/types";
import { emptySlot, hasSlots, type Draft } from "@/store/draft";
import type { Post, TemplateId, TextureRef } from "@/store/types";
import { coverTemplate } from "./cover";
import type { AnyTemplateDefinition, PhotoTarget, TemplateDefinition } from "./definition";
import { graphicTemplate } from "./graphic";
import { infoTemplate } from "./info";
import { photoTemplate } from "./photo";

/** Every template. Key order is the template picker's display order. */
export const TEMPLATES: { readonly [K in TemplateId]: TemplateDefinition<K> } = {
  photo: photoTemplate,
  graphic: graphicTemplate,
  info: infoTemplate,
  cover: coverTemplate,
};

/** The definition for a template id, typed for code that doesn't know which one it is. */
export const templateFor = (id: TemplateId): AnyTemplateDefinition =>
  TEMPLATES[id] as unknown as AnyTemplateDefinition;

export const TEMPLATE_IDS = Object.keys(TEMPLATES) as readonly TemplateId[];

/** All definitions in picker order. */
export const TEMPLATE_LIST: readonly AnyTemplateDefinition[] = TEMPLATE_IDS.map(templateFor);

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** A fresh, empty draft for a template. Uses the template's default texture unless one is given. */
export function newDraft(template: TemplateId, texture?: TextureRef): Draft {
  const t = templateFor(template);
  return t.newDraft({ texture: texture ?? t.defaultTexture, textureChosen: false });
}

/** Which required inputs are still missing. Empty when the draft is complete. */
export function missingInputs(draft: Draft): string[] {
  return templateFor(draft.template).missingInputs(draft);
}

/** A complete, renderable Post, or null if any required input is missing. */
export function toPost(draft: Draft): Post | null {
  if (missingInputs(draft).length > 0) return null;
  return templateFor(draft.template).toPost(draft);
}

/** Load a stored Post back into an editable Draft. Its texture counts as chosen. */
export function fromPost(post: Post): Draft {
  return templateFor(post.template).fromPost(post, { texture: post.texture, textureChosen: true });
}

/** Every pool photo id a post references (photo slots or the graphic). */
export function photoIdsInPost(post: Post): string[] {
  return templateFor(post.template).photoIds(post);
}

/** Every pool photo id a draft references so far. */
export function photoIdsInDraft(draft: Draft): string[] {
  return templateFor(draft.template).draftPhotoIds(draft);
}

/** How many batch posts use each pool photo, keyed by photo id (unused photos are absent). */
export function photoUsage(posts: readonly Post[]): Map<string, number> {
  const usage = new Map<string, number>();
  for (const post of posts) {
    for (const id of new Set(photoIdsInPost(post))) usage.set(id, (usage.get(id) ?? 0) + 1);
  }
  return usage;
}

/** The draft with a pool photo put in position `slot`, or failing that its next free place. Unchanged if the template takes no images. */
export function acceptPhotoInDraft(draft: Draft, photoId: string, slot?: number): Draft {
  return templateFor(draft.template).acceptPhoto(draft, photoId, slot);
}

/** True when the draft's template uses pool images at all. */
export const takesPhotos = (draft: Draft): boolean =>
  acceptPhotoInDraft(draft, "\u0000probe") !== draft;

/** The draft's adjustable photos (see `TemplateDefinition.photoTargets`), bottom to top. */
export function photoTargets(draft: Draft, assets: RenderAssets): PhotoTarget[] {
  return templateFor(draft.template).photoTargets?.(draft, assets) ?? [];
}

/** Where each selectable photo position sits (see `TemplateDefinition.slotPlacements`). */
export function slotPlacements(draft: Draft): PolaroidPlacement[] {
  return templateFor(draft.template).slotPlacements?.(draft) ?? [];
}

/** Where every polaroid is drawn (see `TemplateDefinition.layout`). Empty if not animated. */
export function layoutOf(draft: Draft): PolaroidPlacement[] {
  return templateFor(draft.template).layout?.(draft) ?? [];
}

/** The draft with a pool photo taken out of wherever it was used. */
export function clearPhotoFromDraft(draft: Draft, photoId: string): Draft {
  return templateFor(draft.template).clearPhoto(draft, photoId);
}

/** Give a slot-based draft `count` slots (clamped to its template's range), keeping existing photos. */
export function withPhotoCount(draft: Draft, count: number): Draft {
  const range = templateFor(draft.template).slots;
  if (!hasSlots(draft) || !range) return draft;
  const n = clamp(count, range.min, range.max);
  if (n === draft.slots.length) return draft;
  const slots = Array.from({ length: n }, (_, i) => draft.slots[i] ?? emptySlot());
  return { ...draft, slots } as Draft;
}

/**
 * Switch an in-progress draft to another template. Carries the texture (when chosen or
 * carried over from the session) and photos between the slot-based templates; drops the
 * rest. See docs/decisions/0001-draft-per-template.md
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
  const range = templateFor(template).slots;
  if (!hasSlots(draft) || !hasSlots(next) || !range) return next;
  const carried = draft.slots.filter((s) => s.photoId !== null).map((s) => ({ ...s }));
  const n = clamp(carried.length, range.min, range.max);
  const slots = Array.from({ length: n }, (_, i) => carried[i] ?? emptySlot());
  const textCard =
    "textCard" in draft && "textCard" in next ? { textCard: { ...draft.textCard } } : {};
  return { ...next, grain: draft.grain, slots, ...textCard } as Draft;
}

/**
 * A template's draft filled with its reference inputs, or empty if it has none. Shown in
 * the picker thumbnail and the dev comparison view.
 */
export function fixtureDraft(template: TemplateId): Draft {
  const t = templateFor(template);
  const draft = newDraft(template);
  return t.fixture ? t.fixture(draft) : draft;
}

/** True when switching this draft to another template would throw away typed text. */
export function losesTypedText(draft: Draft, template: TemplateId): boolean {
  if (draft.template === template) return false;
  if (!(templateFor(draft.template).hasTypedText?.(draft) ?? false)) return false;
  // Nothing is lost when the text is carried over (the text card).
  const converted = convertDraft(draft, template, { lastUsedTexture: null });
  return !(templateFor(template).hasTypedText?.(converted) ?? false);
}
