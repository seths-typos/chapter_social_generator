import { describe, expect, it } from "vitest";
import { formatDay, formatEventDate, formatTime } from "./infoDate";

describe("formatEventDate", () => {
  it("matches the reference line", () => {
    expect(formatEventDate("2026-03-10", "18:30", "21:00")).toBe(
      "TUESDAY, MARCH 10, 6:30 PM - 9:00 PM",
    );
  });

  it("leaves out the end time when there is none", () => {
    expect(formatEventDate("2026-03-10", "18:30")).toBe("TUESDAY, MARCH 10, 6:30 PM");
    expect(formatEventDate("2026-03-10", "18:30", "")).toBe("TUESDAY, MARCH 10, 6:30 PM");
  });

  it("has no leading zeros on the day or the hour", () => {
    expect(formatEventDate("2026-07-04", "09:05", "10:00")).toBe(
      "SATURDAY, JULY 4, 9:05 AM - 10:00 AM",
    );
  });

  it("handles noon and midnight", () => {
    expect(formatEventDate("2026-12-31", "12:00", "00:00")).toBe(
      "THURSDAY, DECEMBER 31, 12:00 PM - 12:00 AM",
    );
    expect(formatTime("00:30")).toBe("12:30 AM");
    expect(formatTime("12:30")).toBe("12:30 PM");
    expect(formatTime("23:59")).toBe("11:59 PM");
  });

  it("shows what is filled in so far", () => {
    expect(formatEventDate("", "", "")).toBe("");
    expect(formatEventDate("2026-03-10", "", "")).toBe("TUESDAY, MARCH 10");
    expect(formatEventDate("", "18:30", "21:00")).toBe("6:30 PM - 9:00 PM");
  });

  it("ignores an end time without a start time", () => {
    expect(formatEventDate("2026-03-10", "", "21:00")).toBe("TUESDAY, MARCH 10");
  });
});

describe("formatDay", () => {
  it("gets the weekday right across years and leap days", () => {
    expect(formatDay("2024-02-29")).toBe("THURSDAY, FEBRUARY 29");
    expect(formatDay("2026-11-10")).toBe("TUESDAY, NOVEMBER 10");
    expect(formatDay("2027-01-01")).toBe("FRIDAY, JANUARY 1");
  });

  it("returns nothing for a blank or impossible date", () => {
    expect(formatDay("")).toBe("");
    expect(formatDay("2026-02-30")).toBe("");
    expect(formatDay("2026-13-01")).toBe("");
    expect(formatDay("March 10")).toBe("");
  });
});

describe("formatTime", () => {
  it("returns nothing for a blank or impossible time", () => {
    expect(formatTime("")).toBe("");
    expect(formatTime("24:00")).toBe("");
    expect(formatTime("10:75")).toBe("");
  });
});
