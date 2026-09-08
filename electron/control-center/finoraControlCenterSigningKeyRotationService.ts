/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER SIGNING KEY ROTATION SERVICE

   MODULE  : Control Center
   LAYER   : Privileged Native Signing Authority
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Load current Control Center signing authority
   - Generate a new ECDSA P-256 signing keypair
   - Preserve stable issuerId
   - Retain the exact previous current signing material
   - Promote the new key to top-level current authority
   - Preserve all older retained signing history
   - Persist the complete change through one key-vault
     replacement
   - Return public rotation metadata only

   IMPORTANT:

   - MAIN PROCESS ONLY.
   - No renderer.
   - No IPC.
   - No recipient target.
   - No trust-transition package issuance.
   - No issuance-ledger reservation.
   - No private key returned to callers.
   - No emergency recovery authority.

   ROLLOUT:

   This service changes the Control Center's current local
   signing authority.

   Recipient-specific trust-transition issuance is a separate
   step and may use the retained predecessor key to authorize
   A -> B migration for installations still trusting A.

   Operational rollout coordination across multiple recipients
   remains a separate boundary.

   SERIALIZATION:

   Same Electron main-process only.
   No cross-process CAS guarantee.

   CLOCK:

   Rotation time is accepted through the issuer-bound Control
   Center clock high-water authority before vault mutation.
   Rotation may not precede creation of the current key.
   Historical valid encrypted key-vault + high-water replacement
   remains outside this same-process authority guarantee.
=========================================================== */

import {
  observeFinoraControlCenterAuthoritativeWallClock,
} from "./finoraControlCenterClockHighWaterAuthorityService.js";

import {
  generateFinoraControlCenterSigningMaterial,
} from "./finoraControlCenterCrypto.js";

import {
  runFinoraControlCenterKeyAuthoritySerialized,
} from "./finoraControlCenterKeyAuthorityQueue.js";

import {
  loadOrCreateFinoraControlCenterKeyVault,
  replaceFinoraControlCenterKeyVault,
} from "./finoraControlCenterKeyVault.js";

import type {
  FinoraControlCenterKeyVaultRecord,
  FinoraControlCenterRetainedSigningKeyRecord,
} from "./finoraControlCenterKeyVault.js";

// ============================================================
// RESULT
// ============================================================

export type FinoraControlCenterSigningKeyRotationResult =
  | {
      success:
        true;

      data: {
        issuerId:
          string;

        previousSigningKeyId:
          string;

        previousPublicKeySpkiDerBase64:
          string;

        newSigningKeyId:
          string;

        newPublicKeySpkiDerBase64:
          string;

        rotatedAt:
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
): FinoraControlCenterSigningKeyRotationResult {
  return {
    success:
      false,

    error,
  };
}

// ============================================================
// INTERNAL ROTATION
// ============================================================

async function rotateFinoraControlCenterSigningKeyInternal(
  now:
    Date,
): Promise<
  FinoraControlCenterSigningKeyRotationResult
> {
  const rotatedAtMs =
    now.getTime();

  if (
    !Number.isFinite(
      rotatedAtMs,
    )
  ) {
    return failure(
      "FINORA Control Center signing-key rotation time is invalid.",
    );
  }

  const rotatedAt =
    now.toISOString();

  // ----------------------------------------------------------
  // CURRENT AUTHORITATIVE VAULT
  // ----------------------------------------------------------

  let current:
    FinoraControlCenterKeyVaultRecord;

  try {
    current =
      await loadOrCreateFinoraControlCenterKeyVault();
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to load FINORA Control Center signing-key vault.",
    );
  }

  const currentCreatedAtMs =
    Date.parse(
      current.createdAt,
    );

  if (
    !Number.isFinite(
      currentCreatedAtMs,
    )
  ) {
    return failure(
      "FINORA Control Center current signing-key creation time is invalid.",
    );
  }

  if (
    rotatedAtMs <
      currentCreatedAtMs
  ) {
    return failure(
      "FINORA Control Center signing-key rotation time cannot precede current key creation.",
    );
  }

  // ----------------------------------------------------------
  // NEW P-256 SIGNING MATERIAL
  // ----------------------------------------------------------

  const nextMaterial =
    generateFinoraControlCenterSigningMaterial();

  const existingSigningKeyIds =
    new Set<string>([
      current.signingKeyId,
      ...(
        current.retainedSigningKeys ??
        []
      ).map(
        (key) =>
          key.signingKeyId,
      ),
    ]);

  if (
    existingSigningKeyIds.has(
      nextMaterial.signingKeyId,
    )
  ) {
    return failure(
      "FINORA Control Center generated a signingKeyId that already exists in key history.",
    );
  }

  // ----------------------------------------------------------
  // RETAIN EXACT PREVIOUS CURRENT KEY
  // ----------------------------------------------------------

  const retainedPrevious:
    FinoraControlCenterRetainedSigningKeyRecord = {
      signingKeyId:
        current.signingKeyId,

      privateKeyPkcs8DerBase64:
        current.privateKeyPkcs8DerBase64,

      publicKeySpkiDerBase64:
        current.publicKeySpkiDerBase64,

      createdAt:
        current.createdAt,

      retiredAt:
        rotatedAt,
    };

  // ----------------------------------------------------------
  // NEXT COMPLETE VAULT
  //
  // Stable issuerId.
  // New key becomes top-level current.
  // Existing retained history is preserved byte-for-byte by
  // the key-vault replacement policy.
  // ----------------------------------------------------------

  const nextVault:
    FinoraControlCenterKeyVaultRecord = {
      issuerId:
        current.issuerId,

      signingKeyId:
        nextMaterial.signingKeyId,

      privateKeyPkcs8DerBase64:
        nextMaterial.privateKeyPkcs8DerBase64,

      publicKeySpkiDerBase64:
        nextMaterial.publicKeySpkiDerBase64,

      createdAt:
        rotatedAt,

      retainedSigningKeys: [
        ...(
          current.retainedSigningKeys ??
          []
        ).map(
          (key) => ({
            ...key,
          }),
        ),
        retainedPrevious,
      ],

      schemaVersion:
        1,
    };

  // ----------------------------------------------------------
  // ONE CONTROLLED VAULT REPLACEMENT
  // ----------------------------------------------------------

  try {
    await replaceFinoraControlCenterKeyVault(
      nextVault,
    );
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to persist FINORA Control Center signing-key rotation.",
    );
  }

  // ----------------------------------------------------------
  // AUTHORITATIVE READ-BACK
  // ----------------------------------------------------------

  let persisted:
    FinoraControlCenterKeyVaultRecord;

  try {
    persisted =
      await loadOrCreateFinoraControlCenterKeyVault();
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to read back FINORA Control Center signing-key rotation.",
    );
  }

  const retainedReadBack =
    (
      persisted.retainedSigningKeys ??
      []
    ).find(
      (key) =>
        key.signingKeyId ===
          current.signingKeyId,
    );

  if (
    persisted.issuerId !==
      current.issuerId ||
    persisted.signingKeyId !==
      nextMaterial.signingKeyId ||
    persisted.publicKeySpkiDerBase64 !==
      nextMaterial.publicKeySpkiDerBase64 ||
    persisted.createdAt !==
      rotatedAt ||
    retainedReadBack ===
      undefined ||
    retainedReadBack.privateKeyPkcs8DerBase64 !==
      current.privateKeyPkcs8DerBase64 ||
    retainedReadBack.publicKeySpkiDerBase64 !==
      current.publicKeySpkiDerBase64 ||
    retainedReadBack.createdAt !==
      current.createdAt ||
    retainedReadBack.retiredAt !==
      rotatedAt
  ) {
    return failure(
      "FINORA Control Center signing-key rotation read-back verification failed.",
    );
  }

  // ----------------------------------------------------------
  // SUCCESS — PUBLIC METADATA ONLY
  // ----------------------------------------------------------

  return {
    success:
      true,

    data: {
      issuerId:
        current.issuerId,

      previousSigningKeyId:
        current.signingKeyId,

      previousPublicKeySpkiDerBase64:
        current.publicKeySpkiDerBase64,

      newSigningKeyId:
        nextMaterial.signingKeyId,

      newPublicKeySpkiDerBase64:
        nextMaterial.publicKeySpkiDerBase64,

      rotatedAt,
    },
  };
}

// ============================================================
// PUBLIC API
// ============================================================

export function rotateFinoraControlCenterSigningKey(
  now?:
    Date,
): Promise<
  FinoraControlCenterSigningKeyRotationResult
> {
  const observedNow =
    now ===
    undefined
      ? undefined
      : new Date(
          now.getTime(),
        );

  return runFinoraControlCenterKeyAuthoritySerialized(
    async () => {
      const clockResult =
        await observeFinoraControlCenterAuthoritativeWallClock(
          observedNow,
        );

      if (
        !clockResult.success
      ) {
        return failure(
          clockResult.error,
        );
      }

      return rotateFinoraControlCenterSigningKeyInternal(
        new Date(
          clockResult.data.observedAt,
        ),
      );
    },
  );
}

// ============================================================
// END
// ============================================================