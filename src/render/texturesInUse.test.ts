import { describe, expect, it } from "vitest";
import type { TextureRef } from "@/store/types";
import { texturesInUse } from "./texturesInUse";

const lib = (id: string): TextureRef => ({ kind: "library", id });

describe("texturesInUse", () => {
  it("covers the draft, every batch post and the template defaults, without repeats", () => {
    const keys = texturesInUse(lib("marble"), [lib("wood"), lib("marble")], [lib("plaster")]);
    expect([...keys].sort()).toEqual(["library:marble", "library:plaster", "library:wood"]);
  });

  it("keeps a batch post's texture when no post is being edited", () => {
    expect(texturesInUse(null, [lib("wood")], [])).toEqual(new Set(["library:wood"]));
  });

  it("includes uploaded textures under their own key", () => {
    expect(texturesInUse({ kind: "upload", id: "u1" }, [], [])).toEqual(new Set(["upload:u1"]));
  });
});
