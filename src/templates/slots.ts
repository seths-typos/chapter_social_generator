/**
 * Draft operations shared by the templates whose inputs are pool photos in slots
 * (Cover, Photo, Multi-Photo). Spread into a template's definition.
 */

import { emptySlot, emptyTextCard, type DraftSlot, type PhotoDraft } from "@/store/draft";
import type { PhotoSlot, Post } from "@/store/types";
import type { TemplateDefinition } from "./definition";
import { PhotoSlotEditor } from "./PhotoSlotEditor";
import { activeTextCard, hasCardText } from "./textCard";

type SlotTemplateId = PhotoDraft["template"];
type PhotoPost = Extract<Post, { slots: PhotoSlot[] }>;
type SlotOps<K extends SlotTemplateId> = Required<
  Pick<
    TemplateDefinition<K>,
    | "slots"
    | "newDraft"
    | "missingInputs"
    | "toPost"
    | "fromPost"
    | "photoIds"
    | "draftPhotoIds"
    | "acceptPhoto"
    | "Editor"
    | "clearPhoto"
    | "hasTypedText"
  >
>;

const isFilled = (s: DraftSlot): s is PhotoSlot => s.photoId !== null;

export function slotDraftOps<K extends SlotTemplateId>(
  id: K,
  slots: { readonly min: number; readonly max: number },
  /** Set for the templates that offer the optional text card. */
  opts: { textCard?: boolean } = {},
): SlotOps<K> {
  const ops: SlotOps<SlotTemplateId> = {
    slots,
    newDraft: (base) =>
      ({
        ...base,
        template: id,
        slots: Array.from({ length: slots.min }, emptySlot),
        grain: false,
        ...(opts.textCard ? { textCard: emptyTextCard() } : {}),
      }) as PhotoDraft,
    missingInputs: (draft) => {
      const n = draft.slots.length;
      const empty = draft.slots.filter((s) => !isFilled(s)).length;
      const card = activeTextCard(draft);
      return [
        ...(empty === 0 ? [] : [n === 1 ? "photo" : `${empty} of ${n} photos`]),
        ...(card && !hasCardText(card) ? ["card text"] : []),
      ];
    },
    toPost: (draft) => {
      const filled = draft.slots.filter(isFilled);
      if (filled.length !== draft.slots.length) return null;
      const card = activeTextCard(draft);
      return {
        template: id,
        slots: filled.map(({ photoId, panX, panY, zoom }) => ({ photoId, panX, panY, zoom })),
        texture: draft.texture,
        grain: draft.grain,
        ...(card ? { textCard: { heading: card.heading, text: card.text } } : {}),
      } as PhotoPost;
    },
    fromPost: (post, base) =>
      ({
        ...base,
        template: id,
        slots: post.slots.map((s) => ({ ...s })),
        grain: post.grain,
        ...(opts.textCard
          ? {
              textCard:
                "textCard" in post && post.textCard
                  ? { ...post.textCard, on: true }
                  : emptyTextCard(),
            }
          : {}),
      }) as PhotoDraft,
    photoIds: (post) => post.slots.map((s) => s.photoId),
    draftPhotoIds: (draft) => draft.slots.filter(isFilled).map((s) => s.photoId),
    Editor: PhotoSlotEditor,
    hasTypedText: (draft) => {
      const card = activeTextCard(draft);
      return card !== null && hasCardText(card);
    },
    // The given slot; without one, the first empty slot, or the last when all are full.
    acceptPhoto: (draft, photoId, slot) => {
      const empty = draft.slots.findIndex((s) => !isFilled(s));
      const fallback = empty === -1 ? draft.slots.length - 1 : empty;
      const target = slot !== undefined && slot in draft.slots ? slot : fallback;
      return {
        ...draft,
        slots: draft.slots.map((s, i) => (i === target ? { ...emptySlot(), photoId } : s)),
      } as PhotoDraft;
    },
    clearPhoto: (draft, photoId) =>
      ({
        ...draft,
        slots: draft.slots.map((s) => (s.photoId === photoId ? emptySlot() : s)),
      }) as PhotoDraft,
  };
  return ops as unknown as SlotOps<K>;
}
