import { describe, expect, it } from "vitest";
import {
  ensureFonts,
  findMissingLocalFonts,
  fontSpec,
  LOCAL_FONTS,
  REQUIRED_FONTS,
  type FontFaceLike,
  type FontLoader,
  type RequiredFont,
} from "./fonts";

const druk500: RequiredFont = { family: "Chapter Druk", weight: 500, label: "Druk Medium" };
const druk700: RequiredFont = { family: "Chapter Druk", weight: 700, label: "Druk Bold" };
const serif400: RequiredFont = {
  family: "Instrument Serif",
  weight: 400,
  label: "Instrument Serif",
};
const geist400: RequiredFont = { family: "Geist", weight: 400, label: "Geist" };

function fakeLoader(opts: { fail?: string[]; unavailable?: string[] } = {}): FontLoader {
  return {
    load: async (spec: string) => {
      if (opts.fail?.includes(spec)) throw new Error("network");
      return [];
    },
    check: (spec: string) => !opts.unavailable?.includes(spec),
  };
}

/** A CSS-connected face: `load()` settles its status the way a `local()`-only source does. */
function fakeFace(family: string, weight: string, installed: boolean): FontFaceLike {
  const face: FontFaceLike = {
    family,
    weight,
    status: "unloaded",
    load: async () => {
      face.status = installed ? "loaded" : "error";
      if (!installed) throw new Error("A network error occurred.");
    },
  };
  return face;
}

const noneMissing = () => Promise.resolve([]);

describe("fontSpec", () => {
  it("builds a CSS font shorthand FontFaceSet understands", () => {
    expect(fontSpec(druk500)).toBe('500 100px "Chapter Druk"');
  });
});

describe("font lists", () => {
  it("gates only the bundled template font", () => {
    expect(REQUIRED_FONTS.map((f) => `${f.family}/${f.weight}`)).toEqual(["Instrument Serif/400"]);
  });

  it("treats Druk as a local font, never a required download", () => {
    expect(LOCAL_FONTS.map((f) => `${f.family}/${f.weight}`)).toEqual([
      "Chapter Druk/500",
      "Chapter Druk/700",
    ]);
  });
});

describe("findMissingLocalFonts", () => {
  it("finds nothing missing when both weights are installed", async () => {
    const faces = [
      fakeFace('"Chapter Druk"', "500", true),
      fakeFace('"Chapter Druk"', "700", true),
      fakeFace("Geist", "400", true),
    ];
    await expect(findMissingLocalFonts([druk500, druk700], faces)).resolves.toEqual([]);
  });

  it("reports the weights that aren't installed", async () => {
    const faces = [fakeFace("Chapter Druk", "500", true), fakeFace("Chapter Druk", "700", false)];
    await expect(findMissingLocalFonts([druk500, druk700], faces)).resolves.toEqual([druk700]);
  });

  it("reports a font that has no face declared at all", async () => {
    await expect(findMissingLocalFonts([druk500], [])).resolves.toEqual([druk500]);
  });
});

describe("ensureFonts", () => {
  it("is ok when every bundled font loads, and passes on the missing local fonts", async () => {
    await expect(
      ensureFonts([serif400], fakeLoader(), () => Promise.resolve([druk700])),
    ).resolves.toEqual({ ok: true, missingLocal: [druk700] });
  });

  it("reports a bundled font whose load() rejects", async () => {
    const result = await ensureFonts(
      [serif400, geist400],
      fakeLoader({ fail: [fontSpec(serif400)] }),
      noneMissing,
    );
    expect(result).toEqual({ ok: false, missing: [serif400] });
  });

  it("reports a bundled font that loads but check() says is unavailable", async () => {
    const result = await ensureFonts(
      [serif400, geist400],
      fakeLoader({ unavailable: [fontSpec(geist400)] }),
      noneMissing,
    );
    expect(result).toEqual({ ok: false, missing: [geist400] });
  });

  it("never throws, and assumes local fonts are missing if they can't be checked", async () => {
    const loader: FontLoader = {
      load: async () => {
        throw new Error("boom");
      },
      check: () => false,
    };
    expect((await ensureFonts([serif400], loader, noneMissing)).ok).toBe(false);
    const result = await ensureFonts([serif400], fakeLoader(), () => Promise.reject(new Error()));
    expect(result).toEqual({ ok: true, missingLocal: [...LOCAL_FONTS] });
  });
});
