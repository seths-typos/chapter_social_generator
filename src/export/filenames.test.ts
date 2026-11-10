import { describe, expect, it } from "vitest";
import { pngFilename, slugify } from "./filenames";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Recess At Night!")).toBe("recess-at-night");
    expect(slugify("info-1")).toBe("info-1");
  });

  it("strips accents and collapses runs of punctuation and spaces", () => {
    expect(slugify("Anew Café & Goods")).toBe("anew-cafe-goods");
    expect(slugify("  a  --  b__c  ")).toBe("a-b-c");
  });

  it("never returns an empty name", () => {
    expect(slugify("")).toBe("post");
    expect(slugify("!!! ???")).toBe("post");
  });
});

describe("pngFilename", () => {
  it("adds the extension", () => {
    expect(pngFilename("Photo 2")).toBe("photo-2.png");
  });
});
