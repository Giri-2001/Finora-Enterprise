/* ============================================================
   FINORA ENTERPRISE OS

   ELECTRON CONTROL
   SERVER FIRST-LOGIN BOOTSTRAP VERIFIER

   RESPONSIBILITY:

   - Verify FINORA Server first-login signed bootstrap packages.
   - Pin the production bootstrap signing-key fingerprint.
   - Never trust a public key merely because the server response
     carries that public key.
   - Verify canonical payload bytes using ECDSA P-256 SHA-256.
   - Return only a verified payload to privileged main-process code.

   SECURITY:

   - MAIN PROCESS ONLY.
   - No password or Security Code is accepted here.
   - Public-authority fingerprint is pinned in the application.
   - Public key must independently hash to the pinned fingerprint.
   - signingKeyId must be derived from that exact fingerprint.
   - Signature must contain exactly 64 IEEE-P1363 bytes.
   - Invalid or malformed packages fail closed.

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */

import {
  createHash,
  createPublicKey,
  verify as nodeVerify,
} from "node:crypto";

// ============================================================
// PINNED PRODUCTION SERVER AUTHORITY
// ============================================================

export const FINORA_SERVER_FIRST_LOGIN_ISSUER_ID =
  "FINORA-SERVER-FIRST-LOGIN";

export const FINORA_SERVER_FIRST_LOGIN_PINNED_PUBLIC_KEY_FINGERPRINT =
  "fbd63b2cc51f75e976507921738426768ce649f1a442bf55c80ecb4815e6b207";

export const FINORA_SERVER_FIRST_LOGIN_PINNED_SIGNING_KEY_ID =
  "FINORA-BOOTSTRAP-FBD63B2CC51F75E97650792173842676";

const FINORA_SERVER_FIRST_LOGIN_ALGORITHM =
  "ECDSA_P256_SHA256";

const FINORA_SERVER_FIRST_LOGIN_PUBLIC_KEY_FORMAT =
  "SPKI_DER_BASE64";

const FINORA_SERVER_FIRST_LOGIN_SIGNATURE_ENCODING =
  "BASE64";

const FINORA_SERVER_FIRST_LOGIN_KIND =
  "FINORA_SERVER_FIRST_LOGIN_BOOTSTRAP";

const FINORA_SERVER_FIRST_LOGIN_SCHEMA_VERSION =
  1;

// ============================================================
// TYPES
// ============================================================

export interface FinoraServerFirstLoginBootstrapPayloadV1 {
  kind:
    typeof FINORA_SERVER_FIRST_LOGIN_KIND;

  authorityId:
    string;

  sourceAuthorizationId:
    string;

  credentialId:
    string;

  activationId:
    string;

  branchAccessGrantId:
    string;

  storageEntitlementId:
    string;

  authGeneration:
    number;

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

  businessName:
    string;

  branchName:
    string;

  storageMode:
    string;

  dataContext:
    "REAL";

  businessCode:
    null;

  branchCode:
    null;

  demoId:
    null;

  subscriptionId:
    string;

  subscriptionStatus:
    "ACTIVE";

  branchAccessType:
    "REGISTERED";

  accessMode:
    "ACTIVE";

  accessValidFrom:
    string;

  accessValidUntil:
    string;

  activationStatus:
    "ACTIVE";

  activationActivatedAt:
    string;

  activationCreatedAt:
    string;

  activationUpdatedAt:
    string;

  branchAccessCreatedAt:
    string;

  branchAccessUpdatedAt:
    string;

  registrationPayment:
    null;

  registrationCycle:
    null;

  demoRemarks:
    null;

  storageEntitlementStatus:
    "ACTIVE";

  storageEntitlementActivatedAt:
    string;

  storageEntitlementCreatedAt:
    string;

  storageEntitlementUpdatedAt:
    string;

  issuedAt:
    string;

  mustChangePassword:
    boolean;

  mustChangeSecurityCode:
    boolean;

  branchCertificationEnrollmentPolicy:
    "CREATE_ON_FIRST_VERIFIED_LOGIN";

  schemaVersion:
    1;
}

export interface FinoraServerFirstLoginPublicAuthorityV1 {
  issuerId:
    string;

  signingKeyId:
    string;

  algorithm:
    string;

  format:
    string;

  publicKey:
    string;

  publicKeyFingerprint:
    string;
}

export interface FinoraServerFirstLoginSignedBootstrapV1 {
  payload:
    FinoraServerFirstLoginBootstrapPayloadV1;

  issuer: {
    issuerId:
      string;

    signingKeyId:
      string;
  };

  signature: {
    algorithm:
      string;

    encoding:
      string;

    value:
      string;
  };

  publicAuthority:
    FinoraServerFirstLoginPublicAuthorityV1;

  schemaVersion:
    1;
}

export interface FinoraVerifiedServerFirstLoginBootstrapV1 {
  payload:
    FinoraServerFirstLoginBootstrapPayloadV1;

  issuerId:
    typeof FINORA_SERVER_FIRST_LOGIN_ISSUER_ID;

  signingKeyId:
    typeof FINORA_SERVER_FIRST_LOGIN_PINNED_SIGNING_KEY_ID;

  publicKeyFingerprint:
    typeof FINORA_SERVER_FIRST_LOGIN_PINNED_PUBLIC_KEY_FINGERPRINT;

  verifiedAt:
    string;

  schemaVersion:
    1;
}

// ============================================================
// BASIC VALIDATION
// ============================================================

function asObject(
  value:
    unknown,
): Record<string, unknown> | null {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as Record<string, unknown>;
}

function isNonEmptyString(
  value:
    unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isCanonicalIsoTimestamp(
  value:
    unknown,
): value is string {
  if (!isNonEmptyString(value)) {
    return false;
  }

  const parsed =
    Date.parse(value);

  if (!Number.isFinite(parsed)) {
    return false;
  }

  return (
    new Date(parsed).toISOString() ===
    value
  );
}

function decodeStrictBase64(
  value:
    unknown,
): Buffer | null {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.trim() !== value ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(value)
  ) {
    return null;
  }

  let decoded:
    Buffer;

  try {
    decoded =
      Buffer.from(
        value,
        "base64",
      );
  }
  catch {
    return null;
  }

  if (
    decoded.length === 0 ||
    decoded.toString("base64") !== value
  ) {
    return null;
  }

  return decoded;
}

// ============================================================
// CANONICALIZATION
//
// Must remain byte-for-byte compatible with the production API.
// Object keys are sorted recursively.
// ============================================================

export function canonicalizeFinoraServerFirstLoginBootstrapValue(
  value:
    unknown,
): string {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return (
      "[" +
      value
        .map(
          (item) =>
            canonicalizeFinoraServerFirstLoginBootstrapValue(
              item,
            ),
        )
        .join(",") +
      "]"
    );
  }

  if (
    typeof value === "object"
  ) {
    const objectValue =
      value as Record<string, unknown>;

    const keys =
      Object.keys(
        objectValue,
      ).sort();

    return (
      "{" +
      keys
        .map(
          (key) =>
            JSON.stringify(key) +
            ":" +
            canonicalizeFinoraServerFirstLoginBootstrapValue(
              objectValue[key],
            ),
        )
        .join(",") +
      "}"
    );
  }

  throw new Error(
    "FINORA Server first-login bootstrap canonical value is unsupported.",
  );
}

// ============================================================
// PAYLOAD VALIDATION
// ============================================================

function readBootstrapPayload(
  value:
    unknown,
): FinoraServerFirstLoginBootstrapPayloadV1 | null {
  const payload =
    asObject(
      value,
    );

  if (!payload) {
    return null;
  }

  const exactKeys = [
    "kind",
    "authorityId",
    "sourceAuthorizationId",
    "credentialId",
    "activationId",
    "branchAccessGrantId",
    "storageEntitlementId",
    "authGeneration",
    "ownerId",
    "businessId",
    "branchId",
    "userId",
    "username",
    "canonicalUsername",
    "fullName",
    "role",
    "businessName",
    "branchName",
    "storageMode",
    "dataContext",
    "businessCode",
    "branchCode",
    "demoId",
    "subscriptionId",
    "subscriptionStatus",
    "branchAccessType",
    "accessMode",
    "accessValidFrom",
    "accessValidUntil",
    "activationStatus",
    "activationActivatedAt",
    "activationCreatedAt",
    "activationUpdatedAt",
    "branchAccessCreatedAt",
    "branchAccessUpdatedAt",
    "registrationPayment",
    "registrationCycle",
    "demoRemarks",
    "storageEntitlementStatus",
    "storageEntitlementActivatedAt",
    "storageEntitlementCreatedAt",
    "storageEntitlementUpdatedAt",
    "issuedAt",
    "mustChangePassword",
    "mustChangeSecurityCode",
    "branchCertificationEnrollmentPolicy",
    "schemaVersion",
  ] as const;

  const actualKeys =
    Object.keys(
      payload,
    ).sort();

  const expectedKeys =
    [...exactKeys].sort();

  if (
    actualKeys.length !==
      expectedKeys.length ||
    actualKeys.some(
      (key, index) =>
        key !== expectedKeys[index],
    )
  ) {
    return null;
  }

  const requiredStringKeys = [
    "authorityId",
    "sourceAuthorizationId",
    "credentialId",
    "activationId",
    "branchAccessGrantId",
    "storageEntitlementId",
    "ownerId",
    "businessId",
    "branchId",
    "userId",
    "username",
    "canonicalUsername",
    "fullName",
    "role",
    "businessName",
    "branchName",
    "storageMode",
    "subscriptionId",
    "accessValidFrom",
    "accessValidUntil",
    "activationActivatedAt",
    "activationCreatedAt",
    "activationUpdatedAt",
    "branchAccessCreatedAt",
    "branchAccessUpdatedAt",
    "storageEntitlementActivatedAt",
    "storageEntitlementCreatedAt",
    "storageEntitlementUpdatedAt",
    "issuedAt",
  ] as const;

  for (
    const key of
    requiredStringKeys
  ) {
    if (
      !isNonEmptyString(
        payload[key],
      )
    ) {
      return null;
    }
  }

  const lifecycleTimestampKeys = [
    "accessValidFrom",
    "accessValidUntil",
    "activationActivatedAt",
    "activationCreatedAt",
    "activationUpdatedAt",
    "branchAccessCreatedAt",
    "branchAccessUpdatedAt",
    "storageEntitlementActivatedAt",
    "storageEntitlementCreatedAt",
    "storageEntitlementUpdatedAt",
    "issuedAt",
  ] as const;

  for (
    const key of
    lifecycleTimestampKeys
  ) {
    if (
      !isCanonicalIsoTimestamp(
        payload[key],
      )
    ) {
      return null;
    }
  }

  if (
    payload.kind !==
      FINORA_SERVER_FIRST_LOGIN_KIND ||
    payload.dataContext !==
      "REAL" ||
    payload.businessCode !==
      null ||
    payload.branchCode !==
      null ||
    payload.demoId !==
      null ||
    payload.subscriptionStatus !==
      "ACTIVE" ||
    payload.branchAccessType !==
      "REGISTERED" ||
    payload.accessMode !==
      "ACTIVE" ||
    payload.activationStatus !==
      "ACTIVE" ||
    payload.registrationPayment !==
      null ||
    payload.registrationCycle !==
      null ||
    payload.demoRemarks !==
      null ||
    payload.storageEntitlementStatus !==
      "ACTIVE" ||
    payload.branchCertificationEnrollmentPolicy !==
      "CREATE_ON_FIRST_VERIFIED_LOGIN" ||
    payload.schemaVersion !==
      FINORA_SERVER_FIRST_LOGIN_SCHEMA_VERSION ||
    !Number.isSafeInteger(
      payload.authGeneration,
    ) ||
    (
      payload.authGeneration as number
    ) <= 0 ||
    typeof payload.mustChangePassword !==
      "boolean" ||
    typeof payload.mustChangeSecurityCode !==
      "boolean"
  ) {
    return null;
  }

  const username =
    (
      payload.username as string
    ).trim();

  const canonicalUsername =
    username
      .normalize("NFKC")
      .toLowerCase();

  if (
    payload.canonicalUsername !==
      canonicalUsername
  ) {
    return null;
  }

  const accessValidFrom =
    Date.parse(
      payload.accessValidFrom as string,
    );

  const accessValidUntil =
    Date.parse(
      payload.accessValidUntil as string,
    );

  if (
    accessValidUntil <
      accessValidFrom
  ) {
    return null;
  }

  return structuredClone(
    payload,
  ) as unknown as FinoraServerFirstLoginBootstrapPayloadV1;
}

// ============================================================
// PINNED SIGNATURE VERIFICATION
// ============================================================

export function verifyFinoraServerFirstLoginSignedBootstrap(
  value:
    unknown,
): FinoraVerifiedServerFirstLoginBootstrapV1 | null {
  try {
    const signed =
      asObject(
        value,
      );

    if (
      !signed ||
      signed.schemaVersion !==
        FINORA_SERVER_FIRST_LOGIN_SCHEMA_VERSION
    ) {
      return null;
    }

    const issuer =
      asObject(
        signed.issuer,
      );

    const signature =
      asObject(
        signed.signature,
      );

    const publicAuthority =
      asObject(
        signed.publicAuthority,
      );

    if (
      !issuer ||
      !signature ||
      !publicAuthority
    ) {
      return null;
    }

    if (
      issuer.issuerId !==
        FINORA_SERVER_FIRST_LOGIN_ISSUER_ID ||
      issuer.signingKeyId !==
        FINORA_SERVER_FIRST_LOGIN_PINNED_SIGNING_KEY_ID ||
      publicAuthority.issuerId !==
        FINORA_SERVER_FIRST_LOGIN_ISSUER_ID ||
      publicAuthority.signingKeyId !==
        FINORA_SERVER_FIRST_LOGIN_PINNED_SIGNING_KEY_ID ||
      publicAuthority.algorithm !==
        FINORA_SERVER_FIRST_LOGIN_ALGORITHM ||
      publicAuthority.format !==
        FINORA_SERVER_FIRST_LOGIN_PUBLIC_KEY_FORMAT ||
      publicAuthority.publicKeyFingerprint !==
        FINORA_SERVER_FIRST_LOGIN_PINNED_PUBLIC_KEY_FINGERPRINT ||
      signature.algorithm !==
        FINORA_SERVER_FIRST_LOGIN_ALGORITHM ||
      signature.encoding !==
        FINORA_SERVER_FIRST_LOGIN_SIGNATURE_ENCODING
    ) {
      return null;
    }

    const publicKeyBytes =
      decodeStrictBase64(
        publicAuthority.publicKey,
      );

    const signatureBytes =
      decodeStrictBase64(
        signature.value,
      );

    if (
      !publicKeyBytes ||
      !signatureBytes ||
      signatureBytes.length !==
        64
    ) {
      return null;
    }

    const calculatedFingerprint =
      createHash(
        "sha256",
      )
        .update(
          publicKeyBytes,
        )
        .digest(
          "hex",
        );

    if (
      calculatedFingerprint !==
        FINORA_SERVER_FIRST_LOGIN_PINNED_PUBLIC_KEY_FINGERPRINT
    ) {
      return null;
    }

    const calculatedSigningKeyId =
      "FINORA-BOOTSTRAP-" +
      calculatedFingerprint
        .slice(
          0,
          32,
        )
        .toUpperCase();

    if (
      calculatedSigningKeyId !==
        FINORA_SERVER_FIRST_LOGIN_PINNED_SIGNING_KEY_ID
    ) {
      return null;
    }

    const parsedPublicKey =
      createPublicKey({
        key:
          publicKeyBytes,

        format:
          "der",

        type:
          "spki",
      });

    if (
      parsedPublicKey.asymmetricKeyType !==
        "ec"
    ) {
      return null;
    }

    const namedCurve =
      parsedPublicKey
        .asymmetricKeyDetails
        ?.namedCurve;

    if (
      namedCurve !==
        "prime256v1" &&
      namedCurve !==
        "P-256"
    ) {
      return null;
    }

    const payload =
      readBootstrapPayload(
        signed.payload,
      );

    if (!payload) {
      return null;
    }

    const canonicalPayload =
      canonicalizeFinoraServerFirstLoginBootstrapValue(
        signed.payload,
      );

    const signatureValid =
      nodeVerify(
        "sha256",
        Buffer.from(
          canonicalPayload,
          "utf8",
        ),
        {
          key:
            parsedPublicKey,

          dsaEncoding:
            "ieee-p1363",
        },
        signatureBytes,
      );

    if (!signatureValid) {
      return null;
    }

    return {
      payload,

      issuerId:
        FINORA_SERVER_FIRST_LOGIN_ISSUER_ID,

      signingKeyId:
        FINORA_SERVER_FIRST_LOGIN_PINNED_SIGNING_KEY_ID,

      publicKeyFingerprint:
        FINORA_SERVER_FIRST_LOGIN_PINNED_PUBLIC_KEY_FINGERPRINT,

      verifiedAt:
        new Date()
          .toISOString(),

      schemaVersion:
        1,
    };
  }
  catch {
    return null;
  }
}