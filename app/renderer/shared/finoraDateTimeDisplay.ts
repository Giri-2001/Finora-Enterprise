/**
 * FINORA standard user-facing date and time.
 * DD-MM-YYYY HH:mm in Asia/Kolkata.
 * Original API/database timestamps are never modified.
 */

const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatFinoraDateTime(
  value: string | number | Date | null | undefined,
): string {
  const empty = "\u2014";

  if (value === null || value === undefined || value === "") {
    return empty;
  }

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split("-").map(Number);

      if (
        new Date(Date.UTC(year, month - 1, day))
          .toISOString()
          .slice(0, 10) !== value
      ) {
        return empty;
      }

      return [
        String(day).padStart(2, "0"),
        String(month).padStart(2, "0"),
        String(year).padStart(4, "0"),
      ].join("-");
    }

    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
    ) {
      return empty;
    }
  }

  const date = value instanceof Date ? value : new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return empty;
  }

  const parts = formatter.formatToParts(date);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const day = get("day");
  const month = get("month");
  const year = get("year");
  const hour = get("hour");
  const minute = get("minute");

  if (!day || !month || !year || !hour || !minute) {
    return empty;
  }

  return `${day}-${month}-${year} ${hour}:${minute}`;
}