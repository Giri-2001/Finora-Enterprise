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
  resolveFinoraBranchCredentialAuthGeneration,
} from "./finoraBranchCredentialAuthenticationService.js";

import type {
  FinoraBranchCredentialAuthenticationSuccess,
} from "./finoraBranchCredentialAuthenticationService.js";

import {
  evaluateFinoraAuthoritativeBranchAccess,
} from "./finoraBranchAccessAuthorityService.js";

import {
  findFinoraBranchActivation,
  findFinoraStorageEntitlement,
  readFinoraControlStore,
} from "./finoraControlStore.js";

import type {
  FinoraControlBranchCredential,
  FinoraControlStorageMode,
} from "./finoraControlStore.js";

import {
  authorizeFinoraCurrentBranchDevice,
  checkFinoraCurrentBranchDeviceTrust,
} from "./finoraBranchDeviceTrustAuthority.js";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import {
  bootstrapFinoraLegacySecurityCode,
} from "./finoraLegacySecurityCodeBootstrapCoordinator.js";

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

  /**
   * Present only after Electron main has authenticated the
   * username/password and returned SECURITY_CODE_REQUIRED for
   * an unknown current device.
   *
   * This value is never persisted in a login session.
   */
  securityCode?:
    string;
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
  | "SECURITY_CODE_SETUP_REQUIRED"
  | "SECURITY_CODE_REQUIRED"
  | "SECURITY_CODE_INVALID"
  | "DEVICE_TRUST_FAILED"
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

export interface FinoraBranchOperationalSessionPrincipal {
  authGeneration:
    number;

  userId:
    string;

  username:
    string;

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
}

export interface FinoraBranchOperationalSessionContext {
  session:
    FinoraBranchLoginSessionView;

  principal:
    FinoraBranchOperationalSessionPrincipal;
}

export type FinoraBranchOperationalSessionContextResult =
  | {
      success:
        true;

      data:
        FinoraBranchOperationalSessionContext;
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
    )
  ) {
    return undefined;
  }

  const passwordOnlyRequest =
    hasExactKeys(
      input,
      [
        "username",
        "password",
        "storageMode",
      ],
    );

  const securityCodeRequest =
    hasExactKeys(
      input,
      [
        "username",
        "password",
        "storageMode",
        "securityCode",
      ],
    );

  const securityCode =
    securityCodeRequest
      ? input.securityCode
      : undefined;

  if (
    (
      !passwordOnlyRequest &&
      !securityCodeRequest
    ) ||
    !isNonEmptyString(
      input.username,
    ) ||
    typeof input.password !==
      "string" ||
    !isStorageMode(
      input.storageMode,
    ) ||
    (
      securityCode !==
        undefined &&
      typeof securityCode !==
        "string"
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

    ...(
      typeof securityCode ===
        "string"
        ? {
            securityCode,
          }
        : {}
    ),
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

    authGeneration:
      value.authGeneration,

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

  /*
   * Current-device authorization is owned by Branch Device
   * Trust before this authorization layer is entered.
   *
   * The signed storage entitlement remains the durable logical
   * authorization for the exact user + branch + storage mode.
   *
   * Its historical installation-binding fields are NOT
   * rewritten when another legitimate device becomes trusted.
   * This preserves concurrent trusted devices for one branch.
   */
  const entitlementResult =
    await findFinoraStorageEntitlement(
      principal.userId,
      principal.ownerId,
      principal.businessId,
      principal.branchId,
      requestedStorageMode,
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

  const entitlement =
    entitlementResult.data;

  const logicalEntitlementMatches =
    entitlement !==
      undefined &&
    entitlement.status ===
      "ACTIVE" &&
    entitlement.userId ===
      principal.userId &&
    entitlement.ownerId ===
      principal.ownerId &&
    entitlement.businessId ===
      principal.businessId &&
    entitlement.branchId ===
      principal.branchId &&
    entitlement.storageMode ===
      requestedStorageMode;

  if (
    !logicalEntitlementMatches
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

  portableStore?:
    FinoraPortableBranchAuthStore,
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

  // ----------------------------------------------------------
  // CURRENT DEVICE TRUST
  //
  // Username/password authentication above always happens
  // before this block.
  //
  // Therefore an invalid credential can never trigger a
  // Security Code challenge or Device Trust mutation.
  // ----------------------------------------------------------

  if (!portableStore) {
    return {
      success:
        false,

      errorCode:
        "DEVICE_TRUST_FAILED",

      error:
        "FINORA device-trust authority is unavailable.",
    };
  }

  // ----------------------------------------------------------
  // LEGACY SECURITY CODE BOOTSTRAP
  //
  // Password authentication has already succeeded above.
  // A credential that predates Security Code / Portable Auth
  // must establish that authority before Device Trust runs.
  // ----------------------------------------------------------

  const legacyControlStoreResult =
    await readFinoraControlStore();

  if (
    !legacyControlStoreResult.success ||
    !legacyControlStoreResult.data
  ) {
    return {
      success: false,
      errorCode: "CONTROL_STATE_FAILED",
      error: "FINORA could not verify the authenticated credential state.",
    };
  }

  const authenticatedCredential =
    legacyControlStoreResult.data.branchCredentials?.find(
      (item) =>
        item.credentialId === authenticationResult.data.credentialId &&
        item.userId === authenticationResult.data.userId &&
        item.ownerId === authenticationResult.data.ownerId &&
        item.businessId === authenticationResult.data.businessId &&
        item.branchId === authenticationResult.data.branchId &&
        item.storageMode === authenticationResult.data.storageMode &&
        (item.authGeneration ?? 1) === authenticationResult.data.authGeneration,
    );

  if (!authenticatedCredential) {
    return {
      success: false,
      errorCode: "CONTROL_STATE_FAILED",
      error: "FINORA authenticated credential state is unavailable.",
    };
  }

  if (authenticatedCredential.securityVerifier === undefined) {
    if (request.securityCode === undefined) {
      return {
        success: false,
        errorCode: "SECURITY_CODE_SETUP_REQUIRED",
        error: "Create and confirm a Security Code to upgrade this FINORA credential.",
      };
    }

    const legacyBootstrapResult =
      await bootstrapFinoraLegacySecurityCode(
        {
          username: request.username,
          password: request.password,
          securityCode: request.securityCode,
        },
        portableStore,
      );

    if (!legacyBootstrapResult.success) {
      if (legacyBootstrapResult.errorCode === "ALREADY_BOOTSTRAPPED") {
        return createFinoraBranchLoginSession(
          request,
          portableStore,
        );
      }

      if (legacyBootstrapResult.errorCode === "NATIVE_BINDING_UNAVAILABLE") {
        return {
          success: false,
          errorCode: "NATIVE_BINDING_UNAVAILABLE",
          error: "FINORA native device binding is unavailable.",
        };
      }

      if (legacyBootstrapResult.errorCode === "STORAGE_ENTITLEMENT_DENIED") {
        return {
          success: false,
          errorCode: "STORAGE_ENTITLEMENT_DENIED",
          error: "This device does not hold the exact active storage authority required for legacy Security Code setup.",
        };
      }

      return {
        success: false,
        errorCode: "DEVICE_TRUST_FAILED",
        error: "FINORA could not securely establish Security Code portability for this legacy credential.",
      };
    }

    // Re-authenticate against the advanced credential generation.
    // The same Security Code can then authorize the current device
    // through the ordinary Device Trust path below.
    return createFinoraBranchLoginSession(
      request,
      portableStore,
    );
  }

  const deviceTrustResult =
    await checkFinoraCurrentBranchDeviceTrust({
      principal:
        authenticationResult.data,

      portableStore,
    });

  if (
    !deviceTrustResult.success
  ) {
    return {
      success:
        false,

      errorCode:
        deviceTrustResult.errorCode ===
          "NATIVE_BINDING_UNAVAILABLE"
          ? "NATIVE_BINDING_UNAVAILABLE"
          : "DEVICE_TRUST_FAILED",

      error:
        "FINORA could not verify this device for the authenticated branch.",
    };
  }

  if (
    deviceTrustResult.status ===
      "SECURITY_CODE_REQUIRED"
  ) {
    if (
      request.securityCode ===
        undefined
    ) {
      return {
        success:
          false,

        errorCode:
          "SECURITY_CODE_REQUIRED",

        error:
          "Security Code is required to authorize this device.",
      };
    }

    const deviceAuthorizationResult =
      await authorizeFinoraCurrentBranchDevice({
        principal:
          authenticationResult.data,

        portableStore,

        password:
          request.password,

        securityCode:
          request.securityCode,
      });

    if (
      !deviceAuthorizationResult.success
    ) {
      if (
        deviceAuthorizationResult.errorCode ===
          "NATIVE_BINDING_UNAVAILABLE"
      ) {
        return {
          success:
            false,

          errorCode:
            "NATIVE_BINDING_UNAVAILABLE",

          error:
            "FINORA native device binding is unavailable.",
        };
      }

      if (
        deviceAuthorizationResult.errorCode ===
          "PORTABLE_AUTH_AUTHENTICATION_FAILED"
      ) {
        return {
          success:
            false,

          errorCode:
            "SECURITY_CODE_INVALID",

          error:
            "Security Code could not authorize this device.",
        };
      }

      return {
        success:
          false,

        errorCode:
          "DEVICE_TRUST_FAILED",

        error:
          "FINORA could not securely authorize this device.",
      };
    }
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

export async function resolveFinoraBranchOperationalSessionContext(
  input:
    unknown,
): Promise<
  FinoraBranchOperationalSessionContextResult
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

    data: {
      session:
        toSessionView(
          record,
          principal,
          authorizationResult.accessMode,
        ),

      principal: {
        authGeneration:
          principal.authGeneration,

        userId:
          principal.userId,

        username:
          principal.username,

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
      },
    },
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

export async function validateFinoraBranchLoginSession(
  input:
    unknown,
): Promise<
  FinoraBranchSessionValidationResult
> {
  const contextResult =
    await resolveFinoraBranchOperationalSessionContext(
      input,
    );

  if (
    !contextResult.success
  ) {
    return contextResult;
  }

  return {
    success:
      true,

    data:
      contextResult.data.session,
  };
}

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