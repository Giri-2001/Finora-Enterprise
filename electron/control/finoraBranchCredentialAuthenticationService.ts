/* ============================================================
   FINORA ENTERPRISE OS™

   ELECTRON CONTROL
   BRANCH CREDENTIAL AUTHENTICATION SERVICE

   RESPONSIBILITY:

   - Accept username + password for local credential verification
   - Resolve credential from encrypted authoritative Control Store
   - Canonicalize username using the shared credential authority
   - Re-derive the stored SCRYPT verifier
   - Compare derived verifier with timingSafeEqual
   - Return authenticated identity/scope only

   SECURITY:

   - MAIN PROCESS ONLY.
   - Plaintext password is never persisted or returned.
   - Credential verifier / salt / derived key are never returned.
   - Missing usernames execute a dummy SCRYPT path.
   - Wrong username and wrong password return the same result.
   - Derived cryptographic buffers are zeroized after use.
   - No localStorage.
   - No legacy FINORA_HASH_.
   - No renderer authority.
   - No IPC authority.
   - No Business Date.
   - This service does NOT authorize Branch Access.
   - This service does NOT create or commit a login session.

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */

import {
  scrypt as nodeScrypt,
  timingSafeEqual,
} from "node:crypto";

import {
  canonicalizeFinoraCredentialUsername,
  readFinoraControlStore,
} from "./finoraControlStore.js";

import {
  FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraControlBranchCredential,
} from "./finoraControlStore.js";

// ============================================================
// KDF POLICY
// ============================================================

const FINORA_BRANCH_CREDENTIAL_SCRYPT_MAXMEM =
  64 *
  1024 *
  1024;

const FINORA_BRANCH_CREDENTIAL_PASSWORD_MAX_LENGTH =
  128;

const FINORA_DUMMY_CREDENTIAL_SALT =
  Buffer.alloc(
    16,
    0xa5,
  );

const FINORA_DUMMY_CREDENTIAL_DERIVED_KEY =
  Buffer.alloc(
    32,
    0x5a,
  );

// ============================================================
// CONTRACT
// ============================================================

export interface FinoraBranchCredentialAuthenticationRequest {
  username:
    string;

  password:
    string;
}

export interface FinoraBranchCredentialAuthenticationSuccess {
  credentialId:
    string;

  /**
   * Current authoritative credential lineage generation.
   */
  authGeneration:
    number;

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

  authenticatedAt:
    string;
}

export type FinoraBranchCredentialAuthenticationErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_CREDENTIALS"
  | "CONTROL_STORE_FAILED"
  | "KDF_FAILED";

export type FinoraBranchCredentialAuthenticationResult =
  | {
      success:
        true;

      data:
        FinoraBranchCredentialAuthenticationSuccess;
    }
  | {
      success:
        false;

      errorCode:
        FinoraBranchCredentialAuthenticationErrorCode;

      error:
        string;
    };

// ============================================================
// HELPERS
// ============================================================

function failure(
  errorCode:
    FinoraBranchCredentialAuthenticationErrorCode,

  error:
    string,
): FinoraBranchCredentialAuthenticationResult {
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
  | FinoraBranchCredentialAuthenticationRequest
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

function deriveScryptKey(
  password:
    string,

  salt:
    Buffer,

  keyLength:
    number,

  N:
    number,

  r:
    number,

  p:
    number,
): Promise<Buffer> {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      nodeScrypt(
        password,
        salt,
        keyLength,
        {
          N,
          r,
          p,

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
// AUTHENTICATE
// ============================================================

// ============================================================
// CREDENTIAL AUTH GENERATION
// ============================================================

export function resolveFinoraBranchCredentialAuthGeneration(
  authGeneration:
    number | undefined,
): number {
  return (
    authGeneration ??
    FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION
  );
}

export async function authenticateFinoraBranchCredential(
  input:
    unknown,
): Promise<
  FinoraBranchCredentialAuthenticationResult
> {
  const request =
    sanitizeRequest(
      input,
    );

  if (!request) {
    return failure(
      "INVALID_REQUEST",
      "A valid FINORA credential authentication request is required.",
    );
  }

  const passwordLength =
    Array.from(
      request.password,
    ).length;

  if (
    passwordLength >
      FINORA_BRANCH_CREDENTIAL_PASSWORD_MAX_LENGTH
  ) {
    return failure(
      "INVALID_CREDENTIALS",
      "Invalid username or password.",
    );
  }

  const canonicalUsername =
    canonicalizeFinoraCredentialUsername(
      request.username,
    );

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

  const credential:
    FinoraControlBranchCredential |
    undefined =
    storeResult.data.branchCredentials?.find(
      (item) =>
        item.status ===
          "ACTIVE" &&
        item.canonicalUsername ===
          canonicalUsername,
    );

  // ----------------------------------------------------------
  // CONSTANT-WORK LOOKUP FAILURE PATH
  //
  // Missing username still performs one SCRYPT derivation and
  // one timingSafeEqual comparison using fixed non-secret dummy
  // material. This reduces username-enumeration timing leakage.
  // ----------------------------------------------------------

  let salt:
    Buffer |
    undefined;

  let expectedDerivedKey:
    Buffer |
    undefined;

  let actualDerivedKey:
    Buffer |
    undefined;

  try {
    if (credential) {
      salt =
        Buffer.from(
          credential.verifier.salt,
          "base64",
        );

      expectedDerivedKey =
        Buffer.from(
          credential.verifier.derivedKey,
          "base64",
        );
    }
    else {
      salt =
        Buffer.from(
          FINORA_DUMMY_CREDENTIAL_SALT,
        );

      expectedDerivedKey =
        Buffer.from(
          FINORA_DUMMY_CREDENTIAL_DERIVED_KEY,
        );
    }

    actualDerivedKey =
      await deriveScryptKey(
        request.password,
        salt,
        credential?.verifier.keyLength ??
          32,
        credential?.verifier.N ??
          32768,
        credential?.verifier.r ??
          8,
        credential?.verifier.p ??
          1,
      );

    const passwordMatches =
      timingSafeEqual(
        actualDerivedKey,
        expectedDerivedKey,
      );

    if (
      !credential ||
      !passwordMatches
    ) {
      return failure(
        "INVALID_CREDENTIALS",
        "Invalid username or password.",
      );
    }

    return {
      success:
        true,

      data: {
        credentialId:
          credential.credentialId,

        authGeneration:
          resolveFinoraBranchCredentialAuthGeneration(
            credential.authGeneration,
          ),

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

        authenticatedAt:
          new Date().toISOString(),
      },
    };
  }
  catch {
    return failure(
      "KDF_FAILED",
      "FINORA could not securely verify the local credential.",
    );
  }
  finally {
    if (salt) {
      salt.fill(
        0,
      );
    }

    if (expectedDerivedKey) {
      expectedDerivedKey.fill(
        0,
      );
    }

    if (actualDerivedKey) {
      actualDerivedKey.fill(
        0,
      );
    }
  }
}

// ============================================================
// END
// ============================================================