// ============================================================
// FINORA ENTERPRISE OS™
//
// RECIPIENT TRUST EMERGENCY RECOVERY ISSUER
//
// MODULE  : Offline Recovery Authority
// LAYER   : Privileged Recovery Package Issuance
// VERSION : 1.0
// STATUS  : Production Foundation
//
// RESPONSIBILITY:
//
// - Load the independent Recovery Authority private key
// - Snapshot issuer wall-clock time
// - Validate the requested REPLACE_ACTIVE Recovery payload
// - Reserve a durable Recovery sequence before signing
// - Construct the exact Recovery unsigned envelope
// - Canonicalize and sign with the independent Recovery root
// - Perform final signed-envelope structural validation
//
// SECURITY:
//
// - Does not use the operational Control Center key vault.
// - Does not use the Control Center key-authority queue.
// - Does not use the Recipient Trust Transition issuer.
// - Does not access recipient trust state.
// - Does not access recipient Recovery public-anchor state.
// - Does not expose IPC / preload / renderer APIs.
// - Does not write .finora artifacts.
//
// FAILURE MODEL:
//
// Sequence is durably reserved before signature generation.
// A later signing failure may therefore leave a sequence gap.
// Recipient Recovery replay validation intentionally permits
// forward gaps.
// ============================================================

import {
  randomUUID,
} from "node:crypto";

import {
  signFinoraControlCenterCanonicalValue,
} from "../control-center/finoraControlCenterCrypto.js";

import {
  FINORA_RECIPIENT_TRUST_RECOVERY_FORMAT,
  FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE,
  canonicalizeFinoraRecipientTrustRecoveryUnsignedEnvelope,
  createFinoraRecipientTrustRecoveryPayloadDigest,
  validateFinoraRecipientTrustRecoveryDraft,
  validateFinoraRecipientTrustRecoveryPayload,
  validateFinoraRecipientTrustRecoverySignedEnvelope,
  validateFinoraRecipientTrustRecoveryTarget,
} from "../control/finoraRecipientTrustRecoveryContract.js";

import type {
  FinoraRecipientTrustRecoveryDraft,
  FinoraRecipientTrustRecoveryPayload,
  FinoraRecipientTrustRecoverySignedEnvelope,
  FinoraRecipientTrustRecoveryUnsignedEnvelope,
} from "../control/finoraRecipientTrustRecoveryContract.js";

import {
  loadOrCreateFinoraRecipientTrustRecoveryAuthorityVault,
} from "./finoraRecipientTrustRecoveryAuthorityVault.js";

import {
  reserveFinoraRecipientTrustRecoverySequence,
} from "./finoraRecipientTrustRecoverySequenceLedger.js";

// ============================================================
// REQUEST
// ============================================================

export interface FinoraRecipientTrustRecoveryIssueRequest {
  target:
    FinoraRecipientTrustRecoveryDraft["target"];

  operationalIssuerId:
    FinoraRecipientTrustRecoveryPayload["operationalIssuerId"];

  expectedActiveSigningKeyId:
    FinoraRecipientTrustRecoveryPayload["expectedActiveSigningKeyId"];

  replacementTrustedKey:
    FinoraRecipientTrustRecoveryPayload["replacementTrustedKey"];
}

// ============================================================
// RESULT
// ============================================================

export type FinoraRecipientTrustRecoveryIssueResult =
  | {
      success:
        true;

      data: {
        recoveryAuthorityId:
          string;

        signingKeyId:
          string;

        sequence:
          number;

        issuedAt:
          string;

        signedRecovery:
          FinoraRecipientTrustRecoverySignedEnvelope;
      };
    }
  | {
      success:
        false;

      error:
        string;
    };

// ============================================================
// RESULT HELPERS
// ============================================================

function failure(
  error:
    string,
): FinoraRecipientTrustRecoveryIssueResult {
  return {
    success:
      false,

    error,
  };
}

// ============================================================
// CLOCK SNAPSHOT
// ============================================================

function snapshotIssuerTime(
  now?:
    Date,
): string {
  const observed =
    now
      ? new Date(
          now.getTime(),
        )
      : new Date();

  if (
    !Number.isFinite(
      observed.getTime(),
    )
  ) {
    throw new Error(
      "FINORA Recipient Trust Recovery issuer received an invalid wall-clock timestamp.",
    );
  }

  return observed.toISOString();
}

// ============================================================
// PACKAGE ID
// ============================================================

function createRecoveryPackageId():
  string {
  return `FINORA-RECOVERY-${randomUUID().toUpperCase()}`;
}

// ============================================================
// ISSUE
// ============================================================

export async function issueFinoraRecipientTrustRecovery(
  request:
    FinoraRecipientTrustRecoveryIssueRequest,

  now?:
    Date,
): Promise<
  FinoraRecipientTrustRecoveryIssueResult
> {
  // ----------------------------------------------------------
  // 1. INDEPENDENT RECOVERY AUTHORITY
  // ----------------------------------------------------------

  let authority:
    Awaited<
      ReturnType<
        typeof loadOrCreateFinoraRecipientTrustRecoveryAuthorityVault
      >
    >;

  try {
    authority =
      await loadOrCreateFinoraRecipientTrustRecoveryAuthorityVault();
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to load FINORA Recipient Trust Recovery Authority.",
    );
  }

  // ----------------------------------------------------------
  // 2. SNAPSHOT ISSUER TIME
  //
  // Production time is captured after Recovery Authority load.
  // This prevents first-use key creation from occurring after
  // the timestamp used by its first signed package.
  // ----------------------------------------------------------

  let issuedAt:
    string;

  try {
    issuedAt =
      snapshotIssuerTime(
        now,
      );
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to snapshot FINORA Recovery Authority time.",
    );
  }

  if (
    Date.parse(
      issuedAt,
    ) <
      Date.parse(
        authority.createdAt,
      )
  ) {
    return failure(
      "FINORA Recipient Trust Recovery issuance time precedes Recovery Authority creation time.",
    );
  }

  // ----------------------------------------------------------
  // 3. TARGET + PAYLOAD PREFLIGHT
  //
  // Validate all caller-controlled Recovery semantics before
  // reserving a sequence wherever possible.
  // ----------------------------------------------------------

  try {
    validateFinoraRecipientTrustRecoveryTarget(
      request.target,
    );
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "FINORA Recipient Trust Recovery target is invalid.",
    );
  }

  const payload:
    FinoraRecipientTrustRecoveryPayload = {
      recoveryFormat:
        FINORA_RECIPIENT_TRUST_RECOVERY_FORMAT,

      action:
        "REPLACE_ACTIVE",

      operationalIssuerId:
        request.operationalIssuerId,

      expectedActiveSigningKeyId:
        request.expectedActiveSigningKeyId,

      replacementTrustedKey: {
        ...request.replacementTrustedKey,
      },

      issuedAt,

      schemaVersion:
        1,
    };

  try {
    validateFinoraRecipientTrustRecoveryPayload(
      payload,
    );
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "FINORA Recipient Trust Recovery payload is invalid.",
    );
  }

  // ----------------------------------------------------------
  // 4. DURABLE SEQUENCE RESERVATION
  //
  // Receiver replay scope:
  //
  // recoveryAuthorityId
  // + RECIPIENT_TRUST_RECOVERY
  // + installationId
  // + operationalIssuerId
  // ----------------------------------------------------------

  let reservation:
    Awaited<
      ReturnType<
        typeof reserveFinoraRecipientTrustRecoverySequence
      >
    >;

  try {
    reservation =
      await reserveFinoraRecipientTrustRecoverySequence({
        recoveryAuthorityId:
          authority.recoveryAuthorityId,

        installationId:
          request.target.installationId,

        operationalIssuerId:
          request.operationalIssuerId,

        observedAt:
          issuedAt,
      });
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to reserve FINORA Recipient Trust Recovery sequence.",
    );
  }

  if (
    reservation.recoveryAuthorityId !==
      authority.recoveryAuthorityId ||
    reservation.purpose !==
      FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE ||
    reservation.installationId !==
      request.target.installationId ||
    reservation.operationalIssuerId !==
      request.operationalIssuerId ||
    reservation.reservedAt !==
      issuedAt
  ) {
    return failure(
      "FINORA Recipient Trust Recovery sequence reservation does not match the requested authority scope.",
    );
  }

  // ----------------------------------------------------------
  // 5. EXACT DRAFT
  // ----------------------------------------------------------

  const draft:
    FinoraRecipientTrustRecoveryDraft = {
      packageId:
        createRecoveryPackageId(),

      purpose:
        FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE,

      target: {
        ...request.target,
      },

      issuedAt,

      sequence:
        reservation.sequence,

      payloadVersion:
        1,

      payload,

      schemaVersion:
        1,
    };

  try {
    validateFinoraRecipientTrustRecoveryDraft(
      draft,
    );
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "FINORA Recipient Trust Recovery draft is invalid.",
    );
  }

  // ----------------------------------------------------------
  // 6. UNSIGNED ENVELOPE
  // ----------------------------------------------------------

  const unsignedEnvelope:
    FinoraRecipientTrustRecoveryUnsignedEnvelope = {
      ...draft,

      issuer: {
        type:
          "FINORA_RECOVERY_AUTHORITY",

        recoveryAuthorityId:
          authority.recoveryAuthorityId,

        signingKeyId:
          authority.signingKeyId,
      },

      payloadDigest:
        createFinoraRecipientTrustRecoveryPayloadDigest(
          payload,
        ),
    };

  // ----------------------------------------------------------
  // 7. CANONICALIZE
  // ----------------------------------------------------------

  let canonicalEnvelope:
    string;

  try {
    canonicalEnvelope =
      canonicalizeFinoraRecipientTrustRecoveryUnsignedEnvelope(
        unsignedEnvelope,
      );
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to canonicalize FINORA Recipient Trust Recovery envelope.",
    );
  }

  // ----------------------------------------------------------
  // 8. SIGN WITH INDEPENDENT RECOVERY PRIVATE KEY
  // ----------------------------------------------------------

  let signatureValue:
    string;

  try {
    signatureValue =
      signFinoraControlCenterCanonicalValue(
        canonicalEnvelope,
        authority.privateKeyPkcs8DerBase64,
      );
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to sign FINORA Recipient Trust Recovery envelope.",
    );
  }

  // ----------------------------------------------------------
  // 9. SIGNED ENVELOPE
  // ----------------------------------------------------------

  const signedRecovery:
    FinoraRecipientTrustRecoverySignedEnvelope = {
      ...unsignedEnvelope,

      signature: {
        algorithm:
          "ECDSA_P256_SHA256",

        encoding:
          "IEEE_P1363",

        canonicalization:
          "FINORA_CANONICAL_JSON_V1",

        signingKeyId:
          authority.signingKeyId,

        value:
          signatureValue,
      },
    };

  // ----------------------------------------------------------
  // 10. FINAL STRUCTURAL SELF-CHECK
  // ----------------------------------------------------------

  try {
    validateFinoraRecipientTrustRecoverySignedEnvelope(
      signedRecovery,
    );
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "FINORA Recipient Trust Recovery signed envelope failed final validation.",
    );
  }

  // ----------------------------------------------------------
  // SUCCESS
  // ----------------------------------------------------------

  return {
    success:
      true,

    data: {
      recoveryAuthorityId:
        authority.recoveryAuthorityId,

      signingKeyId:
        authority.signingKeyId,

      sequence:
        reservation.sequence,

      issuedAt,

      signedRecovery,
    },
  };
}

// ============================================================
// END
// ============================================================