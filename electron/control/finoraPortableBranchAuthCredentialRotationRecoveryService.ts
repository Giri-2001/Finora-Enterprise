// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH CREDENTIAL ROTATION RECOVERY SERVICE
//
// Crash windows:
//
// PREPARED
//   - Portable may still be predecessor, OR
//   - CAS may already have committed replacement before journal mark.
//
// PORTABLE_REPLACED
//   - Portable replacement MUST already be durable.
//   - Predecessor reappearance is rollback/inconsistency and fails closed.
//
// CONTROL_APPLIED
//   - Portable MUST equal replacement.
//   - Authoritative credential MUST equal replacement.
//   - Recovery only finalizes COMPLETE.
//
// COMPLETE
//   - Historical evidence only. No mutation.
//
// SECURITY:
//
// - No Password or Security Code is required or accepted.
// - Recovery replays only immutable durable transaction artifacts.
// - No Device Trust mutation.
// - No storage-entitlement mutation.
// - No enrollment-authorization mutation.
// - Unexpected storage/control state fails closed.
// ============================================================

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import {
  applyFinoraPortableBranchAuthCredentialRotationControlState,
  completeFinoraPortableBranchAuthCredentialRotationTransaction,
  markFinoraPortableBranchAuthCredentialRotationPortableReplaced,
  readFinoraControlStore,
} from "./finoraControlStore.js";

import type {
  FinoraControlBranchCredential,
} from "./finoraControlStore.js";

import {
  computeFinoraPortableBranchAuthCredentialRotationEnvelopeSha256,
  validateFinoraPortableBranchAuthCredentialRotationTransactionV1,
} from "./finoraPortableBranchAuthCredentialRotationTransaction.js";

import type {
  FinoraPortableBranchAuthCredentialRotationTransactionV1,
} from "./finoraPortableBranchAuthCredentialRotationTransaction.js";

// ============================================================
// CONTRACT
// ============================================================

export interface FinoraPortableBranchAuthCredentialRotationRecoveryInput {
  portableStore:
    FinoraPortableBranchAuthStore;
}

export type FinoraPortableBranchAuthCredentialRotationRecoveryErrorCode =
  | "INVALID_REQUEST"
  | "CONTROL_STORE_FAILED"
  | "DURABLE_TRANSACTION_AMBIGUOUS"
  | "TRANSACTION_INVALID"
  | "CONTROL_STATE_MISMATCH"
  | "PORTABLE_STORAGE_FAILED"
  | "PORTABLE_STATE_MISMATCH"
  | "PORTABLE_REPLACED_STATE_FAILED"
  | "CONTROL_APPLY_FAILED"
  | "COMPLETE_FAILED";

export interface FinoraPortableBranchAuthCredentialRotationRecoveredTransaction {
  transactionId:
    string;

  initialStatus:
    "PREPARED" | "PORTABLE_REPLACED" | "CONTROL_APPLIED";

  completed:
    true;
}

export interface FinoraPortableBranchAuthCredentialRotationRecoverySuccess {
  recoveredTransactions:
    FinoraPortableBranchAuthCredentialRotationRecoveredTransaction[];

  recoveredCount:
    number;
}

export type FinoraPortableBranchAuthCredentialRotationRecoveryResult =
  | {
      success:
        true;

      data:
        FinoraPortableBranchAuthCredentialRotationRecoverySuccess;
    }
  | {
      success:
        false;

      errorCode:
        FinoraPortableBranchAuthCredentialRotationRecoveryErrorCode;

      error:
        string;

      transactionId?:
        string;
    };

// ============================================================
// PROCESS-WIDE SERIALIZATION
// ============================================================

let credentialRotationRecoveryQueue:
  Promise<void> =
  Promise.resolve();

// ============================================================
// RESULT HELPERS
// ============================================================

function failure(
  errorCode:
    FinoraPortableBranchAuthCredentialRotationRecoveryErrorCode,
  error:
    string,
  transactionId?:
    string,
): FinoraPortableBranchAuthCredentialRotationRecoveryResult {
  return {
    success:
      false,

    errorCode,

    error,

    ...(
      transactionId ===
        undefined
        ? {}
        : {
            transactionId,
          }
    ),
  };
}

function success(
  recoveredTransactions:
    FinoraPortableBranchAuthCredentialRotationRecoveredTransaction[],
): FinoraPortableBranchAuthCredentialRotationRecoveryResult {
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

function getErrorMessage(
  error:
    unknown,
  fallback:
    string,
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

// ============================================================
// EXACT CREDENTIAL SNAPSHOT COMPARISON
// ============================================================

function credentialsEqual(
  left:
    FinoraControlBranchCredential,
  right:
    FinoraControlBranchCredential,
): boolean {
  return JSON.stringify(
    left,
  ) ===
    JSON.stringify(
      right,
    );
}

function findCredential(
  branchCredentials:
    FinoraControlBranchCredential[] | undefined,
  transaction:
    FinoraPortableBranchAuthCredentialRotationTransactionV1,
): FinoraControlBranchCredential | null {
  const matches =
    (
      branchCredentials ??
      []
    ).filter(
      (credential) =>
        credential.credentialId ===
          transaction.credentialId &&
        credential.sourceAuthorizationId ===
          transaction.sourceAuthorizationId,
    );

  return matches.length ===
    1
    ? matches[0]
    : null;
}

// ============================================================
// PORTABLE REPLACEMENT PROOF
// ============================================================

async function provePortableReplacement(
  transaction:
    FinoraPortableBranchAuthCredentialRotationTransactionV1,
  portableStore:
    FinoraPortableBranchAuthStore,
): Promise<
  | {
      success:
        true;
    }
  | {
      success:
        false;

      errorCode:
        "PORTABLE_STORAGE_FAILED" | "PORTABLE_STATE_MISMATCH";

      error:
        string;
    }
> {
  let envelope;

  try {
    envelope =
      await portableStore.read(
        transaction.storageMode,
      );
  }
  catch (
    error
  ) {
    return {
      success:
        false,

      errorCode:
        "PORTABLE_STORAGE_FAILED",

      error:
        getErrorMessage(
          error,
          "Unable to read Portable Branch Auth state during credential rotation recovery.",
        ),
    };
  }

  if (!envelope) {
    return {
      success:
        false,

      errorCode:
        "PORTABLE_STATE_MISMATCH",

      error:
        "Credential rotation recovery requires the durable replacement Portable Branch Auth state.",
    };
  }

  let digest:
    string;

  try {
    digest =
      computeFinoraPortableBranchAuthCredentialRotationEnvelopeSha256(
        envelope,
      );
  }
  catch (
    error
  ) {
    return {
      success:
        false,

      errorCode:
        "PORTABLE_STATE_MISMATCH",

      error:
        getErrorMessage(
          error,
          "Portable Branch Auth recovery state is invalid.",
        ),
    };
  }

  if (
    digest !==
      transaction.replacementPortableEnvelopeSha256
  ) {
    return {
      success:
        false,

      errorCode:
        "PORTABLE_STATE_MISMATCH",

      error:
        "Portable Branch Auth state does not match the durable credential rotation replacement.",
    };
  }

  return {
    success:
      true,
  };
}

// ============================================================
// ONE TRANSACTION RECOVERY
// ============================================================

async function recoverTransaction(
  transaction:
    FinoraPortableBranchAuthCredentialRotationTransactionV1,
  portableStore:
    FinoraPortableBranchAuthStore,
): Promise<
  | {
      success:
        true;

      recovered:
        FinoraPortableBranchAuthCredentialRotationRecoveredTransaction;
    }
  | {
      success:
        false;

      errorCode:
        FinoraPortableBranchAuthCredentialRotationRecoveryErrorCode;

      error:
        string;
    }
> {
  try {
    validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
      transaction,
    );
  }
  catch (
    error
  ) {
    return {
      success:
        false,

      errorCode:
        "TRANSACTION_INVALID",

      error:
        getErrorMessage(
          error,
          "Credential rotation recovery transaction is invalid.",
        ),
    };
  }

  if (
    transaction.status ===
      "COMPLETE"
  ) {
    return {
      success:
        false,

      errorCode:
        "TRANSACTION_INVALID",

      error:
        "Completed credential rotation history must not enter unfinished recovery.",
    };
  }

  const initialStatus =
    transaction.status;

  // ==========================================================
  // PREPARED
  //
  // Legitimate crash states:
  //
  // A. current Portable == predecessor
  //      -> replaceExact returns REPLACED.
  //
  // B. CAS committed replacement but process crashed before mark
  //      -> replaceExact returns ALREADY_MATCHED.
  //
  // Control credential must still be exact predecessor before CAS.
  // ==========================================================

  if (
    transaction.status ===
      "PREPARED"
  ) {
    const beforeCasStore =
      await readFinoraControlStore();

    if (
      !beforeCasStore.success ||
      !beforeCasStore.data
    ) {
      return {
        success:
          false,

        errorCode:
          "CONTROL_STORE_FAILED",

        error:
          beforeCasStore.error ??
            "Unable to load the FINORA Control Store during PREPARED recovery.",
      };
    }

    const currentCredential =
      findCredential(
        beforeCasStore.data.branchCredentials,
        transaction,
      );

    if (
      !currentCredential ||
      !credentialsEqual(
        currentCredential,
        transaction.expectedCredential,
      )
    ) {
      return {
        success:
          false,

        errorCode:
          "CONTROL_STATE_MISMATCH",

        error:
          "PREPARED credential rotation recovery requires the exact predecessor Control Store credential.",
      };
    }

    try {
      await portableStore.replaceExact(
        transaction.storageMode,
        transaction.expectedPortableEnvelope,
        transaction.replacementPortableEnvelope,
      );
    }
    catch (
      error
    ) {
      return {
        success:
          false,

        errorCode:
          "PORTABLE_STORAGE_FAILED",

        error:
          getErrorMessage(
            error,
            "Unable to reconcile PREPARED Portable Branch Auth credential rotation state.",
          ),
      };
    }

    const markResult =
      await markFinoraPortableBranchAuthCredentialRotationPortableReplaced({
        transactionId:
          transaction.transactionId,

        transitionedAt:
          new Date().toISOString(),
      });

    if (
      !markResult.success
    ) {
      return {
        success:
          false,

        errorCode:
          "PORTABLE_REPLACED_STATE_FAILED",

        error:
          markResult.error ??
            "Unable to persist recovered PORTABLE_REPLACED credential rotation state.",
      };
    }
  }

  // ==========================================================
  // PORTABLE_REPLACED PROOF
  //
  // At this durable state the file MUST already be replacement.
  //
  // We intentionally do NOT call replaceExact() here.
  // Reappearance of predecessor is rollback/inconsistency.
  // ==========================================================

  const portableProof =
    await provePortableReplacement(
      transaction,
      portableStore,
    );

  if (
    !portableProof.success
  ) {
    return {
      success:
        false,

      errorCode:
        portableProof.errorCode,

      error:
        portableProof.error,
    };
  }

  // ==========================================================
  // CURRENT CONTROL STATE CORRELATION
  // ==========================================================

  const beforeControlTransition =
    await readFinoraControlStore();

  if (
    !beforeControlTransition.success ||
    !beforeControlTransition.data
  ) {
    return {
      success:
        false,

      errorCode:
        "CONTROL_STORE_FAILED",

      error:
        beforeControlTransition.error ??
          "Unable to load the FINORA Control Store during credential rotation recovery.",
    };
  }

  const currentCredential =
    findCredential(
      beforeControlTransition.data.branchCredentials,
      transaction,
    );

  if (!currentCredential) {
    return {
      success:
        false,

      errorCode:
        "CONTROL_STATE_MISMATCH",

      error:
        "Credential rotation recovery could not resolve the exact authoritative credential.",
    };
  }

  // ==========================================================
  // PREPARED / PORTABLE_REPLACED path:
  //
  // After Portable proof and before atomic Control apply,
  // authoritative credential must remain predecessor.
  // ==========================================================

  if (
    initialStatus ===
      "PREPARED" ||
    initialStatus ===
      "PORTABLE_REPLACED"
  ) {
    if (
      !credentialsEqual(
        currentCredential,
        transaction.expectedCredential,
      )
    ) {
      return {
        success:
          false,

        errorCode:
          "CONTROL_STATE_MISMATCH",

        error:
          "Credential rotation recovery expected the predecessor Control Store credential before Control apply.",
      };
    }

    const applyResult =
      await applyFinoraPortableBranchAuthCredentialRotationControlState({
        transactionId:
          transaction.transactionId,

        transitionedAt:
          new Date().toISOString(),
      });

    if (
      !applyResult.success
    ) {
      return {
        success:
          false,

        errorCode:
          "CONTROL_APPLY_FAILED",

        error:
          applyResult.error ??
            "Unable to recover atomic credential rotation Control Store apply.",
      };
    }
  }
  else {
    // ========================================================
    // CONTROL_APPLIED path:
    //
    // B4.4 persisted replacement credential + journal state
    // atomically. Any predecessor/third credential here fails closed.
    // ========================================================

    if (
      !credentialsEqual(
        currentCredential,
        transaction.replacementCredential,
      )
    ) {
      return {
        success:
          false,

        errorCode:
          "CONTROL_STATE_MISMATCH",

        error:
          "CONTROL_APPLIED credential rotation recovery requires the exact replacement Control Store credential.",
      };
    }
  }

  // ==========================================================
  // COMPLETE
  //
  // complete API is idempotent for already-later legitimate state,
  // but recovery only calls it for an originally unfinished record.
  // ==========================================================

  const completeResult =
    await completeFinoraPortableBranchAuthCredentialRotationTransaction({
      transactionId:
        transaction.transactionId,

      transitionedAt:
        new Date().toISOString(),
    });

  if (
    !completeResult.success
  ) {
    return {
      success:
        false,

      errorCode:
        "COMPLETE_FAILED",

      error:
        completeResult.error ??
          "Unable to complete recovered credential rotation transaction.",
    };
  }

  return {
    success:
      true,

    recovered: {
      transactionId:
        transaction.transactionId,

      initialStatus,

      completed:
        true,
    },
  };
}

// ============================================================
// INTERNAL RECOVERY
// ============================================================

async function recoverCredentialRotationsInternal(
  input:
    FinoraPortableBranchAuthCredentialRotationRecoveryInput,
): Promise<
  FinoraPortableBranchAuthCredentialRotationRecoveryResult
> {
  if (
    !input ||
    typeof input !==
      "object" ||
    !input.portableStore
  ) {
    return failure(
      "INVALID_REQUEST",
      "A valid FINORA credential rotation recovery request is required.",
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
        "Unable to load the FINORA Control Store for credential rotation recovery.",
    );
  }

  const unfinished =
    (
      storeResult.data.portableBranchAuthCredentialRotationTransactions ??
      []
    ).filter(
      (transaction) =>
        transaction.status !==
          "COMPLETE",
    );

  // ==========================================================
  // DEFENSIVE AMBIGUITY GUARD
  //
  // B4.4 preparation already prevents more than one unfinished
  // rotation per credential. Recovery independently re-proves it
  // before performing any Portable mutation.
  // ==========================================================

  const activeCredentialIds =
    new Set<string>();

  for (
    const transaction of unfinished
  ) {
    if (
      activeCredentialIds.has(
        transaction.credentialId,
      )
    ) {
      return failure(
        "DURABLE_TRANSACTION_AMBIGUOUS",
        "Multiple unfinished credential rotation transactions exist for one credential.",
        transaction.transactionId,
      );
    }

    activeCredentialIds.add(
      transaction.credentialId,
    );
  }

  const recoveredTransactions:
    FinoraPortableBranchAuthCredentialRotationRecoveredTransaction[] =
    [];

  for (
    const transaction of unfinished
  ) {
    const recovered =
      await recoverTransaction(
        transaction,
        input.portableStore,
      );

    if (
      !recovered.success
    ) {
      return failure(
        recovered.errorCode,
        recovered.error,
        transaction.transactionId,
      );
    }

    recoveredTransactions.push(
      recovered.recovered,
    );
  }

  return success(
    recoveredTransactions,
  );
}

// ============================================================
// PUBLIC SERIALIZED ENTRYPOINT
// ============================================================

export function recoverFinoraPortableBranchAuthCredentialRotations(
  input:
    FinoraPortableBranchAuthCredentialRotationRecoveryInput,
): Promise<
  FinoraPortableBranchAuthCredentialRotationRecoveryResult
> {
  const operation =
    credentialRotationRecoveryQueue.then(
      () =>
        recoverCredentialRotationsInternal(
          input,
        ),
      () =>
        recoverCredentialRotationsInternal(
          input,
        ),
    );

  credentialRotationRecoveryQueue =
    operation.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return operation;
}

// ============================================================
// END
// ============================================================