/**
 * The one in-memory store: photo pool, session textures, editor draft, batch.
 * See docs/technical-requirements.md#stack. Nothing here is persisted, on purpose:
 * no `persist` middleware, no localStorage, no IndexedDB (docs/prd.md#non-goals-v1).
 *
 * `createAppStore()` builds an isolated store (used by tests); `appStore` is the app's
 * singleton and `useAppStore` the React hook over it.
 */

import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";
import { ZOOM_MAX, ZOOM_MIN, type MultiPhotoCount } from "@/templates/constants";
import {
  convertDraft,
  emptySlot,
  fromPost,
  hasSlots,
  newDraft,
  toPost,
  withPhotoCount,
  type Draft,
  type DraftSlot,
  type InfoFields,
  type PhotoDraft,
} from "./draft";
import {
  photoIdsInPost,
  type BatchItem,
  type PhotoMode,
  type PoolPhoto,
  type Post,
  type Pt,
  type SessionTexture,
  type TemplateId,
  type TextureRef,
} from "./types";

export interface AppState {
  // ── Photo pool ──────────────────────────────────────────────────────────────
  pool: PoolPhoto[];
  addPhotos: (photos: PoolPhoto[]) => void;
  /** Blocked (returns false) while a batch post uses the photo. Clears it from the draft. */
  removePhoto: (id: string) => boolean;
  setPhotoMode: (id: string, mode: PhotoMode, scanCorners?: [Pt, Pt, Pt, Pt]) => void;
  /** How many batch posts reference the photo. */
  usageCount: (id: string) => number;

  // ── Session textures ────────────────────────────────────────────────────────
  sessionTextures: SessionTexture[];
  addSessionTexture: (texture: SessionTexture) => void;
  /** The texture of the last post added to the batch; new drafts start from it. */
  lastUsedTexture: TextureRef | null;

  // ── Editor draft ────────────────────────────────────────────────────────────
  /** The post in progress. `null` = no template chosen yet (editor shows the template picker). */
  draft: Draft | null;
  /** Batch item currently loaded for editing, if any. */
  editingId: string | null;
  /** Choose a template: starts a draft, or converts the current one keeping compatible inputs. */
  setTemplate: (template: TemplateId) => void;
  /** Discard the draft and return to the template picker. */
  clearDraft: () => void;
  setTexture: (texture: TextureRef) => void;
  setGrain: (grain: boolean) => void;
  setPhotoCount: (count: MultiPhotoCount) => void;
  setSlotPhoto: (index: number, photoId: string | null) => void;
  setSlotView: (index: number, view: { panX?: number; panY?: number; zoom?: number }) => void;
  resetSlotView: (index: number) => void;
  setGraphic: (photoId: string | null) => void;
  setInfo: (patch: Partial<InfoFields>) => void;
  /** Snapshot the draft into the batch and return to the picker. Null if the draft is incomplete. */
  addToBatch: () => string | null;
  loadForEdit: (id: string) => void;
  /** Write the draft back to the item being edited. Returns false if incomplete or not editing. */
  saveEdit: () => boolean;
  cancelEdit: () => void;

  // ── Batch ───────────────────────────────────────────────────────────────────
  batch: BatchItem[];
  updateItem: (id: string, patch: Partial<Pick<BatchItem, "name" | "caption">>) => void;
  removeItem: (id: string) => void;
  duplicateItem: (id: string) => string | null;
  moveItem: (fromIndex: number, toIndex: number) => void;
}

export const newId = (): string => crypto.randomUUID();

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** `{template}-{n}` where n counts existing items of that template. */
export function defaultName(template: TemplateId, batch: readonly BatchItem[]): string {
  const n = batch.filter((b) => b.post.template === template).length + 1;
  return `${template}-${n}`;
}

/** Replace one slot of a photo draft, preserving the draft's template shape. */
function mapSlot(d: PhotoDraft, index: number, fn: (slot: DraftSlot) => DraftSlot): Draft {
  const slots = d.slots.map((sl, i) => (i === index ? fn(sl) : sl));
  return d.template === "multi-photo"
    ? { ...d, slots }
    : { ...d, slots: [slots[0] ?? emptySlot()] };
}

export function createAppStore(): StoreApi<AppState> {
  return createStore<AppState>()((set, get) => {
    /** Apply `fn` to the current draft, if there is one. */
    const updateDraft = (fn: (d: Draft) => Draft) =>
      set((s) => (s.draft ? { draft: fn(s.draft) } : {}));
    /** Apply `fn` to the current draft only if it has photo slots. */
    const updatePhotoDraft = (fn: (d: PhotoDraft) => Draft) =>
      updateDraft((d) => (hasSlots(d) ? fn(d) : d));

    return {
      // ── Photo pool
      pool: [],
      addPhotos: (photos) => set((s) => ({ pool: [...s.pool, ...photos] })),
      removePhoto: (id) => {
        if (get().usageCount(id) > 0) return false;
        set((s) => ({ pool: s.pool.filter((p) => p.id !== id) }));
        updateDraft((d) => {
          if (hasSlots(d)) {
            let out: Draft = d;
            d.slots.forEach((sl, i) => {
              if (sl.photoId === id) out = mapSlot(out as PhotoDraft, i, () => emptySlot());
            });
            return out;
          }
          if (d.template === "graphic" && d.graphicId === id) return { ...d, graphicId: null };
          return d;
        });
        return true;
      },
      setPhotoMode: (id, mode, scanCorners) =>
        set((s) => ({
          pool: s.pool.map((p) => {
            if (p.id !== id) return p;
            const next: PoolPhoto = {
              id: p.id,
              file: p.file,
              width: p.width,
              height: p.height,
              mode,
            };
            if (mode === "scan" && scanCorners) next.scanCorners = scanCorners;
            return next;
          }),
        })),
      usageCount: (id) =>
        get().batch.reduce((n, b) => n + (photoIdsInPost(b.post).includes(id) ? 1 : 0), 0),

      // ── Session textures
      sessionTextures: [],
      addSessionTexture: (texture) =>
        set((s) => ({ sessionTextures: [...s.sessionTextures, texture] })),
      lastUsedTexture: null,

      // ── Editor draft
      draft: null,
      editingId: null,
      setTemplate: (template) =>
        set((s) => ({
          draft: s.draft
            ? convertDraft(s.draft, template, { lastUsedTexture: s.lastUsedTexture })
            : newDraft(template, s.lastUsedTexture ?? undefined),
        })),
      clearDraft: () => set({ draft: null, editingId: null }),
      setTexture: (texture) => updateDraft((d) => ({ ...d, texture, textureChosen: true })),
      setGrain: (grain) => updatePhotoDraft((d) => ({ ...d, grain })),
      setPhotoCount: (count) => updateDraft((d) => withPhotoCount(d, count)),
      setSlotPhoto: (index, photoId) =>
        updatePhotoDraft((d) => mapSlot(d, index, () => ({ ...emptySlot(), photoId }))),
      setSlotView: (index, view) =>
        updatePhotoDraft((d) =>
          mapSlot(d, index, (sl) => ({
            ...sl,
            panX: clamp(view.panX ?? sl.panX, -1, 1),
            panY: clamp(view.panY ?? sl.panY, -1, 1),
            zoom: clamp(view.zoom ?? sl.zoom, ZOOM_MIN, ZOOM_MAX),
          })),
        ),
      resetSlotView: (index) =>
        updatePhotoDraft((d) => mapSlot(d, index, (sl) => ({ ...sl, panX: 0, panY: 0, zoom: 1 }))),
      setGraphic: (photoId) =>
        updateDraft((d) => (d.template === "graphic" ? { ...d, graphicId: photoId } : d)),
      setInfo: (patch) =>
        updateDraft((d) => (d.template === "info" ? { ...d, info: { ...d.info, ...patch } } : d)),

      addToBatch: () => {
        const { draft, batch } = get();
        const post = draft && toPost(draft);
        if (!post) return null;
        const item: BatchItem = {
          id: newId(),
          name: defaultName(post.template, batch),
          caption: "",
          post,
        };
        set({
          batch: [...batch, item],
          lastUsedTexture: post.texture,
          draft: null,
          editingId: null,
        });
        return item.id;
      },
      loadForEdit: (id) => {
        const item = get().batch.find((b) => b.id === id);
        if (!item) return;
        set({ draft: fromPost(item.post), editingId: id });
      },
      saveEdit: () => {
        const { draft, editingId, batch } = get();
        if (!editingId || !draft) return false;
        const post = toPost(draft);
        if (!post) return false;
        set({
          batch: batch.map((b) => (b.id === editingId ? { ...b, post } : b)),
          lastUsedTexture: post.texture,
          draft: null,
          editingId: null,
        });
        return true;
      },
      cancelEdit: () => set({ draft: null, editingId: null }),

      // ── Batch
      batch: [],
      updateItem: (id, patch) =>
        set((s) => ({ batch: s.batch.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
      removeItem: (id) =>
        set((s) => ({
          batch: s.batch.filter((b) => b.id !== id),
          ...(s.editingId === id ? { editingId: null, draft: null } : {}),
        })),
      duplicateItem: (id) => {
        const { batch } = get();
        const index = batch.findIndex((b) => b.id === id);
        const source = batch[index];
        if (!source) return null;
        const copy: BatchItem = {
          id: newId(),
          name: defaultName(source.post.template, batch),
          caption: source.caption,
          post: structuredClone(source.post) as Post,
        };
        set({ batch: [...batch.slice(0, index + 1), copy, ...batch.slice(index + 1)] });
        return copy.id;
      },
      moveItem: (fromIndex, toIndex) =>
        set((s) => {
          const n = s.batch.length;
          if (fromIndex < 0 || fromIndex >= n || toIndex < 0 || toIndex >= n) return {};
          const batch = [...s.batch];
          const [moved] = batch.splice(fromIndex, 1);
          batch.splice(toIndex, 0, moved!);
          return { batch };
        }),
    };
  });
}

export const appStore = createAppStore();

export function useAppStore<T>(selector: (state: AppState) => T): T {
  return useStore(appStore, selector);
}
