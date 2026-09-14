/* ============================================================
   FINORA ENTERPRISE OS™

   ELECTRON CONTROL
   BRANCH CREDENTIAL ENROLLMENT SERVICE

   RESPONSIBILITY:

   - Validate recipient username, Password and Security Code request shape
   - Preserve the existing renderer-facing enrollment result contract
   - Delegate enrollment authority to Portable Branch Auth coordinator
   - Return only non-secret enrolled principal metadata

   SECURITY:

   - MAIN PROCESS ONLY.
   - Plaintext Password and Security Code are ephemeral inputs only.
   - No direct credential KDF is performed in this service.
   - No direct credential enrollment Control Store mutation is performed here.
   - No renderer-provided user/scope/role/storage authority.
   - No localStorage.
   - No legacy FINORA_HASH_.
   - No Business Date.
   - No private signing material.
   - Durable PREPARED / PORTABLE_WRITTEN / CONTROL_APPLIED / COMPLETE
     authority is owned by the Portable Branch Auth coordinator.

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */




import {
  enrollFinoraPortableBranchAuth,
} from "./finoraPortableBranchAuthEnrollmentCoordinator.js";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

// ============================================================
// PASSWORD / KDF POLICY
// ============================================================

export const FINORA_BRANCH_CREDENTIAL_PASSWORD_POLICY = {
  minLength:
    8,

  maxLength:
    128,
} as const;

export const FINORA_BRANCH_SECURITY_CODE_POLICY = {
  minLength:
    8,

  maxLength:
    128,
} as const;

// ============================================================
// CONTRACT
// ============================================================

export interface FinoraBranchCredentialEnrollmentRequest {
  username:
    string;

  password:
    string;

  securityCode:
    string;
}

export interface FinoraBranchCredentialEnrollmentSuccess {
  credentialId:
    string;

  userId:
    string;

  username:
    string;

  fullName:
    string;

  role:
    | "ADMIN"
    | "MANAGER"
    | "COLLECTOR"
    | "VIEWER";

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  storageMode:
    | "LOCAL"
    | "USB";

  dataContext:
    | "REAL"
    | "DEMO";

  demoId?:
    string;

  enrolledAt:
    string;
}

export type FinoraBranchCredentialEnrollmentErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_PASSWORD"
  | "INVALID_SECURITY_CODE"
  | "CONTROL_STORE_FAILED"
  | "AUTHORIZATION_NOT_FOUND"
  | "AUTHORIZATION_AMBIGUOUS"
  | "KDF_FAILED"
  | "ENROLLMENT_APPLY_FAILED";

export type FinoraBranchCredentialEnrollmentResult =
  | {
      success:
        true;

      data:
        FinoraBranchCredentialEnrollmentSuccess;
    }
  | {
      success:
        false;

      errorCode:
        FinoraBranchCredentialEnrollmentErrorCode;

      error:
        string;
    };

// ============================================================
// INTERNAL HELPERS
// ============================================================

function failure(
  errorCode:
    FinoraBranchCredentialEnrollmentErrorCode,

  error:
    string,
): FinoraBranchCredentialEnrollmentResult {
  return {
    success:
      false,

    errorCode,

    error,
  };
}

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function isNonEmptyString(
  value:
    unknown,
): value is string {
  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function sanitizeRequest(
  value:
    unknown,
):
  | FinoraBranchCredentialEnrollmentRequest
  | undefined {
  if (
    !isRecord(
      value,
    )
  ) {
    return undefined;
  }

  const actualKeys =
    Object.keys(
      value,
    ).sort();

  const expectedKeys = [
    "username",
    "password",
    "securityCode",
  ].sort();

  if (
    actualKeys.length !==
      expectedKeys.length ||
    !actualKeys.every(
      (key, index) =>
        key ===
          expectedKeys[index],
    ) ||
    !isNonEmptyString(
      value.username,
    ) ||
    typeof value.password !==
      "string" ||
    typeof value.securityCode !==
      "string"
  ) {
    return undefined;
  }

  return {
    username:
      value.username,

    password:
      value.password,

    securityCode:
      value.securityCode,
  };
}

function isPasswordAllowed(
  password:
    string,
): boolean {
  const characterLength =
    Array.from(
      password,
    ).length;

  return (
    characterLength >=
      FINORA_BRANCH_CREDENTIAL_PASSWORD_POLICY.minLength &&
    characterLength <=
      FINORA_BRANCH_CREDENTIAL_PASSWORD_POLICY.maxLength &&
    password.trim().length >
      0
  );
}

function isSecurityCodeAllowed(
  securityCode:
    string,
): boolean {
  const securityCodeLength =
    Array.from(
      securityCode,
    ).length;

  return (
    securityCodeLength >=
      FINORA_BRANCH_SECURITY_CODE_POLICY.minLength &&
    securityCodeLength <=
      FINORA_BRANCH_SECURITY_CODE_POLICY.maxLength &&
    securityCode.trim().length >
      0
  );
}

// ============================================================
// PORTABLE AUTH PRODUCTION ENROLLMENT ADAPTER
//
// Renderer-facing request/result contracts remain unchanged.
//
// Portable Branch Auth coordinator is the sole production
// enrollment mutation authority. This service performs request
// policy validation and result-shape adaptation only.
// ============================================================

export async function enrollFinoraBranchCredentialWithPortableStore(
  input:
    unknown,

  portableStore:
    FinoraPortableBranchAuthStore,
): Promise<
  FinoraBranchCredentialEnrollmentResult
> {
  const request =
    sanitizeRequest(
      input,
    );

  if (!request) {
    return failure(
      "INVALID_REQUEST",
      "A valid FINORA credential enrollment request is required.",
    );
  }

  if (
    !isPasswordAllowed(
      request.password,
    )
  ) {
    return failure(
      "INVALID_PASSWORD",
      `FINORA password must contain between ${FINORA_BRANCH_CREDENTIAL_PASSWORD_POLICY.minLength} and ${FINORA_BRANCH_CREDENTIAL_PASSWORD_POLICY.maxLength} characters and cannot be whitespace-only.`,
    );
  }

  if (
    !isSecurityCodeAllowed(
      request.securityCode,
    )
  ) {
    return failure(
      "INVALID_SECURITY_CODE",
      `FINORA Security Code must contain between ${FINORA_BRANCH_SECURITY_CODE_POLICY.minLength} and ${FINORA_BRANCH_SECURITY_CODE_POLICY.maxLength} characters and cannot be whitespace-only.`,
    );
  }

  const coordinatorResult =
    await enrollFinoraPortableBranchAuth({
      request,

      portableStore,
    });

  if (
    !coordinatorResult.success
  ) {
    switch (
      coordinatorResult.errorCode
    ) {
      case "CONTROL_STORE_FAILED":
        return failure(
          "CONTROL_STORE_FAILED",
          coordinatorResult.error,
        );

      case "AUTHORIZATION_NOT_FOUND":
        return failure(
          "AUTHORIZATION_NOT_FOUND",
          coordinatorResult.error,
        );

      case "AUTHORIZATION_AMBIGUOUS":
      case "DURABLE_TRANSACTION_AMBIGUOUS":
        return failure(
          "AUTHORIZATION_AMBIGUOUS",
          coordinatorResult.error,
        );

      case "MATERIAL_DERIVATION_FAILED":
        return failure(
          "KDF_FAILED",
          "FINORA could not securely derive the local credential verifier.",
        );

      default:
        return failure(
          "ENROLLMENT_APPLY_FAILED",
          coordinatorResult.error,
        );
    }
  }

  const credential =
    coordinatorResult.data.credential;

  const transaction =
    coordinatorResult.data.transaction;

  const enrolledAt =
    transaction.controlAppliedAt;

  if (
    typeof enrolledAt !==
      "string" ||
    enrolledAt.length ===
      0
  ) {
    return failure(
      "ENROLLMENT_APPLY_FAILED",
      "Portable Branch Auth enrollment completed without Control apply evidence.",
    );
  }

  return {
    success:
      true,

    data: {
      credentialId:
        credential.credentialId,

      userId:
        credential.userId,

      username:
        credential.username,

      fullName:
        credential.fullName,

      role:
        credential.role,

      ownerId:
        credential.ownerId,

      businessId:
        credential.businessId,

      branchId:
        credential.branchId,

      storageMode:
        credential.storageMode,

      dataContext:
        credential.dataContext,

      ...(
        credential.demoId ===
          undefined
          ? {}
          : {
              demoId:
                credential.demoId,
            }
      ),

      enrolledAt,
    },
  };
}
// ============================================================
// END
// ============================================================