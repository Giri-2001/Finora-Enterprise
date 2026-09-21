import {
  randomUUID,
} from "node:crypto";

import type {
  FinoraBranchCertificationKeyMaterialV1,
} from "./finoraBranchCertificationContract.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
  FinoraPortableBranchAuthPayloadV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_PURPOSE,
  FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_SCHEMA_VERSION,
} from "./finoraPortableFreshDeviceRuntimeAuthorityContract.js";

import type {
  FinoraPortableFreshDeviceRuntimeAuthorityAccessMode,
  FinoraPortableFreshDeviceRuntimeAuthorityPackageV1,
  FinoraPortableFreshDeviceRuntimeAuthorityPayloadV1,
  FinoraPortableFreshDeviceRuntimeAuthorityRole,
  FinoraPortableFreshDeviceRuntimeAuthorityStorageMode,
} from "./finoraPortableFreshDeviceRuntimeAuthorityContract.js";

import {
  createFinoraPortableFreshDeviceRuntimeAuthorityPackageV1,
} from "./finoraPortableFreshDeviceRuntimeAuthorityCrypto.js";

// ============================================================
// REQUEST
// ============================================================

export interface FinoraPortableFreshDeviceRuntimeAuthoritySeedRequest {
  sessionId:
    string;

  password:
    string;

  securityCode:
    string;
}

// ============================================================
// AUTHENTICATED SESSION SNAPSHOT
// ============================================================

export interface FinoraPortableFreshDeviceRuntimeAuthoritySeedSession {
  sessionId:
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
    FinoraPortableFreshDeviceRuntimeAuthorityRole;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  storageMode:
    FinoraPortableFreshDeviceRuntimeAuthorityStorageMode;

  dataContext:
    "REAL" | "DEMO";

  demoId?:
    string;

  accessMode:
    FinoraPortableFreshDeviceRuntimeAuthorityAccessMode;
}

// ============================================================
// CURRENT CREDENTIAL SNAPSHOT
// ============================================================

export interface FinoraPortableFreshDeviceRuntimeAuthoritySeedCredential {
  credentialId:
    string;

  sourceAuthorizationId:
    string;

  authGeneration:
    number;

  userId:
    string;

  username:
    string;

  canonicalUsername:
    string;

  fullName:
    string;

  role:
    FinoraPortableFreshDeviceRuntimeAuthorityRole;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  storageMode:
    FinoraPortableFreshDeviceRuntimeAuthorityStorageMode;

  dataContext:
    "REAL" | "DEMO";

  demoId?:
    string;

  status:
    "ACTIVE";
}

// ============================================================
// CURRENT RUNTIME AUTHORITIES
// ============================================================

export interface FinoraPortableFreshDeviceRuntimeAuthoritySeedControlState {
  activationId:
    string;

  activationStatus:
    "ACTIVE";

  businessCode:
    string | null;

  branchCode:
    string | null;

  activationActivatedAt?:
    string;

  activationCreatedAt:
    string;

  activationUpdatedAt:
    string;

  branchAccessGrantId:
    string;

  branchAccessType:
    "REGISTERED" | "DEMO";

  registrationPayment:
    FinoraPortableFreshDeviceRuntimeAuthorityPayloadV1["registrationPayment"];

  registrationCycle:
    FinoraPortableFreshDeviceRuntimeAuthorityPayloadV1["registrationCycle"];

  demoRemarks:
    FinoraPortableFreshDeviceRuntimeAuthorityPayloadV1["demoRemarks"];

  accessMode:
    FinoraPortableFreshDeviceRuntimeAuthorityAccessMode;

  accessValidFrom:
    string;

  accessValidUntil:
    string;

  branchAccessCreatedAt:
    string;

  branchAccessUpdatedAt:
    string;

  storageEntitlementId:
    string;

  storageEntitlementStatus:
    "ACTIVE";

  storageEntitlementActivatedAt:
    string;

  storageEntitlementCreatedAt:
    string;

  storageEntitlementUpdatedAt:
    string;
}

// ============================================================
// DEPENDENCIES
// ============================================================

export interface FinoraPortableFreshDeviceRuntimeAuthoritySeedDependencies {
  resolveSession:
    (
      sessionId:
        string,
    ) =>
      Promise<
        FinoraPortableFreshDeviceRuntimeAuthoritySeedSession |
        null
      >;

  resolveCredential:
    (
      session:
        FinoraPortableFreshDeviceRuntimeAuthoritySeedSession,
    ) =>
      Promise<
        FinoraPortableFreshDeviceRuntimeAuthoritySeedCredential |
        null
      >;

  resolveControlState:
    (
      session:
        FinoraPortableFreshDeviceRuntimeAuthoritySeedSession,

      credential:
        FinoraPortableFreshDeviceRuntimeAuthoritySeedCredential,
    ) =>
      Promise<
        FinoraPortableFreshDeviceRuntimeAuthoritySeedControlState |
        null
      >;

  readPortableAuth:
    (
      storageMode:
        FinoraPortableFreshDeviceRuntimeAuthorityStorageMode,
    ) =>
      Promise<
        FinoraPortableBranchAuthEnvelopeV1 |
        null
      >;

  decryptPortableAuth:
    (
      envelope:
        FinoraPortableBranchAuthEnvelopeV1,

      password:
        string,

      securityCode:
        string,

      expectedScope: {
        ownerId:
          string;

        businessId:
          string;

        branchId:
          string;
      },
    ) =>
      Promise<
        FinoraPortableBranchAuthPayloadV1
      >;

  createPortableAuthFingerprint:
    (
      envelope:
        FinoraPortableBranchAuthEnvelopeV1,
    ) =>
      string;

  createSignedPackage:
    (
      payload:
        FinoraPortableFreshDeviceRuntimeAuthorityPayloadV1,

      certificationKeyMaterial:
        FinoraBranchCertificationKeyMaterialV1,
    ) =>
      FinoraPortableFreshDeviceRuntimeAuthorityPackageV1;

  persistRuntimeAuthority:
    (
      storageMode:
        FinoraPortableFreshDeviceRuntimeAuthorityStorageMode,

      packageValue:
        FinoraPortableFreshDeviceRuntimeAuthorityPackageV1,
    ) =>
      Promise<void>;

  now:
    () =>
      Date;

  createAuthorityId:
    () =>
      string;
}

// ============================================================
// RESULT
// ============================================================

export type FinoraPortableFreshDeviceRuntimeAuthoritySeedErrorCode =
  | "INVALID_REQUEST"
  | "SESSION_DENIED"
  | "CREDENTIAL_STATE_MISMATCH"
  | "CONTROL_STATE_DENIED"
  | "PORTABLE_AUTH_UNAVAILABLE"
  | "PORTABLE_AUTH_AUTHENTICATION_FAILED"
  | "PORTABLE_AUTH_MISMATCH"
  | "CERTIFICATION_AUTHORITY_MISSING"
  | "SIGNING_FAILED"
  | "PERSIST_FAILED";

export type FinoraPortableFreshDeviceRuntimeAuthoritySeedResult =
  | {
      success:
        true;

      data: {
        authorityId:
          string;

        storageMode:
          FinoraPortableFreshDeviceRuntimeAuthorityStorageMode;

        portableAuthFingerprint:
          string;

        issuedAt:
          string;
      };
    }
  | {
      success:
        false;

      errorCode:
        FinoraPortableFreshDeviceRuntimeAuthoritySeedErrorCode;

      error:
        string;
    };

// ============================================================
// HELPERS
// ============================================================

type UnknownObject =
  Record<string, unknown>;

function failure(
  errorCode:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedErrorCode,
  error:
    string,
): FinoraPortableFreshDeviceRuntimeAuthoritySeedResult {
  return {
    success:
      false,

    errorCode,

    error,
  };
}

function isObject(
  value:
    unknown,
): value is UnknownObject {
  return (
    value !==
      null &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value,
    )
  );
}

function sanitizeRequest(
  value:
    unknown,
): FinoraPortableFreshDeviceRuntimeAuthoritySeedRequest | null {
  if (
    !isObject(
      value,
    )
  ) {
    return null;
  }

  const keys =
    Object.keys(
      value,
    ).sort();

  const expected =
    [
      "password",
      "securityCode",
      "sessionId",
    ];

  if (
    keys.length !==
      expected.length ||
    keys.some(
      (
        key,
        index,
      ) =>
        key !== expected[index],
    )
  ) {
    return null;
  }

  if (
    typeof value.sessionId !==
      "string" ||
    value.sessionId.trim().length ===
      0 ||
    typeof value.password !==
      "string" ||
    value.password.length ===
      0 ||
    typeof value.securityCode !==
      "string" ||
    value.securityCode.length ===
      0
  ) {
    return null;
  }

  return {
    sessionId:
      value.sessionId.trim(),

    password:
      value.password,

    securityCode:
      value.securityCode,
  };
}

function canonicalUsername(
  value:
    string,
): string {
  return value
    .trim()
    .toLowerCase();
}

function demoContextEqual(
  dataContext:
    "REAL" | "DEMO",

  leftDemoId:
    string | undefined,

  rightDemoId:
    string | undefined,
): boolean {
  if (
    dataContext ===
      "REAL"
  ) {
    return (
      leftDemoId ===
        undefined &&
      rightDemoId ===
        undefined
    );
  }

  return (
    typeof leftDemoId ===
      "string" &&
    leftDemoId.length >
      0 &&
    leftDemoId ===
      rightDemoId
  );
}

function sessionMatchesCredential(
  session:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedSession,

  credential:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedCredential,
): boolean {
  return (
    credential.status ===
      "ACTIVE" &&
    credential.authGeneration ===
      session.authGeneration &&
    credential.userId ===
      session.userId &&
    credential.username ===
      session.username &&
    credential.canonicalUsername ===
      canonicalUsername(
        session.username,
      ) &&
    credential.fullName ===
      session.fullName &&
    credential.role ===
      session.role &&
    credential.ownerId ===
      session.ownerId &&
    credential.businessId ===
      session.businessId &&
    credential.branchId ===
      session.branchId &&
    credential.storageMode ===
      session.storageMode &&
    credential.dataContext ===
      session.dataContext &&
    demoContextEqual(
      session.dataContext,
      session.demoId,
      credential.demoId,
    )
  );
}

function portablePayloadMatches(
  payload:
    FinoraPortableBranchAuthPayloadV1,

  session:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedSession,

  credential:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedCredential,
): boolean {
  return (
    payload.sourceAuthorizationId ===
      credential.sourceAuthorizationId &&
    payload.authGeneration ===
      credential.authGeneration &&
    payload.userId ===
      credential.userId &&
    payload.username ===
      credential.username &&
    payload.canonicalUsername ===
      credential.canonicalUsername &&
    payload.fullName ===
      credential.fullName &&
    payload.role ===
      credential.role &&
    payload.ownerId ===
      credential.ownerId &&
    payload.businessId ===
      credential.businessId &&
    payload.branchId ===
      credential.branchId &&
    payload.storageMode ===
      credential.storageMode &&
    payload.dataContext ===
      credential.dataContext &&
    demoContextEqual(
      session.dataContext,
      credential.demoId,
      payload.demoId,
    )
  );
}

function controlStateValid(
  state:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedControlState,

  session:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedSession,
): boolean {
  if (
    state.activationStatus !==
      "ACTIVE" ||
    state.storageEntitlementStatus !==
      "ACTIVE" ||
    state.accessMode !==
      session.accessMode
  ) {
    return false;
  }

  const businessCodeValid =
    state.businessCode === null ||
    (
      typeof state.businessCode ===
        "string" &&
      state.businessCode.trim().length >
        0
    );

  const branchCodeValid =
    state.branchCode === null ||
    (
      typeof state.branchCode ===
        "string" &&
      state.branchCode.trim().length >
        0
    );

  if (
    !businessCodeValid ||
    !branchCodeValid ||
    (
      state.businessCode === null
    ) !==
    (
      state.branchCode === null
    )
  ) {
    return false;
  }

  const validFrom =
    Date.parse(
      state.accessValidFrom,
    );

  const validUntil =
    Date.parse(
      state.accessValidUntil,
    );

  if (
    !Number.isFinite(
      validFrom,
    ) ||
    !Number.isFinite(
      validUntil,
    ) ||
    validUntil <=
      validFrom
  ) {
    return false;
  }

  if (
    session.dataContext ===
      "REAL"
  ) {
    return (
      state.branchAccessType ===
        "REGISTERED"
    );
  }

  return (
    state.branchAccessType ===
      "DEMO" &&
    state.accessMode ===
      "ACTIVE"
  );
}

function isLowerHexFingerprint(
  value:
    string,
): boolean {
  return /^[0-9a-f]{64}$/.test(
    value,
  );
}

// ============================================================
// SEED
// ============================================================

export async function seedFinoraPortableFreshDeviceRuntimeAuthority(
  input:
    unknown,

  dependencies:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedDependencies,
): Promise<
  FinoraPortableFreshDeviceRuntimeAuthoritySeedResult
> {
  const request =
    sanitizeRequest(
      input,
    );

  if (!request) {
    return failure(
      "INVALID_REQUEST",
      "A valid FINORA runtime-authority seed request is required.",
    );
  }

  let session:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedSession |
    null;

  try {
    session =
      await dependencies.resolveSession(
        request.sessionId,
      );
  }
  catch {
    return failure(
      "SESSION_DENIED",
      "FINORA could not resolve the authenticated session.",
    );
  }

  if (!session) {
    return failure(
      "SESSION_DENIED",
      "An authenticated FINORA branch session is required.",
    );
  }

  let credential:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedCredential |
    null;

  try {
    credential =
      await dependencies.resolveCredential(
        session,
      );
  }
  catch {
    return failure(
      "CREDENTIAL_STATE_MISMATCH",
      "FINORA could not resolve the current credential state.",
    );
  }

  if (
    !credential ||
    !sessionMatchesCredential(
      session,
      credential,
    )
  ) {
    return failure(
      "CREDENTIAL_STATE_MISMATCH",
      "The authenticated FINORA session does not match current credential authority.",
    );
  }

  let controlState:
    FinoraPortableFreshDeviceRuntimeAuthoritySeedControlState |
    null;

  try {
    controlState =
      await dependencies.resolveControlState(
        session,
        credential,
      );
  }
  catch {
    return failure(
      "CONTROL_STATE_DENIED",
      "FINORA could not resolve current branch runtime authority.",
    );
  }

  if (
    !controlState ||
    !controlStateValid(
      controlState,
      session,
    )
  ) {
    return failure(
      "CONTROL_STATE_DENIED",
      "Current FINORA Branch Activation, Branch Access or Storage Entitlement authority is invalid.",
    );
  }

  let envelope:
    FinoraPortableBranchAuthEnvelopeV1 |
    null;

  try {
    envelope =
      await dependencies.readPortableAuth(
        session.storageMode,
      );
  }
  catch {
    return failure(
      "PORTABLE_AUTH_UNAVAILABLE",
      "FINORA Portable Branch Auth state is unavailable.",
    );
  }

  if (!envelope) {
    return failure(
      "PORTABLE_AUTH_UNAVAILABLE",
      "FINORA Portable Branch Auth state was not found.",
    );
  }

  let payload:
    FinoraPortableBranchAuthPayloadV1;

  try {
    payload =
      await dependencies.decryptPortableAuth(
        envelope,
        request.password,
        request.securityCode,
        {
          ownerId:
            session.ownerId,

          businessId:
            session.businessId,

          branchId:
            session.branchId,
        },
      );
  }
  catch {
    return failure(
      "PORTABLE_AUTH_AUTHENTICATION_FAILED",
      "FINORA Portable Branch Auth authentication failed.",
    );
  }

  if (
    !portablePayloadMatches(
      payload,
      session,
      credential,
    )
  ) {
    return failure(
      "PORTABLE_AUTH_MISMATCH",
      "FINORA Portable Branch Auth does not match the authenticated credential lineage.",
    );
  }

  if (
    payload.branchCertificationKeyMaterial ===
      undefined
  ) {
    return failure(
      "CERTIFICATION_AUTHORITY_MISSING",
      "FINORA Portable Branch Auth does not contain Branch Certification authority.",
    );
  }

  let portableAuthFingerprint:
    string;

  try {
    portableAuthFingerprint =
      dependencies.createPortableAuthFingerprint(
        envelope,
      );
  }
  catch {
    return failure(
      "PORTABLE_AUTH_MISMATCH",
      "FINORA could not fingerprint Portable Branch Auth state.",
    );
  }

  if (
    !isLowerHexFingerprint(
      portableAuthFingerprint,
    )
  ) {
    return failure(
      "PORTABLE_AUTH_MISMATCH",
      "FINORA Portable Branch Auth fingerprint is invalid.",
    );
  }

  const issuedAt =
    dependencies
      .now()
      .toISOString();

  const authorityId =
    dependencies
      .createAuthorityId();

  if (
    typeof authorityId !==
      "string" ||
    authorityId.trim().length ===
      0
  ) {
    return failure(
      "SIGNING_FAILED",
      "FINORA runtime-authority identity generation failed.",
    );
  }

  const runtimePayload:
    FinoraPortableFreshDeviceRuntimeAuthorityPayloadV1 = {
      schemaVersion:
        FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_SCHEMA_VERSION,

      purpose:
        FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_PURPOSE,

      authorityId,

      sourceAuthorizationId:
        credential.sourceAuthorizationId,

      credentialId:
        credential.credentialId,

      activationId:
        controlState.activationId,

      branchAccessGrantId:
        controlState.branchAccessGrantId,

      storageEntitlementId:
        controlState.storageEntitlementId,

      ownerId:
        credential.ownerId,

      businessId:
        credential.businessId,

      branchId:
        credential.branchId,

      userId:
        credential.userId,

      username:
        credential.username,

      canonicalUsername:
        credential.canonicalUsername,

      fullName:
        credential.fullName,

      role:
        credential.role,

      storageMode:
        credential.storageMode,

      dataContext:
        credential.dataContext,

      demoId:
        credential.demoId ??
        null,

      authGeneration:
        credential.authGeneration,

      activationStatus:
        "ACTIVE",

      businessCode:
        controlState.businessCode,

      branchCode:
        controlState.branchCode,

      ...(
        controlState.activationActivatedAt ===
          undefined
          ? {}
          : {
              activationActivatedAt:
                controlState.activationActivatedAt,
            }
      ),

      activationCreatedAt:
        controlState.activationCreatedAt,

      activationUpdatedAt:
        controlState.activationUpdatedAt,

      branchAccessType:
        controlState.branchAccessType,

      registrationPayment:
        controlState.registrationPayment,

      registrationCycle:
        controlState.registrationCycle,

      demoRemarks:
        controlState.demoRemarks,

      accessMode:
        controlState.accessMode,

      accessValidFrom:
        controlState.accessValidFrom,

      accessValidUntil:
        controlState.accessValidUntil,

      branchAccessCreatedAt:
        controlState.branchAccessCreatedAt,

      branchAccessUpdatedAt:
        controlState.branchAccessUpdatedAt,

      storageEntitlementStatus:
        "ACTIVE",

      storageEntitlementActivatedAt:
        controlState.storageEntitlementActivatedAt,

      storageEntitlementCreatedAt:
        controlState.storageEntitlementCreatedAt,

      storageEntitlementUpdatedAt:
        controlState.storageEntitlementUpdatedAt,

      portableAuthFingerprint,

      issuedAt,
    };

  let signedPackage:
    FinoraPortableFreshDeviceRuntimeAuthorityPackageV1;

  try {
    signedPackage =
      dependencies.createSignedPackage(
        runtimePayload,
        payload.branchCertificationKeyMaterial,
      );
  }
  catch {
    return failure(
      "SIGNING_FAILED",
      "FINORA could not sign fresh-device runtime authority.",
    );
  }

  try {
    await dependencies.persistRuntimeAuthority(
      session.storageMode,
      signedPackage,
    );
  }
  catch {
    return failure(
      "PERSIST_FAILED",
      "FINORA could not persist fresh-device runtime authority.",
    );
  }

  return {
    success:
      true,

    data: {
      authorityId,

      storageMode:
        session.storageMode,

      portableAuthFingerprint,

      issuedAt,
    },
  };
}

// ============================================================
// DEFAULT ID FACTORY
// ============================================================

export function createFinoraPortableFreshDeviceRuntimeAuthorityId():
  string {
  return (
    "FINORA-FRESH-RUNTIME-AUTHORITY-" +
    randomUUID()
      .toUpperCase()
  );
}

export const createDefaultFinoraPortableFreshDeviceRuntimeAuthoritySignedPackage =
  createFinoraPortableFreshDeviceRuntimeAuthorityPackageV1;