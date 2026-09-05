// ============================================================
// FINORA ENTERPRISE OS™
//
// ELECTRON CONTROL
// SIGNED CONTROL PACKAGE VERIFIER
//
// RESPONSIBILITY:
//
// - Verify Control Center ECDSA P-256 signatures
// - Verify canonical payload SHA-256
// - Enforce public-key trust
// - Enforce package validity window
// - Enforce exact branch / installation target
//
// SECURITY:
//
// - PUBLIC keys only.
// - NO signing.
// - NO private key.
// - NO renderer IPC.
// - NO persistence.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  createPublicKey,
  verify as nodeVerify,
} from "node:crypto";

import {
  canonicalizeFinoraControlCenterValue,
  createFinoraControlCenterPayloadDigest,
} from "../control-center/finoraControlCenterCanonicalization.js";

// ============================================================
// TYPES
// ============================================================

export interface FinoraBranchTrustedControlPublicKey {

  issuerId:
    string;

  signingKeyId:
    string;

  algorithm:
    "ECDSA_P256_SHA256";

  format:
    "SPKI_DER_BASE64";

  publicKey:
    string;

  status:
    "ACTIVE" |
    "RETIRED" |
    "REVOKED";

  validFrom:
    string;

  validUntil?:
    string;
}

export interface FinoraBranchControlTarget {

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  installationId:
    string;
}

export interface FinoraSignedBranchControlPackage {

  packageId:
    string;

  purpose:
    string;

  issuer: {
    type:
      "FINORA_CONTROL_CENTER";

    issuerId:
      string;

    signingKeyId:
      string;
  };

  target:
    FinoraBranchControlTarget;

  issuedAt:
    string;

  validity?: {
    notBefore?:
      string;

    expiresAt?:
      string;
  };

  sequence:
    number;

  payloadVersion:
    number;

  payload:
    Record<string, unknown>;

  payloadDigest: {
    algorithm:
      "SHA-256";

    value:
      string;
  };

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

  schemaVersion:
    1;
}

export type FinoraSignedControlVerificationResult =
  | {
      valid: true;

      controlPackage:
        FinoraSignedBranchControlPackage;
    }
  | {
      valid: false;

      reason:
        | "MALFORMED_PACKAGE"
        | "UNSUPPORTED_ALGORITHM"
        | "INVALID_PAYLOAD_DIGEST"
        | "INVALID_SIGNATURE"
        | "UNKNOWN_SIGNING_KEY"
        | "UNTRUSTED_ISSUER"
        | "SIGNING_KEY_REVOKED"
        | "SIGNING_KEY_NOT_VALID"
        | "NOT_YET_VALID"
        | "PACKAGE_EXPIRED"
        | "TARGET_MISMATCH";

      error:
        string;
    };

// ============================================================
// HELPERS
// ============================================================

function failure(
  reason:
    Exclude<
      FinoraSignedControlVerificationResult,
      { valid: true }
    >["reason"],

  error:
    string,
): FinoraSignedControlVerificationResult {

  return {
    valid:
      false,

    reason,

    error,
  };
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {

  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(value)
  );
}

function isNonEmptyString(
  value: unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function parseTimestamp(
  value: unknown,
): number | undefined {

  if (!isNonEmptyString(value)) {
    return undefined;
  }

  const parsed =
    Date.parse(
      value,
    );

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : undefined;
}

function targetMatches(
  actual:
    FinoraBranchControlTarget,

  expected:
    FinoraBranchControlTarget,
): boolean {

  return (
    actual.ownerId ===
      expected.ownerId &&
    actual.businessId ===
      expected.businessId &&
    actual.branchId ===
      expected.branchId &&
    actual.installationId ===
      expected.installationId
  );
}

// ============================================================
// VERIFY
// ============================================================

export function verifyFinoraSignedControlPackageNative(
  value:
    unknown,

  trustedKeys:
    readonly FinoraBranchTrustedControlPublicKey[],

  expectedTarget:
    FinoraBranchControlTarget,

  now:
    Date = new Date(),
): FinoraSignedControlVerificationResult {

  if (!isRecord(value)) {
    return failure(
      "MALFORMED_PACKAGE",
      "FINORA Control Package must be an object.",
    );
  }

  const controlPackage =
    value as unknown as
      FinoraSignedBranchControlPackage;

  if (
    controlPackage.schemaVersion !==
      1 ||
    !isNonEmptyString(
      controlPackage.packageId,
    ) ||
    !isRecord(
      controlPackage.issuer,
    ) ||
    !isRecord(
      controlPackage.target,
    ) ||
    !isRecord(
      controlPackage.payload,
    ) ||
    !isRecord(
      controlPackage.payloadDigest,
    ) ||
    !isRecord(
      controlPackage.signature,
    ) ||
    !Number.isSafeInteger(
      controlPackage.sequence,
    ) ||
    controlPackage.sequence <=
      0 ||
    !Number.isSafeInteger(
      controlPackage.payloadVersion,
    ) ||
    controlPackage.payloadVersion <=
      0
  ) {
    return failure(
      "MALFORMED_PACKAGE",
      "FINORA Control Package structure is invalid.",
    );
  }

  if (
    controlPackage.issuer.type !==
      "FINORA_CONTROL_CENTER"
  ) {
    return failure(
      "UNTRUSTED_ISSUER",
      "FINORA Control Package issuer is not trusted.",
    );
  }

  if (
    controlPackage.signature.algorithm !==
      "ECDSA_P256_SHA256" ||
    controlPackage.signature.encoding !==
      "IEEE_P1363" ||
    controlPackage.signature.canonicalization !==
      "FINORA_CANONICAL_JSON_V1" ||
    controlPackage.payloadDigest.algorithm !==
      "SHA-256"
  ) {
    return failure(
      "UNSUPPORTED_ALGORITHM",
      "FINORA Control Package cryptographic contract is unsupported.",
    );
  }

  if (
    controlPackage.issuer.signingKeyId !==
      controlPackage.signature.signingKeyId
  ) {
    return failure(
      "MALFORMED_PACKAGE",
      "FINORA issuer and signature key IDs do not match.",
    );
  }

  if (
    !targetMatches(
      controlPackage.target,
      expectedTarget,
    )
  ) {
    return failure(
      "TARGET_MISMATCH",
      "FINORA Control Package does not belong to this installation.",
    );
  }

  const issuedAt =
    parseTimestamp(
      controlPackage.issuedAt,
    );

  const currentTime =
    now.getTime();

  if (
    issuedAt === undefined ||
    !Number.isFinite(
      currentTime,
    )
  ) {
    return failure(
      "MALFORMED_PACKAGE",
      "FINORA Control Package timestamp is invalid.",
    );
  }

  const notBefore =
    controlPackage.validity?.notBefore ===
      undefined
      ? undefined
      : parseTimestamp(
          controlPackage.validity.notBefore,
        );

  if (
    controlPackage.validity?.notBefore !==
      undefined &&
    notBefore ===
      undefined
  ) {
    return failure(
      "MALFORMED_PACKAGE",
      "FINORA Control Package notBefore timestamp is invalid.",
    );
  }

  if (
    notBefore !== undefined &&
    currentTime <
      notBefore
  ) {
    return failure(
      "NOT_YET_VALID",
      "FINORA Control Package is not valid yet.",
    );
  }

  const expiresAt =
    controlPackage.validity?.expiresAt ===
      undefined
      ? undefined
      : parseTimestamp(
          controlPackage.validity.expiresAt,
        );

  if (
    controlPackage.validity?.expiresAt !==
      undefined &&
    expiresAt ===
      undefined
  ) {
    return failure(
      "MALFORMED_PACKAGE",
      "FINORA Control Package expiresAt timestamp is invalid.",
    );
  }

  if (
    expiresAt !== undefined &&
    currentTime >
      expiresAt
  ) {
    return failure(
      "PACKAGE_EXPIRED",
      "FINORA Control Package has expired.",
    );
  }

  const calculatedDigest =
    createFinoraControlCenterPayloadDigest(
      controlPackage.payload,
    ).value;

  if (
    !/^[0-9a-f]{64}$/.test(
      controlPackage.payloadDigest.value,
    ) ||
    calculatedDigest !==
      controlPackage.payloadDigest.value
  ) {
    return failure(
      "INVALID_PAYLOAD_DIGEST",
      "FINORA Control Package payload integrity check failed.",
    );
  }

  const trustedKey =
    trustedKeys.find(
      (key) =>
        key.issuerId ===
          controlPackage.issuer.issuerId &&
        key.signingKeyId ===
          controlPackage.signature.signingKeyId,
    );

  if (!trustedKey) {
    return failure(
      "UNKNOWN_SIGNING_KEY",
      "FINORA Control Package signing key is unknown.",
    );
  }

  if (
    trustedKey.algorithm !==
      "ECDSA_P256_SHA256" ||
    trustedKey.format !==
      "SPKI_DER_BASE64"
  ) {
    return failure(
      "UNSUPPORTED_ALGORITHM",
      "FINORA trusted public-key contract is unsupported.",
    );
  }

  if (
    trustedKey.status !==
      "ACTIVE" &&
    trustedKey.status !==
      "RETIRED" &&
    trustedKey.status !==
      "REVOKED"
  ) {
    return failure(
      "SIGNING_KEY_NOT_VALID",
      "FINORA trusted signing-key status is invalid.",
    );
  }

  if (
    trustedKey.status ===
      "REVOKED"
  ) {
    return failure(
      "SIGNING_KEY_REVOKED",
      "FINORA Control Package signing key has been revoked.",
    );
  }

  const keyValidFrom =
    parseTimestamp(
      trustedKey.validFrom,
    );

  const keyValidUntil =
    trustedKey.validUntil ===
      undefined
      ? undefined
      : parseTimestamp(
          trustedKey.validUntil,
        );

  if (
    keyValidFrom === undefined ||
    issuedAt <
      keyValidFrom ||
    (
      trustedKey.validUntil !==
        undefined &&
      (
        keyValidUntil ===
          undefined ||
        issuedAt >
          keyValidUntil
      )
    )
  ) {
    return failure(
      "SIGNING_KEY_NOT_VALID",
      "FINORA signing key was not valid when this package was issued.",
    );
  }

  try {

    const publicKey =
      createPublicKey({
        key:
          Buffer.from(
            trustedKey.publicKey,
            "base64",
          ),

        format:
          "der",

        type:
          "spki",
      });

    const signature =
      Buffer.from(
        controlPackage.signature.value,
        "base64",
      );

    if (
      signature.byteLength !==
        64
    ) {
      return failure(
        "INVALID_SIGNATURE",
        "FINORA signature length is invalid.",
      );
    }

    const {
      signature:
        _signature,

      ...unsignedPackage
    } =
      controlPackage;

    const canonicalPackage =
      canonicalizeFinoraControlCenterValue(
        unsignedPackage,
      );

    const verified =
      nodeVerify(
        "sha256",
        Buffer.from(
          canonicalPackage,
          "utf8",
        ),
        {
          key:
            publicKey,

          dsaEncoding:
            "ieee-p1363",
        },
        signature,
      );

    if (!verified) {
      return failure(
        "INVALID_SIGNATURE",
        "FINORA Control Package signature verification failed.",
      );
    }

  } catch (error) {

    return failure(
      "INVALID_SIGNATURE",
      error instanceof Error
        ? error.message
        : "Unable to verify FINORA Control Package.",
    );
  }

  return {
    valid:
      true,

    controlPackage,
  };
}

// ============================================================
// END
// ============================================================