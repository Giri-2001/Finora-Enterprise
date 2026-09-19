// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH CONTRACT
// VERSION : 1.0
// STATUS  : Portable Auth Foundation
// ============================================================

import type {
  FinoraBranchCertificationKeyMaterialV1,
} from "./finoraBranchCertificationContract.js";

import {
  assertFinoraBranchCertificationKeyMaterial,
} from "./finoraBranchCertificationCrypto.js";

import {
  Buffer,
} from "node:buffer";

import {
  isFinoraBranchCredentialPortabilityAuthorityProvenanceV1,
} from "./finoraBranchCredentialPortabilityAuthorityProvenance.js";

import type {
  FinoraBranchCredentialPortabilityAuthorityProvenanceV1,
} from "./finoraBranchCredentialPortabilityAuthorityProvenance.js";

// ============================================================
// CONSTANTS
// ============================================================

export const FINORA_PORTABLE_BRANCH_AUTH_FORMAT =
  "FINORA_PORTABLE_BRANCH_AUTH";

export const FINORA_PORTABLE_BRANCH_AUTH_SCHEMA_VERSION =
  1 as const;

export const FINORA_PORTABLE_BRANCH_AUTH_PAYLOAD_SCHEMA_VERSION =
  1 as const;
/**
 * Initial recipient credential enrollment creates generation 1.
 *
 * Current AUTHORIZE_CREDENTIAL authority is one-time enrollment
 * authority and does not authorize credential rotation/replacement.
 *
 * Future signed credential rotation/recovery must explicitly own
 * generation advancement; BRANCH_ACCESS package sequence is replay /
 * ordering authority and must not be reused as authGeneration.
 */
export const FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION =
  1 as const;

export const FINORA_PORTABLE_BRANCH_AUTH_KDF_ALGORITHM =
  "SCRYPT" as const;

export const FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_N =
  32768 as const;

export const FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_R =
  8 as const;

export const FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_P =
  1 as const;

export const FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_SALT_BYTES =
  16 as const;

export const FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_DERIVED_KEY_BYTES =
  64 as const;

export const FINORA_PORTABLE_BRANCH_AUTH_VERIFIER_BYTES =
  32 as const;

export const FINORA_PORTABLE_BRANCH_AUTH_SECRET_FACTOR_BYTES =
  32 as const;

export const FINORA_PORTABLE_BRANCH_AUTH_ENCRYPTION_ALGORITHM =
  "AES-256-GCM" as const;

export const FINORA_PORTABLE_BRANCH_AUTH_KEY_DERIVATION =
  "FINORA-PORTABLE-BRANCH-AUTH-COMBINE-V1" as const;

export const FINORA_PORTABLE_BRANCH_AUTH_IV_BYTES =
  12 as const;

export const FINORA_PORTABLE_BRANCH_AUTH_TAG_BYTES =
  16 as const;

export const FINORA_PORTABLE_BRANCH_AUTH_MAX_CIPHERTEXT_BYTES =
  64 * 1024;

// ============================================================
// TYPES
// ============================================================

export interface FinoraPortableBranchAuthScopeV1 {
  ownerId: string;
  businessId: string;
  branchId: string;
}

export interface FinoraPortableBranchAuthFactorKdfV1 {
  algorithm:
    typeof FINORA_PORTABLE_BRANCH_AUTH_KDF_ALGORITHM;

  salt:
    string;

  N:
    typeof FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_N;

  r:
    typeof FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_R;

  p:
    typeof FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_P;

  derivedKeyLength:
    typeof FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_DERIVED_KEY_BYTES;
}

export interface FinoraPortableBranchAuthVerifierV1
  extends FinoraPortableBranchAuthFactorKdfV1 {
  verifierLength:
    typeof FINORA_PORTABLE_BRANCH_AUTH_VERIFIER_BYTES;

  verifier:
    string;
}

export interface FinoraPortableBranchAuthEncryptionV1 {
  algorithm:
    typeof FINORA_PORTABLE_BRANCH_AUTH_ENCRYPTION_ALGORITHM;

  keyDerivation:
    typeof FINORA_PORTABLE_BRANCH_AUTH_KEY_DERIVATION;

  iv:
    string;

  authTag:
    string;
}

export interface FinoraPortableBranchAuthEnvelopeV1 {
  format:
    typeof FINORA_PORTABLE_BRANCH_AUTH_FORMAT;

  schemaVersion:
    typeof FINORA_PORTABLE_BRANCH_AUTH_SCHEMA_VERSION;

  canonicalUsername:
    string;

  branchScope:
    FinoraPortableBranchAuthScopeV1;

  passwordFactor:
    FinoraPortableBranchAuthVerifierV1;

  securityFactor:
    FinoraPortableBranchAuthFactorKdfV1;

  encryption:
    FinoraPortableBranchAuthEncryptionV1;

  ciphertext:
    string;
}

export interface FinoraPortableBranchAuthVerifiedControlSignerV1 {

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
    | "ACTIVE"
    | "RETIRED";

  validFrom:
    string;

  validUntil?:
    string;
}

/**
 * Encrypted provenance evidence tying Portable Branch Auth
 * lineage to the exact Control Center public signer selected by
 * successful native verification of the source credential
 * enrollment authorization.
 *
 * This record is evidence only. It contains no private key,
 * Password or Security Code.
 */
export interface FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1 {

  authorizationId:
    string;

  packageId:
    string;

  issuerId:
    string;

  sequence:
    number;

  verifiedControlSigner:
    FinoraPortableBranchAuthVerifiedControlSignerV1;

  /**
   * Reusable branch portability authority proven during the
   * same native Credential Enrollment composition apply.
   *
   * Optional at schema-v1 parsing level only so pre-I6
   * Portable Auth artifacts remain parseable. New enrollment
   * coordinator flows require and populate this proof.
   */
  portabilityAuthorityProof?:
    FinoraBranchCredentialPortabilityAuthorityProvenanceV1;

  verifiedAt:
    string;

  schemaVersion:
    1;
}
export interface FinoraPortableBranchAuthPayloadV1 {
  schemaVersion:
    typeof FINORA_PORTABLE_BRANCH_AUTH_PAYLOAD_SCHEMA_VERSION;

  authStateId:
    string;

  sourceAuthorizationId:
    string;

  sourceAuthorizationVerificationEvidence:
    FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1;

  /**
   * Branch-scoped signing authority carried only inside the
   * Password + Security Code encrypted Portable Auth payload.
   *
   * Optional at schema-v1 parsing level so Portable Auth artifacts
   * created before Branch Certification migration remain valid.
   */
  branchCertificationKeyMaterial?:
    FinoraBranchCertificationKeyMaterialV1;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  userId:
    string;

  username:
    string;

  canonicalUsername:
    string;

  fullName:
    string;

  role:
    string;

  dataContext:
    "REAL" | "DEMO";

  demoId?:
    string;

  storageMode:
    "LOCAL" | "USB";

  passwordVerifier:
    FinoraPortableBranchAuthVerifierV1;

  securityVerifier:
    FinoraPortableBranchAuthVerifierV1;

  /**
   * Portable credential lineage generation.
   *
   * Initial one-time enrollment MUST use
   * FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION.
   *
   * This is intentionally independent from signed control-package
   * sequence numbers.
   */
  authGeneration:
    number;

  createdAt:
    string;

  updatedAt:
    string;
}

// ============================================================
// INTERNAL VALIDATION HELPERS
// ============================================================

type FinoraPortableBranchAuthObject =
  Record<string, unknown>;

function assertObject(
  value: unknown,
  label: string,
): FinoraPortableBranchAuthObject {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(
      `${label} must be an object.`,
    );
  }

  return value as FinoraPortableBranchAuthObject;
}

function assertExactKeys(
  value: FinoraPortableBranchAuthObject,
  requiredKeys: readonly string[],
  optionalKeys: readonly string[],
  label: string,
): void {
  const allowedKeys =
    new Set([
      ...requiredKeys,
      ...optionalKeys,
    ]);

  for (
    const requiredKey of requiredKeys
  ) {
    if (
      !Object.prototype.hasOwnProperty.call(
        value,
        requiredKey,
      )
    ) {
      throw new Error(
        `${label} is missing ${requiredKey}.`,
      );
    }
  }

  for (
    const actualKey of Object.keys(value)
  ) {
    if (
      !allowedKeys.has(actualKey)
    ) {
      throw new Error(
        `${label} contains unsupported field ${actualKey}.`,
      );
    }
  }
}

function assertNonEmptyString(
  value: unknown,
  label: string,
  maximumLength = 512,
): asserts value is string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > maximumLength ||
    value.trim() !== value
  ) {
    throw new Error(
      `${label} must be a non-empty canonical string.`,
    );
  }
}

function assertCanonicalUsername(
  value: unknown,
): asserts value is string {
  assertNonEmptyString(
    value,
    "canonicalUsername",
    256,
  );

  if (
    value !==
      value.toLowerCase()
  ) {
    throw new Error(
      "canonicalUsername must be lower-case canonical form.",
    );
  }
}

function decodeCanonicalBase64(
  value: unknown,
  label: string,
): Buffer {
  if (
    typeof value !== "string" ||
    value.length === 0
  ) {
    throw new Error(
      `${label} must be canonical base64.`,
    );
  }

  if (
    !/^[A-Za-z0-9+/]+={0,2}$/.test(
      value,
    )
  ) {
    throw new Error(
      `${label} must be canonical base64.`,
    );
  }

  const decoded =
    Buffer.from(
      value,
      "base64",
    );

  if (
    decoded.length === 0 ||
    decoded.toString("base64") !==
      value
  ) {
    throw new Error(
      `${label} must be canonical base64.`,
    );
  }

  return decoded;
}

function assertBase64Length(
  value: unknown,
  expectedLength: number,
  label: string,
): void {
  const decoded =
    decodeCanonicalBase64(
      value,
      label,
    );

  if (
    decoded.length !==
      expectedLength
  ) {
    throw new Error(
      `${label} has invalid byte length.`,
    );
  }
}

function assertCanonicalIsoTimestamp(
  value: unknown,
  label: string,
): asserts value is string {
  if (
    typeof value !== "string"
  ) {
    throw new Error(
      `${label} must be an ISO timestamp.`,
    );
  }

  const parsed =
    Date.parse(value);

  if (
    !Number.isFinite(parsed) ||
    new Date(parsed).toISOString() !==
      value
  ) {
    throw new Error(
      `${label} must be a canonical ISO timestamp.`,
    );
  }
}

// ============================================================
// SCOPE VALIDATION
// ============================================================

export function validateFinoraPortableBranchAuthScopeV1(
  value: unknown,
): asserts value is FinoraPortableBranchAuthScopeV1 {
  const objectValue =
    assertObject(
      value,
      "branchScope",
    );

  assertExactKeys(
    objectValue,
    [
      "ownerId",
      "businessId",
      "branchId",
    ],
    [],
    "branchScope",
  );

  assertNonEmptyString(
    objectValue.ownerId,
    "branchScope.ownerId",
    256,
  );

  assertNonEmptyString(
    objectValue.businessId,
    "branchScope.businessId",
    256,
  );

  assertNonEmptyString(
    objectValue.branchId,
    "branchScope.branchId",
    256,
  );
}

// ============================================================
// FACTOR VALIDATION
// ============================================================

export function validateFinoraPortableBranchAuthFactorKdfV1(
  value: unknown,
  label = "factor",
): asserts value is FinoraPortableBranchAuthFactorKdfV1 {
  const objectValue =
    assertObject(
      value,
      label,
    );

  assertExactKeys(
    objectValue,
    [
      "algorithm",
      "salt",
      "N",
      "r",
      "p",
      "derivedKeyLength",
    ],
    [],
    label,
  );

  if (
    objectValue.algorithm !==
      FINORA_PORTABLE_BRANCH_AUTH_KDF_ALGORITHM
  ) {
    throw new Error(
      `${label}.algorithm is invalid.`,
    );
  }

  assertBase64Length(
    objectValue.salt,
    FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_SALT_BYTES,
    `${label}.salt`,
  );

  if (
    objectValue.N !==
      FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_N ||
    objectValue.r !==
      FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_R ||
    objectValue.p !==
      FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_P ||
    objectValue.derivedKeyLength !==
      FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_DERIVED_KEY_BYTES
  ) {
    throw new Error(
      `${label} contains unsupported SCRYPT parameters.`,
    );
  }
}

export function validateFinoraPortableBranchAuthVerifierV1(
  value: unknown,
  label = "verifier",
): asserts value is FinoraPortableBranchAuthVerifierV1 {
  const objectValue =
    assertObject(
      value,
      label,
    );

  assertExactKeys(
    objectValue,
    [
      "algorithm",
      "salt",
      "N",
      "r",
      "p",
      "derivedKeyLength",
      "verifierLength",
      "verifier",
    ],
    [],
    label,
  );

  validateFinoraPortableBranchAuthFactorKdfV1(
    {
      algorithm:
        objectValue.algorithm,

      salt:
        objectValue.salt,

      N:
        objectValue.N,

      r:
        objectValue.r,

      p:
        objectValue.p,

      derivedKeyLength:
        objectValue.derivedKeyLength,
    },
    label,
  );

  if (
    objectValue.verifierLength !==
      FINORA_PORTABLE_BRANCH_AUTH_VERIFIER_BYTES
  ) {
    throw new Error(
      `${label}.verifierLength is invalid.`,
    );
  }

  assertBase64Length(
    objectValue.verifier,
    FINORA_PORTABLE_BRANCH_AUTH_VERIFIER_BYTES,
    `${label}.verifier`,
  );
}

// ============================================================
// ENVELOPE VALIDATION
// ============================================================

export function validateFinoraPortableBranchAuthEnvelopeV1(
  value: unknown,
): asserts value is FinoraPortableBranchAuthEnvelopeV1 {
  const objectValue =
    assertObject(
      value,
      "portableBranchAuthEnvelope",
    );

  assertExactKeys(
    objectValue,
    [
      "format",
      "schemaVersion",
      "canonicalUsername",
      "branchScope",
      "passwordFactor",
      "securityFactor",
      "encryption",
      "ciphertext",
    ],
    [],
    "portableBranchAuthEnvelope",
  );

  if (
    objectValue.format !==
      FINORA_PORTABLE_BRANCH_AUTH_FORMAT
  ) {
    throw new Error(
      "Portable Branch Auth format is invalid.",
    );
  }

  if (
    objectValue.schemaVersion !==
      FINORA_PORTABLE_BRANCH_AUTH_SCHEMA_VERSION
  ) {
    throw new Error(
      "Portable Branch Auth schemaVersion is unsupported.",
    );
  }

  assertCanonicalUsername(
    objectValue.canonicalUsername,
  );

  validateFinoraPortableBranchAuthScopeV1(
    objectValue.branchScope,
  );

  validateFinoraPortableBranchAuthVerifierV1(
    objectValue.passwordFactor,
    "passwordFactor",
  );

  validateFinoraPortableBranchAuthFactorKdfV1(
    objectValue.securityFactor,
    "securityFactor",
  );

  const encryption =
    assertObject(
      objectValue.encryption,
      "encryption",
    );

  assertExactKeys(
    encryption,
    [
      "algorithm",
      "keyDerivation",
      "iv",
      "authTag",
    ],
    [],
    "encryption",
  );

  if (
    encryption.algorithm !==
      FINORA_PORTABLE_BRANCH_AUTH_ENCRYPTION_ALGORITHM ||
    encryption.keyDerivation !==
      FINORA_PORTABLE_BRANCH_AUTH_KEY_DERIVATION
  ) {
    throw new Error(
      "Portable Branch Auth encryption metadata is unsupported.",
    );
  }

  assertBase64Length(
    encryption.iv,
    FINORA_PORTABLE_BRANCH_AUTH_IV_BYTES,
    "encryption.iv",
  );

  assertBase64Length(
    encryption.authTag,
    FINORA_PORTABLE_BRANCH_AUTH_TAG_BYTES,
    "encryption.authTag",
  );

  const ciphertext =
    decodeCanonicalBase64(
      objectValue.ciphertext,
      "ciphertext",
    );

  if (
    ciphertext.length >
      FINORA_PORTABLE_BRANCH_AUTH_MAX_CIPHERTEXT_BYTES
  ) {
    throw new Error(
      "Portable Branch Auth ciphertext exceeds maximum size.",
    );
  }
}

// ============================================================
// PAYLOAD VALIDATION
// ============================================================

function validatePortableVerifiedControlSigner(
  value:
    unknown,
): asserts value is FinoraPortableBranchAuthVerifiedControlSignerV1 {
  const signer =
    assertObject(
      value,
      "sourceAuthorizationVerificationEvidence.verifiedControlSigner",
    );

  assertExactKeys(
    signer,
    [
      "issuerId",
      "signingKeyId",
      "algorithm",
      "format",
      "publicKey",
      "status",
      "validFrom",
    ],
    [
      "validUntil",
    ],
    "sourceAuthorizationVerificationEvidence.verifiedControlSigner",
  );

  assertNonEmptyString(
    signer.issuerId,
    "sourceAuthorizationVerificationEvidence.verifiedControlSigner.issuerId",
  );

  assertNonEmptyString(
    signer.signingKeyId,
    "sourceAuthorizationVerificationEvidence.verifiedControlSigner.signingKeyId",
  );

  if (
    signer.algorithm !==
      "ECDSA_P256_SHA256"
  ) {
    throw new Error(
      "Portable Branch Auth verified Control signer algorithm is invalid.",
    );
  }

  if (
    signer.format !==
      "SPKI_DER_BASE64"
  ) {
    throw new Error(
      "Portable Branch Auth verified Control signer format is invalid.",
    );
  }

  assertNonEmptyString(
    signer.publicKey,
    "sourceAuthorizationVerificationEvidence.verifiedControlSigner.publicKey",
  );

  if (
    signer.status !==
      "ACTIVE" &&
    signer.status !==
      "RETIRED"
  ) {
    throw new Error(
      "Portable Branch Auth verified Control signer status is invalid.",
    );
  }

  assertCanonicalIsoTimestamp(
    signer.validFrom,
    "sourceAuthorizationVerificationEvidence.verifiedControlSigner.validFrom",
  );

  if (
    signer.validUntil !==
      undefined
  ) {
    assertCanonicalIsoTimestamp(
      signer.validUntil,
      "sourceAuthorizationVerificationEvidence.verifiedControlSigner.validUntil",
    );

    if (
      Date.parse(
        signer.validUntil as string,
      ) <
      Date.parse(
        signer.validFrom as string,
      )
    ) {
      throw new Error(
        "Portable Branch Auth verified Control signer validity window is invalid.",
      );
    }
  }
}

export function validateFinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1(
  value:
    unknown,
): asserts value is FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1 {
  const evidence =
    assertObject(
      value,
      "sourceAuthorizationVerificationEvidence",
    );

  assertExactKeys(
    evidence,
    [
      "authorizationId",
      "packageId",
      "issuerId",
      "sequence",
      "verifiedControlSigner",
      "verifiedAt",
      "schemaVersion",
    ],
    [
      "portabilityAuthorityProof",
    ],
    "sourceAuthorizationVerificationEvidence",
  );

  assertNonEmptyString(
    evidence.authorizationId,
    "sourceAuthorizationVerificationEvidence.authorizationId",
  );

  assertNonEmptyString(
    evidence.packageId,
    "sourceAuthorizationVerificationEvidence.packageId",
  );

  assertNonEmptyString(
    evidence.issuerId,
    "sourceAuthorizationVerificationEvidence.issuerId",
  );

  if (
    !Number.isSafeInteger(
      evidence.sequence,
    ) ||
    (
      evidence.sequence as
        number
    ) <=
      0
  ) {
    throw new Error(
      "Portable Branch Auth source authorization verification sequence is invalid.",
    );
  }

  validatePortableVerifiedControlSigner(
    evidence.verifiedControlSigner,
  );

  const portabilityAuthorityProof =
    evidence.portabilityAuthorityProof;

  if (
    portabilityAuthorityProof !==
      undefined
  ) {
    if (
      !isFinoraBranchCredentialPortabilityAuthorityProvenanceV1(
        portabilityAuthorityProof,
      )
    ) {
      throw new Error(
        "Portable Branch Auth portability authority proof is invalid.",
      );
    }

    const portabilitySigner =
      portabilityAuthorityProof.verifiedControlSigner;

    const sourceSigner =
      evidence.verifiedControlSigner;

    if (
      portabilityAuthorityProof.sourceAuthorizationId !==
        evidence.authorizationId ||
      portabilityAuthorityProof.signedPortabilityAuthorityPackage
        .payload.sourceAuthorizationId !==
        evidence.authorizationId ||
      portabilityAuthorityProof.signedPortabilityAuthorityPackage
        .issuer.issuerId !==
        evidence.issuerId ||
      portabilityAuthorityProof.signedPortabilityAuthorityPackage
        .issuer.signingKeyId !==
        sourceSigner.signingKeyId ||
      portabilitySigner.issuerId !==
        sourceSigner.issuerId ||
      portabilitySigner.signingKeyId !==
        sourceSigner.signingKeyId ||
      portabilitySigner.algorithm !==
        sourceSigner.algorithm ||
      portabilitySigner.format !==
        sourceSigner.format ||
      portabilitySigner.publicKey !==
        sourceSigner.publicKey ||
      portabilitySigner.status !==
        sourceSigner.status ||
      portabilitySigner.validFrom !==
        sourceSigner.validFrom ||
      (
        portabilitySigner.validUntil ??
        undefined
      ) !==
        (
          sourceSigner.validUntil ??
          undefined
        ) ||
      portabilityAuthorityProof.verifiedAt !==
        evidence.verifiedAt
    ) {
      throw new Error(
        "Portable Branch Auth portability authority proof does not match the exact source authorization lineage and verified Control Center signer.",
      );
    }
  }

  assertCanonicalIsoTimestamp(
    evidence.verifiedAt,
    "sourceAuthorizationVerificationEvidence.verifiedAt",
  );

  if (
    evidence.schemaVersion !==
      1
  ) {
    throw new Error(
      "Portable Branch Auth source authorization verification evidence schemaVersion is unsupported.",
    );
  }

  if (
    evidence.verifiedControlSigner.issuerId !==
      evidence.issuerId
  ) {
    throw new Error(
      "Portable Branch Auth source authorization signer issuer does not match evidence issuer.",
    );
  }
}
export function validateFinoraPortableBranchAuthPayloadV1(
  value: unknown,
): asserts value is FinoraPortableBranchAuthPayloadV1 {
  const objectValue =
    assertObject(
      value,
      "portableBranchAuthPayload",
    );

  assertExactKeys(
    objectValue,
    [
      "schemaVersion",
      "authStateId",
      "sourceAuthorizationId",
      "sourceAuthorizationVerificationEvidence",
      "ownerId",
      "businessId",
      "branchId",
      "userId",
      "username",
      "canonicalUsername",
      "fullName",
      "role",
      "dataContext",
      "storageMode",
      "passwordVerifier",
      "securityVerifier",
      "authGeneration",
      "createdAt",
      "updatedAt",
    ],
    [
      "demoId",
      "branchCertificationKeyMaterial",
    ],
    "portableBranchAuthPayload",
  );

  if (
    objectValue.branchCertificationKeyMaterial !==
      undefined
  ) {
    assertFinoraBranchCertificationKeyMaterial(
      objectValue.branchCertificationKeyMaterial as
        FinoraBranchCertificationKeyMaterialV1,
    );
  }

  if (
    objectValue.schemaVersion !==
      FINORA_PORTABLE_BRANCH_AUTH_PAYLOAD_SCHEMA_VERSION
  ) {
    throw new Error(
      "Portable Branch Auth payload schemaVersion is unsupported.",
    );
  }

  assertNonEmptyString(
    objectValue.authStateId,
    "authStateId",
    256,
  );

  assertNonEmptyString(
    objectValue.sourceAuthorizationId,
    "sourceAuthorizationId",
  );

  validateFinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1(
    objectValue.sourceAuthorizationVerificationEvidence,
  );

  if (
    objectValue.sourceAuthorizationVerificationEvidence.authorizationId !==
      objectValue.sourceAuthorizationId
  ) {
    throw new Error(
      "Portable Branch Auth source authorization verification evidence does not match sourceAuthorizationId.",
    );
  }

  assertNonEmptyString(
    objectValue.ownerId,
    "ownerId",
    256,
  );

  assertNonEmptyString(
    objectValue.businessId,
    "businessId",
    256,
  );

  assertNonEmptyString(
    objectValue.branchId,
    "branchId",
    256,
  );

  assertNonEmptyString(
    objectValue.userId,
    "userId",
    256,
  );

  assertNonEmptyString(
    objectValue.username,
    "username",
    256,
  );

  assertCanonicalUsername(
    objectValue.canonicalUsername,
  );

  assertNonEmptyString(
    objectValue.fullName,
    "fullName",
    512,
  );

  assertNonEmptyString(
    objectValue.role,
    "role",
    128,
  );

  if (
    objectValue.dataContext !== "REAL" &&
    objectValue.dataContext !== "DEMO"
  ) {
    throw new Error(
      "dataContext is invalid.",
    );
  }

  if (
    objectValue.storageMode !== "LOCAL" &&
    objectValue.storageMode !== "USB"
  ) {
    throw new Error(
      "storageMode is invalid.",
    );
  }

  if (
    objectValue.dataContext === "DEMO"
  ) {
    assertNonEmptyString(
      objectValue.demoId,
      "demoId",
      256,
    );
  }
  else if (
    objectValue.demoId !== undefined
  ) {
    throw new Error(
      "demoId is not allowed for REAL data context.",
    );
  }

  validateFinoraPortableBranchAuthVerifierV1(
    objectValue.passwordVerifier,
    "passwordVerifier",
  );

  validateFinoraPortableBranchAuthVerifierV1(
    objectValue.securityVerifier,
    "securityVerifier",
  );

  if (
    !Number.isSafeInteger(
      objectValue.authGeneration,
    ) ||
    (
      objectValue.authGeneration as number
    ) < 1
  ) {
    throw new Error(
      "authGeneration must be a positive safe integer.",
    );
  }

  assertCanonicalIsoTimestamp(
    objectValue.createdAt,
    "createdAt",
  );

  assertCanonicalIsoTimestamp(
    objectValue.updatedAt,
    "updatedAt",
  );

  if (
    Date.parse(
      objectValue.updatedAt as string,
    ) <
    Date.parse(
      objectValue.createdAt as string,
    )
  ) {
    throw new Error(
      "updatedAt cannot precede createdAt.",
    );
  }
}

// ============================================================
// SERIALIZATION
// ============================================================

export function serializeFinoraPortableBranchAuthEnvelopeV1(
  envelope:
    FinoraPortableBranchAuthEnvelopeV1,
): string {
  validateFinoraPortableBranchAuthEnvelopeV1(
    envelope,
  );

  return JSON.stringify(
    envelope,
  );
}

export function parseFinoraPortableBranchAuthEnvelopeV1(
  serialized:
    string,
): FinoraPortableBranchAuthEnvelopeV1 {
  if (
    typeof serialized !== "string" ||
    serialized.length === 0
  ) {
    throw new Error(
      "Portable Branch Auth envelope is empty.",
    );
  }

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        serialized,
      );
  }
  catch {
    throw new Error(
      "Portable Branch Auth envelope is not valid JSON.",
    );
  }

  validateFinoraPortableBranchAuthEnvelopeV1(
    parsed,
  );

  return parsed;
}

// ============================================================
// END
// ============================================================