import {
  FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,
} from "./finoraBranchAccessPackage.types.js";

import type {
  FinoraBranchPortabilityAuthorityPayloadV1,
} from "./finoraBranchPortabilityAuthorityPackage.types.js";

import type {
  FinoraBranchTrustedControlPublicKey,
  FinoraSignedBranchScopeControlPackage,
} from "./finoraSignedControlPackageVerifier.js";

/**
 * Signed reusable portability package with the domain payload
 * narrowed after structural validation.
 */
export type FinoraBranchCredentialPortabilityAuthoritySignedPackageV1 =
  FinoraSignedBranchScopeControlPackage & {
    payload:
      FinoraBranchPortabilityAuthorityPayloadV1;
  };

export interface FinoraBranchCredentialPortabilityAuthorityProvenanceV1 {
  sourceAuthorizationId:
    string;

  signedPortabilityAuthorityPackage:
    FinoraBranchCredentialPortabilityAuthoritySignedPackageV1;

  verifiedControlSigner:
    FinoraBranchTrustedControlPublicKey;

  verifiedAt:
    string;

  schemaVersion:
    1;
}

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

function hasText(
  value:
    unknown,

  maxLength:
    number,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0 &&
    value.length <=
      maxLength
  );
}

function hasExactKeys(
  value:
    Record<string, unknown>,

  requiredKeys:
    readonly string[],

  optionalKeys:
    readonly string[] = [],
): boolean {

  const allowed =
    new Set([
      ...requiredKeys,
      ...optionalKeys,
    ]);

  for (
    const requiredKey of
    requiredKeys
  ) {
    if (
      !Object.prototype.hasOwnProperty.call(
        value,
        requiredKey,
      )
    ) {
      return false;
    }
  }

  return Object.keys(
    value,
  ).every(
    (
      key,
    ) =>
      allowed.has(
        key,
      ),
  );
}

function isCanonicalTimestamp(
  value:
    unknown,
): value is string {

  if (
    typeof value !==
      "string" ||
    value.trim().length ===
      0
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

function isRole(
  value:
    unknown,
): boolean {

  return (
    value ===
      "ADMIN" ||
    value ===
      "MANAGER" ||
    value ===
      "COLLECTOR" ||
    value ===
      "VIEWER"
  );
}

function isStorageMode(
  value:
    unknown,
): boolean {

  return (
    value ===
      "LOCAL" ||
    value ===
      "USB"
  );
}

function isVerifiedControlSigner(
  value:
    unknown,
): value is FinoraBranchTrustedControlPublicKey {

  if (
    !isRecord(
      value,
    ) ||
    !hasExactKeys(
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
      [
        "validUntil",
      ],
    ) ||
    !hasText(
      value.issuerId,
      256,
    ) ||
    !hasText(
      value.signingKeyId,
      256,
    ) ||
    value.algorithm !==
      "ECDSA_P256_SHA256" ||
    value.format !==
      "SPKI_DER_BASE64" ||
    !hasText(
      value.publicKey,
      65536,
    ) ||
    (
      value.status !==
        "ACTIVE" &&
      value.status !==
        "RETIRED"
    ) ||
    !isCanonicalTimestamp(
      value.validFrom,
    ) ||
    (
      value.validUntil !==
        undefined &&
      !isCanonicalTimestamp(
        value.validUntil,
      )
    )
  ) {
    return false;
  }

  return (
    value.validUntil ===
      undefined ||
    Date.parse(
      value.validUntil,
    ) >=
      Date.parse(
        value.validFrom,
      )
  );
}

function isBranchOnlyTarget(
  value:
    unknown,
): boolean {

  return (
    isRecord(
      value,
    ) &&
    hasExactKeys(
      value,
      [
        "ownerId",
        "businessId",
        "branchId",
      ],
    ) &&
    hasText(
      value.ownerId,
      256,
    ) &&
    hasText(
      value.businessId,
      256,
    ) &&
    hasText(
      value.branchId,
      256,
    )
  );
}

function isPortabilityPayload(
  value:
    unknown,
): value is FinoraBranchPortabilityAuthorityPayloadV1 {

  if (
    !isRecord(
      value,
    ) ||
    !hasExactKeys(
      value,
      [
        "sourceAuthorizationId",
        "userId",
        "username",
        "role",
        "ownerId",
        "businessId",
        "branchId",
        "storageMode",
        "dataContext",
        "sourceAuthorizationMethod",
        "schemaVersion",
      ],
      [
        "demoId",
      ],
    ) ||
    !hasText(
      value.sourceAuthorizationId,
      256,
    ) ||
    !value.sourceAuthorizationId.startsWith(
      "FINORA-CREDENTIAL-ENROLLMENT-",
    ) ||
    !hasText(
      value.userId,
      256,
    ) ||
    !hasText(
      value.username,
      128,
    ) ||
    !isRole(
      value.role,
    ) ||
    !hasText(
      value.ownerId,
      256,
    ) ||
    !hasText(
      value.businessId,
      256,
    ) ||
    !hasText(
      value.branchId,
      256,
    ) ||
    !isStorageMode(
      value.storageMode,
    ) ||
    (
      value.dataContext !==
        "REAL" &&
      value.dataContext !==
        "DEMO"
    ) ||
    value.sourceAuthorizationMethod !==
      FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD ||
    value.schemaVersion !==
      1
  ) {
    return false;
  }

  return value.dataContext ===
    "REAL"
    ? value.demoId ===
        undefined
    : hasText(
        value.demoId,
        256,
      );
}

function isSignedPortabilityAuthorityPackage(
  value:
    unknown,
): value is FinoraBranchCredentialPortabilityAuthoritySignedPackageV1 {

  if (
    !isRecord(
      value,
    ) ||
    !hasText(
      value.packageId,
      256,
    ) ||
    !value.packageId.startsWith(
      "FINORA-BRANCH-PORTABILITY-",
    ) ||
    value.purpose !==
      "BRANCH_PORTABILITY_AUTHORITY" ||
    !isRecord(
      value.issuer,
    ) ||
    value.issuer.type !==
      "FINORA_CONTROL_CENTER" ||
    !hasText(
      value.issuer.issuerId,
      256,
    ) ||
    !hasText(
      value.issuer.signingKeyId,
      256,
    ) ||
    !isBranchOnlyTarget(
      value.target,
    ) ||
    !isCanonicalTimestamp(
      value.issuedAt,
    ) ||
    (
      value.expiresAt !==
        undefined &&
      !isCanonicalTimestamp(
        value.expiresAt,
      )
    ) ||
    (
      value.expiresAt !==
        undefined &&
      Date.parse(
        value.expiresAt,
      ) <
        Date.parse(
          value.issuedAt,
        )
    ) ||
    !Number.isSafeInteger(
      value.sequence,
    ) ||
    (
      value.sequence as
        number
    ) <=
      0 ||
    value.payloadVersion !==
      1 ||
    !isPortabilityPayload(
      value.payload,
    ) ||
    !isRecord(
      value.payloadDigest,
    ) ||
    value.payloadDigest.algorithm !==
      "SHA-256" ||
    typeof value.payloadDigest.value !==
      "string" ||
    !/^[0-9a-f]{64}$/.test(
      value.payloadDigest.value,
    ) ||
    !isRecord(
      value.signature,
    ) ||
    value.signature.algorithm !==
      "ECDSA_P256_SHA256" ||
    value.signature.encoding !==
      "IEEE_P1363" ||
    !hasText(
      value.signature.signingKeyId,
      256,
    ) ||
    !hasText(
      value.signature.value,
      65536,
    ) ||
    value.signature.signingKeyId !==
      value.issuer.signingKeyId ||
    value.schemaVersion !==
      1
  ) {
    return false;
  }

  const target =
    value.target as
      Record<string, unknown>;

  const payload =
    value.payload;

  return (
    payload.ownerId ===
      target.ownerId &&
    payload.businessId ===
      target.businessId &&
    payload.branchId ===
      target.branchId
  );
}

export function isFinoraBranchCredentialPortabilityAuthorityProvenanceV1(
  value:
    unknown,
): value is FinoraBranchCredentialPortabilityAuthorityProvenanceV1 {

  if (
    !isRecord(
      value,
    ) ||
    !hasExactKeys(
      value,
      [
        "sourceAuthorizationId",
        "signedPortabilityAuthorityPackage",
        "verifiedControlSigner",
        "verifiedAt",
        "schemaVersion",
      ],
    ) ||
    !hasText(
      value.sourceAuthorizationId,
      256,
    ) ||
    !value.sourceAuthorizationId.startsWith(
      "FINORA-CREDENTIAL-ENROLLMENT-",
    ) ||
    !isSignedPortabilityAuthorityPackage(
      value.signedPortabilityAuthorityPackage,
    ) ||
    !isVerifiedControlSigner(
      value.verifiedControlSigner,
    ) ||
    !isCanonicalTimestamp(
      value.verifiedAt,
    ) ||
    value.schemaVersion !==
      1
  ) {
    return false;
  }

  const signedPackage =
    value.signedPortabilityAuthorityPackage;

  const verifiedSigner =
    value.verifiedControlSigner;

  return (
    signedPackage.payload.sourceAuthorizationId ===
      value.sourceAuthorizationId &&
    signedPackage.issuer.issuerId ===
      verifiedSigner.issuerId &&
    signedPackage.issuer.signingKeyId ===
      verifiedSigner.signingKeyId
  );
}