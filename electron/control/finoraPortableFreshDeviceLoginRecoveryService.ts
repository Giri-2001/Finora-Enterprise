/* ============================================================
   FINORA ENTERPRISE OS

   PORTABLE FRESH-DEVICE LOGIN RECOVERY SERVICE

   RESPONSIBILITY:

   - Adapt production Portable Branch Auth crypto/storage into the
     password-first Fresh Device Bootstrap Coordinator.
   - Verify Branch-Certification-signed Runtime Authority.
   - Hydrate current native-bound Control Store atomically.
   - Return only the narrow Login Authority recovery contract.

   SECURITY:

   - MAIN PROCESS ONLY.
   - Wrong Password remains INVALID_CREDENTIALS.
   - Security Code is requested only after Password proof.
   - Branch Certification private key material never leaves the
     decrypted Portable Auth adapter boundary.
   - Runtime Authority must verify against the public half of the
     exact Branch Certification authority carried by Portable Auth.
   - Hydration never authorizes Device Trust by itself.
   ============================================================ */

import {
  assertFinoraBranchCertificationKeyMaterial,
  assertFinoraBranchCertificationPublicKey,
} from "./finoraBranchCertificationCrypto.js";

import {
  FinoraPortableBranchAuthCryptoError,
  canonicalizeFinoraPortableBranchUsername,
  decryptFinoraPortableBranchAuthEnvelopeV1,
  verifyFinoraPortableBranchAuthPassword,
} from "./finoraPortableBranchAuthCrypto.js";

import {
  FinoraPortableBranchAuthV2CryptoError,
  decryptFinoraPortableBranchAuthEnvelopeV2WithPassword,
  decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode,
} from "./finoraPortableBranchAuthV2Crypto.js";

import {
  createFinoraPortableBranchAuthFingerprint,
} from "./finoraBranchDeviceTrustAuthority.js";

import {
  prepareFinoraFreshDeviceBootstrap,
} from "./finoraPortableFreshDeviceBootstrapCoordinator.js";

import type {
  FinoraFreshDevicePortablePayloadView,
} from "./finoraPortableFreshDeviceBootstrapCoordinator.js";

import {
  hydrateFinoraPortableFreshDeviceFromPlan,
} from "./finoraPortableFreshDeviceHydrationService.js";

import {
  verifyFinoraPortableFreshDeviceRuntimeAuthorityPackageV1,
} from "./finoraPortableFreshDeviceRuntimeAuthorityCrypto.js";

import type {
  FinoraPortableFreshDeviceRuntimeAuthorityStore,
} from "./finoraPortableFreshDeviceRuntimeAuthorityStore.js";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import type {
  FinoraPortableBranchAuthV2Store,
} from "./finoraPortableBranchAuthV2Store.js";

import type {
  FinoraBranchFreshDeviceRecovery,
  FinoraBranchFreshDeviceRecoveryResult,
} from "./finoraBranchLoginSessionAuthority.js";

// ============================================================
// NARROW TYPE ADAPTERS
//
// The called production crypto functions perform authoritative
// runtime validation of these values before cryptographic use.
// ============================================================

type PortableEnvelope =
  Parameters<
    typeof verifyFinoraPortableBranchAuthPassword
  >[0];

type BranchCertificationPublicKey =
  Parameters<
    typeof assertFinoraBranchCertificationPublicKey
  >[0];

function toPortableEnvelope(
  value:
    unknown,
): PortableEnvelope {
  return value as
    PortableEnvelope;
}

// ============================================================
// PORTABLE PAYLOAD -> FRESH-DEVICE VIEW
//
// Portable Auth retains complete Branch Certification key
// material because the branch must sign future Runtime Authority.
//
// Fresh-device Bootstrap needs only the public verification half.
// The private key is deliberately not returned from this adapter.
// ============================================================

function toFreshDevicePortablePayload(
  payload:
    Awaited<
      ReturnType<
        typeof decryptFinoraPortableBranchAuthEnvelopeV1
      >
    >,
): FinoraFreshDevicePortablePayloadView {
  const certification =
    payload.branchCertificationKeyMaterial;

  if (
    certification ===
      undefined
  ) {
    throw new Error(
      "FINORA Portable Branch Auth does not contain Branch Certification authority.",
    );
  }

  assertFinoraBranchCertificationKeyMaterial(
    certification,
  );

  const branchCertificationPublicAuthority:
    BranchCertificationPublicKey = {
      keyId:
        certification.keyId,

      algorithm:
        certification.algorithm,

      publicKeyFormat:
        certification.publicKeyFormat,

      publicKey:
        certification.publicKey,

      fingerprintAlgorithm:
        certification.fingerprintAlgorithm,

      publicKeyFingerprint:
        certification.publicKeyFingerprint,

      createdAt:
        certification.createdAt,

      schemaVersion:
        certification.schemaVersion,
    };

  assertFinoraBranchCertificationPublicKey(
    branchCertificationPublicAuthority,
  );

  return {
    sourceAuthorizationId:
      payload.sourceAuthorizationId,

    sourceAuthorizationVerificationEvidence:
      payload.sourceAuthorizationVerificationEvidence,

    branchCertificationPublicAuthority,

    ownerId:
      payload.ownerId,

    businessId:
      payload.businessId,

    branchId:
      payload.branchId,

    userId:
      payload.userId,

    username:
      payload.username,

    canonicalUsername:
      payload.canonicalUsername,

    fullName:
      payload.fullName,

    role:
      payload.role,

    dataContext:
      payload.dataContext,

    ...(
      payload.demoId ===
        undefined
        ? {}
        : {
            demoId:
              payload.demoId,
          }
    ),

    storageMode:
      payload.storageMode,

    passwordVerifier:
      payload.passwordVerifier,

    securityVerifier:
      payload.securityVerifier,

    authGeneration:
      payload.authGeneration,

    createdAt:
      payload.createdAt,

    updatedAt:
      payload.updatedAt,
  };
}

// ============================================================
// BOOTSTRAP FAILURE -> LOGIN FAILURE
// ============================================================

function loginFailure(
  errorCode:
    Exclude<
      FinoraBranchFreshDeviceRecoveryResult,
      {
        success:
          true;
      }
    >["errorCode"],

  error:
    string,
): FinoraBranchFreshDeviceRecoveryResult {
  return {
    success:
      false,

    errorCode,

    error,
  };
}

// ============================================================
// PRODUCTION FACTORY
// ============================================================

export function createFinoraPortableFreshDeviceLoginRecovery(
  runtimeAuthorityStore:
    FinoraPortableFreshDeviceRuntimeAuthorityStore,
  portableV2Store?:
    FinoraPortableBranchAuthV2Store,
): FinoraBranchFreshDeviceRecovery {
  return async (
    request,
    portableStore:
      FinoraPortableBranchAuthStore,
  ): Promise<
    FinoraBranchFreshDeviceRecoveryResult
  > => {
    let activePortableAuthVersion: "V1" | "V2" = "V1";

    const bootstrapResult =
      await prepareFinoraFreshDeviceBootstrap(
        request,
        {
          canonicalizeUsername:
            canonicalizeFinoraPortableBranchUsername,

          readPortableAuth:
            async (
              storageMode,
            ) => {
              if (portableV2Store) {
                try {
                  const v2Envelope =
                    await portableV2Store.read(
                      storageMode,
                    );

                  if (v2Envelope) {
                    activePortableAuthVersion = "V2";
                    return v2Envelope;
                  }
                }
                catch {
                  // Legacy V1 auth may occupy the same physical path.
                }
              }

              activePortableAuthVersion = "V1";
              return portableStore.read(
                storageMode,
              );
            },

          verifyPortablePassword:
            async (
              envelope,
              password,
            ) => {
              if (activePortableAuthVersion === "V2") {
                try {
                  await decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
                    envelope as Parameters<
                      typeof decryptFinoraPortableBranchAuthEnvelopeV2WithPassword
                    >[0],
                    password,
                  );

                  return true;
                }
                catch {
                  return false;
                }
              }

              return verifyFinoraPortableBranchAuthPassword(
                toPortableEnvelope(
                  envelope,
                ),
                password,
              );
            },

          decryptPortableAuth:
            async (
              envelope,
              password,
              securityCode,
            ) => {
              if (activePortableAuthVersion === "V2") {
                try {
                  const v2Envelope =
                    envelope as Parameters<
                      typeof decryptFinoraPortableBranchAuthEnvelopeV2WithPassword
                    >[0];

                  const passwordPayload =
                    await decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
                      v2Envelope,
                      password,
                    );

                  const recoveryPayload =
                    await decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode(
                      v2Envelope,
                      securityCode,
                    );

                  if (
                    JSON.stringify(passwordPayload) !==
                    JSON.stringify(recoveryPayload)
                  ) {
                    return {
                      success: false,
                      errorCode: "PORTABILITY_AUTH_VERIFICATION_FAILED",
                    };
                  }

                  return {
                    success: true,
                    payload: toFreshDevicePortablePayload(
                      passwordPayload,
                    ),
                  };
                }
                catch (error) {
                  if (
                    error instanceof FinoraPortableBranchAuthV2CryptoError &&
                    (
                      error.code === "INVALID_CREDENTIALS" ||
                      error.code === "AUTHENTICATION_FAILED"
                    )
                  ) {
                    return {
                      success: false,
                      errorCode: "SECURITY_CODE_INVALID",
                    };
                  }

                  return {
                    success: false,
                    errorCode: "PORTABILITY_AUTH_VERIFICATION_FAILED",
                  };
                }
              }

              try {
                const payload =
                  await decryptFinoraPortableBranchAuthEnvelopeV1(
                    toPortableEnvelope(
                      envelope,
                    ),
                    password,
                    securityCode,
                  );

                return {
                  success:
                    true,

                  payload:
                    toFreshDevicePortablePayload(
                      payload,
                    ),
                };
              }
              catch (
                error
              ) {
                if (
                  error instanceof
                    FinoraPortableBranchAuthCryptoError &&
                  error.code ===
                    "AUTHENTICATION_FAILED"
                ) {
                  return {
                    success:
                      false,

                    errorCode:
                      "SECURITY_CODE_INVALID",
                  };
                }

                return {
                  success:
                    false,

                  errorCode:
                    "PORTABILITY_AUTH_VERIFICATION_FAILED",
                };
              }
            },

          createPortableAuthFingerprint:
            (
              envelope,
            ) =>
              createFinoraPortableBranchAuthFingerprint(
                toPortableEnvelope(
                  envelope,
                ),
              ),

          readRuntimeAuthority:
            (
              storageMode,
            ) =>
              runtimeAuthorityStore.read(
                storageMode,
              ),

          verifyAndReadRuntimeAuthority:
            (
              packageValue,
              branchCertificationPublicAuthority,
            ) => {
              try {
                const certificationPublicKey =
                  branchCertificationPublicAuthority as
                    BranchCertificationPublicKey;

                assertFinoraBranchCertificationPublicKey(
                  certificationPublicKey,
                );

                if (
                  !verifyFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
                    packageValue,
                    certificationPublicKey,
                  )
                ) {
                  return null;
                }

                const runtimePayload =
                  structuredClone(
                    packageValue.payload,
                  );

                const accessValidUntil =
                  runtimePayload.accessValidUntil;

                if (
                  accessValidUntil ===
                    null
                ) {
                  return null;
                }

                const {
                  demoId,
                  ...runtimeWithoutDemoId
                } =
                  runtimePayload;

                return {
                  ...runtimeWithoutDemoId,

                  // Explicitly override the nullable signed-payload
                  // property with the already-narrowed verified value.
                  accessValidUntil,

                  ...(
                    demoId ===
                      null
                      ? {}
                      : {
                          demoId,
                        }
                  ),
                };
              }
              catch {
                return null;
              }
            },

          now:
            () =>
              new Date(),
        },
      );

    if (
      !bootstrapResult.success
    ) {
      switch (
        bootstrapResult.errorCode
      ) {
        case "INVALID_REQUEST":
        case "INVALID_CREDENTIALS":
          return loginFailure(
            "INVALID_CREDENTIALS",
            "Invalid username or password.",
          );

        case "SECURITY_CODE_REQUIRED":
          return loginFailure(
            "SECURITY_CODE_REQUIRED",
            "Security Code is required to authorize this device.",
          );

        case "SECURITY_CODE_INVALID":
          return loginFailure(
            "SECURITY_CODE_INVALID",
            "Invalid Security Code.",
          );

        case "BRANCH_ACCESS_DENIED":
          return loginFailure(
            "BRANCH_ACCESS_DENIED",
            bootstrapResult.error,
          );

        case "STORAGE_UNAVAILABLE":
          return loginFailure(
            "CONTROL_STATE_FAILED",
            bootstrapResult.error,
          );

        case "RUNTIME_AUTHORITY_MISSING":
          return loginFailure(
            "RUNTIME_AUTHORITY_MISSING",
            bootstrapResult.error,
          );

        case "PORTABILITY_AUTH_VERIFICATION_FAILED":
        case "RUNTIME_AUTHORITY_INVALID":
        case "RUNTIME_AUTHORITY_MISMATCH":
          return loginFailure(
            "CONTROL_STATE_FAILED",
            bootstrapResult.error,
          );
      }
    }

    const hydrationResult =
      await hydrateFinoraPortableFreshDeviceFromPlan(
        bootstrapResult.plan,
      );

    if (
      !hydrationResult.success
    ) {
      return loginFailure(
        "CONTROL_STATE_FAILED",
        hydrationResult.error,
      );
    }

    /*
     * Device Trust is intentionally NOT authorized here.
     *
     * P3A re-authenticates the newly hydrated local credential,
     * then continues through the existing Login Authority
     * Device Trust check / Security Code authorization path.
     */
    return {
      success:
        true,
    };
  };
}
