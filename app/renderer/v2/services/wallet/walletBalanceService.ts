/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   WALLET BALANCE SERVICE

   RESPONSIBILITY:
   - Validate Wallet monetary amounts
   - Calculate Recharge balance transitions
   - Calculate Debit balance transitions
   - Prevent negative Wallet balances
   - Provide deterministic balance transition results

   IMPORTANT:
   - PURE FINANCIAL LOGIC ONLY.
   - No persistence.
   - No repository access.
   - No React.
   - No UI.
   - No payment gateway calls.
   - No storage access.
   - No transaction creation.
   - Wallet balance must never become negative.

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */

/* ============================================================
   TYPES
============================================================ */

export interface WalletBalanceTransition {
  balanceBefore:
    number;

  amount:
    number;

  balanceAfter:
    number;
}

export interface WalletBalanceFailure {
  success:
    false;

  errorCode:
    "INVALID_BALANCE"
    | "INVALID_AMOUNT"
    | "INSUFFICIENT_BALANCE";

  error:
    string;
}

export interface WalletBalanceSuccess {
  success:
    true;

  transition:
    WalletBalanceTransition;
}

export type WalletBalanceResult =
  | WalletBalanceSuccess
  | WalletBalanceFailure;

/* ============================================================
   MONEY NORMALIZATION
============================================================ */

export function normalizeWalletMoney(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return Number.NaN;
  }

  return Math.round(
    (value + Number.EPSILON) * 100,
  ) / 100;
}

/**
 * Convert one FINORA Wallet rupee amount into canonical
 * INR minor units (paise).
 *
 * Wallet persistence remains rupee-denominated. This helper
 * exists for exact comparison with signed WALLET_RECHARGE
 * amountMinor values.
 *
 * Number.NaN means the supplied value cannot be represented
 * as a safe canonical minor-unit integer.
 */
export function convertWalletMoneyToMinorUnits(
  value: number,
): number {
  const normalizedValue =
    normalizeWalletMoney(value);

  if (!Number.isFinite(normalizedValue)) {
    return Number.NaN;
  }

  const amountMinor =
    Math.round(
      normalizedValue * 100,
    );

  if (!Number.isSafeInteger(amountMinor)) {
    return Number.NaN;
  }

  return amountMinor;
}

/* ============================================================
   BALANCE VALIDATION
============================================================ */

function validateCurrentBalance(
  balance: number,
): WalletBalanceFailure | undefined {
  const normalizedBalance =
    normalizeWalletMoney(balance);

  if (
    !Number.isFinite(normalizedBalance) ||
    normalizedBalance < 0
  ) {
    return {
      success:
        false,

      errorCode:
        "INVALID_BALANCE",

      error:
        "FINORA Wallet balance must be a non-negative finite amount.",
    };
  }

  return undefined;
}

/* ============================================================
   AMOUNT VALIDATION
============================================================ */

function validateTransactionAmount(
  amount: number,
): WalletBalanceFailure | undefined {
  const normalizedAmount =
    normalizeWalletMoney(amount);

  if (
    !Number.isFinite(normalizedAmount) ||
    normalizedAmount <= 0
  ) {
    return {
      success:
        false,

      errorCode:
        "INVALID_AMOUNT",

      error:
        "FINORA Wallet transaction amount must be greater than zero.",
    };
  }

  return undefined;
}

/* ============================================================
   RECHARGE
============================================================ */

export function calculateWalletRecharge(
  currentBalance: number,
  rechargeAmount: number,
): WalletBalanceResult {
  const balanceError =
    validateCurrentBalance(currentBalance);

  if (balanceError) {
    return balanceError;
  }

  const amountError =
    validateTransactionAmount(rechargeAmount);

  if (amountError) {
    return amountError;
  }

  const balanceBefore =
    normalizeWalletMoney(currentBalance);

  const amount =
    normalizeWalletMoney(rechargeAmount);

  const balanceAfter =
    normalizeWalletMoney(
      balanceBefore + amount,
    );

  return {
    success:
      true,

    transition: {
      balanceBefore,

      amount,

      balanceAfter,
    },
  };
}

/* ============================================================
   DEBIT
============================================================ */

export function calculateWalletDebit(
  currentBalance: number,
  debitAmount: number,
): WalletBalanceResult {
  const balanceError =
    validateCurrentBalance(currentBalance);

  if (balanceError) {
    return balanceError;
  }

  const amountError =
    validateTransactionAmount(debitAmount);

  if (amountError) {
    return amountError;
  }

  const balanceBefore =
    normalizeWalletMoney(currentBalance);

  const amount =
    normalizeWalletMoney(debitAmount);

  if (amount > balanceBefore) {
    return {
      success:
        false,

      errorCode:
        "INSUFFICIENT_BALANCE",

      error:
        "Insufficient FINORA Wallet balance.",
    };
  }

  const balanceAfter =
    normalizeWalletMoney(
      balanceBefore - amount,
    );

  return {
    success:
      true,

    transition: {
      balanceBefore,

      amount,

      balanceAfter,
    },
  };
}

/* ============================================================
   AFFORDABILITY
============================================================ */

export function canWalletAfford(
  currentBalance: number,
  requiredAmount: number,
): boolean {
  const result =
    calculateWalletDebit(
      currentBalance,
      requiredAmount,
    );

  return result.success;
}

/* ============================================================
   END
============================================================ */
