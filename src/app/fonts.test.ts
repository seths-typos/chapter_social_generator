import { describe, expect, it } from "vitest";
import { ensureFonts, fontSpec, REQUIRED_FONTS, type FontLoader, type RequiredFont } from "./fonts";

const druk500: RequiredFont = { family: "Chapter Druk", weight: 500, label: "Druk Medium" };
const serif400: RequiredFont = {
  family: "Instrument Serif",
  weight: 400,
  label: "Instrument Serif",
};

function fakeLoader(opts: { fail?: string[]; unavailable?: string[] } = {}): FontLoader {
  return {
    load: async (spec: string) => {
      if (opts.fail?.includes(spec)) throw new Error("network");
      return [];
    },
    check: (spec: string) => !opts.unavailable?.includes(spec),
  };
}

describe("fontSpec", () => {
  it("builds a CSS font shorthand FontFaceSet understands", () => {
    expect(fontSpec(druk500)).toBe('500 100px "Chapter Druk"');
  });
});

describe("REQUIRED_FONTS", () => {
  it("gates exactly the template fonts: Druk 500, Druk 700, Instrument Serif 400", () => {
    expect(REQUIRED_FONTS.map((f) => `${f.family}/${f.weight}`)).toEqual([
      "Chapter Druk/500",
      "Chapter Druk/700",
      "Instrument Serif/400",
    ]);
  });
});

describe("ensureFonts", () => {
  it("is ok when every font loads and checks", async () => {
    await expect(ensureFonts([druk500, serif400], fakeLoader())).resolves.toEqual({ ok: true });
  });

  it("reports a font whose load() rejects", async () => {
    const result = await ensureFonts(
      [druk500, serif400],
      fakeLoader({ fail: [fontSpec(druk500)] }),
    );
    expect(result).toEqual({ ok: false, missing: [druk500] });
  });

  it("reports a font that loads but check() says is unavailable", async () => {
    const result = await ensureFonts(
      [druk500, serif400],
      fakeLoader({ unavailable: [fontSpec(serif400)] }),
    );
    expect(result).toEqual({ ok: false, missing: [serif400] });
  });

  it("never throws", async () => {
    const loader: FontLoader = {
      load: async () => {
        throw new Error("boom");
      },
      check: () => false,
    };
    const result = await ensureFonts([druk500, serif400], loader);
    expect(result.ok).toBe(false);
  });
});
