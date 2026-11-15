/** The line under the editor's buttons once a post has left the editor. */

import type { LastAction } from "@/store/types";

const LEAD: Record<LastAction, string> = {
  added: "Added.",
  saved: "Saved.",
  cancelled: "Edit cancelled.",
  removed: "Removed.",
};

/**
 * What just happened, how many posts the batch holds, and what to do next. Empty when
 * nothing has happened yet.
 */
export function pickerStatus(last: LastAction | null, batchCount: number): string {
  if (!last) return "";
  const count =
    batchCount === 0
      ? "The batch is empty."
      : `${batchCount} ${batchCount === 1 ? "post" : "posts"} in the batch.`;
  return `${LEAD[last]} ${count} Choose a template for the next one.`;
}
