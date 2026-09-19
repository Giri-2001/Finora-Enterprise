/* ============================================================
   FINORA ENTERPRISE OS™
   LEGACY SECURITY CODE BOOTSTRAP COORDINATOR

   One-time migration authority for an authenticated legacy
   Branch Credential that predates Security Code / Portable Auth.

   SECURITY:
   - Password authenticates first.
   - Existing credential must have no securityVerifier.
   - Current native binding must match ACTIVE signed storage authority.
   - Exact retained signed credential portability provenance required.
   - Existing Portable Auth is never overwritten.
   - Interrupted bootstrap resumes from the exact persisted envelope.
   - Device Trust is not mutated here.
============================================================ */

import { randomUUID } from "node:crypto";

import {
  authenticateFinoraBranchCredential,
  resolveFinoraBranchCredentialAuthGeneration,
} from "./finoraBranchCredentialAuthenticationService.js";

import {
  createFinoraPortableBranchAuthEnrollmentMaterialV1,
  decryptFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthCrypto.js";

import {
  getFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  applyFinoraLegacySecurityCodeBootstrapCredentialReplace,
  hasActiveFinoraStorageEntitlement,
  readFinoraControlStore,
} from "./finoraControlStore.js";

import type {
  FinoraControlBranchCredential,
  FinoraControlBranchCredentialVerifierV1,
} from "./finoraControlStore.js";

import type {
  FinoraPortableBranchAuthPayloadV1,
  FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1,
  FinoraPortableBranchAuthVerifierV1,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraPortableBranchAuthStore,
  FinoraPortableBranchAuthEnsureResult,
} from "./finoraPortableBranchAuthStore.js";

export interface FinoraLegacySecurityCodeBootstrapRequest {
  username: string;
  password: string;
  securityCode: string;
}

export type FinoraLegacySecurityCodeBootstrapErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_CREDENTIALS"
  | "CONTROL_STORE_FAILED"
  | "LEGACY_CREDENTIAL_NOT_FOUND"
  | "ALREADY_BOOTSTRAPPED"
  | "NATIVE_BINDING_UNAVAILABLE"
  | "STORAGE_ENTITLEMENT_DENIED"
  | "SIGNED_PROVENANCE_UNAVAILABLE"
  | "PORTABLE_AUTH_FAILED"
  | "PORTABLE_AUTH_MISMATCH"
  | "MATERIAL_DERIVATION_FAILED"
  | "CONTROL_COMMIT_FAILED";

export type FinoraLegacySecurityCodeBootstrapResult =
  | {
      success: true;
      data: {
        credentialId: string;
        authGeneration: number;
        portableResult: FinoraPortableBranchAuthEnsureResult;
      };
    }
  | {
      success: false;
      errorCode: FinoraLegacySecurityCodeBootstrapErrorCode;
      error: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeRequest(value: unknown): FinoraLegacySecurityCodeBootstrapRequest | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.username !== "string" ||
    value.username.trim().length === 0 ||
    typeof value.password !== "string" ||
    value.password.length === 0 ||
    typeof value.securityCode !== "string" ||
    value.securityCode.trim().length === 0 ||
    Array.from(value.securityCode).length < 8 ||
    Array.from(value.securityCode).length > 128
  ) {
    return null;
  }

  return {
    username: value.username,
    password: value.password,
    securityCode: value.securityCode,
  };
}

function failure(
  errorCode: FinoraLegacySecurityCodeBootstrapErrorCode,
  error: string,
): FinoraLegacySecurityCodeBootstrapResult {
  return { success: false, errorCode, error };
}

function toControlCredentialVerifier(
  verifier: FinoraPortableBranchAuthVerifierV1,
): FinoraControlBranchCredentialVerifierV1 {
  return {
    algorithm: "SCRYPT",
    saltEncoding: "BASE64",
    salt: verifier.salt,
    derivedKeyEncoding: "BASE64",
    derivedKey: verifier.verifier,
    keyLength: 32,
    N: verifier.N,
    r: verifier.r,
    p: verifier.p,
  };
}

function recoveredPayloadMatchesCredential(
  payload: FinoraPortableBranchAuthPayloadV1,
  credential: FinoraControlBranchCredential,
  targetGeneration: number,
): boolean {
  return (
    payload.sourceAuthorizationId === credential.sourceAuthorizationId &&
    payload.ownerId === credential.ownerId &&
    payload.businessId === credential.businessId &&
    payload.branchId === credential.branchId &&
    payload.userId === credential.userId &&
    payload.canonicalUsername === credential.canonicalUsername &&
    payload.fullName === credential.fullName &&
    payload.role === credential.role &&
    payload.storageMode === credential.storageMode &&
    payload.dataContext === credential.dataContext &&
    payload.demoId === credential.demoId &&
    payload.authGeneration === targetGeneration &&
    payload.createdAt === credential.createdAt
  );
}

export async function bootstrapFinoraLegacySecurityCode(
  input: unknown,
  portableStore: FinoraPortableBranchAuthStore,
): Promise<FinoraLegacySecurityCodeBootstrapResult> {
  const request = sanitizeRequest(input);

  if (!request) {
    return failure("INVALID_REQUEST", "A valid legacy Security Code bootstrap request is required.");
  }

  const authenticationResult = await authenticateFinoraBranchCredential({
    username: request.username,
    password: request.password,
  });

  if (!authenticationResult.success) {
    return failure(
      authenticationResult.errorCode === "INVALID_CREDENTIALS" || authenticationResult.errorCode === "INVALID_REQUEST"
        ? "INVALID_CREDENTIALS"
        : "CONTROL_STORE_FAILED",
      authenticationResult.errorCode === "INVALID_CREDENTIALS" || authenticationResult.errorCode === "INVALID_REQUEST"
        ? "Invalid username or password."
        : authenticationResult.error,
    );
  }

  const principal = authenticationResult.data;
  const storeResult = await readFinoraControlStore();

  if (!storeResult.success || !storeResult.data) {
    return failure("CONTROL_STORE_FAILED", storeResult.error ?? "Unable to load the FINORA Control Store.");
  }

  const controlStore = storeResult.data;
  const currentCredential = controlStore.branchCredentials?.find(
    (item) =>
      item.credentialId === principal.credentialId &&
      item.userId === principal.userId &&
      item.ownerId === principal.ownerId &&
      item.businessId === principal.businessId &&
      item.branchId === principal.branchId &&
      item.storageMode === principal.storageMode,
  );

  if (!currentCredential || currentCredential.status !== "ACTIVE") {
    return failure("LEGACY_CREDENTIAL_NOT_FOUND", "The authenticated legacy FINORA credential is unavailable.");
  }

  if (currentCredential.securityVerifier !== undefined) {
    return failure("ALREADY_BOOTSTRAPPED", "Security Code has already been established for this credential.");
  }

  const currentGeneration = resolveFinoraBranchCredentialAuthGeneration(currentCredential.authGeneration);
  const targetGeneration = currentGeneration + 1;

  if (!Number.isSafeInteger(targetGeneration)) {
    return failure("CONTROL_STORE_FAILED", "Legacy credential generation cannot be advanced safely.");
  }

  let nativeBinding;

  try {
    nativeBinding = await getFinoraWindowsInstallationBinding();
  } catch {
    return failure("NATIVE_BINDING_UNAVAILABLE", "FINORA native device binding could not be verified.");
  }

  if (!nativeBinding) {
    return failure("NATIVE_BINDING_UNAVAILABLE", "FINORA native device binding is unavailable.");
  }

  const entitlementResult = await hasActiveFinoraStorageEntitlement(
    principal.userId,
    principal.ownerId,
    principal.businessId,
    principal.branchId,
    principal.storageMode,
    nativeBinding,
  );

  if (!entitlementResult.success) {
    return failure("CONTROL_STORE_FAILED", entitlementResult.error ?? "Unable to verify FINORA storage authority.");
  }

  if (!entitlementResult.data) {
    return failure("STORAGE_ENTITLEMENT_DENIED", "Legacy bootstrap requires the exact ACTIVE native-bound storage entitlement.");
  }

  const verificationEvidence =
    (controlStore.branchCredentialAuthorizationVerificationEvidence ?? []).filter(
      (item) => item.authorizationId === currentCredential.sourceAuthorizationId,
    );

  const portabilityAuthorities =
    (controlStore.branchCredentialPortabilityAuthorities ?? []).filter(
      (item) => item.sourceAuthorizationId === currentCredential.sourceAuthorizationId,
    );

  let portableVerificationEvidence:
    FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1;

  if (
    verificationEvidence.length ===
      1 &&
    portabilityAuthorities.length ===
      1
  ) {
    const retainedEvidence =
      verificationEvidence[0];

    const retainedSigner =
      retainedEvidence.verifiedControlSigner;

    if (
      retainedSigner.status ===
        "REVOKED"
    ) {
      return failure(
        "SIGNED_PROVENANCE_UNAVAILABLE",
        "Legacy bootstrap cannot use revoked Control signer provenance.",
      );
    }

    portableVerificationEvidence = {
      authorizationId:
        retainedEvidence.authorizationId,

      packageId:
        retainedEvidence.packageId,

      issuerId:
        retainedEvidence.issuerId,

      sequence:
        retainedEvidence.sequence,

      verifiedControlSigner: {
        issuerId:
          retainedSigner.issuerId,

        signingKeyId:
          retainedSigner.signingKeyId,

        algorithm:
          retainedSigner.algorithm,

        format:
          retainedSigner.format,

        publicKey:
          retainedSigner.publicKey,

        status:
          retainedSigner.status,

        validFrom:
          retainedSigner.validFrom,

        ...(
          retainedSigner.validUntil ===
            undefined
            ? {}
            : {
                validUntil:
                  retainedSigner.validUntil,
              }
        ),
      },

      portabilityAuthorityProof:
        structuredClone(
          portabilityAuthorities[0],
        ),

      verifiedAt:
        retainedEvidence.verifiedAt,

      schemaVersion:
        1,
    };
  }
  else if (
    verificationEvidence.length ===
      0 &&
    portabilityAuthorities.length ===
      0
  ) {
    const migratedAt =
      new Date().toISOString();

    portableVerificationEvidence = {
      authorizationId:
        currentCredential.sourceAuthorizationId,

      legacyNativeBoundMigrationEvidence: {
        schemaVersion:
          1,

        migrationMethod:
          "PASSWORD_AND_ACTIVE_NATIVE_STORAGE_ENTITLEMENT",

        sourceAuthorizationId:
          currentCredential.sourceAuthorizationId,

        ownerId:
          currentCredential.ownerId,

        businessId:
          currentCredential.businessId,

        branchId:
          currentCredential.branchId,

        userId:
          currentCredential.userId,

        username:
          currentCredential.username,

        storageMode:
          currentCredential.storageMode,

        authGeneration:
          targetGeneration,

        installationId:
          nativeBinding.installationId,

        bindingKeyId:
          nativeBinding.bindingKeyId,

        fingerprintAlgorithm:
          nativeBinding.fingerprintAlgorithm,

        publicKeyFingerprint:
          nativeBinding.publicKeyFingerprint,

        migratedAt,
      },

      schemaVersion:
        1,
    };
  }
  else {
    return failure(
      "SIGNED_PROVENANCE_UNAVAILABLE",
      "Legacy bootstrap found incomplete or conflicting retained credential portability provenance.",
    );
  }
  let existingEnvelope;

  try {
    existingEnvelope = await portableStore.read(currentCredential.storageMode);
  } catch (error) {
    return failure(
      "PORTABLE_AUTH_FAILED",
      error instanceof Error ? error.message : "Unable to inspect Portable Branch Auth state.",
    );
  }

  let replacementCredential: FinoraControlBranchCredential;
  let portableResult: FinoraPortableBranchAuthEnsureResult;

  let commitVerificationEvidence:
    FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1;

  if (existingEnvelope === null) {
    const preparedAt = new Date().toISOString();
    let material;

    try {
      material = await createFinoraPortableBranchAuthEnrollmentMaterialV1({
        authStateId: `FINORA-LEGACY-AUTH-${randomUUID()}`,
        sourceAuthorizationId: currentCredential.sourceAuthorizationId,
        sourceAuthorizationVerificationEvidence: structuredClone(portableVerificationEvidence),
        ownerId: currentCredential.ownerId,
        businessId: currentCredential.businessId,
        branchId: currentCredential.branchId,
        userId: currentCredential.userId,
        username: currentCredential.username,
        fullName: currentCredential.fullName,
        role: currentCredential.role,
        dataContext: currentCredential.dataContext,
        ...(currentCredential.demoId === undefined ? {} : { demoId: currentCredential.demoId }),
        storageMode: currentCredential.storageMode,
        authGeneration: targetGeneration,
        createdAt: currentCredential.createdAt,
        updatedAt: preparedAt,
        password: request.password,
        securityCode: request.securityCode,
      });
    } catch (error) {
      return failure(
        "MATERIAL_DERIVATION_FAILED",
        error instanceof Error ? error.message : "Unable to derive legacy Portable Branch Auth material.",
      );
    }

    try {
      portableResult = await portableStore.ensureExact(
        currentCredential.storageMode,
        material.envelope,
      );
    } catch (error) {
      return failure(
        "PORTABLE_AUTH_FAILED",
        error instanceof Error ? error.message : "Unable to persist legacy Portable Branch Auth state.",
      );
    }

    replacementCredential = {
      ...structuredClone(currentCredential),
      authGeneration: targetGeneration,
      verifier: toControlCredentialVerifier(material.passwordVerifier),
      securityVerifier: toControlCredentialVerifier(material.securityVerifier),
      updatedAt: preparedAt,
    };

    commitVerificationEvidence =
      structuredClone(
        portableVerificationEvidence,
      );
  } else {
    let recoveredPayload;

    try {
      recoveredPayload = await decryptFinoraPortableBranchAuthEnvelopeV1(
        existingEnvelope,
        request.password,
        request.securityCode,
        {
          expectedScope: {
            ownerId: currentCredential.ownerId,
            businessId: currentCredential.businessId,
            branchId: currentCredential.branchId,
          },
        },
      );
    } catch {
      return failure(
        "PORTABLE_AUTH_MISMATCH",
        "Existing Portable Branch Auth does not match this interrupted legacy bootstrap.",
      );
    }

    if (!recoveredPayloadMatchesCredential(recoveredPayload, currentCredential, targetGeneration)) {
      return failure(
        "PORTABLE_AUTH_MISMATCH",
        "Existing Portable Branch Auth lineage does not match the authenticated legacy credential.",
      );
    }

    portableResult = "ALREADY_MATCHED";

    replacementCredential = {
      ...structuredClone(currentCredential),
      authGeneration: targetGeneration,
      verifier: toControlCredentialVerifier(recoveredPayload.passwordVerifier),
      securityVerifier: toControlCredentialVerifier(recoveredPayload.securityVerifier),
      updatedAt: recoveredPayload.updatedAt,
    };

    commitVerificationEvidence =
      structuredClone(
        recoveredPayload
          .sourceAuthorizationVerificationEvidence,
      );
  }

  const commitAuthority =
    "legacyNativeBoundMigrationEvidence" in
      commitVerificationEvidence
      ? {
          mode:
            "LEGACY_NATIVE_BOUND_MIGRATION" as const,

          migrationEvidence:
            structuredClone(
              commitVerificationEvidence
                .legacyNativeBoundMigrationEvidence,
            ),
        }
      : {
          mode:
            "SIGNED_PORTABILITY_PROVENANCE" as const,
        };

  const commitResult = await applyFinoraLegacySecurityCodeBootstrapCredentialReplace({
    expectedCredential: structuredClone(currentCredential),
    replacementCredential,
    appliedAt: replacementCredential.updatedAt,
    authority: commitAuthority,
  });

  if (!commitResult.success) {
    return failure(
      "CONTROL_COMMIT_FAILED",
      commitResult.error ?? "Unable to commit FINORA legacy Security Code bootstrap state.",
    );
  }

  return {
    success: true,
    data: {
      credentialId: replacementCredential.credentialId,
      authGeneration: targetGeneration,
      portableResult,
    },
  };
}

// ============================================================
// END
// ============================================================
