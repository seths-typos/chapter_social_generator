import { describe, expect, it } from "vitest";
import { batchFilenames, captionsText, pngFilename, slugify, zipFilename } from "./filenames";

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

describe("zipFilename", () => {
  it("is dated with the local day, zero-padded", () => {
    expect(zipFilename(new Date(2026, 0, 5, 23, 59))).toBe("chapter-posts-2026-01-05.zip");
    expect(zipFilename(new Date(2026, 10, 10))).toBe("chapter-posts-2026-11-10.zip");
  });
});

describe("batchFilenames", () => {
  it("numbers posts from 01 in order", () => {
    expect(batchFilenames(["cover-1", "Opening Night!", ""])).toEqual([
      "01-cover-1.png",
      "02-opening-night.png",
      "03-post.png",
    ]);
  });

  it("keeps two posts with the same name apart", () => {
    const names = batchFilenames(["photo", "photo"]);
    expect(new Set(names).size).toBe(2);
  });

  it("widens the number for a batch of 100 or more", () => {
    const names = batchFilenames(Array.from({ length: 100 }, () => "p"));
    expect(names[0]).toBe("001-p.png");
    expect(names[99]).toBe("100-p.png");
  });
});

describe("captionsText", () => {
  it("lists each filename, its caption, then a blank line", () => {
    expect(
      captionsText([
        { filename: "01-cover-1.png", caption: "We had fun." },
        { filename: "02-photo-1.png", caption: "Line one\nLine two" },
      ]),
    ).toBe("01-cover-1.png\nWe had fun.\n\n02-photo-1.png\nLine one\nLine two\n\n");
  });

  it("uses LF endings and trims the caption", () => {
    expect(captionsText([{ filename: "01-a.png", caption: "  a\r\nb\r\n\r\n" }])).toBe(
      "01-a.png\na\nb\n\n",
    );
  });

  it("keeps a post with no caption as its filename and a blank line", () => {
    expect(captionsText([{ filename: "01-a.png", caption: "" }])).toBe("01-a.png\n\n");
    expect(captionsText([])).toBe("");
  });
});
