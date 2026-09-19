/* ===========================================================
   FINORA ENTERPRISE OS
   PORTABLE BRANCH AUTH COMPLETED ENROLLMENT RECOVERY
   MODULE  : Native Control
   LAYER   : Electron Main
   VERSION : 1.0
   STATUS  : Compatibility Foundation

   RESPONSIBILITY:

   - Resolve an exact Portable Auth envelope retained inside a
     completed durable enrollment transaction
   - Require exact current authenticated credential lineage
   - Never mutate Control Store or Portable Auth storage
   - Never synthesize new credential or envelope material
=========================================================== */

import {
  FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION,
} from "./finoraPortableBranchAuthContract.js";

import {
  canonicalizeFinoraCredentialUsername,
  readFinoraControlStore,
} from "./finoraControlStore.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthContract.js";

export interface FinoraPortableBranchAuthCompletedEnrollmentRecoveryPrincipal {
  credentialId?: string;
  authGeneration: number;
  userId: string;
  username: string;
  ownerId: string;
  businessId: string;
  branchId: string;
  storageMode: "LOCAL" | "USB";
  dataContext: "REAL" | "DEMO";
  demoId?: string;
}

export type FinoraPortableBranchAuthCompletedEnrollmentRecoveryResult =
  | {
      success: true;
      data: {
        transactionId: string;
        envelope: FinoraPortableBranchAuthEnvelopeV1;
      };
    }
  | {
      success: false;
      errorCode:
        | "CONTROL_STORE_FAILED"
        | "RECOVERY_NOT_FOUND"
        | "RECOVERY_AMBIGUOUS";
      error: string;
    };

function failure(
  errorCode:
    | "CONTROL_STORE_FAILED"
    | "RECOVERY_NOT_FOUND"
    | "RECOVERY_AMBIGUOUS",
  error: string,
 ): FinoraPortableBranchAuthCompletedEnrollmentRecoveryResult {
  return {
    success: false,
    errorCode,
    error,
  };
}

export async function resolveFinoraCompletedPortableBranchAuthEnrollmentRecovery(
  principal: FinoraPortableBranchAuthCompletedEnrollmentRecoveryPrincipal,
 ): Promise<FinoraPortableBranchAuthCompletedEnrollmentRecoveryResult> {
  const storeResult =
    await readFinoraControlStore();

  if (
    !storeResult.success ||
    !storeResult.data
  ) {
    return failure(
      "CONTROL_STORE_FAILED",
      storeResult.error ??
        "Unable to load FINORA Control Store for Portable Auth recovery.",
    );
  }

  const canonicalUsername =
    canonicalizeFinoraCredentialUsername(
      principal.username,
    );

  const matches =
    (
      storeResult.data.portableBranchAuthEnrollmentTransactions ??
      []
    ).filter(
      (transaction) => {
        if (transaction.status !== "COMPLETE") {
          return false;
        }

        const credential =
          transaction.credential;

        const credentialAuthGeneration =
          credential.authGeneration ??
          FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION;

        const demoMatches =
          principal.dataContext === "DEMO"
            ? (
                typeof principal.demoId === "string" &&
                principal.demoId.length > 0 &&
                credential.demoId === principal.demoId
              )
            : (
                principal.demoId === undefined &&
                credential.demoId === undefined
              );

        return (
          transaction.canonicalUsername === canonicalUsername &&
          transaction.ownerId === principal.ownerId &&
          transaction.businessId === principal.businessId &&
          transaction.branchId === principal.branchId &&
          transaction.storageMode === principal.storageMode &&
          credential.status === "ACTIVE" &&
          credentialAuthGeneration === principal.authGeneration &&
          credential.userId === principal.userId &&
          canonicalizeFinoraCredentialUsername(
            credential.username,
          ) === canonicalUsername &&
          credential.ownerId === principal.ownerId &&
          credential.businessId === principal.businessId &&
          credential.branchId === principal.branchId &&
          credential.storageMode === principal.storageMode &&
          credential.dataContext === principal.dataContext &&
          demoMatches &&
          (
            principal.credentialId === undefined ||
            credential.credentialId === principal.credentialId
          )
        );
      },
    );

  if (matches.length === 0) {
    return failure(
      "RECOVERY_NOT_FOUND",
      "No exact completed Portable Branch Auth enrollment recovery exists for the authenticated credential.",
    );
  }

  if (matches.length !== 1) {
    return failure(
      "RECOVERY_AMBIGUOUS",
      "Portable Branch Auth completed-enrollment recovery is ambiguous for the authenticated credential.",
    );
  }

  return {
    success: true,
    data: {
      transactionId:
        matches[0].transactionId,
      envelope:
        matches[0].portableEnvelope,
    },
  };
}

// ===========================================================
// END
// ===========================================================
