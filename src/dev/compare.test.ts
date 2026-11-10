import { describe, expect, it } from "vitest";
import { TEMPLATE_IDS } from "@/templates/registry";
import { COMPARE_IDS, parseCompareParam } from "./compare";

describe("parseCompareParam", () => {
  it("accepts the templates that have a reference render", () => {
    for (const id of COMPARE_IDS) expect(parseCompareParam(id)).toBe(id);
  });

  it("rejects anything else", () => {
    expect(parseCompareParam(null)).toBeNull();
    expect(parseCompareParam("")).toBeNull();
    expect(parseCompareParam("multi-photo")).toBeNull();
    expect(parseCompareParam("nope")).toBeNull();
  });

  it("only names real templates", () => {
    for (const id of COMPARE_IDS) expect(TEMPLATE_IDS).toContain(id);
  });
});
