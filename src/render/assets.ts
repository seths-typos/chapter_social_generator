/**
 * Render asset loading. For now the texture "library" is two solid-colour placeholders
 * (docs/template-spec.md#texture-library); #8 replaces this with the manifest loader.
 */

import { useMemo } from "react";
import { LIBRARY_TEXTURE } from "@/templates/meta";
import { textureKey, type RenderAssets, type TextureAsset } from "./types";

/** Placeholder colours standing in for the real textures until they're supplied. */
export const PLACEHOLDER_TEXTURES: ReadonlyMap<string, TextureAsset> = new Map([
  [textureKey(LIBRARY_TEXTURE.woodParquet), { kind: "color", color: "#A0602E" }],
  [textureKey(LIBRARY_TEXTURE.tileWhite), { kind: "color", color: "#D9DCE0" }],
]);

export function placeholderAssets(): RenderAssets {
  return { textures: PLACEHOLDER_TEXTURES, photos: new Map() };
}

/** The assets the preview renders with. Stable identity so renders aren't retriggered. */
export function useRenderAssets(): RenderAssets {
  return useMemo(() => placeholderAssets(), []);
}
