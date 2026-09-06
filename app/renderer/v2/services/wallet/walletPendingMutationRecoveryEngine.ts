/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   PENDING WALLET MUTATION RECOVERY ENGINE

   RESPONSIBILITY:
   - Classify persisted PENDING Wallet mutation balance state
   - Reconstruct the authoritative pre-mutation balance
   - Preserve FINORA two-decimal Wallet money normalization
   - Fail closed when balance state cannot be proven

   IMPORTANT:
   - PURE LOGIC ONLY.
   - No repository access.
   - No StorageManager.
   - No Wallet mutation.
   - No ledger finalization.
   - No React.
   - No UI.
   - No Business Date.
   - This engine does not decide whether recovery is globally safe.
   - Ledger chronology and competing PENDING records must be
     checked by the recovery orchestration service.
============================================================ */

import type {
  WalletTransaction,
} from "../../types/wallet/wallet.types";

/* ============================================================
   TYPES
============================================================ */

export type WalletPendingMutationBalanceState =
  | "APPLIED"
  | "NOT_APPLIED"
  | "AMBIGUOUS";

export interface WalletPendingMutationRecoveryDecision {
  state:
    WalletPendingMutationBalanceState;

  normalizedCurrentBalance:
    number;

  expectedBalanceBefore:
    number;

  expectedBalanceAfter:
    number;

  normalizedAmount:
    number;

  reason:
    string;
}

/* ============================================================
   MONEY NORMALIZATION
============================================================ */

/**
 * Must remain aligned with walletBalanceService.ts.
 */
function normalizeWalletRecoveryMoney(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return Number.NaN;
  }

  return Math.round(
    (value + Number.EPSILON) * 100,
  ) / 100;
}

/* ============================================================
   AMBIGUOUS RESULT
============================================================ */

function buildAmbiguousDecision(
  currentBalance: number,
  amount: number,
  balanceBefore: number,
  balanceAfter: number,
  reason: string,
): WalletPendingMutationRecoveryDecision {
  return {
    state:
      "AMBIGUOUS",

    normalizedCurrentBalance:
      currentBalance,

    expectedBalanceBefore:
      balanceBefore,

    expectedBalanceAfter:
      balanceAfter,

    normalizedAmount:
      amount,

    reason,
  };
}

/* ============================================================
   CLASSIFY PENDING MUTATION BALANCE STATE
============================================================ */

export function classifyPendingWalletMutationBalance(
  currentWalletBalance: number,
  pendingTransaction: WalletTransaction,
): WalletPendingMutationRecoveryDecision {
  const normalizedCurrentBalance =
    normalizeWalletRecoveryMoney(
      currentWalletBalance,
    );

  const normalizedAmount =
    normalizeWalletRecoveryMoney(
      pendingTransaction.amount,
    );

  const expectedBalanceAfter =
    normalizeWalletRecoveryMoney(
      pendingTransaction.availableBalance,
    );

  if (
    pendingTransaction.status !== "PENDING"
  ) {
    return buildAmbiguousDecision(
      normalizedCurrentBalance,
      normalizedAmount,
      Number.NaN,
      expectedBalanceAfter,
      "Wallet recovery requires a PENDING transaction.",
    );
  }

  if (
    !Number.isFinite(
      normalizedCurrentBalance,
    ) ||
    normalizedCurrentBalance < 0
  ) {
    return buildAmbiguousDecision(
      normalizedCurrentBalance,
      normalizedAmount,
      Number.NaN,
      expectedBalanceAfter,
      "Current Wallet balance is invalid for recovery.",
    );
  }

  if (
    !Number.isFinite(
      normalizedAmount,
    ) ||
    normalizedAmount <= 0
  ) {
    return buildAmbiguousDecision(
      normalizedCurrentBalance,
      normalizedAmount,
      Number.NaN,
      expectedBalanceAfter,
      "Pending Wallet transaction amount is invalid for recovery.",
    );
  }

  if (
    !Number.isFinite(
      expectedBalanceAfter,
    ) ||
    expectedBalanceAfter < 0
  ) {
    return buildAmbiguousDecision(
      normalizedCurrentBalance,
      normalizedAmount,
      Number.NaN,
      expectedBalanceAfter,
      "Pending Wallet post-transaction balance is invalid for recovery.",
    );
  }

  let expectedBalanceBefore:
    number;

  if (
    pendingTransaction.direction ===
    "DEBIT"
  ) {
    expectedBalanceBefore =
      normalizeWalletRecoveryMoney(
        expectedBalanceAfter +
        normalizedAmount,
      );
  } else if (
    pendingTransaction.direction ===
    "CREDIT"
  ) {
    expectedBalanceBefore =
      normalizeWalletRecoveryMoney(
        expectedBalanceAfter -
        normalizedAmount,
      );
  } else {
    return buildAmbiguousDecision(
      normalizedCurrentBalance,
      normalizedAmount,
      Number.NaN,
      expectedBalanceAfter,
      "Pending Wallet transaction direction is unsupported for recovery.",
    );
  }

  if (
    !Number.isFinite(
      expectedBalanceBefore,
    ) ||
    expectedBalanceBefore < 0
  ) {
    return buildAmbiguousDecision(
      normalizedCurrentBalance,
      normalizedAmount,
      expectedBalanceBefore,
      expectedBalanceAfter,
      "Reconstructed pre-transaction Wallet balance is invalid.",
    );
  }

  if (
    normalizedCurrentBalance ===
    expectedBalanceAfter
  ) {
    return {
      state:
        "APPLIED",

      normalizedCurrentBalance,

      expectedBalanceBefore,

      expectedBalanceAfter,

      normalizedAmount,

      reason:
        "Current Wallet balance matches the persisted post-mutation balance.",
    };
  }

  if (
    normalizedCurrentBalance ===
    expectedBalanceBefore
  ) {
    return {
      state:
        "NOT_APPLIED",

      normalizedCurrentBalance,

      expectedBalanceBefore,

      expectedBalanceAfter,

      normalizedAmount,

      reason:
        "Current Wallet balance matches the reconstructed pre-mutation balance.",
    };
  }

  return buildAmbiguousDecision(
    normalizedCurrentBalance,
    normalizedAmount,
    expectedBalanceBefore,
    expectedBalanceAfter,
    "Current Wallet balance matches neither the pre-mutation nor post-mutation balance.",
  );
}

/* ============================================================
   END
============================================================ */