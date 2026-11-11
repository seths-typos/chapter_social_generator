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
 * A template with its own fields also exports an `Editor` form component (see `EditorProps`).
 */

import type { ComponentType } from "react";
import type { PolaroidPlacement } from "@/render/polaroid";
import type { RenderAssets, RendererFor } from "@/render/types";
import type { DraftBase, DraftFor } from "@/store/draft";
import type { PoolPhoto, PostFor, TemplateId, TextureRef } from "@/store/types";

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
  /** Every pool photo id the draft uses so far. */
  draftPhotoIds(draft: DraftFor<K>): string[];
  /**
   * The draft with a pool photo put where the template wants one next (clicking a photo in
   * the pool). Templates without images return the draft unchanged. `slot` is the position
   * selected in the editor, for templates with more than one.
   */
  acceptPhoto(draft: DraftFor<K>, photoId: string, slot?: number): DraftFor<K>;
  /** The draft with a (removed) pool photo taken out. */
  clearPhoto(draft: DraftFor<K>, photoId: string): DraftFor<K>;

  /** True while the template still draws a stand-in. The picker shows it as "Soon". */
  placeholder?: true;
  /** Whether the draft holds typed text that switching template would discard. */
  hasTypedText?(draft: DraftFor<K>): boolean;

  /** Draw everything above the background texture. Returns fit warnings. */
  render: RendererFor<K>;

  /**
   * The photos that can be dragged and zoomed in the preview, bottom to top. Templates
   * without adjustable photos omit it.
   */
  photoTargets?(draft: DraftFor<K>, assets: RenderAssets): PhotoTarget[];
  /**
   * Where every photo position sits, filled or not, bottom to top, so the preview can show
   * and change which one is selected. Only templates with more than one position need it.
   */
  slotPlacements?(draft: DraftFor<K>): PolaroidPlacement[];

  /** The template's own form fields. Templates with nothing beyond the shared controls omit it. */
  Editor?: ComponentType<EditorProps<K>>;
  /**
   * Fill a fresh draft with the inputs of the template's reference render, for checking it
   * against `docs/reference/{id}.png` (dev only).
   */
  fixture?: (draft: DraftFor<K>) => DraftFor<K>;
}

/** One adjustable photo in the preview: which slot it is and where its polaroid sits. */
export interface PhotoTarget {
  slot: number;
  placement: PolaroidPlacement;
  /** Size of the photo in the slot, in px. */
  photo: { width: number; height: number };
}

/**
 * What a template's form receives. It edits its draft through `onChange` rather than
 * reaching for the store, which keeps template files free of store imports.
 */
export interface EditorProps<K extends TemplateId> {
  draft: DraftFor<K>;
  onChange: (fn: (draft: DraftFor<K>) => DraftFor<K>) => void;
  /** The session's photo pool, to look up the draft's images. */
  pool: readonly PoolPhoto[];
  /** The photo position selected in the editor (shared with the Photos panel). */
  activeSlot: number;
  onActiveSlot: (slot: number) => void;
  /** Add an image file to the pool. Resolves with its id, or a message to show. */
  importImage: (file: File) => Promise<ImportOutcome>;
}

export type ImportOutcome = { ok: true; photoId: string } | { ok: false; message: string };

/** A definition for whichever template is current (`DraftFor<TemplateId>` is just `Draft`). */
export type AnyTemplateDefinition = TemplateDefinition<TemplateId>;
