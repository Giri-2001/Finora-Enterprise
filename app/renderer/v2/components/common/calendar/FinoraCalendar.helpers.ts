const ISO_DATE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})$/;

const DISPLAY_DATE_PATTERN =
  /^(\d{2})\/(\d{2})\/(\d{4})$/;

export function parseIsoDate(
  value: string,
): Date | null {

  const match =
    ISO_DATE_PATTERN.exec(
      String(value ?? "").trim(),
    );

  if (!match) {
    return null;
  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const day =
    Number(match[3]);

  const date =
    new Date(
      year,
      month - 1,
      day,
    );

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
    ? date
    : null;
}

export function formatIsoDate(
  date: Date,
): string {

  const year =
    String(date.getFullYear()).padStart(4, "0");

  const month =
    String(date.getMonth() + 1).padStart(2, "0");

  const day =
    String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(
  date: Date,
): string {

  const day =
    String(date.getDate()).padStart(2, "0");

  const month =
    String(date.getMonth() + 1).padStart(2, "0");

  const year =
    String(date.getFullYear()).padStart(4, "0");

  return `${day}/${month}/${year}`;
}

export function isoToDisplayDate(
  value: string,
): string {

  const parsed =
    parseIsoDate(value);

  return parsed
    ? formatDisplayDate(parsed)
    : "";
}

export function displayToIsoDate(
  value: string,
): string | null {

  const match =
    DISPLAY_DATE_PATTERN.exec(
      String(value ?? "").trim(),
    );

  if (!match) {
    return null;
  }

  const day =
    Number(match[1]);

  const month =
    Number(match[2]);

  const year =
    Number(match[3]);

  const date =
    new Date(
      year,
      month - 1,
      day,
    );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return formatIsoDate(date);
}

export function normalizeTypedDate(
  rawValue: string,
): string {

  const digits =
    String(rawValue ?? "")
      .replace(/\D/g, "")
      .slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return (
    `${digits.slice(0, 2)}/` +
    `${digits.slice(2, 4)}/` +
    `${digits.slice(4, 8)}`
  );
}

export function getMonthStart(
  date: Date,
): Date {

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
  );
}

export function isSameDay(
  first: Date,
  second: Date,
): boolean {

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function isSameMonth(
  first: Date,
  second: Date,
): boolean {

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth()
  );
}

export function buildCalendarDays(
  month: Date,
): Date[] {

  const year =
    month.getFullYear();

  const monthIndex =
    month.getMonth();

  const firstDay =
    new Date(
      year,
      monthIndex,
      1,
    );

  const totalDays =
    new Date(
      year,
      monthIndex + 1,
      0,
    ).getDate();

  const firstWeekday =
    firstDay.getDay();

  const totalCells =
    Math.ceil(
      (firstWeekday + totalDays) / 7,
    ) * 7;

  return Array.from(
    {
      length:
        totalCells,
    },
    (_, index) =>
      new Date(
        year,
        monthIndex,
        index - firstWeekday + 1,
      ),
  );
}

export function isDateWithinBoundary(
  date: Date,
  min?: string,
  max?: string,
): boolean {

  const target =
    formatIsoDate(date);

  if (
    min &&
    target < min
  ) {
    return false;
  }

  if (
    max &&
    target > max
  ) {
    return false;
  }

  return true;
}

export function getRangeDurationDays(
  fromValue: string,
  toValue: string,
): number | null {

  const from =
    parseIsoDate(fromValue);

  const to =
    parseIsoDate(toValue);

  if (
    !from ||
    !to ||
    to.getTime() < from.getTime()
  ) {
    return null;
  }

  const millisecondsPerDay =
    24 * 60 * 60 * 1000;

  const fromUtc =
    Date.UTC(
      from.getFullYear(),
      from.getMonth(),
      from.getDate(),
    );

  const toUtc =
    Date.UTC(
      to.getFullYear(),
      to.getMonth(),
      to.getDate(),
    );

  return Math.round(
    (toUtc - fromUtc) /
      millisecondsPerDay,
  );
}

export interface FinoraRelativeDayIndicator {
  label: string;
  exactDays: number;
  title: string;
}

export function getRelativeDayIndicator(
  value: string,
  referenceDate: Date = new Date(),
): FinoraRelativeDayIndicator | null {

  const selected =
    parseIsoDate(value);

  if (!selected) {
    return null;
  }

  const selectedUtc =
    Date.UTC(
      selected.getFullYear(),
      selected.getMonth(),
      selected.getDate(),
    );

  const referenceUtc =
    Date.UTC(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate(),
    );

  const millisecondsPerDay =
    24 * 60 * 60 * 1000;

  const exactDays =
    Math.round(
      (selectedUtc - referenceUtc) /
        millisecondsPerDay,
    );

  if (exactDays === 0) {
    return {
      label: "Today",
      exactDays,
      title: "Today",
    };
  }

  if (exactDays === -1) {
    return {
      label: "Yesterday",
      exactDays,
      title: "1 day before today",
    };
  }

  if (exactDays === 1) {
    return {
      label: "Tomorrow",
      exactDays,
      title: "1 day after today",
    };
  }

  const absoluteDays =
    Math.abs(exactDays);

  const capped =
    absoluteDays > 9999;

  const sign =
    exactDays < 0
      ? "-"
      : "+";

  return {
    label:
      capped
        ? `${sign}9999+`
        : `${sign}${absoluteDays}`,
    exactDays,
    title:
      exactDays < 0
        ? `${absoluteDays} days before today`
        : `${absoluteDays} days after today`,
  };
}