/* ===========================================================
   FINORA ENTERPRISE OS™
   ACCOUNTS ENGINE™

   ACCOUNTS TOTALS ENGINE

   RESPONSIBILITY:
   - Calculate Money Out totals
   - Calculate Money In totals
   - Calculate Net Movement
   - Calculate transaction counts
   - Provide one authoritative summary calculation
   - Keep financial calculations outside React / JSX

   IMPORTANT:
   - No React.
   - No styles.
   - No persistence.
   - No repository access.
   - No mutation.
   - No filtering.
   - No currency formatting.
   - No theme logic.
   - No responsive logic.

   FORMULA:

   TOTAL MONEY OUT
     =
   Sum of visible Money Out values

   TOTAL MONEY IN
     =
   Sum of visible Money In values

   NET MOVEMENT
     =
   Total Money In - Total Money Out

   VERSION : 1.0
=========================================================== */

import type {
  AccountEntry,
  AccountsSummary,
} from "../../types/accounts/accounts.types";

/* ===========================================================
   EMPTY SUMMARY
=========================================================== */

export const EMPTY_ACCOUNTS_SUMMARY: Readonly<AccountsSummary> = {
  totalMoneyOut: 0,

  totalMoneyIn: 0,

  netMovement: 0,

  transactionCount: 0,

  moneyOutCount: 0,

  moneyInCount: 0,
};

/* ===========================================================
   SAFE POSITIVE MONEY

   Accounts ledger movements must never produce:
   - NaN
   - Infinity
   - negative debit / credit side values

   Negative Net Movement is valid and is handled separately.
=========================================================== */

function safePositiveMoney(value: unknown): number {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 0;
  }

  return numericValue;
}

/* ===========================================================
   NORMALIZE ZERO

   Prevent JavaScript -0 from reaching UI / PDF layers.
=========================================================== */

function normalizeZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

/* ===========================================================
   ENTRY MONEY OUT
=========================================================== */

export function getAccountEntryMoneyOut(entry: AccountEntry): number {
  return safePositiveMoney(entry.moneyOut);
}

/* ===========================================================
   ENTRY MONEY IN
=========================================================== */

export function getAccountEntryMoneyIn(entry: AccountEntry): number {
  return safePositiveMoney(entry.moneyIn);
}

/* ===========================================================
   ENTRY NET MOVEMENT

   CREDIT / MONEY IN
      +
   positive movement

   DEBIT / MONEY OUT
      +
   negative movement
=========================================================== */

export function getAccountEntryNetMovement(entry: AccountEntry): number {
  const moneyIn = getAccountEntryMoneyIn(entry);

  const moneyOut = getAccountEntryMoneyOut(entry);

  return normalizeZero(moneyIn - moneyOut);
}

/* ===========================================================
   MONEY OUT TOTAL
=========================================================== */

export function calculateTotalMoneyOut(
  entries: readonly AccountEntry[],
): number {
  let total = 0;

  for (const entry of entries) {
    total += getAccountEntryMoneyOut(entry);
  }

  return normalizeZero(total);
}

/* ===========================================================
   MONEY IN TOTAL
=========================================================== */

export function calculateTotalMoneyIn(
  entries: readonly AccountEntry[],
): number {
  let total = 0;

  for (const entry of entries) {
    total += getAccountEntryMoneyIn(entry);
  }

  return normalizeZero(total);
}

/* ===========================================================
   NET MOVEMENT
=========================================================== */

export function calculateNetMovement(
  totalMoneyIn: number,
  totalMoneyOut: number,
): number {
  const safeMoneyIn = Number.isFinite(totalMoneyIn) ? totalMoneyIn : 0;

  const safeMoneyOut = Number.isFinite(totalMoneyOut) ? totalMoneyOut : 0;

  return normalizeZero(safeMoneyIn - safeMoneyOut);
}

/* ===========================================================
   MONEY OUT COUNT
=========================================================== */

export function calculateMoneyOutCount(
  entries: readonly AccountEntry[],
): number {
  let count = 0;

  for (const entry of entries) {
    if (getAccountEntryMoneyOut(entry) > 0) {
      count += 1;
    }
  }

  return count;
}

/* ===========================================================
   MONEY IN COUNT
=========================================================== */

export function calculateMoneyInCount(
  entries: readonly AccountEntry[],
): number {
  let count = 0;

  for (const entry of entries) {
    if (getAccountEntryMoneyIn(entry) > 0) {
      count += 1;
    }
  }

  return count;
}

/* ===========================================================
   ACCOUNTS SUMMARY

   This is the single summary calculator consumed by:

   - Accounts Summary cards
   - Date-group totals
   - Accounts PDF
   - Print register
   - Share register
=========================================================== */

export function calculateAccountsSummary(
  entries: readonly AccountEntry[],
): AccountsSummary {
  if (entries.length === 0) {
    return {
      ...EMPTY_ACCOUNTS_SUMMARY,
    };
  }

  let totalMoneyOut = 0;

  let totalMoneyIn = 0;

  let moneyOutCount = 0;

  let moneyInCount = 0;

  for (const entry of entries) {
    const moneyOut = getAccountEntryMoneyOut(entry);

    const moneyIn = getAccountEntryMoneyIn(entry);

    totalMoneyOut += moneyOut;

    totalMoneyIn += moneyIn;

    if (moneyOut > 0) {
      moneyOutCount += 1;
    }

    if (moneyIn > 0) {
      moneyInCount += 1;
    }
  }

  totalMoneyOut = normalizeZero(totalMoneyOut);

  totalMoneyIn = normalizeZero(totalMoneyIn);

  const netMovement = calculateNetMovement(totalMoneyIn, totalMoneyOut);

  return {
    totalMoneyOut,

    totalMoneyIn,

    netMovement,

    transactionCount: entries.length,

    moneyOutCount,

    moneyInCount,
  };
}

/* ===========================================================
   END
=========================================================== */
