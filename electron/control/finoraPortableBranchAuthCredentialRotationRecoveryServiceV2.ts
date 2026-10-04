// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH V2 CREDENTIAL ROTATION RECOVERY SERVICE
//
// PURPOSE:
//
// Recover unfinished V2 credential rotations without requiring
// Password or Security Code.
//
// SECURITY:
//
// - MAIN PROCESS ONLY.
// - Recovery replays immutable durable transaction artifacts.
// - No plaintext credential factor is accepted.
// - COMPLETE history is ignored.
// - More than one unfinished transaction for one credential
//   fails closed before Portable mutation.
// - Actual state reconciliation is delegated to the V2 resume
//   engine.
// ============================================================

import {
  readFinoraControlStore,
} from "./finoraControlStore.js";

import {
  resumeFinoraPortableBranchAuthCredentialRotationV2,
} from "./finoraPortableBranchAuthCredentialRotationResumeV2.js";

import type {
  FinoraPortableBranchAuthV2Store,
} from "./finoraPortableBranchAuthV2Store.js";

import type {
  FinoraPortableBranchAuthCredentialRotationTransactionV2,
} from "./finoraPortableBranchAuthCredentialRotationTransactionV2.js";

// ============================================================
// CONTRACT
// ============================================================

export interface FinoraPortableBranchAuthCredentialRotationRecoveryV2Input {
  portableStore:
    FinoraPortableBranchAuthV2Store;
}

export interface FinoraPortableBranchAuthCredentialRotationRecoveredTransactionV2 {
  transactionId:
    string;

  initialStatus:
    "PREPARED" |
    "PORTABLE_REPLACED" |
    "CONTROL_APPLIED";

  completed:
    true;
}

export interface FinoraPortableBranchAuthCredentialRotationRecoveryV2Success {
  recoveredTransactions:
    FinoraPortableBranchAuthCredentialRotationRecoveredTransactionV2[];

  recoveredCount:
    number;
}

export type FinoraPortableBranchAuthCredentialRotationRecoveryV2ErrorCode =
  | "CONTROL_STORE_FAILED"
  | "DURABLE_TRANSACTION_INVALID"
  | "DURABLE_TRANSACTION_AMBIGUOUS"
  | "RECOVERY_FAILED";

export type FinoraPortableBranchAuthCredentialRotationRecoveryV2Result =
  | {
      success:
        true;

      data:
        FinoraPortableBranchAuthCredentialRotationRecoveryV2Success;
    }
  | {
      success:
        false;

      errorCode:
        FinoraPortableBranchAuthCredentialRotationRecoveryV2ErrorCode;

      error:
        string;
    };

// ============================================================
// HELPERS
// ============================================================

function failure(
  errorCode:
    FinoraPortableBranchAuthCredentialRotationRecoveryV2ErrorCode,
  error:
    string,
): FinoraPortableBranchAuthCredentialRotationRecoveryV2Result {
  return {
    success:
      false,

    errorCode,

    error,
  };
}

function isRecoverableStatus(
  transaction:
    FinoraPortableBranchAuthCredentialRotationTransactionV2,
): transaction is
  FinoraPortableBranchAuthCredentialRotationTransactionV2 & {
    status:
      "PREPARED" |
      "PORTABLE_REPLACED" |
      "CONTROL_APPLIED";
  } {
  return (
    transaction.status ===
      "PREPARED" ||
    transaction.status ===
      "PORTABLE_REPLACED" ||
    transaction.status ===
      "CONTROL_APPLIED"
  );
}

// ============================================================
// SERIALIZATION
// ============================================================

let credentialRotationRecoveryV2Queue:
  Promise<void> =
    Promise.resolve();

// ============================================================
// INTERNAL RECOVERY
// ============================================================

async function recoverCredentialRotationsV2Internal(
  input:
    FinoraPortableBranchAuthCredentialRotationRecoveryV2Input,
): Promise<
  FinoraPortableBranchAuthCredentialRotationRecoveryV2Result
> {
  if (
    !input ||
    typeof input !==
      "object" ||
    !input.portableStore
  ) {
    return failure(
      "RECOVERY_FAILED",
      "A valid FINORA Portable Branch Auth V2 Store is required.",
    );
  }

  const storeResult =
    await readFinoraControlStore();

  if (
    !storeResult.success ||
    !storeResult.data
  ) {
    return failure(
      "CONTROL_STORE_FAILED",
      storeResult.error ??
        "Unable to load the FINORA Control Store for V2 credential rotation recovery.",
    );
  }

  const unfinished = [
    ...(
      storeResult.data
        .portableBranchAuthV2CredentialRotationTransactions ??
      []
    ),
  ].filter(
    (transaction) =>
      transaction.status !==
        "COMPLETE",
  );

  // ----------------------------------------------------------
  // Defensive ambiguity proof.
  //
  // Preparation already prevents this state. Recovery proves
  // it independently before touching Portable state.
  // ----------------------------------------------------------

  const activeCredentialIds =
    new Set<string>();

  for (
    const transaction of
      unfinished
  ) {
    if (
      !isRecoverableStatus(
        transaction,
      )
    ) {
      return failure(
        "DURABLE_TRANSACTION_INVALID",
        "An unfinished FINORA V2 credential rotation has an invalid recovery status.",
      );
    }

    if (
      activeCredentialIds.has(
        transaction.credentialId,
      )
    ) {
      return failure(
        "DURABLE_TRANSACTION_AMBIGUOUS",
        "Multiple unfinished FINORA V2 credential rotations exist for the same credential.",
      );
    }

    activeCredentialIds.add(
      transaction.credentialId,
    );
  }

  const recoveredTransactions:
    FinoraPortableBranchAuthCredentialRotationRecoveredTransactionV2[] =
      [];

  for (
    const transaction of
      unfinished
  ) {
    if (
      !isRecoverableStatus(
        transaction,
      )
    ) {
      return failure(
        "DURABLE_TRANSACTION_INVALID",
        "An unfinished FINORA V2 credential rotation has an invalid recovery status.",
      );
    }

    const initialStatus:
      "PREPARED" |
      "PORTABLE_REPLACED" |
      "CONTROL_APPLIED" =
        transaction.status;

    const result =
      await resumeFinoraPortableBranchAuthCredentialRotationV2({
        transaction,
        portableStore:
          input.portableStore,
      });

    if (!result.success) {
      return failure(
        "RECOVERY_FAILED",
        result.error,
      );
    }

    recoveredTransactions.push({
      transactionId:
        transaction.transactionId,

      initialStatus,

      completed:
        true,
    });
  }

  return {
    success:
      true,

    data: {
      recoveredTransactions,

      recoveredCount:
        recoveredTransactions.length,
    },
  };
}

// ============================================================
// PUBLIC API
// ============================================================

export function recoverFinoraPortableBranchAuthCredentialRotationsV2(
  input:
    FinoraPortableBranchAuthCredentialRotationRecoveryV2Input,
): Promise<
  FinoraPortableBranchAuthCredentialRotationRecoveryV2Result
> {
  const operation =
    credentialRotationRecoveryV2Queue.then(
      () =>
        recoverCredentialRotationsV2Internal(
          input,
        ),
      () =>
        recoverCredentialRotationsV2Internal(
          input,
        ),
    );

  credentialRotationRecoveryV2Queue =
    operation.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return operation;
}


