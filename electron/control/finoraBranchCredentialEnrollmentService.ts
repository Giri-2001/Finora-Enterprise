/* ============================================================
   FINORA ENTERPRISE OS™

   ELECTRON CONTROL
   BRANCH CREDENTIAL ENROLLMENT SERVICE

   RESPONSIBILITY:

   - Accept recipient username plus password
   - Resolve exactly one pending signed authorization by canonical username
   - Apply explicit recipient password policy
   - Derive a credential verifier with async Node scrypt
   - Generate cryptographic salt and credential ID
   - Forward only the derived credential record to the atomic
     one-time Control Store enrollment mutation

   SECURITY:

   - MAIN PROCESS ONLY.
   - Plaintext password is never persisted.
   - Plaintext password is never returned.
   - No renderer-provided user/scope/role/data-context authority.
   - No localStorage.
   - No legacy FINORA_HASH_.
   - No Business Date.
   - No private signing material.
   - Final authorization consumption remains atomic in the
     Control Store mutation boundary.

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */

import {
  randomBytes,
  randomUUID,
  scrypt as nodeScrypt,
} from "node:crypto";

import {
  applyFinoraBranchCredentialEnrollmentState,
  canonicalizeFinoraCredentialUsername,
  readFinoraControlStore,
} from "./finoraControlStore.js";

import type {
  FinoraControlBranchCredential,
} from "./finoraControlStore.js";

// ============================================================
// PASSWORD / KDF POLICY
// ============================================================

export const FINORA_BRANCH_CREDENTIAL_PASSWORD_POLICY = {
  minLength:
    8,

  maxLength:
    128,
} as const;

const FINORA_BRANCH_CREDENTIAL_SALT_BYTES =
  16;

const FINORA_BRANCH_CREDENTIAL_KEY_BYTES =
  32;

const FINORA_BRANCH_CREDENTIAL_SCRYPT_N =
  32768;

const FINORA_BRANCH_CREDENTIAL_SCRYPT_R =
  8;

const FINORA_BRANCH_CREDENTIAL_SCRYPT_P =
  1;

const FINORA_BRANCH_CREDENTIAL_SCRYPT_MAXMEM =
  64 *
  1024 *
  1024;

// ============================================================
// CONTRACT
// ============================================================

export interface FinoraBranchCredentialEnrollmentRequest {
  username:
    string;

  password:
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
      "string"
  ) {
    return undefined;
  }

  return {
    username:
      value.username,

    password:
      value.password,
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

function deriveScryptKey(
  password:
    string,

  salt:
    Buffer,
): Promise<Buffer> {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      nodeScrypt(
        password,
        salt,
        FINORA_BRANCH_CREDENTIAL_KEY_BYTES,
        {
          N:
            FINORA_BRANCH_CREDENTIAL_SCRYPT_N,

          r:
            FINORA_BRANCH_CREDENTIAL_SCRYPT_R,

          p:
            FINORA_BRANCH_CREDENTIAL_SCRYPT_P,

          maxmem:
            FINORA_BRANCH_CREDENTIAL_SCRYPT_MAXMEM,
        },
        (
          error,
          derivedKey,
        ) => {
          if (error) {
            reject(
              error,
            );

            return;
          }

          resolve(
            derivedKey,
          );
        },
      );
    },
  );
}

// ============================================================
// ENROLL
// ============================================================

export async function enrollFinoraBranchCredential(
  input:
    unknown,
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

  // ----------------------------------------------------------
  // AUTHORITATIVE SIGNED ENROLLMENT AUTHORIZATION
  //
  // User identity/scope/role/storage/data-context are derived
  // exclusively from the persisted signed authorization.
  // ----------------------------------------------------------

  const storeResult =
    await readFinoraControlStore();

  if (
    !storeResult.success ||
    !storeResult.data
  ) {
    return failure(
      "CONTROL_STORE_FAILED",
      storeResult.error ??
        "Unable to load the FINORA Control Store.",
    );
  }

  const canonicalUsername =
    canonicalizeFinoraCredentialUsername(
      request.username,
    );

  const matchingAuthorizations =
    (
      storeResult.data
        .branchCredentialEnrollmentAuthorizations ??
      []
    ).filter(
      (item) =>
        canonicalizeFinoraCredentialUsername(
          item.username,
        ) ===
          canonicalUsername,
    );

  if (
    matchingAuthorizations.length ===
      0
  ) {
    return failure(
      "AUTHORIZATION_NOT_FOUND",
      "FINORA credential enrollment authorization is missing or already consumed.",
    );
  }

  if (
    matchingAuthorizations.length !==
      1
  ) {
    return failure(
      "AUTHORIZATION_AMBIGUOUS",
      "FINORA credential enrollment authority is ambiguous for this username.",
    );
  }

  const authorization =
    matchingAuthorizations[0];

  // ----------------------------------------------------------
  // KDF
  //
  // Password remains an ephemeral in-memory input only.
  // ----------------------------------------------------------

  const salt =
    randomBytes(
      FINORA_BRANCH_CREDENTIAL_SALT_BYTES,
    );

  let derivedKey:
    Buffer |
    undefined;

  try {
    derivedKey =
      await deriveScryptKey(
        request.password,
        salt,
      );

    const appliedAt =
      new Date().toISOString();

    const credentialId =
      `FINORA-CREDENTIAL-${randomUUID()}`;

    const credential:
      FinoraControlBranchCredential = {
        credentialId,

        sourceAuthorizationId:
          authorization.authorizationId,

        userId:
          authorization.userId,

        username:
          authorization.username,

        canonicalUsername:
          canonicalizeFinoraCredentialUsername(
            authorization.username,
          ),

        fullName:
          authorization.fullName,

        role:
          authorization.role,

        ownerId:
          authorization.ownerId,

        businessId:
          authorization.businessId,

        branchId:
          authorization.branchId,

        storageMode:
          authorization.storageMode,

        dataContext:
          authorization.dataContext,

        ...(
          authorization.demoId ===
            undefined
            ? {}
            : {
                demoId:
                  authorization.demoId,
              }
        ),

        status:
          "ACTIVE",

        verifier: {
          algorithm:
            "SCRYPT",

          saltEncoding:
            "BASE64",

          salt:
            salt.toString(
              "base64",
            ),

          derivedKeyEncoding:
            "BASE64",

          derivedKey:
            derivedKey.toString(
              "base64",
            ),

          keyLength:
            32,

          N:
            32768,

          r:
            8,

          p:
            1,
        },

        createdAt:
          appliedAt,

        updatedAt:
          appliedAt,

        schemaVersion:
          1,
      };

    const applyResult =
      await applyFinoraBranchCredentialEnrollmentState({
        authorizationId:
          authorization.authorizationId,

        credential,

        appliedAt,
      });

    if (
      !applyResult.success ||
      !applyResult.data
    ) {
      return failure(
        "ENROLLMENT_APPLY_FAILED",
        applyResult.error ??
          "Unable to apply FINORA Branch Credential enrollment.",
      );
    }

    return {
      success:
        true,

      data: {
        credentialId:
          applyResult.data.credential.credentialId,

        userId:
          authorization.userId,

        username:
          authorization.username,

        fullName:
          authorization.fullName,

        role:
          authorization.role,

        ownerId:
          authorization.ownerId,

        businessId:
          authorization.businessId,

        branchId:
          authorization.branchId,

        storageMode:
          authorization.storageMode,

        dataContext:
          authorization.dataContext,

        ...(
          authorization.demoId ===
            undefined
            ? {}
            : {
                demoId:
                  authorization.demoId,
              }
        ),

        enrolledAt:
          appliedAt,
      },
    };
  }
  catch {
    return failure(
      "KDF_FAILED",
      "FINORA could not securely derive the local credential verifier.",
    );
  }
  finally {
    salt.fill(
      0,
    );

    if (derivedKey) {
      derivedKey.fill(
        0,
      );
    }
  }
}

// ============================================================
// END
// ============================================================