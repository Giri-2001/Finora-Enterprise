/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST TRANSITION CONTRACT

   MODULE  : Native Control
   LAYER   : Shared Native Contract
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Define installation-level signed recipient trust transitions
   - Keep trust authority independent from branch/business scope
   - Define ROTATE and REVOKE_RETIRED payload contracts
   - Validate installation target identity
   - Validate canonical Control Center signing-key identity
   - Validate new P-256 public signing keys
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
   - No .finora trust-on-first-use.

   AUTHORITY MODEL:

   ROTATE:
   - Must be signed by the currently authorized ACTIVE key.
   - Introduces one new ACTIVE key for the SAME issuerId.
   - New key validFrom equals transition issuedAt.
   - New key has no validUntil.
   - Apply policy later retires the prior ACTIVE signer at the
     same transition timestamp.

   REVOKE_RETIRED:
   - Must be signed by the currently authorized ACTIVE key.
   - May identify a DIFFERENT RETIRED signing key.
   - Apply policy later confirms that target key is RETIRED.
   - Revocation is intentionally retroactive under the existing
     package verifier semantics.

   Current ACTIVE signer emergency revocation is NOT authorized
   by this contract. That requires a separate out-of-band
   recovery authority.

   TARGET:

   Trust authority is installation-level only:

   - installationId
   - bindingKeyId
   - fingerprintAlgorithm
   - publicKeyFingerprint

   No ownerId.
   No businessId.
   No branchId.
=========================================================== */


import {
  canonicalizeFinoraControlCenterValue,
  createFinoraControlCenterPayloadDigest,
} from "../control-center/finoraControlCenterCanonicalization.js";

import {
  createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint,
} from "../control-center/finoraControlCenterCrypto.js";

import {
  assertFinoraP256SpkiPublicKey,
  createFinoraInstallationBindingFingerprint,
} from "./finoraInstallationBindingCrypto.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

// ============================================================
// CONSTANTS
// ============================================================

export const FINORA_RECIPIENT_TRUST_TRANSITION_PURPOSE =
  "RECIPIENT_TRUST_TRANSITION" as const;

export const FINORA_RECIPIENT_TRUST_TRANSITION_FORMAT =
  "FINORA_RECIPIENT_TRUST_TRANSITION_V1" as const;

// ============================================================
// TARGET
// ============================================================

export interface FinoraRecipientTrustTransitionTarget {
  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  publicKeyFingerprint:
    string;
}

// ============================================================
// PAYLOADS
// ============================================================

export interface FinoraRecipientTrustRotatePayload {
  transitionFormat:
    typeof FINORA_RECIPIENT_TRUST_TRANSITION_FORMAT;

  action:
    "ROTATE";

  newTrustedKey:
    FinoraBranchTrustedControlPublicKey;

  issuedAt:
    string;

  schemaVersion:
    1;
}

export interface FinoraRecipientTrustRevokeRetiredPayload {
  transitionFormat:
    typeof FINORA_RECIPIENT_TRUST_TRANSITION_FORMAT;

  action:
    "REVOKE_RETIRED";

  revokedSigningKeyId:
    string;

  issuedAt:
    string;

  schemaVersion:
    1;
}

export type FinoraRecipientTrustTransitionPayload =
  | FinoraRecipientTrustRotatePayload
  | FinoraRecipientTrustRevokeRetiredPayload;

// ============================================================
// DRAFT
// ============================================================

export interface FinoraRecipientTrustTransitionDraft {
  packageId:
    string;

  purpose:
    typeof FINORA_RECIPIENT_TRUST_TRANSITION_PURPOSE;

  target:
    FinoraRecipientTrustTransitionTarget;

  issuedAt:
    string;

  sequence:
    number;

  payloadVersion:
    1;

  payload:
    FinoraRecipientTrustTransitionPayload;

  schemaVersion:
    1;
}

// ============================================================
// UNSIGNED ENVELOPE
// ============================================================

export interface FinoraRecipientTrustTransitionUnsignedEnvelope
  extends FinoraRecipientTrustTransitionDraft {
  issuer: {
    type:
      "FINORA_CONTROL_CENTER";

    issuerId:
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

export interface FinoraRecipientTrustTransitionSignedEnvelope
  extends FinoraRecipientTrustTransitionUnsignedEnvelope {
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
  expectedKeys:
    readonly string[],
): boolean {
  const actualKeys =
    Object.keys(
      value,
    ).sort();

  const expected =
    [...expectedKeys].sort();

  return (
    actualKeys.length ===
      expected.length &&
    actualKeys.every(
      (
        key,
        index,
      ) =>
        key ===
          expected[index],
    )
  );
}

function isCanonicalIsoTimestamp(
  value:
    unknown,
): value is string {
  if (
    !isNonEmptyString(
      value,
    )
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
    string,
): Buffer {
  if (
    value.length ===
      0 ||
    value.length %
      4 !==
      0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(
      value,
    )
  ) {
    throw new Error(
      "FINORA trust transition contains noncanonical base64.",
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
      "FINORA trust transition contains invalid base64.",
    );
  }

  return decoded;
}

// ============================================================
// TARGET VALIDATION
// ============================================================

export function validateFinoraRecipientTrustTransitionTarget(
  value:
    unknown,
): asserts value is
  FinoraRecipientTrustTransitionTarget {
  if (
    !isRecord(
      value,
    ) ||
    !hasOnlyKeys(
      value,
      [
        "installationId",
        "bindingKeyId",
        "fingerprintAlgorithm",
        "publicKeyFingerprint",
      ],
    ) ||
    !isNonEmptyString(
      value.installationId,
    ) ||
    !isNonEmptyString(
      value.bindingKeyId,
    ) ||
    value.fingerprintAlgorithm !==
      "SHA-256" ||
    typeof value.publicKeyFingerprint !==
      "string" ||
    !/^[0-9a-f]{64}$/.test(
      value.publicKeyFingerprint,
    )
  ) {
    throw new Error(
      "FINORA recipient trust transition target is invalid.",
    );
  }
}

// ============================================================
// NEW ROTATION KEY VALIDATION
// ============================================================

export function validateFinoraRecipientOperationalActiveTrustedKey(
  value:
    unknown,
  issuedAt:
    string,
): asserts value is
  FinoraBranchTrustedControlPublicKey {
  if (
    !isRecord(
      value,
    ) ||
    !hasOnlyKeys(
      value,
      [
        "issuerId",
        "signingKeyId",
        "algorithm",
        "format",
        "publicKey",
        "status",
        "validFrom",
      ],
    ) ||
    !isNonEmptyString(
      value.issuerId,
    ) ||
    !isNonEmptyString(
      value.signingKeyId,
    ) ||
    value.algorithm !==
      "ECDSA_P256_SHA256" ||
    value.format !==
      "SPKI_DER_BASE64" ||
    value.status !==
      "ACTIVE" ||
    value.validFrom !==
      issuedAt ||
    !isCanonicalIsoTimestamp(
      value.validFrom,
    ) ||
    !isNonEmptyString(
      value.publicKey,
    )
  ) {
    throw new Error(
      "FINORA recipient trust ROTATE payload contains an invalid new ACTIVE signing key.",
    );
  }

  decodeStrictBase64(
    value.publicKey,
  );

  try {
    assertFinoraP256SpkiPublicKey(
      value.publicKey,
    );
  } catch (
    error
  ) {
    const validationError =
      error instanceof Error
        ? error.message
        : "";

    if (
      validationError.includes(
        "must be EC",
      ) ||
      validationError.includes(
        "must use P-256",
      )
    ) {
      throw new Error(
        "FINORA recipient trust ROTATE public key must use P-256.",
      );
    }

    throw new Error(
      "FINORA recipient trust ROTATE public key is invalid SPKI DER.",
    );
  }

  const fingerprint =
    createFinoraInstallationBindingFingerprint(
      value.publicKey,
    );

  const canonicalSigningKeyId =
    createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint(
      fingerprint,
    );

  if (
    value.signingKeyId !==
      canonicalSigningKeyId
  ) {
    throw new Error(
      "FINORA recipient trust ROTATE signingKeyId does not match the new public key.",
    );
  }
}

// ============================================================
// PAYLOAD VALIDATION
// ============================================================

export function validateFinoraRecipientTrustTransitionPayload(
  value:
    unknown,
): asserts value is
  FinoraRecipientTrustTransitionPayload {
  if (
    !isRecord(
      value,
    ) ||
    value.transitionFormat !==
      FINORA_RECIPIENT_TRUST_TRANSITION_FORMAT ||
    value.schemaVersion !==
      1 ||
    !isCanonicalIsoTimestamp(
      value.issuedAt,
    )
  ) {
    throw new Error(
      "FINORA recipient trust transition payload structure is invalid.",
    );
  }

  if (
    value.action ===
      "ROTATE"
  ) {
    if (
      !hasOnlyKeys(
        value,
        [
          "transitionFormat",
          "action",
          "newTrustedKey",
          "issuedAt",
          "schemaVersion",
        ],
      )
    ) {
      throw new Error(
        "FINORA recipient trust ROTATE payload contains unsupported fields.",
      );
    }

    validateFinoraRecipientOperationalActiveTrustedKey(
      value.newTrustedKey,
      value.issuedAt,
    );

    return;
  }

  if (
    value.action ===
      "REVOKE_RETIRED"
  ) {
    if (
      !hasOnlyKeys(
        value,
        [
          "transitionFormat",
          "action",
          "revokedSigningKeyId",
          "issuedAt",
          "schemaVersion",
        ],
      ) ||
      !isNonEmptyString(
        value.revokedSigningKeyId,
      )
    ) {
      throw new Error(
        "FINORA recipient trust REVOKE_RETIRED payload is invalid.",
      );
    }

    return;
  }

  throw new Error(
    "FINORA recipient trust transition action is unsupported.",
  );
}

// ============================================================
// DRAFT VALIDATION
// ============================================================

export function validateFinoraRecipientTrustTransitionDraft(
  value:
    unknown,
): asserts value is
  FinoraRecipientTrustTransitionDraft {
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
      FINORA_RECIPIENT_TRUST_TRANSITION_PURPOSE ||
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
      "FINORA recipient trust transition draft is invalid.",
    );
  }

  validateFinoraRecipientTrustTransitionTarget(
    value.target,
  );

  validateFinoraRecipientTrustTransitionPayload(
    value.payload,
  );

  if (
    value.payload.issuedAt !==
      value.issuedAt
  ) {
    throw new Error(
      "FINORA recipient trust transition payload and envelope issuedAt must match exactly.",
    );
  }
}

// ============================================================
// UNSIGNED ENVELOPE VALIDATION
// ============================================================

export function validateFinoraRecipientTrustTransitionUnsignedEnvelope(
  value:
    unknown,
): asserts value is
  FinoraRecipientTrustTransitionUnsignedEnvelope {
  if (
    !isRecord(
      value,
    )
  ) {
    throw new Error(
      "FINORA recipient trust transition unsigned envelope is invalid.",
    );
  }

  const {
    issuer,
    payloadDigest,
    ...draft
  } =
    value;

  validateFinoraRecipientTrustTransitionDraft(
    draft,
  );

  if (
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
    ) ||
    !isRecord(
      issuer,
    ) ||
    !hasOnlyKeys(
      issuer,
      [
        "type",
        "issuerId",
        "signingKeyId",
      ],
    ) ||
    issuer.type !==
      "FINORA_CONTROL_CENTER" ||
    !isNonEmptyString(
      issuer.issuerId,
    ) ||
    !isNonEmptyString(
      issuer.signingKeyId,
    ) ||
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
      "FINORA recipient trust transition unsigned cryptographic envelope is invalid.",
    );
  }

  const calculatedDigest =
    createFinoraControlCenterPayloadDigest(
      draft.payload,
    ).value;

  if (
    payloadDigest.value !==
      calculatedDigest
  ) {
    throw new Error(
      "FINORA recipient trust transition payload digest does not match payload.",
    );
  }

  if (
    draft.payload.action ===
      "ROTATE" &&
    draft.payload.newTrustedKey.issuerId !==
      issuer.issuerId
  ) {
    throw new Error(
      "FINORA recipient trust rotation cannot change issuerId.",
    );
  }

  if (
    draft.payload.action ===
      "ROTATE" &&
    draft.payload.newTrustedKey.signingKeyId ===
      issuer.signingKeyId
  ) {
    throw new Error(
      "FINORA recipient trust rotation requires a different new signing key.",
    );
  }

  if (
    draft.payload.action ===
      "REVOKE_RETIRED" &&
    draft.payload.revokedSigningKeyId ===
      issuer.signingKeyId
  ) {
    throw new Error(
      "FINORA current trust-transition signer cannot revoke itself.",
    );
  }
}

// ============================================================
// SIGNED ENVELOPE VALIDATION
// ============================================================

export function validateFinoraRecipientTrustTransitionSignedEnvelope(
  value:
    unknown,
): asserts value is
  FinoraRecipientTrustTransitionSignedEnvelope {
  if (
    !isRecord(
      value
    )
  ) {
    throw new Error(
      "FINORA recipient trust transition signed envelope is invalid.",
    );
  }

  const {
    signature,
    ...unsignedEnvelope
  } =
    value;

  validateFinoraRecipientTrustTransitionUnsignedEnvelope(
    unsignedEnvelope,
  );

  if (
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
    ) ||
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
      "FINORA recipient trust transition signature contract is invalid.",
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
      "FINORA recipient trust transition signature must be a 64-byte IEEE-P1363 P-256 signature.",
    );
  }
}

// ============================================================
// PAYLOAD DIGEST
// ============================================================

export function createFinoraRecipientTrustTransitionPayloadDigest(
  payload:
    FinoraRecipientTrustTransitionPayload,
): {
  algorithm:
    "SHA-256";

  value:
    string;
} {
  validateFinoraRecipientTrustTransitionPayload(
    payload,
  );

  const digest =
    createFinoraControlCenterPayloadDigest(
      payload,
    );

  return {
    algorithm:
      "SHA-256",

    value:
      digest.value,
  };
}

// ============================================================
// UNSIGNED CANONICALIZATION
// ============================================================

export function canonicalizeFinoraRecipientTrustTransitionUnsignedEnvelope(
  envelope:
    FinoraRecipientTrustTransitionUnsignedEnvelope,
): string {
  validateFinoraRecipientTrustTransitionUnsignedEnvelope(
    envelope,
  );

  return canonicalizeFinoraControlCenterValue(
    envelope,
  );
}

// ============================================================
// END
// ============================================================