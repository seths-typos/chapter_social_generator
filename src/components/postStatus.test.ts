import { describe, expect, it } from "vitest";
import { pickerStatus } from "./postStatus";

describe("pickerStatus", () => {
  it("says nothing before anything has happened", () => {
    expect(pickerStatus(null, 0)).toBe("");
    expect(pickerStatus(null, 3)).toBe("");
  });

  it("names the action that actually happened", () => {
    expect(pickerStatus("added", 1)).toBe(
      "Added. 1 post in the batch. Choose a template for the next one.",
    );
    expect(pickerStatus("saved", 2)).toMatch(/^Saved\. 2 posts in the batch\./);
    expect(pickerStatus("cancelled", 2)).toMatch(/^Edit cancelled\. 2 posts/);
  });

  it("copes with the batch being emptied by removing the post under edit", () => {
    expect(pickerStatus("removed", 0)).toMatch(/^Removed\. The batch is empty\./);
  });
});
