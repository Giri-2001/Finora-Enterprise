// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH V2 CREDENTIAL ROTATION RESUME ENGINE
//
// PURPOSE:
//
// Replay one already-durable V2 credential rotation transaction.
//
// SECURITY:
//
// - No Password or Security Code is accepted.
// - No fresh cryptographic material is derived.
// - No random transaction identity is generated.
// - Only frozen durable predecessor/successor artifacts are used.
// - Unexpected Portable or Control state fails closed.
// ============================================================

import {
  applyFinoraPortableBranchAuthV2CredentialRotationControlState,
  completeFinoraPortableBranchAuthV2CredentialRotationTransaction,
  markFinoraPortableBranchAuthV2CredentialRotationPortableReplaced,
} from "./finoraControlStore.js";

import type {
  FinoraControlBranchCredential,
} from "./finoraControlStore.js";

import type {
  FinoraPortableBranchAuthReplaceResult,
  FinoraPortableBranchAuthV2Store,
} from "./finoraPortableBranchAuthV2Store.js";

import {
  validateFinoraPortableBranchAuthCredentialRotationTransactionV2,
} from "./finoraPortableBranchAuthCredentialRotationTransactionV2.js";

import type {
  FinoraPortableBranchAuthCredentialRotationTransactionV2,
} from "./finoraPortableBranchAuthCredentialRotationTransactionV2.js";

// ============================================================
// CONTRACT
// ============================================================

export interface FinoraPortableBranchAuthCredentialRotationResumeV2Input {
  transaction:
    FinoraPortableBranchAuthCredentialRotationTransactionV2;

  portableStore:
    FinoraPortableBranchAuthV2Store;
}

export type FinoraPortableBranchAuthCredentialRotationResumeV2ErrorCode =
  | "INVALID_REQUEST"
  | "TRANSACTION_INVALID"
  | "PORTABLE_REPLACE_FAILED"
  | "PORTABLE_REPLACED_STATE_FAILED"
  | "CONTROL_APPLY_FAILED"
  | "COMPLETE_FAILED";

export interface FinoraPortableBranchAuthCredentialRotationResumeV2Success {
  transactionId:
    string;

  credential:
    FinoraControlBranchCredential;

  authGeneration:
    number;

  portableReplaceResult:
    FinoraPortableBranchAuthReplaceResult;
}

export type FinoraPortableBranchAuthCredentialRotationResumeV2Result =
  | {
      success:
        true;

      data:
        FinoraPortableBranchAuthCredentialRotationResumeV2Success;
    }
  | {
      success:
        false;

      errorCode:
        FinoraPortableBranchAuthCredentialRotationResumeV2ErrorCode;

      error:
        string;
    };

// ============================================================
// HELPERS
// ============================================================

function failure(
  errorCode:
    FinoraPortableBranchAuthCredentialRotationResumeV2ErrorCode,
  error:
    string,
): FinoraPortableBranchAuthCredentialRotationResumeV2Result {
  return {
    success:
      false,

    errorCode,

    error,
  };
}

function success(
  transactionId:
    string,
  credential:
    FinoraControlBranchCredential,
  authGeneration:
    number,
  portableReplaceResult:
    FinoraPortableBranchAuthReplaceResult,
): FinoraPortableBranchAuthCredentialRotationResumeV2Result {
  return {
    success:
      true,

    data: {
      transactionId,
      credential,
      authGeneration,
      portableReplaceResult,
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
// INTERNAL ENGINE
// ============================================================

async function resumeCredentialRotationV2Internal(
  input:
    FinoraPortableBranchAuthCredentialRotationResumeV2Input,
): Promise<
  FinoraPortableBranchAuthCredentialRotationResumeV2Result
> {
  if (
    !input ||
    typeof input !==
      "object" ||
    !input.transaction ||
    !input.portableStore
  ) {
    return failure(
      "INVALID_REQUEST",
      "A valid FINORA V2 credential rotation recovery request is required.",
    );
  }

  const transaction =
    structuredClone(
      input.transaction,
    );

  try {
    validateFinoraPortableBranchAuthCredentialRotationTransactionV2(
      transaction,
    );
  }
  catch (
    error
  ) {
    return failure(
      "TRANSACTION_INVALID",
      getErrorMessage(
        error,
        "Credential rotation recovery transaction is invalid.",
      ),
    );
  }

  let portableReplaceResult:
    FinoraPortableBranchAuthReplaceResult =
      "ALREADY_MATCHED";

  // ==========================================================
  // PREPARED
  //
  // The Portable CAS may not have happened, or it may have
  // completed immediately before process failure.
  //
  // replaceExact safely handles both:
  //
  // predecessor -> REPLACED
  // frozen successor -> ALREADY_MATCHED
  // ==========================================================

  if (
    transaction.status ===
      "PREPARED"
  ) {
    try {
      portableReplaceResult =
        await input.portableStore.replaceExact(
          transaction.storageMode,
          transaction.expectedPortableEnvelope,
          transaction.replacementPortableEnvelope,
        );
    }
    catch (
      error
    ) {
      return failure(
        "PORTABLE_REPLACE_FAILED",
        getErrorMessage(
          error,
          "Unable to recover Portable Branch Auth replacement state.",
        ),
      );
    }

    const portableReplacedResult =
      await markFinoraPortableBranchAuthV2CredentialRotationPortableReplaced({
        transactionId:
          transaction.transactionId,

        transitionedAt:
          new Date().toISOString(),
      });

    if (!portableReplacedResult.success) {
      return failure(
        "PORTABLE_REPLACED_STATE_FAILED",
        portableReplacedResult.error ??
          "Unable to persist recovered Portable Branch Auth replacement state.",
      );
    }

    transaction.status =
      "PORTABLE_REPLACED";
  }

  // ==========================================================
  // PORTABLE_REPLACED
  // ==========================================================

  if (
    transaction.status ===
      "PORTABLE_REPLACED"
  ) {
    const controlAppliedResult =
      await applyFinoraPortableBranchAuthV2CredentialRotationControlState({
        transactionId:
          transaction.transactionId,

        transitionedAt:
          new Date().toISOString(),
      });

    if (!controlAppliedResult.success) {
      return failure(
        "CONTROL_APPLY_FAILED",
        controlAppliedResult.error ??
          "Unable to recover replacement FINORA credential state.",
      );
    }

    transaction.status =
      "CONTROL_APPLIED";
  }

  // ==========================================================
  // CONTROL_APPLIED
  // ==========================================================

  if (
    transaction.status ===
      "CONTROL_APPLIED"
  ) {
    const completeResult =
      await completeFinoraPortableBranchAuthV2CredentialRotationTransaction({
        transactionId:
          transaction.transactionId,

        transitionedAt:
          new Date().toISOString(),
      });

    if (!completeResult.success) {
      return failure(
        "COMPLETE_FAILED",
        completeResult.error ??
          "Unable to complete recovered FINORA credential rotation.",
      );
    }

    transaction.status =
      "COMPLETE";
  }

  if (
    transaction.status !==
      "COMPLETE"
  ) {
    return failure(
      "TRANSACTION_INVALID",
      "FINORA V2 credential rotation recovery reached an unsupported state.",
    );
  }

  return success(
    transaction.transactionId,
    structuredClone(
      transaction.replacementCredential,
    ),
    transaction.targetGeneration,
    portableReplaceResult,
  );
}

// ============================================================
// SERIALIZED PUBLIC ENTRYPOINT
// ============================================================

let credentialRotationResumeV2Queue:
  Promise<void> =
    Promise.resolve();

export function resumeFinoraPortableBranchAuthCredentialRotationV2(
  input:
    FinoraPortableBranchAuthCredentialRotationResumeV2Input,
): Promise<
  FinoraPortableBranchAuthCredentialRotationResumeV2Result
> {
  const operation =
    credentialRotationResumeV2Queue.then(
      () =>
        resumeCredentialRotationV2Internal(
          input,
        ),
      () =>
        resumeCredentialRotationV2Internal(
          input,
        ),
    );

  credentialRotationResumeV2Queue =
    operation.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return operation;
}
