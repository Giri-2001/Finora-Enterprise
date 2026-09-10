/* ============================================================
   FINORA ENTERPRISE OS™

   ELECTRON CONTROL
   BRANCH LOGIN SESSION AUTHORITY

   RESPONSIBILITY:

   - Authenticate a recipient-local FINORA Branch Credential
   - Bind credential proof to authoritative signed Branch Access
   - Require ACTIVE Branch Activation
   - Require exact selected storage mode
   - Require exact native-bound ACTIVE storage entitlement
   - Issue a cryptographically random opaque login session ID
   - Keep authenticated session authority only in Electron main
   - Revalidate authoritative credential/access state without
     re-submitting the password
   - Own the authoritative in-process idle-session lifetime

   SECURITY:

   - Renderer never supplies identity/scope/role authority.
   - Renderer supplies only username/password/storage selection
     for initial login.
   - Password is never stored in a session record.
   - credentialId is an internal authority handle, not a bearer
     token exposed as session authority.
   - sessionId is a 256-bit random bearer token.
   - Session records are never persisted to disk.
   - Electron process restart invalidates every login session.
   - Main-process monotonic time owns idle expiration.
   - Branch Access uses its authoritative wall-clock service.
   - FINORA Business Date is deliberately absent.

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */

import {
  randomBytes,
} from "node:crypto";

import {
  authenticateFinoraBranchCredential,
} from "./finoraBranchCredentialAuthenticationService.js";

import type {
  FinoraBranchCredentialAuthenticationSuccess,
} from "./finoraBranchCredentialAuthenticationService.js";

import {
  evaluateFinoraAuthoritativeBranchAccess,
} from "./finoraBranchAccessAuthorityService.js";

import {
  findFinoraBranchActivation,
  hasActiveFinoraStorageEntitlement,
  readFinoraControlStore,
} from "./finoraControlStore.js";

import type {
  FinoraControlBranchCredential,
  FinoraControlStorageMode,
} from "./finoraControlStore.js";

import {
  getFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

// ============================================================
// CONSTANTS
// ============================================================

const FINORA_BRANCH_LOGIN_SESSION_PREFIX =
  "FINORA-SESSION-";

const FINORA_BRANCH_LOGIN_SESSION_RANDOM_BYTES =
  32;

const FINORA_BRANCH_LOGIN_IDLE_TIMEOUT_MS =
  30 *
  60 *
  1000;

// ============================================================
// PUBLIC CONTRACTS
// ============================================================

export interface FinoraBranchLoginRequest {
  username:
    string;

  password:
    string;

  storageMode:
    FinoraControlStorageMode;
}

export type FinoraBranchLoginAccessMode =
  | "ACTIVE"
  | "REGISTERED_EXPIRED_READ_ONLY";

export interface FinoraBranchLoginSessionView {
  sessionId:
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
    FinoraControlStorageMode;

  dataContext:
    | "REAL"
    | "DEMO";

  demoId?:
    string;

  accessMode:
    FinoraBranchLoginAccessMode;

  loginTime:
    string;

  lastActivity:
    string;

  validatedAt:
    string;
}

export type FinoraBranchLoginErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_CREDENTIALS"
  | "AUTHENTICATION_FAILED"
  | "NATIVE_BINDING_UNAVAILABLE"
  | "ACTIVATION_REQUIRED"
  | "BRANCH_ACCESS_DENIED"
  | "STORAGE_MODE_MISMATCH"
  | "STORAGE_ENTITLEMENT_DENIED"
  | "CONTROL_STATE_FAILED";

export type FinoraBranchLoginResult =
  | {
      success:
        true;

      data:
        FinoraBranchLoginSessionView;
    }
  | {
      success:
        false;

      errorCode:
        FinoraBranchLoginErrorCode;

      error:
        string;
    };

export interface FinoraBranchSessionRequest {
  sessionId:
    string;
}

export type FinoraBranchSessionValidationErrorCode =
  | "INVALID_REQUEST"
  | "SESSION_NOT_FOUND"
  | "SESSION_EXPIRED"
  | "SESSION_INVALID"
  | "NATIVE_BINDING_UNAVAILABLE"
  | "ACTIVATION_REQUIRED"
  | "BRANCH_ACCESS_DENIED"
  | "STORAGE_MODE_MISMATCH"
  | "STORAGE_ENTITLEMENT_DENIED"
  | "CONTROL_STATE_FAILED";

export type FinoraBranchSessionValidationResult =
  | {
      success:
        true;

      data:
        FinoraBranchLoginSessionView;
    }
  | {
      success:
        false;

      errorCode:
        FinoraBranchSessionValidationErrorCode;

      error:
        string;
    };

export type FinoraBranchSessionTouchResult =
  | {
      success:
        true;

      data: {
        sessionId:
          string;

        lastActivity:
          string;
      };
    }
  | {
      success:
        false;

      errorCode:
        | "INVALID_REQUEST"
        | "SESSION_NOT_FOUND"
        | "SESSION_EXPIRED";

      error:
        string;
    };

// ============================================================
// INTERNAL SESSION RECORD
//
// SECURITY:
//
// credentialId identifies the authoritative encrypted credential
// record.
//
// selectedStorageMode binds the login to the exact storage mode
// selected when the password was successfully authenticated.
//
// No username/password/verifier/salt/derived key is stored here.
// ============================================================

interface FinoraBranchLoginSessionRecord {
  sessionId:
    string;

  credentialId:
    string;

  selectedStorageMode:
    FinoraControlStorageMode;

  loginTime:
    string;

  lastActivity:
    string;

  lastActivityMonotonicMs:
    bigint;
}

const activeSessions =
  new Map<
    string,
    FinoraBranchLoginSessionRecord
  >();

// ============================================================
// INTERNAL AUTHORIZATION CONTRACT
// ============================================================

type FinoraBranchLoginPrincipal = {
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
    FinoraControlStorageMode;

  dataContext:
    | "REAL"
    | "DEMO";

  demoId?:
    string;
};

type FinoraBranchAuthorizationFailureCode =
  | "NATIVE_BINDING_UNAVAILABLE"
  | "ACTIVATION_REQUIRED"
  | "BRANCH_ACCESS_DENIED"
  | "STORAGE_MODE_MISMATCH"
  | "STORAGE_ENTITLEMENT_DENIED"
  | "CONTROL_STATE_FAILED";

type FinoraBranchAuthorizationResult =
  | {
      success:
        true;

      accessMode:
        FinoraBranchLoginAccessMode;
    }
  | {
      success:
        false;

      errorCode:
        FinoraBranchAuthorizationFailureCode;

      error:
        string;
    };

// ============================================================
// GENERIC HELPERS
// ============================================================

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

function isStorageMode(
  value:
    unknown,
): value is FinoraControlStorageMode {
  return (
    value ===
      "LOCAL" ||
    value ===
      "USB"
  );
}

function hasExactKeys(
  value:
    Record<string, unknown>,

  expected:
    readonly string[],
): boolean {
  const keys =
    Object.keys(
      value,
    );

  return (
    keys.length ===
      expected.length &&
    expected.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(
          value,
          key,
        ),
    )
  );
}

function sanitizeLoginRequest(
  input:
    unknown,
): FinoraBranchLoginRequest | undefined {
  if (
    !isRecord(
      input,
    ) ||
    !hasExactKeys(
      input,
      [
        "username",
        "password",
        "storageMode",
      ],
    ) ||
    !isNonEmptyString(
      input.username,
    ) ||
    typeof input.password !==
      "string" ||
    !isStorageMode(
      input.storageMode,
    )
  ) {
    return undefined;
  }

  return {
    username:
      input.username.trim(),

    password:
      input.password,

    storageMode:
      input.storageMode,
  };
}

function sanitizeSessionRequest(
  input:
    unknown,
): FinoraBranchSessionRequest | undefined {
  if (
    !isRecord(
      input,
    ) ||
    !hasExactKeys(
      input,
      [
        "sessionId",
      ],
    ) ||
    !isNonEmptyString(
      input.sessionId,
    )
  ) {
    return undefined;
  }

  return {
    sessionId:
      input.sessionId,
  };
}

function monotonicNowMs():
  bigint {
  return (
    process.hrtime.bigint() /
    1_000_000n
  );
}

function isSessionExpired(
  record:
    FinoraBranchLoginSessionRecord,

  currentMonotonicMs:
    bigint,
): boolean {
  const idleMilliseconds =
    currentMonotonicMs -
    record.lastActivityMonotonicMs;

  return (
    idleMilliseconds >
    BigInt(
      FINORA_BRANCH_LOGIN_IDLE_TIMEOUT_MS,
    )
  );
}

function pruneExpiredSessions():
  void {
  const currentMonotonicMs =
    monotonicNowMs();

  for (
    const [
      sessionId,
      record,
    ] of activeSessions
  ) {
    if (
      isSessionExpired(
        record,
        currentMonotonicMs,
      )
    ) {
      activeSessions.delete(
        sessionId,
      );
    }
  }
}

function createOpaqueSessionId():
  string {
  let sessionId:
    string;

  do {
    sessionId =
      FINORA_BRANCH_LOGIN_SESSION_PREFIX +
      randomBytes(
        FINORA_BRANCH_LOGIN_SESSION_RANDOM_BYTES,
      ).toString(
        "base64url",
      );
  } while (
    activeSessions.has(
      sessionId,
    )
  );

  return sessionId;
}

function toPrincipalFromAuthentication(
  value:
    FinoraBranchCredentialAuthenticationSuccess,
): FinoraBranchLoginPrincipal {
  return {
    credentialId:
      value.credentialId,

    userId:
      value.userId,

    username:
      value.username,

    fullName:
      value.fullName,

    role:
      value.role,

    ownerId:
      value.ownerId,

    businessId:
      value.businessId,

    branchId:
      value.branchId,

    storageMode:
      value.storageMode,

    dataContext:
      value.dataContext,

    ...(
      value.demoId ===
        undefined
        ? {}
        : {
            demoId:
              value.demoId,
          }
    ),
  };
}

function toPrincipalFromCredential(
  credential:
    FinoraControlBranchCredential,
): FinoraBranchLoginPrincipal {
  return {
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
  };
}

function toSessionView(
  record:
    FinoraBranchLoginSessionRecord,

  principal:
    FinoraBranchLoginPrincipal,

  accessMode:
    FinoraBranchLoginAccessMode,
): FinoraBranchLoginSessionView {
  return {
    sessionId:
      record.sessionId,

    userId:
      principal.userId,

    username:
      principal.username,

    fullName:
      principal.fullName,

    role:
      principal.role,

    ownerId:
      principal.ownerId,

    businessId:
      principal.businessId,

    branchId:
      principal.branchId,

    storageMode:
      principal.storageMode,

    dataContext:
      principal.dataContext,

    ...(
      principal.demoId ===
        undefined
        ? {}
        : {
            demoId:
              principal.demoId,
          }
    ),

    accessMode,

    loginTime:
      record.loginTime,

    lastActivity:
      record.lastActivity,

    validatedAt:
      new Date().toISOString(),
  };
}

// ============================================================
// AUTHORITATIVE LOGIN ACCESS
//
// This is deliberately duplicated at login/session authority
// rather than trusting renderer-side checks.
//
// AuthenticatedApplication may re-check the same authorities as
// defense in depth before exposing business data.
// ============================================================

async function authorizePrincipal(
  principal:
    FinoraBranchLoginPrincipal,

  requestedStorageMode:
    FinoraControlStorageMode,
): Promise<
  FinoraBranchAuthorizationResult
> {
  if (
    principal.storageMode !==
      requestedStorageMode
  ) {
    return {
      success:
        false,

      errorCode:
        "STORAGE_MODE_MISMATCH",

      error:
        "This FINORA credential is not authorized for the selected storage mode.",
    };
  }

  const nativeBinding =
    await getFinoraWindowsInstallationBinding();

  if (!nativeBinding) {
    return {
      success:
        false,

      errorCode:
        "NATIVE_BINDING_UNAVAILABLE",

      error:
        "FINORA native installation binding is unavailable.",
    };
  }

  const activationResult =
    await findFinoraBranchActivation(
      principal.ownerId,
      principal.businessId,
      principal.branchId,
    );

  if (
    !activationResult.success
  ) {
    return {
      success:
        false,

      errorCode:
        "CONTROL_STATE_FAILED",

      error:
        activationResult.error ??
        "Unable to verify FINORA Branch Activation.",
    };
  }

  if (
    !activationResult.data ||
    activationResult.data.status !==
      "ACTIVE"
  ) {
    return {
      success:
        false,

      errorCode:
        "ACTIVATION_REQUIRED",

      error:
        "An ACTIVE FINORA Branch Activation is required.",
    };
  }

  const accessResult =
    await evaluateFinoraAuthoritativeBranchAccess({
      userId:
        principal.userId,

      ownerId:
        principal.ownerId,

      businessId:
        principal.businessId,

      branchId:
        principal.branchId,
    });

  if (
    !accessResult.success
  ) {
    return {
      success:
        false,

      errorCode:
        "CONTROL_STATE_FAILED",

      error:
        accessResult.error,
    };
  }

  const accessDecision =
    accessResult.data;

  const accessGrant =
    accessDecision.grant;

  if (!accessGrant) {
    return {
      success:
        false,

      errorCode:
        "BRANCH_ACCESS_DENIED",

      error:
        accessDecision.reason,
    };
  }

  const identityMatches =
    accessGrant.userId ===
      principal.userId &&
    accessGrant.ownerId ===
      principal.ownerId &&
    accessGrant.businessId ===
      principal.businessId &&
    accessGrant.branchId ===
      principal.branchId;

  const storageMatches =
    accessGrant.storageMode ===
      principal.storageMode &&
    accessGrant.storageMode ===
      requestedStorageMode;

  const contextMatches =
    principal.dataContext ===
      "DEMO"
      ? (
          accessGrant.accessType ===
            "DEMO" &&
          principal.demoId !==
            undefined &&
          accessGrant.demoId ===
            principal.demoId
        )
      : (
          accessGrant.accessType ===
            "REGISTERED" &&
          principal.demoId ===
            undefined &&
          accessGrant.demoId ===
            undefined
        );

  if (
    !identityMatches ||
    !storageMatches ||
    !contextMatches
  ) {
    return {
      success:
        false,

      errorCode:
        "BRANCH_ACCESS_DENIED",

      error:
        "The FINORA credential does not match its authoritative signed Branch Access Grant.",
    };
  }

  const registeredExpiredReadOnly =
    !accessDecision.allowed &&
    accessDecision.state ===
      "EXPIRED" &&
    accessGrant.accessType ===
      "REGISTERED";

  if (
    !accessDecision.allowed &&
    !registeredExpiredReadOnly
  ) {
    return {
      success:
        false,

      errorCode:
        "BRANCH_ACCESS_DENIED",

      error:
        accessDecision.reason,
    };
  }

  const entitlementResult =
    await hasActiveFinoraStorageEntitlement(
      principal.userId,
      principal.ownerId,
      principal.businessId,
      principal.branchId,
      requestedStorageMode,
      {
        installationId:
          nativeBinding.installationId,

        bindingKeyId:
          nativeBinding.bindingKeyId,

        fingerprintAlgorithm:
          nativeBinding.fingerprintAlgorithm,

        publicKeyFingerprint:
          nativeBinding.publicKeyFingerprint,
      },
    );

  if (
    !entitlementResult.success
  ) {
    return {
      success:
        false,

      errorCode:
        "CONTROL_STATE_FAILED",

      error:
        entitlementResult.error ??
        "Unable to verify FINORA storage entitlement.",
    };
  }

  if (
    entitlementResult.data !==
      true
  ) {
    return {
      success:
        false,

      errorCode:
        "STORAGE_ENTITLEMENT_DENIED",

      error:
        `No active ${requestedStorageMode} storage entitlement exists for this FINORA login.`,
    };
  }

  return {
    success:
      true,

    accessMode:
      registeredExpiredReadOnly
        ? "REGISTERED_EXPIRED_READ_ONLY"
        : "ACTIVE",
  };
}

// ============================================================
// SECURE LOGIN
// ============================================================

export async function createFinoraBranchLoginSession(
  input:
    unknown,
): Promise<
  FinoraBranchLoginResult
> {
  const request =
    sanitizeLoginRequest(
      input,
    );

  if (!request) {
    return {
      success:
        false,

      errorCode:
        "INVALID_REQUEST",

      error:
        "A valid FINORA login request is required.",
    };
  }

  const authenticationResult =
    await authenticateFinoraBranchCredential({
      username:
        request.username,

      password:
        request.password,
    });

  if (
    !authenticationResult.success
  ) {
    if (
      authenticationResult.errorCode ===
        "INVALID_CREDENTIALS" ||
      authenticationResult.errorCode ===
        "INVALID_REQUEST"
    ) {
      return {
        success:
          false,

        errorCode:
          "INVALID_CREDENTIALS",

        error:
          "Invalid username or password.",
      };
    }

    return {
      success:
        false,

      errorCode:
        "AUTHENTICATION_FAILED",

      error:
        "FINORA could not securely authenticate the local credential.",
    };
  }

  const principal =
    toPrincipalFromAuthentication(
      authenticationResult.data,
    );

  const authorizationResult =
    await authorizePrincipal(
      principal,
      request.storageMode,
    );

  if (
    !authorizationResult.success
  ) {
    return authorizationResult;
  }

  pruneExpiredSessions();

  // ----------------------------------------------------------
  // ONE ACTIVE MAIN-PROCESS SESSION PER CREDENTIAL
  // ----------------------------------------------------------

  for (
    const [
      existingSessionId,
      existingRecord,
    ] of activeSessions
  ) {
    if (
      existingRecord.credentialId ===
        principal.credentialId
    ) {
      activeSessions.delete(
        existingSessionId,
      );
    }
  }

  const now =
    new Date().toISOString();

  const sessionId =
    createOpaqueSessionId();

  const record:
    FinoraBranchLoginSessionRecord = {
      sessionId,

      credentialId:
        principal.credentialId,

      selectedStorageMode:
        request.storageMode,

      loginTime:
        now,

      lastActivity:
        now,

      lastActivityMonotonicMs:
        monotonicNowMs(),
    };

  activeSessions.set(
    sessionId,
    record,
  );

  return {
    success:
      true,

    data:
      toSessionView(
        record,
        principal,
        authorizationResult.accessMode,
      ),
  };
}

// ============================================================
// AUTHORITATIVE SESSION VALIDATION
//
// Password is not required again.
//
// The opaque sessionId resolves only to an in-memory credential
// handle. The encrypted Control Store is then re-read and all
// access authorities are re-evaluated fresh.
// ============================================================

export async function validateFinoraBranchLoginSession(
  input:
    unknown,
): Promise<
  FinoraBranchSessionValidationResult
> {
  const request =
    sanitizeSessionRequest(
      input,
    );

  if (!request) {
    return {
      success:
        false,

      errorCode:
        "INVALID_REQUEST",

      error:
        "A valid FINORA session request is required.",
    };
  }

  const record =
    activeSessions.get(
      request.sessionId,
    );

  if (!record) {
    return {
      success:
        false,

      errorCode:
        "SESSION_NOT_FOUND",

      error:
        "FINORA login session is unavailable.",
    };
  }

  if (
    isSessionExpired(
      record,
      monotonicNowMs(),
    )
  ) {
    activeSessions.delete(
      request.sessionId,
    );

    return {
      success:
        false,

      errorCode:
        "SESSION_EXPIRED",

      error:
        "FINORA login session has expired.",
    };
  }

  const storeResult =
    await readFinoraControlStore();

  if (
    !storeResult.success ||
    !storeResult.data
  ) {
    activeSessions.delete(
      request.sessionId,
    );

    return {
      success:
        false,

      errorCode:
        "CONTROL_STATE_FAILED",

      error:
        storeResult.error ??
        "Unable to load authoritative FINORA credential state.",
    };
  }

  const credential =
    (
      storeResult.data.branchCredentials ??
      []
    ).find(
      (item) =>
        item.credentialId ===
        record.credentialId,
    );

  if (
    !credential ||
    credential.status !==
      "ACTIVE"
  ) {
    activeSessions.delete(
      request.sessionId,
    );

    return {
      success:
        false,

      errorCode:
        "SESSION_INVALID",

      error:
        "FINORA login session credential is no longer valid.",
    };
  }

  const principal =
    toPrincipalFromCredential(
      credential,
    );

  const authorizationResult =
    await authorizePrincipal(
      principal,
      record.selectedStorageMode,
    );

  if (
    !authorizationResult.success
  ) {
    activeSessions.delete(
      request.sessionId,
    );

    return authorizationResult;
  }

  return {
    success:
      true,

    data:
      toSessionView(
        record,
        principal,
        authorizationResult.accessMode,
      ),
  };
}

// ============================================================
// SESSION ACTIVITY
//
// Activity refresh changes only the in-memory idle timer and
// security timestamp.
//
// It does not modify credential/access authority.
// ============================================================

export function touchFinoraBranchLoginSession(
  input:
    unknown,
): FinoraBranchSessionTouchResult {
  const request =
    sanitizeSessionRequest(
      input,
    );

  if (!request) {
    return {
      success:
        false,

      errorCode:
        "INVALID_REQUEST",

      error:
        "A valid FINORA session request is required.",
    };
  }

  const record =
    activeSessions.get(
      request.sessionId,
    );

  if (!record) {
    return {
      success:
        false,

      errorCode:
        "SESSION_NOT_FOUND",

      error:
        "FINORA login session is unavailable.",
    };
  }

  const currentMonotonicMs =
    monotonicNowMs();

  if (
    isSessionExpired(
      record,
      currentMonotonicMs,
    )
  ) {
    activeSessions.delete(
      request.sessionId,
    );

    return {
      success:
        false,

      errorCode:
        "SESSION_EXPIRED",

      error:
        "FINORA login session has expired.",
    };
  }

  const lastActivity =
    new Date().toISOString();

  record.lastActivity =
    lastActivity;

  record.lastActivityMonotonicMs =
    currentMonotonicMs;

  return {
    success:
      true,

    data: {
      sessionId:
        record.sessionId,

      lastActivity,
    },
  };
}

// ============================================================
// SESSION INVALIDATION
// ============================================================

export function invalidateFinoraBranchLoginSession(
  input:
    unknown,
): boolean {
  const request =
    sanitizeSessionRequest(
      input,
    );

  if (!request) {
    return false;
  }

  return activeSessions.delete(
    request.sessionId,
  );
}

// ============================================================
// END
// ============================================================