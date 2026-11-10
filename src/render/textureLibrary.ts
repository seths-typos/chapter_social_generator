/**
 * The bundled texture library: `public/textures/textures.json` plus the image files it
 * names. docs/template-spec.md#texture-library
 */

export interface TextureManifestEntry {
  id: string;
  /** Human-readable, for the picker. */
  name: string;
  /** File names relative to `public/textures/`. */
  file: string;
  thumb: string;
  width: number;
  height: number;
}

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Validate the manifest JSON. Throws with a clear message on a malformed entry. */
export function parseManifest(json: unknown): TextureManifestEntry[] {
  if (!Array.isArray(json)) throw new Error("textures.json: expected an array");
  const seen = new Set<string>();
  return json.map((raw, i) => {
    const e = raw as Record<string, unknown>;
    const where = `textures.json[${i}]`;
    for (const k of ["id", "name", "file", "thumb"] as const) {
      if (typeof e[k] !== "string" || !e[k]) throw new Error(`${where}: missing "${k}"`);
    }
    for (const k of ["width", "height"] as const) {
      if (typeof e[k] !== "number" || !(e[k] > 0)) throw new Error(`${where}: bad "${k}"`);
    }
    const id = e.id as string;
    if (!ID_RE.test(id)) throw new Error(`${where}: id "${id}" must be kebab-case`);
    if (seen.has(id)) throw new Error(`${where}: duplicate id "${id}"`);
    seen.add(id);
    return {
      id,
      name: e.name as string,
      file: e.file as string,
      thumb: e.thumb as string,
      width: e.width as number,
      height: e.height as number,
    };
  });
}

export const texturesBase = (base: string = import.meta.env.BASE_URL): string => `${base}textures/`;

export const textureFileUrl = (entry: TextureManifestEntry, base?: string): string =>
  `${texturesBase(base)}${entry.file}`;

export const textureThumbUrl = (entry: TextureManifestEntry, base?: string): string =>
  `${texturesBase(base)}${entry.thumb}`;

let manifestPromise: Promise<TextureManifestEntry[]> | null = null;

/** Fetch and validate the manifest once; later calls share the result. */
export function fetchManifest(base?: string): Promise<TextureManifestEntry[]> {
  manifestPromise ??= fetch(`${texturesBase(base)}textures.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`textures.json: HTTP ${r.status}`);
      return r.json();
    })
    .then(parseManifest)
    .catch((err: unknown) => {
      manifestPromise = null; // allow a retry
      throw err;
    });
  return manifestPromise;
}

/** Decode an image blob, honouring EXIF orientation. */
export function decodeImage(blob: Blob): Promise<ImageBitmap> {
  return createImageBitmap(blob, { imageOrientation: "from-image" });
}
