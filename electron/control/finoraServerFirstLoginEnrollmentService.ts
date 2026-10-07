/* ============================================================
   FINORA ENTERPRISE OS

   SERVER-FIRST LOGIN ENROLLMENT SERVICE

   RESPONSIBILITY:

   - Verify first-login authority with FINORA Server.
   - Require the selected USB user-folder name to match the
     canonical server username.
   - Create or resume legitimate Portable Branch Auth V2.
   - Preserve SERVER_FIRST_LOGIN_SIGNED_BOOTSTRAP provenance.
   - Create Branch Certification key material only when no
     Portable Auth V2 already exists.
   - Create or resume exact Branch-Certification-signed Runtime
     Authority.
   - Hydrate local Control Store with the server-authorized
     credential/access lifecycle.
   - Never authorize Device Trust itself.

   SECURITY:

   - MAIN PROCESS ONLY.
   - Existing conflicting Portable Auth / Runtime Authority fails
     closed.
   - Password / Security Code are never persisted here.
   - Existing V2 state is resumed only after both Password and
     Security Code decrypt to the same exact Portable Auth payload.
   - Server signature verification remains pinned in the
     server-first verifier.
   - Device Trust remains the responsibility of normal Login
     Authority after local re-authentication.
   ============================================================ */

import {
  randomUUID,
} from "node:crypto";

import {
  basename,
  resolve,
} from "node:path";

import {
  generateFinoraBranchCertificationKeyMaterial,
  toFinoraBranchCertificationPublicKey,
} from "./finoraBranchCertificationCrypto.js";

import {
  FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION,
  FINORA_PORTABLE_BRANCH_AUTH_PAYLOAD_SCHEMA_VERSION,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraPortableBranchAuthPayloadV1,
  FinoraPortableBranchAuthServerFirstLoginSourceAuthorizationVerificationEvidenceV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  createFinoraPortableBranchAuthEnrollmentMaterialV2,
  decryptFinoraPortableBranchAuthEnvelopeV2WithPassword,
  decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode,
} from "./finoraPortableBranchAuthV2Crypto.js";

import type {
  FinoraPortableBranchAuthV2Store,
} from "./finoraPortableBranchAuthV2Store.js";

import {
  computeFinoraPortableBranchAuthV2EnvelopeSha256,
} from "./finoraPortableBranchAuthV2EnrollmentTransaction.js";

import {
  FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_PURPOSE,
  FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_SCHEMA_VERSION,
  canonicalizeFinoraPortableFreshDeviceRuntimeAuthorityPayloadV1,
} from "./finoraPortableFreshDeviceRuntimeAuthorityContract.js";

import type {
  FinoraPortableFreshDeviceRuntimeAuthorityPayloadV1,
} from "./finoraPortableFreshDeviceRuntimeAuthorityContract.js";

import {
  createFinoraPortableFreshDeviceRuntimeAuthorityPackageV1,
  verifyFinoraPortableFreshDeviceRuntimeAuthorityPackageV1,
} from "./finoraPortableFreshDeviceRuntimeAuthorityCrypto.js";

import type {
  FinoraPortableFreshDeviceRuntimeAuthorityStore,
} from "./finoraPortableFreshDeviceRuntimeAuthorityStore.js";

import {
  hydrateFinoraPortableFreshDeviceFromPlan,
} from "./finoraPortableFreshDeviceHydrationService.js";

import {
  ensureFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import type {
  FinoraFreshDeviceBootstrapHydrationPlan,
} from "./finoraPortableFreshDeviceBootstrapCoordinator.js";

import {
  verifyFinoraOwnerFirstLoginOnServer,
} from "./finoraServerFirstLoginClient.js";

import type {
  FinoraServerFirstLoginSignedBootstrapV1,
  FinoraServerFirstLoginBootstrapPayloadV1,
} from "./finoraServerFirstLoginBootstrapVerifier.js";

// ============================================================
// CONTRACT
// ============================================================

export interface FinoraServerFirstLoginEnrollmentRequest {
  username:
    string;

  password:
    string;

  securityCode:
    string;

  selectedUsbRoot:
    string;
}

export type FinoraServerFirstLoginEnrollmentErrorCode =
  | "INVALID_REQUEST"
  | "SERVER_VERIFICATION_FAILED"
  | "USB_FOLDER_MISMATCH"
  | "PORTABLE_AUTH_CONFLICT"
  | "PORTABLE_AUTH_FAILED"
  | "RUNTIME_AUTHORITY_CONFLICT"
  | "RUNTIME_AUTHORITY_FAILED"
  | "HYDRATION_FAILED";

export interface FinoraServerFirstLoginEnrollmentSuccess {
  success:
    true;

  status:
    "ENROLLED_AND_HYDRATED";

  credentialId:
    string;

  canonicalUsername:
    string;

  portableAuthFingerprint:
    string;

  credentialChangeRequired:
    boolean;
}

export interface FinoraServerFirstLoginEnrollmentFailure {
  success:
    false;

  errorCode:
    FinoraServerFirstLoginEnrollmentErrorCode;

  error:
    string;
}

export type FinoraServerFirstLoginEnrollmentResult =
  | FinoraServerFirstLoginEnrollmentSuccess
  | FinoraServerFirstLoginEnrollmentFailure;

// ============================================================
// HELPERS
// ============================================================

function failure(
  errorCode:
    FinoraServerFirstLoginEnrollmentErrorCode,

  error:
    string,
): FinoraServerFirstLoginEnrollmentFailure {
  return {
    success:
      false,

    errorCode,

    error,
  };
}

function canonicalizeUsername(
  value:
    string,
): string {
  return value
    .trim()
    .normalize("NFKC")
    .toLowerCase();
}

function isAllowedRole(
  value:
    string,
): value is
  | "ADMIN"
  | "MANAGER"
  | "COLLECTOR"
  | "VIEWER" {
  // FINORA_SERVER_FIRST_LOGIN_OWNER_ROLE_V1
  if (
    value === "OWNER"
  ) {
    return true;
  }

  return (
    value === "ADMIN" ||
    value === "MANAGER" ||
    value === "COLLECTOR" ||
    value === "VIEWER"
  );
}

function exactJsonEqual(
  left:
    unknown,

  right:
    unknown,
): boolean {
  return (
    JSON.stringify(
      left,
    ) ===
    JSON.stringify(
      right,
    )
  );
}

function buildServerFirstEvidence(
  signedBootstrap:
    FinoraServerFirstLoginSignedBootstrapV1,

  payload:
    FinoraServerFirstLoginBootstrapPayloadV1,

  verifiedAt:
    string,
): FinoraPortableBranchAuthServerFirstLoginSourceAuthorizationVerificationEvidenceV1 {
  return {
    authorizationId:
      payload.sourceAuthorizationId,

    provenanceType:
      "SERVER_FIRST_LOGIN_SIGNED_BOOTSTRAP",

    signedBootstrap:
      structuredClone(
        signedBootstrap,
      ),

    verifiedAt,

    schemaVersion:
      1,
  };
}

function portablePayloadMatchesServerAuthority(
  portable:
    FinoraPortableBranchAuthPayloadV1,

  server:
    FinoraServerFirstLoginBootstrapPayloadV1,
): boolean {
  const evidence =
    portable.sourceAuthorizationVerificationEvidence;

  if (
    !(
      "provenanceType" in
        evidence
    ) ||
    evidence.provenanceType !==
      "SERVER_FIRST_LOGIN_SIGNED_BOOTSTRAP"
  ) {
    return false;
  }

  return (
    evidence.authorizationId ===
      server.sourceAuthorizationId &&
    evidence.signedBootstrap.payload.sourceAuthorizationId ===
      server.sourceAuthorizationId &&
    exactJsonEqual(
      evidence.signedBootstrap.payload,
      server,
    ) &&
    portable.sourceAuthorizationId ===
      server.sourceAuthorizationId &&
    portable.ownerId ===
      server.ownerId &&
    portable.businessId ===
      server.businessId &&
    portable.branchId ===
      server.branchId &&
    portable.userId ===
      server.userId &&
    portable.username ===
      server.username &&
    portable.canonicalUsername ===
      server.canonicalUsername &&
    portable.fullName ===
      server.fullName &&
    portable.role ===
      server.role &&
    portable.storageMode ===
      server.storageMode &&
    portable.dataContext ===
      server.dataContext &&
    portable.authGeneration ===
      server.authGeneration &&
    portable.branchCertificationKeyMaterial !==
      undefined
  );
}

function buildRuntimePayload(
  server:
    FinoraServerFirstLoginBootstrapPayloadV1,

  portableAuthFingerprint:
    string,
): FinoraPortableFreshDeviceRuntimeAuthorityPayloadV1 {
  if (
    !isAllowedRole(
      server.role,
    )
  ) {
    throw new Error(
      "FINORA server-first role is unsupported.",
    );
  }

  if (
    server.storageMode !==
      "USB"
  ) {
    throw new Error(
      "FINORA server-first enrollment requires USB storage.",
    );
  }

  return {
    schemaVersion:
      FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_SCHEMA_VERSION,

    purpose:
      FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_PURPOSE,

    authorityId:
      server.authorityId,

    sourceAuthorizationId:
      server.sourceAuthorizationId,

    credentialId:
      server.credentialId,

    activationId:
      server.activationId,

    branchAccessGrantId:
      server.branchAccessGrantId,

    storageEntitlementId:
      server.storageEntitlementId,

    ownerId:
      server.ownerId,

    businessId:
      server.businessId,

    branchId:
      server.branchId,

    businessCode:
      server.businessCode,

    branchCode:
      server.branchCode,

    userId:
      server.userId,

    username:
      server.username,

    canonicalUsername:
      server.canonicalUsername,

    fullName:
      server.fullName,

    role:
      server.role,

    storageMode:
      "USB",

    dataContext:
      "REAL",

    demoId:
      null,

    authGeneration:
      server.authGeneration,

    activationStatus:
      "ACTIVE",

    activationActivatedAt:
      server.activationActivatedAt,

    activationCreatedAt:
      server.activationCreatedAt,

    activationUpdatedAt:
      server.activationUpdatedAt,

    branchAccessType:
      "REGISTERED",

    registrationPayment:
      null,

    registrationCycle:
      null,

    demoRemarks:
      null,

    accessMode:
      "ACTIVE",

    accessValidFrom:
      server.accessValidFrom,

    accessValidUntil:
      server.accessValidUntil,

    branchAccessCreatedAt:
      server.branchAccessCreatedAt,

    branchAccessUpdatedAt:
      server.branchAccessUpdatedAt,

    storageEntitlementStatus:
      "ACTIVE",

    storageEntitlementActivatedAt:
      server.storageEntitlementActivatedAt,

    storageEntitlementCreatedAt:
      server.storageEntitlementCreatedAt,

    storageEntitlementUpdatedAt:
      server.storageEntitlementUpdatedAt,

    portableAuthFingerprint,

    issuedAt:
      server.issuedAt,
  };
}

// ============================================================
// PRODUCTION SERVICE
// ============================================================

export async function enrollFinoraServerFirstLogin(
  request:
    FinoraServerFirstLoginEnrollmentRequest,

  portableV2Store:
    FinoraPortableBranchAuthV2Store,

  runtimeAuthorityStore:
    FinoraPortableFreshDeviceRuntimeAuthorityStore,
): Promise<
  FinoraServerFirstLoginEnrollmentResult
> {
  if (
    typeof request.username !==
      "string" ||
    request.username.trim().length ===
      0 ||
    typeof request.password !==
      "string" ||
    request.password.length ===
      0 ||
    typeof request.securityCode !==
      "string" ||
    request.securityCode.length ===
      0 ||
    typeof request.selectedUsbRoot !==
      "string" ||
    request.selectedUsbRoot.trim().length ===
      0
  ) {
    return failure(
      "INVALID_REQUEST",
      "FINORA server-first enrollment request is incomplete.",
    );
  }

  const serverResult =
    await verifyFinoraOwnerFirstLoginOnServer({
      username:
        request.username,

      password:
        request.password,

      securityCode:
        request.securityCode,
    });

  if (
    !serverResult.success
  ) {
    return failure(
      "SERVER_VERIFICATION_FAILED",
      serverResult.error,
    );
  }

  const server =
    serverResult
      .verifiedBootstrap
      .payload;

  console.error(
    "[FINORA SERVER-FIRST SEMANTICS]",
    JSON.stringify({
      storageMode:
        server.storageMode,
      dataContext:
        server.dataContext,
      branchAccessType:
        server.branchAccessType,
      accessMode:
        server.accessMode,
      activationStatus:
        server.activationStatus,
      storageEntitlementStatus:
        server.storageEntitlementStatus,
      branchCertificationEnrollmentPolicy:
        server.branchCertificationEnrollmentPolicy,
      authGeneration:
        server.authGeneration,
      expectedAuthGeneration:
        FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION,
      role:
        server.role,
      roleAllowed:
        isAllowedRole(
          server.role,
        ),
    }),
  );

  if (
    server.storageMode !==
      "USB" ||
    server.dataContext !==
      "REAL" ||
    server.branchAccessType !==
      "REGISTERED" ||
    server.accessMode !==
      "ACTIVE" ||
    server.activationStatus !==
      "ACTIVE" ||
    server.storageEntitlementStatus !==
      "ACTIVE" ||
    server.branchCertificationEnrollmentPolicy !==
      "CREATE_ON_FIRST_VERIFIED_LOGIN" ||
    server.authGeneration !==
      FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION ||
    !isAllowedRole(
      server.role,
    )
  ) {
    return failure(
      "SERVER_VERIFICATION_FAILED",
      "FINORA server-first authority contains unsupported access semantics.",
    );
  }

  const selectedFolderName =
    canonicalizeUsername(
      basename(
        resolve(
          request.selectedUsbRoot,
        ),
      ),
    );

  if (
    selectedFolderName !==
      server.canonicalUsername
  ) {
    return failure(
      "USB_FOLDER_MISMATCH",
      `Select the USB folder for User ID: ${server.canonicalUsername}`,
    );
  }

  let portablePayload:
    FinoraPortableBranchAuthPayloadV1;

  let portableEnvelope:
    Awaited<
      ReturnType<
        FinoraPortableBranchAuthV2Store["read"]
      >
    >;

  try {
    portableEnvelope =
      await portableV2Store.read(
        "USB",
      );
  }
  catch {
    return failure(
      "PORTABLE_AUTH_CONFLICT",
      "Existing FINORA Portable Auth state is invalid or incompatible.",
    );
  }

  if (
    portableEnvelope
  ) {
    try {
      const passwordPayload =
        await decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
          portableEnvelope,
          request.password,
        );

      const securityPayload =
        await decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode(
          portableEnvelope,
          request.securityCode,
        );

      if (
        !exactJsonEqual(
          passwordPayload,
          securityPayload,
        ) ||
        !portablePayloadMatchesServerAuthority(
          passwordPayload,
          server,
        )
      ) {
        return failure(
          "PORTABLE_AUTH_CONFLICT",
          "Existing FINORA Portable Auth does not match this server-first authority.",
        );
      }

      portablePayload =
        passwordPayload;
    }
    catch {
      return failure(
        "PORTABLE_AUTH_CONFLICT",
        "Existing FINORA Portable Auth cannot be resumed with these verified credentials.",
      );
    }
  }
  else {
    const certificationKeyMaterial =
      generateFinoraBranchCertificationKeyMaterial(
        new Date(
          server.issuedAt,
        ),
      );

    const sourceEvidence =
      buildServerFirstEvidence(
        serverResult.signedBootstrap,
        server,
        serverResult.verifiedBootstrap.verifiedAt,
      );

    let material:
      Awaited<
        ReturnType<
          typeof createFinoraPortableBranchAuthEnrollmentMaterialV2
        >
      >;

    try {
      material =
        await createFinoraPortableBranchAuthEnrollmentMaterialV2({
          payload: {
            schemaVersion:
              FINORA_PORTABLE_BRANCH_AUTH_PAYLOAD_SCHEMA_VERSION,

            authStateId:
              `FINORA-PORTABLE-AUTH-STATE-${randomUUID()}`,

            sourceAuthorizationId:
              server.sourceAuthorizationId,

            sourceAuthorizationVerificationEvidence:
              sourceEvidence,

            canonicalUsername:
              server.canonicalUsername,

            ownerId:
              server.ownerId,

            businessId:
              server.businessId,

            branchId:
              server.branchId,

            userId:
              server.userId,

            username:
              server.username,

            fullName:
              server.fullName,

            role:
              server.role,

            dataContext:
              "REAL",

            storageMode:
              "USB",

            branchCertificationKeyMaterial:
              certificationKeyMaterial,

            authGeneration:
              FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION,

            createdAt:
              server.issuedAt,

            updatedAt:
              server.issuedAt,
          },

          password:
            request.password,

          securityCode:
            request.securityCode,
        });
    }
    catch (
      error
    ) {
      console.error(
        "[FINORA PORTABLE AUTH DERIVE]",
        error instanceof Error
          ? {
              name:
                error.name,
              message:
                error.message,
            }
          : {
              name:
                "UnknownError",
              message:
                String(
                  error,
                ),
            },
      );

      return failure(
        "PORTABLE_AUTH_FAILED",
        "Unable to derive FINORA Portable Auth V2 enrollment material.",
      );
    }

    try {
      await portableV2Store.ensureExact(
        "USB",
        material.envelope,
      );
    }
    catch {
      return failure(
        "PORTABLE_AUTH_CONFLICT",
        "FINORA Portable Auth V2 could not be persisted without overwriting existing state.",
      );
    }

    portableEnvelope =
      material.envelope;

    try {
      portablePayload =
        await decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
          portableEnvelope,
          request.password,
        );
    }
    catch {
      return failure(
        "PORTABLE_AUTH_FAILED",
        "FINORA Portable Auth V2 post-write verification failed.",
      );
    }
  }

  if (
    !portableEnvelope ||
    !portablePayload.branchCertificationKeyMaterial
  ) {
    return failure(
      "PORTABLE_AUTH_FAILED",
      "FINORA Portable Auth V2 does not contain Branch Certification authority.",
    );
  }

  const portableAuthFingerprint =
    computeFinoraPortableBranchAuthV2EnvelopeSha256(
      portableEnvelope,
    );

  let runtimePayload:
    FinoraPortableFreshDeviceRuntimeAuthorityPayloadV1;

  try {
    runtimePayload =
      buildRuntimePayload(
        server,
        portableAuthFingerprint,
      );
  }
  catch {
    return failure(
      "RUNTIME_AUTHORITY_FAILED",
      "FINORA server-first runtime authority payload is invalid.",
    );
  }

  const certificationPublicKey =
    toFinoraBranchCertificationPublicKey(
      portablePayload.branchCertificationKeyMaterial,
    );

  let existingRuntime;

  try {
    existingRuntime =
      await runtimeAuthorityStore.read(
        "USB",
      );
  }
  catch {
    return failure(
      "RUNTIME_AUTHORITY_CONFLICT",
      "Existing FINORA runtime authority state is invalid.",
    );
  }

  if (
    existingRuntime
  ) {
    const verified =
      verifyFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
        existingRuntime,
        certificationPublicKey,
      );

    const existingCanonical =
      verified
        ? canonicalizeFinoraPortableFreshDeviceRuntimeAuthorityPayloadV1(
            existingRuntime.payload,
          )
        : null;

    const expectedCanonical =
      canonicalizeFinoraPortableFreshDeviceRuntimeAuthorityPayloadV1(
        runtimePayload,
      );

    if (
      !verified ||
      existingCanonical !==
        expectedCanonical
    ) {
      return failure(
        "RUNTIME_AUTHORITY_CONFLICT",
        "Existing FINORA runtime authority does not match this server-first authority.",
      );
    }
  }
  else {
    const runtimePackage =
      createFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
        runtimePayload,
        portablePayload.branchCertificationKeyMaterial,
      );

    try {
      await runtimeAuthorityStore.ensureExact(
        "USB",
        runtimePackage,
      );
    }
    catch {
      return failure(
        "RUNTIME_AUTHORITY_CONFLICT",
        "FINORA runtime authority could not be persisted without overwriting existing state.",
      );
    }
  }

  const credentialChangeRequired =
    server.mustChangePassword ===
      true ||
    server.mustChangeSecurityCode ===
      true;

  let nativeBinding;

  try {
    nativeBinding =
      await ensureFinoraWindowsInstallationBinding();
  }
  catch {
    return failure(
      "HYDRATION_FAILED",
      "FINORA could not establish the local installation authority required for server-first hydration.",
    );
  }

  /*
   * SERVER-FIRST BUSINESS PROFILE
   *
   * Business identity and display names originate only from the
   * already PINNED + SIGNATURE-VERIFIED server bootstrap.
   *
   * The current server schema does not yet expose dedicated
   * businessCode / branchCode values, so the signed stable IDs are
   * used as deterministic codes. No legacy Control Center profile,
   * offline branch registry or previous local business data is used.
   *
   * Installation binding remains local device evidence and is
   * resolved only in Electron main.
   */
  const serverFirstBusinessCode =
    server.businessId;

  const serverFirstBranchCode =
    server.branchId;

  const serverFirstBusinessProfile = {
    profileId:
      `FINORA-SERVER-PROFILE-${server.branchId}`,

    ownerId:
      server.ownerId,

    businessId:
      server.businessId,

    branchId:
      server.branchId,

    businessCode:
      serverFirstBusinessCode,

    branchCode:
      serverFirstBranchCode,

    businessName:
      server.businessName,

    branchName:
      server.branchName,

    installationId:
      nativeBinding.installationId,

    bindingKeyId:
      nativeBinding.bindingKeyId,

    fingerprintAlgorithm:
      nativeBinding.fingerprintAlgorithm,

    publicKeyFingerprint:
      nativeBinding.publicKeyFingerprint,

    createdAt:
      server.issuedAt,

    updatedAt:
      server.issuedAt,

    schemaVersion:
      1 as const,
  };
  const plan:
    FinoraFreshDeviceBootstrapHydrationPlan = {
      authorityId:
        server.authorityId,

      sourceAuthorizationId:
        server.sourceAuthorizationId,

      sourceAuthorizationVerificationEvidence:
        structuredClone(
          portablePayload.sourceAuthorizationVerificationEvidence,
        ),

      credentialId:
        server.credentialId,

      activationId:
        server.activationId,

      activationActivatedAt:
        server.activationActivatedAt,

      activationCreatedAt:
        server.activationCreatedAt,

      activationUpdatedAt:
        server.activationUpdatedAt,

      branchAccessGrantId:
        server.branchAccessGrantId,

      storageEntitlementId:
        server.storageEntitlementId,

      storageEntitlementActivatedAt:
        server.storageEntitlementActivatedAt,

      storageEntitlementCreatedAt:
        server.storageEntitlementCreatedAt,

      storageEntitlementUpdatedAt:
        server.storageEntitlementUpdatedAt,

      ownerId:
        server.ownerId,

      businessId:
        server.businessId,

      branchId:
        server.branchId,

      businessCode:
        serverFirstBusinessCode,

      branchCode:
        serverFirstBranchCode,

      businessProfile:
        serverFirstBusinessProfile,

      userId:
        server.userId,

      username:
        server.username,

      canonicalUsername:
        server.canonicalUsername,

      fullName:
        server.fullName,

      role:
        server.role,

      storageMode:
        "USB",

      dataContext:
        "REAL",

      passwordVerifier:
        portablePayload.passwordVerifier,

      securityVerifier:
        portablePayload.securityVerifier,

      authGeneration:
        server.authGeneration,

      credentialChangeRequired,

      branchAccessType:
        "REGISTERED",

      registrationPayment:
        null,

      registrationCycle:
        null,

      demoRemarks:
        null,

      accessMode:
        "ACTIVE",

      accessValidFrom:
        server.accessValidFrom,

      accessValidUntil:
        server.accessValidUntil,

      branchAccessCreatedAt:
        server.branchAccessCreatedAt,

      branchAccessUpdatedAt:
        server.branchAccessUpdatedAt,

      portableAuthFingerprint,

      portableCredentialCreatedAt:
        portablePayload.createdAt,

      portableCredentialUpdatedAt:
        portablePayload.updatedAt,

      runtimeAuthorityIssuedAt:
        server.issuedAt,
    };

  const hydrationResult =
    await hydrateFinoraPortableFreshDeviceFromPlan(
      plan,
    );

  if (
    !hydrationResult.success
  ) {
    return failure(
      "HYDRATION_FAILED",
      hydrationResult.error,
    );
  }

  return {
    success:
      true,

    status:
      "ENROLLED_AND_HYDRATED",

    credentialId:
      server.credentialId,

    canonicalUsername:
      server.canonicalUsername,

    portableAuthFingerprint,

    credentialChangeRequired,
  };
}