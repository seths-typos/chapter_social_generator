/** The slots with two positions exchanged; each photo keeps its own pan and zoom. */
export function swapSlots<T>(slots: readonly T[], a: number, b: number): T[] {
  if (a === b || !(a in slots) || !(b in slots)) return [...slots];
  return slots.map((s, i) => (i === a ? slots[b]! : i === b ? slots[a]! : s));
}
