/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST EMERGENCY RECOVERY CONTRACT

   MODULE  : Native Control
   LAYER   : Shared Native Contract
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Define signed emergency recipient-trust recovery packages
   - Keep recovery authority independent from operational signer
   - Bind recovery to one exact native installation
   - Bind recovery to one expected current ACTIVE operational key
   - Define one REPLACE_ACTIVE emergency action
   - Require one new operational ACTIVE P-256 signing key
   - Reuse FINORA canonical JSON and payload digest primitives

   SECURITY:

   - No Electron API.
   - No filesystem.
   - No persistence.
   - No IPC.
   - No renderer.
   - No private keys.
   - No trust-store mutation.
   - No replay-state mutation.
   - No recovery-root trust-on-first-use.

   AUTHORITY MODEL:

   - Recovery packages are NOT normal recipient trust transitions.
   - Recovery signer is an independent recovery authority.
   - Recovery cannot be authorized by the compromised operational
     ACTIVE key being replaced.
   - Apply policy must later confirm expectedActiveSigningKeyId is
     exactly the current ACTIVE key for operationalIssuerId.
   - Apply policy must later revoke that current ACTIVE key.
   - Replacement key must become the sole ACTIVE operational key.
   - Historical RETIRED / REVOKED keys are outside this contract
     and are preserved by the authoritative apply service.
=========================================================== */

import {
  canonicalizeFinoraControlCenterValue,
  createFinoraControlCenterPayloadDigest,
} from "../control-center/finoraControlCenterCanonicalization.js";

import {
  validateFinoraRecipientOperationalActiveTrustedKey,
  validateFinoraRecipientTrustTransitionTarget,
} from "./finoraRecipientTrustTransitionContract.js";

import type {
  FinoraRecipientTrustTransitionTarget,
} from "./finoraRecipientTrustTransitionContract.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

// ============================================================
// CONSTANTS
// ============================================================

export const FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE =
  "RECIPIENT_TRUST_RECOVERY" as const;

export const FINORA_RECIPIENT_TRUST_RECOVERY_FORMAT =
  "FINORA_RECIPIENT_TRUST_RECOVERY_V1" as const;

// ============================================================
// PAYLOAD
// ============================================================

export interface FinoraRecipientTrustRecoveryReplaceActivePayload {
  recoveryFormat:
    typeof FINORA_RECIPIENT_TRUST_RECOVERY_FORMAT;

  action:
    "REPLACE_ACTIVE";

  operationalIssuerId:
    string;

  expectedActiveSigningKeyId:
    string;

  replacementTrustedKey:
    FinoraBranchTrustedControlPublicKey;

  issuedAt:
    string;

  schemaVersion:
    1;
}

export type FinoraRecipientTrustRecoveryPayload =
  FinoraRecipientTrustRecoveryReplaceActivePayload;

// ============================================================
// DRAFT
// ============================================================

export interface FinoraRecipientTrustRecoveryDraft {
  packageId:
    string;

  purpose:
    typeof FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE;

  target:
    FinoraRecipientTrustTransitionTarget;

  issuedAt:
    string;

  sequence:
    number;

  payloadVersion:
    1;

  payload:
    FinoraRecipientTrustRecoveryPayload;

  schemaVersion:
    1;
}

// ============================================================
// UNSIGNED ENVELOPE
// ============================================================

export interface FinoraRecipientTrustRecoveryUnsignedEnvelope
  extends FinoraRecipientTrustRecoveryDraft {
  issuer: {
    type:
      "FINORA_RECOVERY_AUTHORITY";

    recoveryAuthorityId:
      string;

    signingKeyId:
      string;
  };

  payloadDigest: {
    algorithm:
      "SHA-256";

    value:
      string;
  };
}

// ============================================================
// SIGNED ENVELOPE
// ============================================================

export interface FinoraRecipientTrustRecoverySignedEnvelope
  extends FinoraRecipientTrustRecoveryUnsignedEnvelope {
  signature: {
    algorithm:
      "ECDSA_P256_SHA256";

    encoding:
      "IEEE_P1363";

    canonicalization:
      "FINORA_CANONICAL_JSON_V1";

    signingKeyId:
      string;

    value:
      string;
  };
}

// ============================================================
// BASIC HELPERS
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

function hasOnlyKeys(
  value:
    Record<string, unknown>,
  expected:
    readonly string[],
): boolean {
  const actualKeys =
    Object.keys(
      value,
    ).sort();

  const expectedKeys =
    [
      ...expected,
    ].sort();

  return (
    actualKeys.length ===
      expectedKeys.length &&
    actualKeys.every(
      (
        key,
        index,
      ) =>
        key ===
          expectedKeys[index],
    )
  );
}

function isCanonicalIsoTimestamp(
  value:
    unknown,
): value is string {
  if (
    typeof value !==
      "string"
  ) {
    return false;
  }

  const parsed =
    Date.parse(
      value,
    );

  return (
    Number.isFinite(
      parsed,
    ) &&
    new Date(
      parsed,
    ).toISOString() ===
      value
  );
}

function decodeStrictBase64(
  value:
    unknown,
): Buffer {
  if (
    typeof value !==
      "string" ||
    value.length ===
      0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      value,
    )
  ) {
    throw new Error(
      "FINORA recipient trust recovery signature encoding is invalid.",
    );
  }

  const decoded =
    Buffer.from(
      value,
      "base64",
    );

  if (
    decoded.length ===
      0 ||
    decoded.toString(
      "base64",
    ) !==
      value
  ) {
    throw new Error(
      "FINORA recipient trust recovery signature encoding is invalid.",
    );
  }

  return decoded;
}

// ============================================================
// TARGET
// ============================================================

export function validateFinoraRecipientTrustRecoveryTarget(
  value:
    unknown,
): asserts value is
  FinoraRecipientTrustTransitionTarget {
  try {
    validateFinoraRecipientTrustTransitionTarget(
      value,
    );
  } catch {
    throw new Error(
      "FINORA recipient trust recovery target is invalid.",
    );
  }
}

// ============================================================
// PAYLOAD
// ============================================================

export function validateFinoraRecipientTrustRecoveryPayload(
  value:
    unknown,
): asserts value is
  FinoraRecipientTrustRecoveryPayload {
  if (
    !isRecord(
      value,
    ) ||
    !hasOnlyKeys(
      value,
      [
        "recoveryFormat",
        "action",
        "operationalIssuerId",
        "expectedActiveSigningKeyId",
        "replacementTrustedKey",
        "issuedAt",
        "schemaVersion",
      ],
    ) ||
    value.recoveryFormat !==
      FINORA_RECIPIENT_TRUST_RECOVERY_FORMAT ||
    value.action !==
      "REPLACE_ACTIVE" ||
    !isNonEmptyString(
      value.operationalIssuerId,
    ) ||
    !isNonEmptyString(
      value.expectedActiveSigningKeyId,
    ) ||
    !isCanonicalIsoTimestamp(
      value.issuedAt,
    ) ||
    value.schemaVersion !==
      1
  ) {
    throw new Error(
      "FINORA recipient trust recovery payload structure is invalid.",
    );
  }

  validateFinoraRecipientOperationalActiveTrustedKey(
    value.replacementTrustedKey,
    value.issuedAt,
  );

  if (
    value.replacementTrustedKey.issuerId !==
      value.operationalIssuerId
  ) {
    throw new Error(
      "FINORA recipient trust recovery replacement key must preserve the operational issuerId.",
    );
  }

  if (
    value.replacementTrustedKey.signingKeyId ===
      value.expectedActiveSigningKeyId
  ) {
    throw new Error(
      "FINORA recipient trust recovery replacement key must differ from the expected compromised ACTIVE key.",
    );
  }
}

// ============================================================
// DRAFT
// ============================================================

export function validateFinoraRecipientTrustRecoveryDraft(
  value:
    unknown,
): asserts value is
  FinoraRecipientTrustRecoveryDraft {
  if (
    !isRecord(
      value,
    ) ||
    !hasOnlyKeys(
      value,
      [
        "packageId",
        "purpose",
        "target",
        "issuedAt",
        "sequence",
        "payloadVersion",
        "payload",
        "schemaVersion",
      ],
    ) ||
    !isNonEmptyString(
      value.packageId,
    ) ||
    value.purpose !==
      FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE ||
    !isCanonicalIsoTimestamp(
      value.issuedAt,
    ) ||
    !Number.isSafeInteger(
      value.sequence,
    ) ||
    (
      value.sequence as number
    ) <=
      0 ||
    value.payloadVersion !==
      1 ||
    value.schemaVersion !==
      1
  ) {
    throw new Error(
      "FINORA recipient trust recovery draft structure is invalid.",
    );
  }

  validateFinoraRecipientTrustRecoveryTarget(
    value.target,
  );

  validateFinoraRecipientTrustRecoveryPayload(
    value.payload,
  );

  if (
    value.payload.issuedAt !==
      value.issuedAt
  ) {
    throw new Error(
      "FINORA recipient trust recovery payload and envelope issuedAt must match exactly.",
    );
  }
}

// ============================================================
// UNSIGNED ENVELOPE
// ============================================================

export function validateFinoraRecipientTrustRecoveryUnsignedEnvelope(
  value:
    unknown,
): asserts value is
  FinoraRecipientTrustRecoveryUnsignedEnvelope {
  if (
    !isRecord(
      value,
    ) ||
    !hasOnlyKeys(
      value,
      [
        "packageId",
        "purpose",
        "target",
        "issuedAt",
        "sequence",
        "payloadVersion",
        "payload",
        "schemaVersion",
        "issuer",
        "payloadDigest",
      ],
    )
  ) {
    throw new Error(
      "FINORA recipient trust recovery unsigned envelope structure is invalid.",
    );
  }

  const {
    issuer,
    payloadDigest,
    ...draft
  } =
    value;

  validateFinoraRecipientTrustRecoveryDraft(
    draft,
  );

  if (
    !isRecord(
      issuer,
    ) ||
    !hasOnlyKeys(
      issuer,
      [
        "type",
        "recoveryAuthorityId",
        "signingKeyId",
      ],
    ) ||
    issuer.type !==
      "FINORA_RECOVERY_AUTHORITY" ||
    !isNonEmptyString(
      issuer.recoveryAuthorityId,
    ) ||
    !isNonEmptyString(
      issuer.signingKeyId,
    )
  ) {
    throw new Error(
      "FINORA recipient trust recovery issuer structure is invalid.",
    );
  }

  if (
    !isRecord(
      payloadDigest,
    ) ||
    !hasOnlyKeys(
      payloadDigest,
      [
        "algorithm",
        "value",
      ],
    ) ||
    payloadDigest.algorithm !==
      "SHA-256" ||
    typeof payloadDigest.value !==
      "string" ||
    !/^[0-9a-f]{64}$/.test(
      payloadDigest.value,
    )
  ) {
    throw new Error(
      "FINORA recipient trust recovery payload digest structure is invalid.",
    );
  }

  const expectedDigest =
    createFinoraControlCenterPayloadDigest(
      draft.payload,
    ).value;

  if (
    payloadDigest.value !==
      expectedDigest
  ) {
    throw new Error(
      "FINORA recipient trust recovery payload digest does not match its payload.",
    );
  }
}

// ============================================================
// SIGNED ENVELOPE
// ============================================================

export function validateFinoraRecipientTrustRecoverySignedEnvelope(
  value:
    unknown,
): asserts value is
  FinoraRecipientTrustRecoverySignedEnvelope {
  if (
    !isRecord(
      value,
    ) ||
    !hasOnlyKeys(
      value,
      [
        "packageId",
        "purpose",
        "target",
        "issuedAt",
        "sequence",
        "payloadVersion",
        "payload",
        "schemaVersion",
        "issuer",
        "payloadDigest",
        "signature",
      ],
    )
  ) {
    throw new Error(
      "FINORA recipient trust recovery signed envelope structure is invalid.",
    );
  }

  const {
    signature,
    ...unsignedEnvelope
  } =
    value;

  validateFinoraRecipientTrustRecoveryUnsignedEnvelope(
    unsignedEnvelope,
  );

  if (
    !isRecord(
      signature,
    ) ||
    !hasOnlyKeys(
      signature,
      [
        "algorithm",
        "encoding",
        "canonicalization",
        "signingKeyId",
        "value",
      ],
    ) ||
    signature.algorithm !==
      "ECDSA_P256_SHA256" ||
    signature.encoding !==
      "IEEE_P1363" ||
    signature.canonicalization !==
      "FINORA_CANONICAL_JSON_V1" ||
    signature.signingKeyId !==
      unsignedEnvelope.issuer.signingKeyId ||
    !isNonEmptyString(
      signature.value,
    )
  ) {
    throw new Error(
      "FINORA recipient trust recovery signature contract is invalid.",
    );
  }

  const signatureBytes =
    decodeStrictBase64(
      signature.value,
    );

  if (
    signatureBytes.byteLength !==
      64
  ) {
    throw new Error(
      "FINORA recipient trust recovery signature must be a 64-byte IEEE-P1363 P-256 signature.",
    );
  }
}

// ============================================================
// PAYLOAD DIGEST
// ============================================================

export function createFinoraRecipientTrustRecoveryPayloadDigest(
  payload:
    FinoraRecipientTrustRecoveryPayload,
): {
  algorithm:
    "SHA-256";

  value:
    string;
} {
  validateFinoraRecipientTrustRecoveryPayload(
    payload,
  );

  return createFinoraControlCenterPayloadDigest(
    payload,
  );
}

// ============================================================
// CANONICAL UNSIGNED ENVELOPE
// ============================================================

export function canonicalizeFinoraRecipientTrustRecoveryUnsignedEnvelope(
  unsignedEnvelope:
    FinoraRecipientTrustRecoveryUnsignedEnvelope,
): string {
  validateFinoraRecipientTrustRecoveryUnsignedEnvelope(
    unsignedEnvelope,
  );

  return canonicalizeFinoraControlCenterValue(
    unsignedEnvelope,
  );
}

// ============================================================
// END
// ============================================================