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

/**
 * Library textures the code refers to by id (the template defaults).
 * Ids must exist in public/textures/textures.json. docs/template-spec.md#texture-library
 */
export const LIBRARY_TEXTURE = {
  woodDarkWorn: { kind: "library", id: "wood-dark-worn" },
  plasterWhite: { kind: "library", id: "plaster-white" },
} as const satisfies Record<string, TextureRef>;

/** Per-template default texture, used until a texture has been chosen in the session. */
export const DEFAULT_TEXTURE: Record<TemplateId, TextureRef> = {
  cover: LIBRARY_TEXTURE.woodDarkWorn,
  photo: LIBRARY_TEXTURE.woodDarkWorn,
  "multi-photo": LIBRARY_TEXTURE.woodDarkWorn,
  graphic: LIBRARY_TEXTURE.plasterWhite,
  info: LIBRARY_TEXTURE.plasterWhite,
};
