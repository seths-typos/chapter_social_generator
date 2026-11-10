import type { TemplateId, TextureRef } from "@/store/types";

/** Display order and labels for the template picker. */
export const TEMPLATES: readonly { id: TemplateId; label: string }[] = [
  { id: "cover", label: "Cover" },
  { id: "photo", label: "Photo" },
  { id: "multi-photo", label: "Multi-Photo" },
  { id: "graphic", label: "Graphic" },
  { id: "info", label: "Info" },
];

export const TEMPLATE_IDS: readonly TemplateId[] = TEMPLATES.map((t) => t.id);

/** Bundled texture ids. See docs/template-spec.md#texture-library */
export const LIBRARY_TEXTURE = {
  woodParquet: { kind: "library", id: "wood-parquet" },
  tileWhite: { kind: "library", id: "tile-white" },
} as const satisfies Record<string, TextureRef>;

/** Per-template default texture, used until a texture has been chosen in the session. */
export const DEFAULT_TEXTURE: Record<TemplateId, TextureRef> = {
  cover: LIBRARY_TEXTURE.woodParquet,
  photo: LIBRARY_TEXTURE.woodParquet,
  "multi-photo": LIBRARY_TEXTURE.woodParquet,
  graphic: LIBRARY_TEXTURE.tileWhite,
  info: LIBRARY_TEXTURE.tileWhite,
};
