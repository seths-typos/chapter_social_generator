/**
 * What a template is. Each file in this folder exports one `TemplateDefinition`, and
 * `registry.ts` lists them. The store, renderer and UI go through the registry, so they
 * never switch on a template id. docs/decisions/0003-template-definitions.md
 *
 * To add a template:
 *   1. Write its section in docs/template-spec.md and add its values to `constants.ts`.
 *   2. Add its variant to the `Post` union (src/store/types.ts) and the `Draft` union
 *      (src/store/draft.ts).
 *   3. Create `src/templates/{name}.ts` exporting its definition.
 *   4. Add it to `TEMPLATES` in `registry.ts`. Its position there is its picker position.
 * Template-specific fields are edited through the store's `editDraft(template, fn)`.
 */

import type { RendererFor } from "@/render/types";
import type { DraftBase, DraftFor } from "@/store/draft";
import type { PostFor, TemplateId, TextureRef } from "@/store/types";

export interface TemplateDefinition<K extends TemplateId> {
  id: K;
  /** Name shown in the template picker. */
  label: string;
  /** Texture used until one has been chosen in the session. */
  defaultTexture: TextureRef;
  /**
   * Set when the draft holds pool photos in `slots`. The shared slot actions (assign, pan,
   * zoom, count) and the carry-over of photos between templates work off this range.
   */
  slots?: { readonly min: number; readonly max: number };

  /** A fresh, empty draft. */
  newDraft(base: DraftBase): DraftFor<K>;
  /** Required inputs still missing, as short labels. Empty when the draft is complete. */
  missingInputs(draft: DraftFor<K>): string[];
  /** The complete Post. Only called when `missingInputs` is empty. */
  toPost(draft: DraftFor<K>): PostFor<K> | null;
  /** Load a stored Post back into an editable draft. */
  fromPost(post: PostFor<K>, base: DraftBase): DraftFor<K>;
  /** Every pool photo id the post uses. */
  photoIds(post: PostFor<K>): string[];
  /** The draft with a (removed) pool photo taken out. */
  clearPhoto(draft: DraftFor<K>, photoId: string): DraftFor<K>;

  /** Draw everything above the background texture. Returns fit warnings. */
  render: RendererFor<K>;
}

/** A definition for whichever template is current (`DraftFor<TemplateId>` is just `Draft`). */
export type AnyTemplateDefinition = TemplateDefinition<TemplateId>;
