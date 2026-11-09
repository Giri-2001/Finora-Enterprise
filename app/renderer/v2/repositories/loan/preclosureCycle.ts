/**
 * PAISARULE C132-R44
 * Determine the authoritative scheduled due-date cycle
 * for a proposed preclosure date.
 *
 * Pure function: NO financial mutation or persistence.
 * The caller must use an authenticated, validated Loan schedule.
 */

export interface PreclosureCycle {
  cycleStart: string;
  cycleEnd: string;
  cycleDueDate: string;
  cycleNumber: number;
}

function parseDate(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));

  if (
    year < 1900 ||
    year > 9999 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) return null;

  const time = Date.UTC(year, month - 1, day);
  const verified = new Date(time);

  if (
    verified.getUTCFullYear() !== year ||
    verified.getUTCMonth() !== month - 1 ||
    verified.getUTCDate() !== day
  ) return null;

  return time;
}

function nextDay(value: string): string | null {
  const date = parseDate(value);
  if (date === null) return null;

  return new Date(date + 86400000)
    .toISOString()
    .slice(0, 10);
}

/**
 * Cycle boundary policy:
 * - Due date belongs to the current cycle (inclusive).
 * - Next calendar day starts the next scheduled cycle.
 * - No daily prorating.
 * - No invented due dates after the final scheduled EMI.
 */
export function resolvePreclosureCycle(
  loanDate: string,
  dueDates: readonly string[],
  closingDate: string,
): PreclosureCycle | null {
  const loan = parseDate(loanDate);
  const closing = parseDate(closingDate);

  if (
    loan === null ||
    closing === null ||
    closing < loan ||
    dueDates.length === 0
  ) return null;

  let previousDate = loan;
  let previousDue = loanDate;

  for (let index = 0; index < dueDates.length; index++) {
    const dueText = dueDates[index];
    const due = parseDate(dueText);

    // Strictly ascending schedule is mandatory.
    if (due === null || due <= previousDate) return null;

    previousDate = due;
  }

  for (let index = 0; index < dueDates.length; index++) {
    const dueText = dueDates[index];
    const due = parseDate(dueText);

    if (due === null) return null;

    if (closing <= due) {
      const cycleStart = index === 0
        ? loanDate
        : nextDay(previousDue);

      if (!cycleStart) return null;

      if (closing < (parseDate(cycleStart) ?? Infinity)) {
        return null;
      }

      return {
        cycleStart,
        cycleEnd: dueText,
        cycleDueDate: dueText,
        cycleNumber: index + 1,
      };
    }

    previousDue = dueText;
  }

  // Beyond final EMI: not an early preclosure.
  return null;
}