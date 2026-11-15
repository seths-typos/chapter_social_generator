/**
 * The edits the slot editors make to a draft's photo positions, as plain functions so they
 * can be tested without the form. docs/template-spec.md#photo
 */

import { emptySlot, type DraftSlot } from "@/store/draft";

/** Put a photo (or nothing) in one position. The new photo starts centred and unzoomed. */
export function withSlotPhoto(
  slots: readonly DraftSlot[],
  index: number,
  photoId: string | null,
): DraftSlot[] {
  return slots.map((s, i) => (i === index ? { ...emptySlot(), photoId } : s));
}

/** `count` positions: fewer drops the last ones, more adds empty ones. Photos stay put. */
export function withSlotCount(slots: readonly DraftSlot[], count: number): DraftSlot[] {
  return Array.from({ length: Math.max(1, count) }, (_, i) => slots[i] ?? emptySlot());
}

/** Change the pan and zoom of one position's photo. */
export function withSlotView(
  slots: readonly DraftSlot[],
  index: number,
  view: (slot: DraftSlot) => Partial<Pick<DraftSlot, "panX" | "panY" | "zoom">>,
): DraftSlot[] {
  return slots.map((s, i) => (i === index ? { ...s, ...view(s) } : s));
}

/**
 * Which position to select after the number of positions changes. The selection stays on a
 * position that exists, and moves off a filled one to the first empty one, so the next
 * photo clicked fills the new space.
 */
export function selectionAfterCount(slots: readonly DraftSlot[], active: number): number {
  const current = Math.max(0, Math.min(active, slots.length - 1));
  const firstEmpty = slots.findIndex((s) => s.photoId === null);
  return slots[current]?.photoId !== null && firstEmpty !== -1 ? firstEmpty : current;
}

/** Which position to select after two are swapped: the selection stays on the same photo. */
export function selectionAfterSwap(active: number, from: number, to: number): number {
  return active === from ? to : active === to ? from : active;
}
