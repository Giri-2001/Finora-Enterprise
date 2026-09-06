/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   PENDING WALLET MUTATION RECOVERY ENGINE SELFTEST

   RESPONSIBILITY:
   - Prove Debit APPLIED / NOT_APPLIED classification
   - Prove Credit APPLIED / NOT_APPLIED classification
   - Prove Wallet two-decimal normalization alignment
   - Prove unsupported / invalid / unrelated states fail closed

   IMPORTANT:
   - No persistence.
   - No StorageManager.
   - No Wallet mutation.
   - No ledger finalization.
============================================================ */

import type {
  WalletTransaction,
} from "../../types/wallet/wallet.types";

import {
  classifyPendingWalletMutationBalance,
} from "./walletPendingMutationRecoveryEngine";

/* ============================================================
   ASSERTION
============================================================ */

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(
      `SELFTEST FAILED: ${message}`,
    );
  }

  console.log(
    `PASS: ${message}`,
  );
}

/* ============================================================
   FIXTURES
============================================================ */

function buildPendingDebit(
  amount: number,
  availableBalance: number,
): WalletTransaction {
  return {
    id:
      "WALLET-RECOVERY-DEBIT-001",

    entity:
      "WALLET_TRANSACTION",

    walletId:
      "WALLET-RECOVERY-001",

    ownerId:
      "OWNER-RECOVERY-001",

    businessId:
      "BUSINESS-RECOVERY-001",

    branchId:
      "BRANCH-RECOVERY-001",

    type:
      "LOAN_DISBURSEMENT_PLATFORM_FEE",

    direction:
      "DEBIT",

    moneyFlow:
      "MONEY_OUT",

    status:
      "PENDING",

    amount,

    title:
      "Recovery Debit",

    remarks:
      "Pending recovery debit",

    occurredAt:
      "2026-09-06T05:00:00.000Z",

    availableBalance,

    referenceId:
      "LOAN-RECOVERY-001",

    sourceId:
      "LOAN-ID-RECOVERY-001",

    sourceType:
      "LOAN",

    chargeReason:
      "LOAN_DISBURSEMENT_PLATFORM_FEE",

    createdAt:
      "2026-09-06T05:00:00.000Z",

    updatedAt:
      "2026-09-06T05:00:00.000Z",

    schemaVersion:
      1,
  };
}

function buildPendingRecharge(
  amount: number,
  availableBalance: number,
): WalletTransaction {
  return {
    id:
      "WALLET-RECOVERY-RECHARGE-001",

    entity:
      "WALLET_TRANSACTION",

    walletId:
      "WALLET-RECOVERY-001",

    ownerId:
      "OWNER-RECOVERY-001",

    businessId:
      "BUSINESS-RECOVERY-001",

    branchId:
      "BRANCH-RECOVERY-001",

    type:
      "WALLET_RECHARGE",

    direction:
      "CREDIT",

    moneyFlow:
      "MONEY_IN",

    status:
      "PENDING",

    amount,

    title:
      "Wallet Recharge",

    remarks:
      "Pending recovery recharge",

    occurredAt:
      "2026-09-06T05:10:00.000Z",

    availableBalance,

    referenceId:
      "FINORA:WALLET:RECHARGE:RECOVERY-001",

    sourceId:
      "PAY-RECOVERY-001",

    sourceType:
      "PAYMENT",

    paymentReference:
      "PAY-RECOVERY-001",

    paymentMethod:
      "UPI",

    paymentSource:
      "UPI",

    createdAt:
      "2026-09-06T05:10:00.000Z",

    updatedAt:
      "2026-09-06T05:10:00.000Z",

    schemaVersion:
      1,
  };
}

/* ============================================================
   DEBIT
============================================================ */

function testDebitApplied():
void {
  const decision =
    classifyPendingWalletMutationBalance(
      90,
      buildPendingDebit(
        10,
        90,
      ),
    );

  assert(
    decision.state === "APPLIED",
    "Debit is APPLIED when current balance matches persisted post-debit balance",
  );

  assert(
    decision.expectedBalanceBefore === 100 &&
    decision.expectedBalanceAfter === 90,
    "Debit recovery reconstructs 100 -> 90 transition",
  );
}

function testDebitNotApplied():
void {
  const decision =
    classifyPendingWalletMutationBalance(
      100,
      buildPendingDebit(
        10,
        90,
      ),
    );

  assert(
    decision.state === "NOT_APPLIED",
    "Debit is NOT_APPLIED when current balance matches reconstructed pre-debit balance",
  );
}

/* ============================================================
   CREDIT
============================================================ */

function testCreditApplied():
void {
  const decision =
    classifyPendingWalletMutationBalance(
      120,
      buildPendingRecharge(
        20,
        120,
      ),
    );

  assert(
    decision.state === "APPLIED",
    "Recharge is APPLIED when current balance matches persisted post-credit balance",
  );

  assert(
    decision.expectedBalanceBefore === 100 &&
    decision.expectedBalanceAfter === 120,
    "Recharge recovery reconstructs 100 -> 120 transition",
  );
}

function testCreditNotApplied():
void {
  const decision =
    classifyPendingWalletMutationBalance(
      100,
      buildPendingRecharge(
        20,
        120,
      ),
    );

  assert(
    decision.state === "NOT_APPLIED",
    "Recharge is NOT_APPLIED when current balance matches reconstructed pre-credit balance",
  );
}

/* ============================================================
   MONEY NORMALIZATION
============================================================ */

function testTwoDecimalNormalization():
void {
  const debitDecision =
    classifyPendingWalletMutationBalance(
      89.999999999,
      buildPendingDebit(
        10.000000001,
        90.000000001,
      ),
    );

  assert(
    debitDecision.state === "APPLIED",
    "Debit recovery uses FINORA two-decimal normalization",
  );

  assert(
    debitDecision.normalizedCurrentBalance === 90 &&
    debitDecision.normalizedAmount === 10 &&
    debitDecision.expectedBalanceAfter === 90 &&
    debitDecision.expectedBalanceBefore === 100,
    "Debit normalized recovery values are deterministic",
  );

  const rechargeDecision =
    classifyPendingWalletMutationBalance(
      100.000000001,
      buildPendingRecharge(
        20.000000001,
        120.000000001,
      ),
    );

  assert(
    rechargeDecision.state === "NOT_APPLIED",
    "Recharge pre-balance classification also uses two-decimal normalization",
  );
}

/* ============================================================
   FAIL-CLOSED STATES
============================================================ */

function testUnrelatedBalanceIsAmbiguous():
void {
  const decision =
    classifyPendingWalletMutationBalance(
      95,
      buildPendingDebit(
        10,
        90,
      ),
    );

  assert(
    decision.state === "AMBIGUOUS",
    "Current balance matching neither before nor after fails closed",
  );
}

function testNonPendingTransactionIsAmbiguous():
void {
  const transaction =
    buildPendingDebit(
      10,
      90,
    );

  transaction.status =
    "SUCCESS";

  const decision =
    classifyPendingWalletMutationBalance(
      90,
      transaction,
    );

  assert(
    decision.state === "AMBIGUOUS",
    "non-PENDING transaction cannot enter Wallet recovery",
  );
}

function testInvalidCurrentBalanceIsAmbiguous():
void {
  const decision =
    classifyPendingWalletMutationBalance(
      Number.NaN,
      buildPendingDebit(
        10,
        90,
      ),
    );

  assert(
    decision.state === "AMBIGUOUS",
    "non-finite current Wallet balance fails closed",
  );
}

function testInvalidAmountIsAmbiguous():
void {
  const decision =
    classifyPendingWalletMutationBalance(
      90,
      buildPendingDebit(
        0,
        90,
      ),
    );

  assert(
    decision.state === "AMBIGUOUS",
    "non-positive pending transaction amount fails closed",
  );
}

function testImpossibleCreditBeforeBalanceIsAmbiguous():
void {
  const decision =
    classifyPendingWalletMutationBalance(
      5,
      buildPendingRecharge(
        10,
        5,
      ),
    );

  assert(
    decision.state === "AMBIGUOUS",
    "Recharge recovery rejects a negative reconstructed pre-credit balance",
  );
}

function testUnsupportedDirectionIsAmbiguous():
void {
  const malformed =
    {
      ...buildPendingDebit(
        10,
        90,
      ),

      direction:
        "SIDEWAYS",
    } as unknown as WalletTransaction;

  const decision =
    classifyPendingWalletMutationBalance(
      90,
      malformed,
    );

  assert(
    decision.state === "AMBIGUOUS",
    "unsupported Wallet transaction direction fails closed",
  );
}

/* ============================================================
   RUN
============================================================ */

function runSelfTest():
void {
  testDebitApplied();

  testDebitNotApplied();

  testCreditApplied();

  testCreditNotApplied();

  testTwoDecimalNormalization();

  testUnrelatedBalanceIsAmbiguous();

  testNonPendingTransactionIsAmbiguous();

  testInvalidCurrentBalanceIsAmbiguous();

  testInvalidAmountIsAmbiguous();

  testImpossibleCreditBeforeBalanceIsAmbiguous();

  testUnsupportedDirectionIsAmbiguous();

  console.log("");

  console.log(
    "PASS: FINORA PENDING WALLET MUTATION RECOVERY ENGINE SELFTEST",
  );
}

try {
  runSelfTest();
} catch (error) {
  console.error(
    "FAIL: FINORA PENDING WALLET MUTATION RECOVERY ENGINE SELFTEST",
    error,
  );

  process.exitCode =
    1;
}

/* ============================================================
   END
============================================================ */