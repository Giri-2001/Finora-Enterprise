/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT CONTROL TRUST BOOTSTRAP SERVICE

   MODULE  : Native Control
   LAYER   : Electron Main
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Establish the first recipient-authoritative Control Center
     public signing key
   - Require an independently supplied SHA-256 SPKI fingerprint
   - Verify the supplied public key against that fingerprint
   - Verify the canonical Control Center signingKeyId
   - Refuse bootstrap when recipient trust already exists
   - Persist only one validated initial ACTIVE trust key

   SECURITY:

   - Electron main process only.
   - No IPC.
   - No preload.
   - No renderer.
   - No environment-variable bootstrap.
   - No filesystem path input.
   - No .finora trust-on-first-use.
   - No package-provided trust authority.
   - No private-key material.

   AUTHORITY:

   The expected fingerprint is intentionally independent from
   the supplied trust record.

   Transport/operator authorization for supplying that
   fingerprint remains a separate Phase 14 boundary.

   CONCURRENCY:

   Bootstrap operations are serialized within this Electron
   main process.

   No cross-process compare-and-swap guarantee is claimed.
=========================================================== */

import {
  timingSafeEqual,
} from "node:crypto";

import {
  createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint,
} from "../control-center/finoraControlCenterCrypto.js";

import {
  createFinoraInstallationBindingFingerprint,
} from "./finoraInstallationBindingCrypto.js";

import {
  runFinoraRecipientTrustAuthoritySerialized,
} from "./finoraRecipientTrustAuthorityQueue.js";

import {
  loadFinoraRecipientTrustStore,
  persistFinoraRecipientTrustStore,
  validateFinoraRecipientTrustStoreState,
} from "./finoraRecipientTrustStore.js";

import type {
  FinoraRecipientTrustStoreState,
} from "./finoraRecipientTrustStore.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

// ============================================================
// REQUEST
// ============================================================

export interface FinoraRecipientTrustBootstrapRequest {
  trustedKey:
    FinoraBranchTrustedControlPublicKey;

  /**
   * Independently supplied canonical lowercase SHA-256
   * fingerprint of the exact SPKI DER public key.
   */
  expectedPublicKeyFingerprint:
    string;
}

// ============================================================
// RESULT
// ============================================================

export type FinoraRecipientTrustBootstrapResult =
  | {
      success:
        true;

      data: {
        issuerId:
          string;

        signingKeyId:
          string;

        publicKeyFingerprint:
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
// FAILURE
// ============================================================

function failure(
  error:
    string,
): FinoraRecipientTrustBootstrapResult {
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

export async function bootstrapFinoraRecipientTrust(
  request:
    FinoraRecipientTrustBootstrapRequest,
): Promise<
  FinoraRecipientTrustBootstrapResult
> {
  return runFinoraRecipientTrustAuthoritySerialized(
    async () => {
      try {
        // ----------------------------------------------------
        // INDEPENDENT FINGERPRINT CONTRACT
        // ----------------------------------------------------

        if (
          !isCanonicalSha256Fingerprint(
            request.expectedPublicKeyFingerprint,
          )
        ) {
          return failure(
            "FINORA recipient trust bootstrap requires a canonical lowercase SHA-256 public-key fingerprint.",
          );
        }

        // ----------------------------------------------------
        // INITIAL KEY POLICY
        // ----------------------------------------------------

        if (
          request.trustedKey.status !==
            "ACTIVE"
        ) {
          return failure(
            "FINORA recipient trust bootstrap requires one ACTIVE initial signing key.",
          );
        }

        if (
          request.trustedKey.validUntil !==
            undefined
        ) {
          return failure(
            "FINORA initial ACTIVE recipient signing key must not define validUntil.",
          );
        }

        // ----------------------------------------------------
        // COMPLETE TRUST RECORD VALIDATION
        //
        // Reuse the production trust-store validator for:
        //
        // - issuer identity
        // - algorithm / format
        // - canonical timestamps
        // - strict Base64
        // - SPKI DER structure
        // - EC P-256 requirement
        // ----------------------------------------------------

        const proposedStore:
          FinoraRecipientTrustStoreState = {
            schemaVersion:
              1,

            trustedKeys: [
              request.trustedKey,
            ],
          };

        validateFinoraRecipientTrustStoreState(
          proposedStore,
        );

        // ----------------------------------------------------
        // DERIVE ACTUAL SHA-256 SPKI FINGERPRINT
        //
        // The existing installation-binding primitive computes
        // exactly:
        //
        // SHA-256(decoded canonical SPKI DER) -> lowercase hex.
        //
        // It is reused here only as that pure fingerprint
        // primitive. Installation binding identity itself is
        // not used as recipient Control Center trust.
        // ----------------------------------------------------

        const actualPublicKeyFingerprint =
          createFinoraInstallationBindingFingerprint(
            request.trustedKey.publicKey,
          );

        if (
          !fingerprintsMatch(
            request.expectedPublicKeyFingerprint,
            actualPublicKeyFingerprint,
          )
        ) {
          return failure(
            "FINORA recipient trust bootstrap public-key fingerprint does not match the independently supplied fingerprint.",
          );
        }

        // ----------------------------------------------------
        // CANONICAL CONTROL CENTER SIGNING KEY ID
        // ----------------------------------------------------

        const expectedSigningKeyId =
          createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint(
            actualPublicKeyFingerprint,
          );

        if (
          request.trustedKey.signingKeyId !==
            expectedSigningKeyId
        ) {
          return failure(
            "FINORA recipient trust bootstrap signingKeyId does not match the trusted public key.",
          );
        }

        // ----------------------------------------------------
        // EXISTING TRUST = BOOTSTRAP FORBIDDEN
        //
        // Never silently replace an established trust root.
        // Rotation / retirement / revocation require a separate
        // authenticated transition authority.
        // ----------------------------------------------------

        const existingTrust =
          await loadFinoraRecipientTrustStore();

        if (
          existingTrust !==
            undefined
        ) {
          return failure(
            "FINORA recipient trust is already bootstrapped and cannot be replaced through bootstrap.",
          );
        }

        // ----------------------------------------------------
        // PERSIST INITIAL AUTHORITY
        // ----------------------------------------------------

        await persistFinoraRecipientTrustStore(
          proposedStore,
        );

        // ----------------------------------------------------
        // READ-BACK CONFIRMATION
        // ----------------------------------------------------

        const persistedTrust =
          await loadFinoraRecipientTrustStore();

        if (
          persistedTrust ===
            undefined ||
          persistedTrust.trustedKeys.length !==
            1
        ) {
          return failure(
            "FINORA recipient trust bootstrap persistence could not be confirmed.",
          );
        }

        const persistedKey =
          persistedTrust.trustedKeys[0];

        if (
          persistedKey.issuerId !==
            request.trustedKey.issuerId ||
          persistedKey.signingKeyId !==
            request.trustedKey.signingKeyId ||
          persistedKey.publicKey !==
            request.trustedKey.publicKey ||
          persistedKey.status !==
            "ACTIVE" ||
          persistedKey.validFrom !==
            request.trustedKey.validFrom ||
          persistedKey.validUntil !==
            undefined
        ) {
          return failure(
            "FINORA recipient trust bootstrap persisted state does not match the authorized initial key.",
          );
        }

        return {
          success:
            true,

          data: {
            issuerId:
              persistedKey.issuerId,

            signingKeyId:
              persistedKey.signingKeyId,

            publicKeyFingerprint:
              actualPublicKeyFingerprint,
          },
        };
      } catch (
        error
      ) {
        return failure(
          error instanceof Error
            ? error.message
            : "FINORA recipient trust bootstrap failed.",
        );
      }
    },
  );
}

// ============================================================
// END
// ============================================================