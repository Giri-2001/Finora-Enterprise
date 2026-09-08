/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST RECOVERY AUTHORITY BOOTSTRAP SERVICE

   MODULE  : Native Control
   LAYER   : Electron Main Security Authority
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Establish the first independent recipient recovery authority
   - Require an independently supplied SHA-256 SPKI fingerprint
   - Verify the supplied recovery public key against that fingerprint
   - Verify canonical recovery signingKeyId
   - Bind the recovery authority to the exact native installation
   - Obtain provisionedAt from recipient authoritative wall-clock
   - Refuse bootstrap when recovery authority already exists
   - Persist only public recovery-authority material

   SECURITY:

   - Electron main process only.
   - No IPC.
   - No preload.
   - No renderer.
   - No environment-variable bootstrap.
   - No filesystem path input.
   - No package-provided trust authority.
   - No trust-on-first-use from a recovery package.
   - No private recovery signing key.
   - No operational Control Center private-key access.

   AUTHORITY:

   The expected fingerprint is intentionally independent from
   the supplied recovery public-key record.

   Transport/operator authorization for supplying this bootstrap
   request remains a separate privileged operational boundary.

   CONCURRENCY:

   Recovery-authority bootstrap shares the recipient-trust
   authority queue with trust bootstrap / transition / recovery
   operations whose correctness depends on coherent recipient
   trust authority.

   This is Electron main-process memory serialization only.
   No cross-process compare-and-swap guarantee is claimed.

   CLOCK:

   provisionedAt comes only from the recipient installation-bound
   clock high-water authority.

   The clock high-water write and recovery-authority store write
   are separate encrypted stores and are not claimed as one
   transactional filesystem commit.
=========================================================== */

import {
  timingSafeEqual,
} from "node:crypto";

import {
  createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint,
} from "../control-center/finoraControlCenterCrypto.js";

import {
  observeFinoraAuthoritativeWallClock,
} from "./finoraClockHighWaterAuthorityService.js";

import {
  assertFinoraP256SpkiPublicKey,
  createFinoraInstallationBindingFingerprint,
} from "./finoraInstallationBindingCrypto.js";

import {
  getFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  runFinoraRecipientTrustAuthoritySerialized,
} from "./finoraRecipientTrustAuthorityQueue.js";

import {
  loadFinoraRecipientTrustRecoveryAuthorityStore,
  persistNewFinoraRecipientTrustRecoveryAuthorityStore,
  validateFinoraRecipientTrustRecoveryAuthorityStoreState,
} from "./finoraRecipientTrustRecoveryAuthorityStore.js";

import type {
  FinoraRecipientTrustRecoveryAuthorityStoreState,
} from "./finoraRecipientTrustRecoveryAuthorityStore.js";

// ============================================================
// REQUEST
// ============================================================

export interface FinoraRecipientTrustRecoveryAuthorityBootstrapRequest {
  recoveryAuthorityId:
    string;

  signingKeyId:
    string;

  algorithm:
    "ECDSA_P256_SHA256";

  format:
    "SPKI_DER_BASE64";

  publicKey:
    string;

  /**
   * Independently supplied canonical lowercase SHA-256
   * fingerprint of the exact recovery SPKI DER public key.
   *
   * This value must come from an authority channel independent
   * from the supplied public key itself.
   */
  expectedPublicKeyFingerprint:
    string;
}

// ============================================================
// RESULT
// ============================================================

export type FinoraRecipientTrustRecoveryAuthorityBootstrapResult =
  | {
      success:
        true;

      data: {
        recoveryAuthorityId:
          string;

        signingKeyId:
          string;

        publicKeyFingerprint:
          string;

        installationId:
          string;

        provisionedAt:
          string;
      };
    }
  | {
      success:
        false;

      error:
        string;
    };

// ============================================================
// BASIC HELPERS
// ============================================================

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

function failure(
  error:
    string,
): FinoraRecipientTrustRecoveryAuthorityBootstrapResult {
  return {
    success:
      false,

    error,
  };
}

// ============================================================
// EXPECTED FINGERPRINT
// ============================================================

function isCanonicalSha256Fingerprint(
  value:
    unknown,
): value is string {
  return (
    typeof value ===
      "string" &&
    /^[0-9a-f]{64}$/.test(
      value,
    )
  );
}

// ============================================================
// FINGERPRINT COMPARISON
// ============================================================

function fingerprintsMatch(
  expected:
    string,
  actual:
    string,
): boolean {
  const expectedBytes =
    Buffer.from(
      expected,
      "hex",
    );

  const actualBytes =
    Buffer.from(
      actual,
      "hex",
    );

  if (
    expectedBytes.length !==
      32 ||
    actualBytes.length !==
      32
  ) {
    return false;
  }

  return timingSafeEqual(
    expectedBytes,
    actualBytes,
  );
}

// ============================================================
// BOOTSTRAP
// ============================================================

export async function bootstrapFinoraRecipientTrustRecoveryAuthority(
  request:
    FinoraRecipientTrustRecoveryAuthorityBootstrapRequest,
): Promise<
  FinoraRecipientTrustRecoveryAuthorityBootstrapResult
> {
  return runFinoraRecipientTrustAuthoritySerialized(
    async () => {
      try {
        // ----------------------------------------------------
        // REQUEST STRUCTURE
        // ----------------------------------------------------

        if (
          !isNonEmptyString(
            request.recoveryAuthorityId,
          ) ||
          !isNonEmptyString(
            request.signingKeyId,
          ) ||
          request.algorithm !==
            "ECDSA_P256_SHA256" ||
          request.format !==
            "SPKI_DER_BASE64" ||
          !isNonEmptyString(
            request.publicKey,
          )
        ) {
          return failure(
            "FINORA recipient trust recovery-authority bootstrap request is invalid.",
          );
        }

        // ----------------------------------------------------
        // INDEPENDENT FINGERPRINT CONTRACT
        // ----------------------------------------------------

        if (
          !isCanonicalSha256Fingerprint(
            request.expectedPublicKeyFingerprint,
          )
        ) {
          return failure(
            "FINORA recipient trust recovery-authority bootstrap requires a canonical lowercase SHA-256 public-key fingerprint.",
          );
        }

        // ----------------------------------------------------
        // RECOVERY ROOT PUBLIC-KEY CRYPTO VALIDATION
        // ----------------------------------------------------

        try {
          assertFinoraP256SpkiPublicKey(
            request.publicKey,
          );
        } catch (
          error
        ) {
          return failure(
            error instanceof Error
              ? `FINORA recipient trust recovery-authority public key is invalid: ${error.message}`
              : "FINORA recipient trust recovery-authority public key is invalid.",
          );
        }

        const actualPublicKeyFingerprint =
          createFinoraInstallationBindingFingerprint(
            request.publicKey,
          );

        if (
          !fingerprintsMatch(
            request.expectedPublicKeyFingerprint,
            actualPublicKeyFingerprint,
          )
        ) {
          return failure(
            "FINORA recipient trust recovery-authority bootstrap public-key fingerprint does not match the independently supplied fingerprint.",
          );
        }

        // ----------------------------------------------------
        // CANONICAL RECOVERY SIGNING KEY ID
        // ----------------------------------------------------

        const expectedSigningKeyId =
          createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint(
            actualPublicKeyFingerprint,
          );

        if (
          request.signingKeyId !==
            expectedSigningKeyId
        ) {
          return failure(
            "FINORA recipient trust recovery-authority bootstrap signingKeyId does not match the recovery public key.",
          );
        }

        // ----------------------------------------------------
        // EXISTING RECOVERY AUTHORITY = BOOTSTRAP FORBIDDEN
        //
        // Do this before authoritative wall-clock observation so
        // a refused repeated bootstrap does not advance clock
        // high-water merely because provisioning was retried.
        // ----------------------------------------------------

        const existingAuthority =
          await loadFinoraRecipientTrustRecoveryAuthorityStore();

        if (
          existingAuthority !==
            undefined
        ) {
          return failure(
            "FINORA recipient trust recovery authority is already provisioned and cannot be replaced through bootstrap.",
          );
        }

        // ----------------------------------------------------
        // AUTHORITATIVE NATIVE INSTALLATION BINDING
        // ----------------------------------------------------

        const nativeBinding =
          await getFinoraWindowsInstallationBinding();

        if (
          nativeBinding ===
            undefined
        ) {
          return failure(
            "FINORA native installation binding is required before provisioning recipient trust recovery authority.",
          );
        }

        const installationTarget = {
          installationId:
            nativeBinding.installationId,

          bindingKeyId:
            nativeBinding.bindingKeyId,

          fingerprintAlgorithm:
            nativeBinding.fingerprintAlgorithm,

          publicKeyFingerprint:
            nativeBinding.publicKeyFingerprint,
        } as const;

        // ----------------------------------------------------
        // AUTHORITATIVE RECIPIENT WALL CLOCK
        //
        // No caller timestamp and no direct new Date() here.
        // The clock authority captures production wall time after
        // resolving the native installation binding.
        // ----------------------------------------------------

        const clockResult =
          await observeFinoraAuthoritativeWallClock();

        if (
          !clockResult.success
        ) {
          return failure(
            clockResult.error,
          );
        }

        if (
          clockResult.data.installationId !==
            nativeBinding.installationId
        ) {
          return failure(
            "FINORA recipient trust recovery-authority bootstrap clock authority resolved a different installation identity.",
          );
        }

        const provisionedAt =
          clockResult.data.observedAt;

        // ----------------------------------------------------
        // COMPLETE PROPOSED STORE
        // ----------------------------------------------------

        const proposedStore:
          FinoraRecipientTrustRecoveryAuthorityStoreState = {
            schemaVersion:
              1,

            installation:
              installationTarget,

            authority: {
              type:
                "FINORA_RECOVERY_AUTHORITY",

              recoveryAuthorityId:
                request.recoveryAuthorityId,

              signingKeyId:
                request.signingKeyId,

              algorithm:
                request.algorithm,

              format:
                request.format,

              publicKey:
                request.publicKey,

              fingerprintAlgorithm:
                "SHA-256",

              publicKeyFingerprint:
                actualPublicKeyFingerprint,
            },

            provisionedAt,
          };

        validateFinoraRecipientTrustRecoveryAuthorityStoreState(
          proposedStore,
        );

        // ----------------------------------------------------
        // PERSIST FIRST-PROVISIONED RECOVERY AUTHORITY
        // ----------------------------------------------------

        await persistNewFinoraRecipientTrustRecoveryAuthorityStore(
          proposedStore,
        );

        // ----------------------------------------------------
        // READ-BACK CONFIRMATION
        // ----------------------------------------------------

        const persisted =
          await loadFinoraRecipientTrustRecoveryAuthorityStore();

        if (
          persisted ===
            undefined
        ) {
          return failure(
            "FINORA recipient trust recovery-authority bootstrap persistence could not be confirmed.",
          );
        }

        if (
          persisted.schemaVersion !==
            1 ||
          persisted.installation.installationId !==
            installationTarget.installationId ||
          persisted.installation.bindingKeyId !==
            installationTarget.bindingKeyId ||
          persisted.installation.fingerprintAlgorithm !==
            installationTarget.fingerprintAlgorithm ||
          persisted.installation.publicKeyFingerprint !==
            installationTarget.publicKeyFingerprint ||
          persisted.authority.type !==
            "FINORA_RECOVERY_AUTHORITY" ||
          persisted.authority.recoveryAuthorityId !==
            request.recoveryAuthorityId ||
          persisted.authority.signingKeyId !==
            request.signingKeyId ||
          persisted.authority.algorithm !==
            request.algorithm ||
          persisted.authority.format !==
            request.format ||
          persisted.authority.publicKey !==
            request.publicKey ||
          persisted.authority.fingerprintAlgorithm !==
            "SHA-256" ||
          persisted.authority.publicKeyFingerprint !==
            actualPublicKeyFingerprint ||
          persisted.provisionedAt !==
            provisionedAt
        ) {
          return failure(
            "FINORA recipient trust recovery-authority bootstrap persisted state does not match the authorized recovery authority.",
          );
        }

        return {
          success:
            true,

          data: {
            recoveryAuthorityId:
              persisted.authority.recoveryAuthorityId,

            signingKeyId:
              persisted.authority.signingKeyId,

            publicKeyFingerprint:
              persisted.authority.publicKeyFingerprint,

            installationId:
              persisted.installation.installationId,

            provisionedAt:
              persisted.provisionedAt,
          },
        };
      } catch (
        error
      ) {
        return failure(
          error instanceof Error
            ? error.message
            : "FINORA recipient trust recovery-authority bootstrap failed.",
        );
      }
    },
  );
}

// ============================================================
// END
// ============================================================