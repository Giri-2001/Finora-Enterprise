/* ============================================================
   FINORA ENTERPRISE OS
   BRANCH DEVICE TRUST AUTHORITY

   RESPONSIBILITY:

   - Evaluate exact current-device trust after Password auth
   - Require current Portable Auth envelope identity
   - Bind trust to exact native installation public identity
   - Authorize a previously unknown device only after successful
     Password + Security Code Portable Auth decryption
   - Persist idempotent branch-scoped device trust

   SECURITY:

   - MAIN PROCESS ONLY.
   - This service assumes the caller already authenticated the
     username/password through Branch Credential authority.
   - A trusted-device fast path NEVER decrypts Portable Auth.
   - Fast-path trust requires exact current Portable envelope
     SHA-256 + exact current native device binding + exact
     authenticated principal identity/context/storage.
   - Unknown device does not become trusted until full Portable
     Auth decryption succeeds with Password + Security Code.
   - Password and Security Code are never persisted here.
   - Native private key is never read or persisted here.
   - USB is only the selected Portable Auth carrier.
   - No LOCAL fallback is performed for USB.
   - Renderer and IPC are deliberately absent.

   VERSION : 1.0
   STATUS  : Foundation
============================================================ */

import {
  createHash,
} from "node:crypto";

import {
  canonicalizeFinoraCredentialUsername,
} from "./finoraControlStore.js";

import {
  getFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  verifyFinoraSignedBranchPortabilityAuthorityPackage,
} from "./finoraSignedControlPackageVerifier.js";

import {
  FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,
} from "./finoraBranchAccessPackage.types.js";

import {
  decryptFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthCrypto.js";

import {
  serializeFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  FINORA_BRANCH_DEVICE_TRUST_FORMAT,
  FINORA_BRANCH_DEVICE_TRUST_RECORD_SCHEMA_VERSION,
  FINORA_BRANCH_DEVICE_TRUST_SCHEMA_VERSION,
  loadFinoraBranchDeviceTrustStore,
  persistFinoraBranchDeviceTrustStore,
} from "./finoraBranchDeviceTrustStore.js";

import type {
  FinoraBranchCredentialAuthenticationSuccess,
} from "./finoraBranchCredentialAuthenticationService.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import type {
  FinoraBranchDeviceTrustRecordV1,
  FinoraBranchDeviceTrustStoreStateV1,
} from "./finoraBranchDeviceTrustStore.js";

// ============================================================
// PUBLIC CONTRACTS
// ============================================================

export interface FinoraBranchDeviceTrustCheckInput {
  principal:
    FinoraBranchCredentialAuthenticationSuccess;

  portableStore:
    FinoraPortableBranchAuthStore;
}

export interface FinoraBranchDeviceTrustAuthorizeInput
  extends FinoraBranchDeviceTrustCheckInput {
  password:
    string;

  securityCode:
    string;
}

export type FinoraBranchDeviceTrustCheckStatus =
  | "TRUSTED"
  | "SECURITY_CODE_REQUIRED";

export type FinoraBranchDeviceTrustCheckErrorCode =
  | "PORTABLE_AUTH_UNAVAILABLE"
  | "PORTABLE_AUTH_MISMATCH"
  | "NATIVE_BINDING_UNAVAILABLE"
  | "DEVICE_TRUST_STORE_FAILED";

export type FinoraBranchDeviceTrustCheckResult =
  | {
      success:
        true;

      status:
        FinoraBranchDeviceTrustCheckStatus;

      portableAuthFingerprint:
        string;
    }
  | {
      success:
        false;

      errorCode:
        FinoraBranchDeviceTrustCheckErrorCode;

      error:
        string;
    };

export type FinoraBranchDeviceTrustAuthorizeStatus =
  | "AUTHORIZED"
  | "ALREADY_TRUSTED";

export type FinoraBranchDeviceTrustAuthorizeErrorCode =
  | FinoraBranchDeviceTrustCheckErrorCode
  | "PORTABLE_AUTH_AUTHENTICATION_FAILED"
  | "PORTABLE_AUTH_PAYLOAD_MISMATCH"
  | "PORTABILITY_AUTH_VERIFICATION_FAILED"
  | "DEVICE_TRUST_PERSIST_FAILED";

export type FinoraBranchDeviceTrustAuthorizeResult =
  | {
      success:
        true;

      status:
        FinoraBranchDeviceTrustAuthorizeStatus;

      record:
        FinoraBranchDeviceTrustRecordV1;
    }
  | {
      success:
        false;

      errorCode:
        FinoraBranchDeviceTrustAuthorizeErrorCode;

      error:
        string;
    };

// ============================================================
// MUTATION SERIALIZATION
// ============================================================

let deviceTrustMutationQueue:
  Promise<void> =
    Promise.resolve();

// ============================================================
// HELPERS
// ============================================================

function checkFailure(
  errorCode:
    FinoraBranchDeviceTrustCheckErrorCode,

  error:
    string,
): FinoraBranchDeviceTrustCheckResult {
  return {
    success:
      false,

    errorCode,

    error,
  };
}

function authorizeFailure(
  errorCode:
    FinoraBranchDeviceTrustAuthorizeErrorCode,

  error:
    string,
): FinoraBranchDeviceTrustAuthorizeResult {
  return {
    success:
      false,

    errorCode,

    error,
  };
}

function contextsEqual(
  principal:
    FinoraBranchCredentialAuthenticationSuccess,

  dataContext:
    "REAL" | "DEMO",

  demoId:
    string | undefined,
): boolean {
  if (
    principal.dataContext !==
      dataContext
  ) {
    return false;
  }

  return dataContext ===
      "DEMO"
    ? (
        typeof principal.demoId ===
          "string" &&
        principal.demoId ===
          demoId
      )
    : (
        principal.demoId ===
          undefined &&
        demoId ===
          undefined
      );
}

function outerEnvelopeMatchesPrincipal(
  envelope:
    FinoraPortableBranchAuthEnvelopeV1,

  principal:
    FinoraBranchCredentialAuthenticationSuccess,
): boolean {
  const canonicalUsername =
    canonicalizeFinoraCredentialUsername(
      principal.username,
    );

  return (
    envelope.canonicalUsername ===
      canonicalUsername &&
    envelope.branchScope.ownerId ===
      principal.ownerId &&
    envelope.branchScope.businessId ===
      principal.businessId &&
    envelope.branchScope.branchId ===
      principal.branchId
  );
}

function payloadMatchesPrincipal(
  payload:
    Awaited<
      ReturnType<
        typeof decryptFinoraPortableBranchAuthEnvelopeV1
      >
    >,

  principal:
    FinoraBranchCredentialAuthenticationSuccess,
): boolean {
  const canonicalUsername =
    canonicalizeFinoraCredentialUsername(
      principal.username,
    );

  return (
    payload.userId ===
      principal.userId &&
    payload.username ===
      principal.username &&
    payload.canonicalUsername ===
      canonicalUsername &&
    payload.fullName ===
      principal.fullName &&
    payload.role ===
      principal.role &&
    payload.ownerId ===
      principal.ownerId &&
    payload.businessId ===
      principal.businessId &&
    payload.branchId ===
      principal.branchId &&
    payload.storageMode ===
      principal.storageMode &&
    contextsEqual(
      principal,
      payload.dataContext,
      payload.demoId,
    )
  );
}

function bindingMatchesRecord(
  record:
    FinoraBranchDeviceTrustRecordV1,

  nativeBinding:
    NonNullable<
      Awaited<
        ReturnType<
          typeof getFinoraWindowsInstallationBinding
        >
      >
    >,
): boolean {
  return (
    record.platform ===
      "WINDOWS" &&
    record.installationId ===
      nativeBinding.installationId &&
    record.bindingKeyId ===
      nativeBinding.bindingKeyId &&
    record.fingerprintAlgorithm ===
      nativeBinding.fingerprintAlgorithm &&
    record.publicKeyFingerprint ===
      nativeBinding.publicKeyFingerprint
  );
}

function principalMatchesRecord(
  record:
    FinoraBranchDeviceTrustRecordV1,

  principal:
    FinoraBranchCredentialAuthenticationSuccess,
): boolean {
  const canonicalUsername =
    canonicalizeFinoraCredentialUsername(
      principal.username,
    );

  return (
    record.userId ===
      principal.userId &&
    record.canonicalUsername ===
      canonicalUsername &&
    record.ownerId ===
      principal.ownerId &&
    record.businessId ===
      principal.businessId &&
    record.branchId ===
      principal.branchId &&
    record.storageMode ===
      principal.storageMode &&
    contextsEqual(
      principal,
      record.dataContext,
      record.demoId,
    )
  );
}

// ============================================================
// CANONICAL PORTABLE AUTH FINGERPRINT
// ============================================================

export function createFinoraPortableBranchAuthFingerprint(
  envelope:
    FinoraPortableBranchAuthEnvelopeV1,
): string {
  const canonical =
    serializeFinoraPortableBranchAuthEnvelopeV1(
      envelope,
    );

  return createHash(
    "sha256",
  )
    .update(
      canonical,
      "utf8",
    )
    .digest(
      "hex",
    );
}

// ============================================================
// CURRENT DEVICE TRUST CHECK
//
// Password authentication MUST occur before calling this.
//
// This path does not receive Security Code and does not decrypt
// Portable Auth.
// ============================================================

export async function checkFinoraCurrentBranchDeviceTrust(
  input:
    FinoraBranchDeviceTrustCheckInput,
): Promise<
  FinoraBranchDeviceTrustCheckResult
> {
  let envelope:
    FinoraPortableBranchAuthEnvelopeV1 | null;

  try {
    envelope =
      await input.portableStore.read(
        input.principal.storageMode,
      );
  }
  catch {
    return checkFailure(
      "PORTABLE_AUTH_UNAVAILABLE",
      "FINORA Portable Branch Auth state is unavailable.",
    );
  }

  if (!envelope) {
    return checkFailure(
      "PORTABLE_AUTH_UNAVAILABLE",
      "FINORA Portable Branch Auth state is unavailable.",
    );
  }

  if (
    !outerEnvelopeMatchesPrincipal(
      envelope,
      input.principal,
    )
  ) {
    return checkFailure(
      "PORTABLE_AUTH_MISMATCH",
      "FINORA Portable Branch Auth does not match the authenticated branch identity.",
    );
  }

  const portableAuthFingerprint =
    createFinoraPortableBranchAuthFingerprint(
      envelope,
    );

  let nativeBinding:
    Awaited<
      ReturnType<
        typeof getFinoraWindowsInstallationBinding
      >
    >;

  try {
    nativeBinding =
      await getFinoraWindowsInstallationBinding();
  }
  catch {
    return checkFailure(
      "NATIVE_BINDING_UNAVAILABLE",
      "FINORA native installation binding is unavailable.",
    );
  }

  if (!nativeBinding) {
    return checkFailure(
      "NATIVE_BINDING_UNAVAILABLE",
      "FINORA native installation binding is unavailable.",
    );
  }

  let store:
    FinoraBranchDeviceTrustStoreStateV1 | undefined;

  try {
    store =
      await loadFinoraBranchDeviceTrustStore();
  }
  catch {
    return checkFailure(
      "DEVICE_TRUST_STORE_FAILED",
      "FINORA Device Trust state could not be validated.",
    );
  }

  if (!store) {
    return {
      success:
        true,

      status:
        "SECURITY_CODE_REQUIRED",

      portableAuthFingerprint,
    };
  }

  // ----------------------------------------------------------
  // TRUSTED-DEVICE CONTINUITY
  //
  // Portable Auth fingerprint/authGeneration on a Device Trust
  // record are historical evidence of the authorization that
  // created that record. Credential rotation must not silently
  // revoke an already-trusted exact native device.
  //
  // Current trusted-device authority therefore matches the
  // authenticated branch principal + exact native binding.
  // Fresh/unknown-device authorization still decrypts Portable
  // Auth and requires the current credential generation.
  // ----------------------------------------------------------

  const matchingRecords =
    store.records.filter(
      (
        record,
      ) =>
        principalMatchesRecord(
          record,
          input.principal,
        ) &&
        bindingMatchesRecord(
          record,
          nativeBinding,
        ),
    );

  if (
    matchingRecords.length ===
      0
  ) {
    return {
      success:
        true,

      status:
        "SECURITY_CODE_REQUIRED",

      portableAuthFingerprint,
    };
  }

  if (
    matchingRecords.length !==
      1
  ) {
    return checkFailure(
      "DEVICE_TRUST_STORE_FAILED",
      "FINORA Device Trust state contains ambiguous current-device authority.",
    );
  }

  return {
    success:
      true,

    status:
      "TRUSTED",

    portableAuthFingerprint,
  };
}

// ============================================================
// UNKNOWN DEVICE AUTHORIZATION
//
// This is the only D4D2 mutation authority.
//
// Full Portable Auth decryption proves Password + Security Code
// and yields the encrypted authStateId/authGeneration evidence.
// ============================================================

async function authorizeCurrentDeviceInternal(
  input:
    FinoraBranchDeviceTrustAuthorizeInput,
): Promise<
  FinoraBranchDeviceTrustAuthorizeResult
> {
  let envelope:
    FinoraPortableBranchAuthEnvelopeV1 | null;

  try {
    envelope =
      await input.portableStore.read(
        input.principal.storageMode,
      );
  }
  catch {
    return authorizeFailure(
      "PORTABLE_AUTH_UNAVAILABLE",
      "FINORA Portable Branch Auth state is unavailable.",
    );
  }

  if (!envelope) {
    return authorizeFailure(
      "PORTABLE_AUTH_UNAVAILABLE",
      "FINORA Portable Branch Auth state is unavailable.",
    );
  }

  if (
    !outerEnvelopeMatchesPrincipal(
      envelope,
      input.principal,
    )
  ) {
    return authorizeFailure(
      "PORTABLE_AUTH_MISMATCH",
      "FINORA Portable Branch Auth does not match the authenticated branch identity.",
    );
  }

  const portableAuthFingerprint =
    createFinoraPortableBranchAuthFingerprint(
      envelope,
    );

  let nativeBinding:
    Awaited<
      ReturnType<
        typeof getFinoraWindowsInstallationBinding
      >
    >;

  try {
    nativeBinding =
      await getFinoraWindowsInstallationBinding();
  }
  catch {
    return authorizeFailure(
      "NATIVE_BINDING_UNAVAILABLE",
      "FINORA native installation binding is unavailable.",
    );
  }

  if (!nativeBinding) {
    return authorizeFailure(
      "NATIVE_BINDING_UNAVAILABLE",
      "FINORA native installation binding is unavailable.",
    );
  }

  let payload:
    Awaited<
      ReturnType<
        typeof decryptFinoraPortableBranchAuthEnvelopeV1
      >
    >;

  try {
    payload =
      await decryptFinoraPortableBranchAuthEnvelopeV1(
        envelope,
        input.password,
        input.securityCode,
        {
          expectedScope: {
            ownerId:
              input.principal.ownerId,

            businessId:
              input.principal.businessId,

            branchId:
              input.principal.branchId,
          },
        },
      );
  }
  catch {
    return authorizeFailure(
      "PORTABLE_AUTH_AUTHENTICATION_FAILED",
      "FINORA Portable Branch Auth authentication failed.",
    );
  }

  if (
    !payloadMatchesPrincipal(
      payload,
      input.principal,
    )
  ) {
    return authorizeFailure(
      "PORTABLE_AUTH_PAYLOAD_MISMATCH",
      "FINORA Portable Branch Auth payload does not match the authenticated credential.",
    );
  }

  // ----------------------------------------------------------
  // PORTABLE AUTH FRESHNESS
  //
  // Password authentication resolved the current authoritative
  // credential generation from the encrypted Control Store.
  //
  // A copied Portable Auth state from an older credential
  // generation must never authorize a fresh device.
  // ----------------------------------------------------------

  if (
    payload.authGeneration !==
      input.principal.authGeneration
  ) {
    return authorizeFailure(
      "PORTABLE_AUTH_PAYLOAD_MISMATCH",
      "FINORA Portable Branch Auth generation is stale for the authenticated credential.",
    );
  }

  // ----------------------------------------------------------
  // FRESH-DEVICE PORTABILITY AUTHORITY
  //
  // The signed package does NOT supply its own trust root.
  //
  // The only key eligible to verify this reusable portability
  // authority is the exact Control Center public signer that was
  // pinned inside encrypted Portable Auth during the original,
  // already-verified Credential Enrollment composition.
  //
  // Current system time is intentionally used here:
  //
  // - package expiry remains enforceable on the new device;
  // - package issue time is checked against current time;
  // - signer validity is evaluated by the generic verifier
  //   against the signed package issuedAt.
  //
  // No Device Trust mutation occurs before all checks below pass.
  // ----------------------------------------------------------

  const sourceVerificationEvidence =
    payload.sourceAuthorizationVerificationEvidence;

  const portabilityAuthorityProof =
    sourceVerificationEvidence.portabilityAuthorityProof;

  if (!portabilityAuthorityProof) {
    return authorizeFailure(
      "PORTABILITY_AUTH_VERIFICATION_FAILED",
      "FINORA Portable Branch Auth does not contain a verified Branch Portability Authority.",
    );
  }

  const portabilityPackage =
    portabilityAuthorityProof.signedPortabilityAuthorityPackage;

  const portabilityPayload =
    portabilityPackage.payload;

  const pinnedSigner =
    portabilityAuthorityProof.verifiedControlSigner;

  const portabilityVerification =
    verifyFinoraSignedBranchPortabilityAuthorityPackage(
      portabilityPackage,
      [
        pinnedSigner,
      ],
      {
        ownerId:
          input.principal.ownerId,

        businessId:
          input.principal.businessId,

        branchId:
          input.principal.branchId,
      },
      new Date(),
    );

  if (!portabilityVerification.valid) {
    return authorizeFailure(
      "PORTABILITY_AUTH_VERIFICATION_FAILED",
      `FINORA Branch Portability Authority verification failed: ${portabilityVerification.reason}.`,
    );
  }

  const verifiedSigner =
    portabilityVerification.verifiedTrustedKey;

  const exactPinnedSignerMatched =
    verifiedSigner.issuerId ===
      pinnedSigner.issuerId &&
    verifiedSigner.signingKeyId ===
      pinnedSigner.signingKeyId &&
    verifiedSigner.algorithm ===
      pinnedSigner.algorithm &&
    verifiedSigner.format ===
      pinnedSigner.format &&
    verifiedSigner.publicKey ===
      pinnedSigner.publicKey &&
    verifiedSigner.status ===
      pinnedSigner.status &&
    verifiedSigner.validFrom ===
      pinnedSigner.validFrom &&
    (
      verifiedSigner.validUntil ??
      undefined
    ) ===
      (
        pinnedSigner.validUntil ??
        undefined
      );

  const sourceSigner =
    sourceVerificationEvidence.verifiedControlSigner;

  const exactSourceSignerMatched =
    sourceSigner.issuerId ===
      pinnedSigner.issuerId &&
    sourceSigner.signingKeyId ===
      pinnedSigner.signingKeyId &&
    sourceSigner.algorithm ===
      pinnedSigner.algorithm &&
    sourceSigner.format ===
      pinnedSigner.format &&
    sourceSigner.publicKey ===
      pinnedSigner.publicKey &&
    sourceSigner.status ===
      pinnedSigner.status &&
    sourceSigner.validFrom ===
      pinnedSigner.validFrom &&
    (
      sourceSigner.validUntil ??
      undefined
    ) ===
      (
        pinnedSigner.validUntil ??
        undefined
      );

  const exactPortabilityLineageMatched =
    payload.sourceAuthorizationId ===
      sourceVerificationEvidence.authorizationId &&
    portabilityAuthorityProof.sourceAuthorizationId ===
      payload.sourceAuthorizationId &&
    portabilityPayload.sourceAuthorizationId ===
      payload.sourceAuthorizationId &&
    sourceVerificationEvidence.issuerId ===
      pinnedSigner.issuerId &&
    portabilityPackage.issuer.issuerId ===
      pinnedSigner.issuerId &&
    portabilityPackage.issuer.signingKeyId ===
      pinnedSigner.signingKeyId &&
    portabilityPayload.userId ===
      payload.userId &&
    portabilityPayload.username ===
      payload.username &&
    portabilityPayload.role ===
      payload.role &&
    portabilityPayload.ownerId ===
      payload.ownerId &&
    portabilityPayload.businessId ===
      payload.businessId &&
    portabilityPayload.branchId ===
      payload.branchId &&
    portabilityPayload.storageMode ===
      payload.storageMode &&
    portabilityPayload.dataContext ===
      payload.dataContext &&
    portabilityPayload.sourceAuthorizationMethod ===
      FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD &&
    (
      portabilityPayload.demoId ??
      undefined
    ) ===
      (
        payload.demoId ??
        undefined
      ) &&
    contextsEqual(
      input.principal,
      portabilityPayload.dataContext,
      portabilityPayload.demoId,
    );

  if (
    !exactPinnedSignerMatched ||
    !exactSourceSignerMatched ||
    !exactPortabilityLineageMatched
  ) {
    return authorizeFailure(
      "PORTABILITY_AUTH_VERIFICATION_FAILED",
      "FINORA Branch Portability Authority does not match the exact encrypted authorization lineage and pinned Control Center signer.",
    );
  }

  let existingStore:
    FinoraBranchDeviceTrustStoreStateV1 | undefined;

  try {
    existingStore =
      await loadFinoraBranchDeviceTrustStore();
  }
  catch {
    return authorizeFailure(
      "DEVICE_TRUST_STORE_FAILED",
      "FINORA Device Trust state could not be validated.",
    );
  }

  const canonicalUsername =
    canonicalizeFinoraCredentialUsername(
      input.principal.username,
    );

  const existingExact =
    existingStore?.records.find(
      (
        record,
      ) =>
        record.authStateId ===
          payload.authStateId &&
        record.authGeneration ===
          payload.authGeneration &&
        record.portableAuthFingerprintAlgorithm ===
          "SHA256" &&
        record.portableAuthFingerprint ===
          portableAuthFingerprint &&
        principalMatchesRecord(
          record,
          input.principal,
        ) &&
        bindingMatchesRecord(
          record,
          nativeBinding,
        ),
    );

  if (existingExact) {
    return {
      success:
        true,

      status:
        "ALREADY_TRUSTED",

      record:
        existingExact,
    };
  }

  const trustedAt =
    new Date().toISOString();

  const record:
    FinoraBranchDeviceTrustRecordV1 = {
      authStateId:
        payload.authStateId,

      userId:
        input.principal.userId,

      canonicalUsername,

      ownerId:
        input.principal.ownerId,

      businessId:
        input.principal.businessId,

      branchId:
        input.principal.branchId,

      storageMode:
        input.principal.storageMode,

      dataContext:
        input.principal.dataContext,

      ...(
        input.principal.dataContext ===
          "DEMO"
          ? {
              demoId:
                input.principal.demoId,
            }
          : {}
      ),

      authGeneration:
        payload.authGeneration,

      portableAuthFingerprintAlgorithm:
        "SHA256",

      portableAuthFingerprint,

      platform:
        "WINDOWS",

      installationId:
        nativeBinding.installationId,

      bindingKeyId:
        nativeBinding.bindingKeyId,

      fingerprintAlgorithm:
        nativeBinding.fingerprintAlgorithm,

      publicKeyFingerprint:
        nativeBinding.publicKeyFingerprint,

      trustedAt,

      updatedAt:
        trustedAt,

      schemaVersion:
        FINORA_BRANCH_DEVICE_TRUST_RECORD_SCHEMA_VERSION,
    };

  const nextStore:
    FinoraBranchDeviceTrustStoreStateV1 = {
      format:
        FINORA_BRANCH_DEVICE_TRUST_FORMAT,

      schemaVersion:
        FINORA_BRANCH_DEVICE_TRUST_SCHEMA_VERSION,

      records: [
        ...(
          existingStore?.records ??
          []
        ),
        record,
      ],

      updatedAt:
        trustedAt,
    };

  try {
    await persistFinoraBranchDeviceTrustStore(
      nextStore,
    );
  }
  catch {
    return authorizeFailure(
      "DEVICE_TRUST_PERSIST_FAILED",
      "FINORA could not persist the authorized device trust.",
    );
  }

  return {
    success:
      true,

    status:
      "AUTHORIZED",

    record,
  };
}

export function authorizeFinoraCurrentBranchDevice(
  input:
    FinoraBranchDeviceTrustAuthorizeInput,
): Promise<
  FinoraBranchDeviceTrustAuthorizeResult
> {
  const operation =
    deviceTrustMutationQueue.then(
      () =>
        authorizeCurrentDeviceInternal(
          input,
        ),
      () =>
        authorizeCurrentDeviceInternal(
          input,
        ),
    );

  deviceTrustMutationQueue =
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