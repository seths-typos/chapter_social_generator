/**
 * The Info template's date/time line, built from the structured date and time inputs so
 * every post reads the same way. docs/template-spec.md#fields-and-overflow
 *
 *   TUESDAY, MARCH 10, 6:30 PM - 9:00 PM
 */

const WEEKDAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const MONTHS = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];
const TIME_SEPARATOR = " - ";

/** `YYYY-MM-DD` → `TUESDAY, MARCH 10`. Empty for a blank or impossible date. */
export function formatDay(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return "";
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  // UTC throughout, so the weekday never depends on the browser's time zone.
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCFullYear(year);
  if (d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return "";
  return `${WEEKDAYS[d.getUTCDay()]}, ${MONTHS[month - 1]} ${day}`;
}

/** `HH:mm` (24-hour) → `6:30 PM`. Empty for a blank or impossible time. */
export function formatTime(time: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!m) return "";
  const [hours, minutes] = [Number(m[1]), Number(m[2])];
  if (hours > 23 || minutes > 59) return "";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${m[2]} ${hours < 12 ? "AM" : "PM"}`;
}

/**
 * The full line. Parts that aren't filled in yet are left out, so the preview shows what
 * there is so far. An end time without a start time is ignored.
 */
export function formatEventDate(date: string, startTime: string, endTime = ""): string {
  const start = formatTime(startTime);
  const end = start ? formatTime(endTime) : "";
  const times = end ? `${start}${TIME_SEPARATOR}${end}` : start;
  return [formatDay(date), times].filter(Boolean).join(", ");
}
