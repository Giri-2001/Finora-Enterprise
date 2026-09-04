// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL PLANE
// SIGNED CONTROL PACKAGE VERIFICATION
//
// RESPONSIBILITY:
//
// - Validate FINORA signed package structure
// - Validate package/payload digest integrity
// - Resolve trusted Control Center public key
// - Validate package acceptance window
// - Validate package target binding
// - Verify ECDSA P-256 SHA-256 signature
//
// IMPORTANT:
//
// - VERIFY ONLY.
// - PUBLIC keys only.
// - No private key material.
// - No package signing.
// - No persistence.
// - No sequence mutation.
// - No replay-state mutation.
// - No activation mutation.
// - No wallet mutation.
// - No pricing mutation.
//
// Replay and monotonic sequence persistence are enforced later
// by the package import/apply boundary.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  FinoraControlPackageTarget,
  FinoraControlVerificationFailure,
  FinoraControlVerificationResult,
  FinoraSignedControlPackage,
  FinoraUnsignedControlPackage,
} from "../../types/control-plane/finoraControlPackage.types";

import type {
  FinoraControlTrustStore,
  FinoraControlTrustedPublicKey,
} from "../../types/control-plane/finoraControlTrust.types";

import {
  canonicalizeFinoraUnsignedControlPackage,
  createFinoraControlPayloadDigest,
  encodeFinoraCanonicalUtf8,
} from "./finoraControlCanonicalization";

// ============================================================
// CONSTANTS
// ============================================================

const SIGNATURE_ALGORITHM =
  "ECDSA_P256_SHA256" as const;

const SIGNATURE_ENCODING =
  "IEEE_P1363" as const;

const CANONICALIZATION =
  "FINORA_CANONICAL_JSON_V1" as const;

const PUBLIC_KEY_FORMAT =
  "SPKI_DER_BASE64" as const;

// ============================================================
// TARGET
// ============================================================

export interface FinoraExpectedControlTarget {

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  installationId?:
    string;
}

// ============================================================
// HELPERS
// ============================================================

function failure(
  reason:
    FinoraControlVerificationFailure,

  error:
    string,

  packageId?:
    string,
): FinoraControlVerificationResult {

  return {
    valid:
      false,

    reason,

    error,

    packageId,
  };
}

function parseIsoTimestamp(
  value: string,
): number | undefined {

  const parsed =
    Date.parse(value);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
}

function decodeBase64(
  value: string,
): Uint8Array {

  let binary:
    string;

  try {
    binary =
      globalThis.atob(
        value,
      );
  } catch {
    throw new Error(
      "Invalid Base64 data.",
    );
  }


  const bytes =
    new Uint8Array(
      binary.length,
    );


  for (
    let index = 0;
    index < binary.length;
    index += 1
  ) {
    bytes[index] =
      binary.charCodeAt(
        index,
      );
  }


  return bytes;
}

function copyToArrayBuffer(
  bytes: Uint8Array,
): ArrayBuffer {

  const copy =
    new Uint8Array(
      bytes.byteLength,
    );

  copy.set(
    bytes,
  );

  return copy.buffer;
}

function targetsMatch(
  actual:
    FinoraControlPackageTarget,

  expected:
    FinoraExpectedControlTarget,
): boolean {

  if (
    actual.ownerId !==
      expected.ownerId ||
    actual.businessId !==
      expected.businessId ||
    actual.branchId !==
      expected.branchId
  ) {
    return false;
  }


  if (
    expected.installationId &&
    actual.installationId !==
      expected.installationId
  ) {
    return false;
  }


  return true;
}

function findTrustedKey(
  trustStore:
    FinoraControlTrustStore,

  controlPackage:
    FinoraSignedControlPackage<object>,
): FinoraControlTrustedPublicKey | undefined {

  return trustStore.keys.find(
    (key) =>
      key.issuerId ===
        controlPackage.issuer.issuerId &&
      key.signingKeyId ===
        controlPackage.signature.signingKeyId,
  );
}

function unsignedPackageFromSigned<
  TPayload extends object,
>(
  controlPackage:
    FinoraSignedControlPackage<TPayload>,
): FinoraUnsignedControlPackage<TPayload> {

  const {
    signature: _signature,
    ...unsignedPackage
  } =
    controlPackage;

  return unsignedPackage;
}

// ============================================================
// TRUSTED PUBLIC KEY IMPORT
// ============================================================

async function importTrustedPublicKey(
  key:
    FinoraControlTrustedPublicKey,
): Promise<CryptoKey> {

  if (
    !globalThis.crypto?.subtle
  ) {
    throw new Error(
      "FINORA secure cryptographic runtime is unavailable.",
    );
  }


  if (
    key.format !==
      PUBLIC_KEY_FORMAT
  ) {
    throw new Error(
      "Unsupported FINORA public-key format.",
    );
  }


  const publicKeyBytes =
    decodeBase64(
      key.publicKey,
    );


  return globalThis.crypto.subtle.importKey(
    "spki",
    copyToArrayBuffer(
      publicKeyBytes,
    ),
    {
      name:
        "ECDSA",

      namedCurve:
        "P-256",
    },
    false,
    [
      "verify",
    ],
  );
}

// ============================================================
// PUBLIC VERIFIER
// ============================================================

export async function verifyFinoraSignedControlPackage<
  TPayload extends object,
>(
  controlPackage:
    FinoraSignedControlPackage<TPayload>,

  trustStore:
    FinoraControlTrustStore,

  expectedTarget?:
    FinoraExpectedControlTarget,

  now:
    Date = new Date(),
): Promise<
  FinoraControlVerificationResult
> {

  const packageId =
    controlPackage.packageId;


  // ----------------------------------------------------------
  // 1. BASIC STRUCTURE
  // ----------------------------------------------------------

  if (
    controlPackage.schemaVersion !== 1 ||
    !packageId ||
    !controlPackage.issuer?.issuerId ||
    !controlPackage.issuer?.signingKeyId ||
    !controlPackage.target ||
    !controlPackage.payload ||
    !Number.isSafeInteger(
      controlPackage.sequence,
    ) ||
    controlPackage.sequence <= 0 ||
    !Number.isSafeInteger(
      controlPackage.payloadVersion,
    ) ||
    controlPackage.payloadVersion <= 0
  ) {
    return failure(
      "MALFORMED_PACKAGE",
      "FINORA Control Package structure is invalid.",
      packageId,
    );
  }


  if (
    controlPackage.issuer.type !==
      "FINORA_CONTROL_CENTER"
  ) {
    return failure(
      "UNTRUSTED_ISSUER",
      "FINORA Control Package issuer is not trusted.",
      packageId,
    );
  }


  // ----------------------------------------------------------
  // 2. CRYPTO CONTRACT
  // ----------------------------------------------------------

  if (
    controlPackage.signature.algorithm !==
      SIGNATURE_ALGORITHM ||
    controlPackage.signature.encoding !==
      SIGNATURE_ENCODING ||
    controlPackage.signature.canonicalization !==
      CANONICALIZATION ||
    controlPackage.payloadDigest.algorithm !==
      "SHA-256"
  ) {
    return failure(
      "UNSUPPORTED_ALGORITHM",
      "FINORA Control Package cryptographic contract is unsupported.",
      packageId,
    );
  }


  if (
    controlPackage.issuer.signingKeyId !==
      controlPackage.signature.signingKeyId
  ) {
    return failure(
      "MALFORMED_PACKAGE",
      "FINORA issuer and signature key identifiers do not match.",
      packageId,
    );
  }


  // ----------------------------------------------------------
  // 3. TIMESTAMPS
  // ----------------------------------------------------------

  const issuedAt =
    parseIsoTimestamp(
      controlPackage.issuedAt,
    );

  if (issuedAt === undefined) {
    return failure(
      "MALFORMED_PACKAGE",
      "FINORA Control Package issuedAt timestamp is invalid.",
      packageId,
    );
  }


  const currentTime =
    now.getTime();

  if (!Number.isFinite(currentTime)) {
    return failure(
      "MALFORMED_PACKAGE",
      "FINORA verification clock is invalid.",
      packageId,
    );
  }


  if (
    controlPackage.validity?.notBefore
  ) {

    const notBefore =
      parseIsoTimestamp(
        controlPackage.validity.notBefore,
      );

    if (notBefore === undefined) {
      return failure(
        "MALFORMED_PACKAGE",
        "FINORA Control Package notBefore timestamp is invalid.",
        packageId,
      );
    }


    if (currentTime < notBefore) {
      return failure(
        "NOT_YET_VALID",
        "FINORA Control Package is not valid yet.",
        packageId,
      );
    }
  }


  if (
    controlPackage.validity?.expiresAt
  ) {

    const expiresAt =
      parseIsoTimestamp(
        controlPackage.validity.expiresAt,
      );

    if (expiresAt === undefined) {
      return failure(
        "MALFORMED_PACKAGE",
        "FINORA Control Package expiresAt timestamp is invalid.",
        packageId,
      );
    }


    if (currentTime > expiresAt) {
      return failure(
        "PACKAGE_EXPIRED",
        "FINORA Control Package has expired.",
        packageId,
      );
    }
  }


  // ----------------------------------------------------------
  // 4. TARGET BINDING
  // ----------------------------------------------------------

  if (
    expectedTarget &&
    !targetsMatch(
      controlPackage.target,
      expectedTarget,
    )
  ) {
    return failure(
      "TARGET_MISMATCH",
      "FINORA Control Package does not belong to this installation or branch.",
      packageId,
    );
  }


  // ----------------------------------------------------------
  // 5. PAYLOAD DIGEST
  // ----------------------------------------------------------

  let calculatedDigest:
    string;

  try {

    calculatedDigest =
      (
        await createFinoraControlPayloadDigest(
          controlPackage.payload,
        )
      ).value;

  } catch (error) {

    return failure(
      "MALFORMED_PACKAGE",
      error instanceof Error
        ? error.message
        : "Unable to calculate FINORA payload digest.",
      packageId,
    );
  }


  if (
    calculatedDigest !==
      controlPackage.payloadDigest.value.toLowerCase()
  ) {
    return failure(
      "INVALID_PAYLOAD_DIGEST",
      "FINORA Control Package payload integrity check failed.",
      packageId,
    );
  }


  // ----------------------------------------------------------
  // 6. TRUST STORE
  // ----------------------------------------------------------

  const trustedKey =
    findTrustedKey(
      trustStore,
      controlPackage as
        FinoraSignedControlPackage<object>,
    );


  if (!trustedKey) {
    return failure(
      "UNKNOWN_SIGNING_KEY",
      "FINORA Control Package signing key is not trusted.",
      packageId,
    );
  }


  if (
    trustedKey.status ===
      "REVOKED"
  ) {
    return failure(
      "SIGNING_KEY_REVOKED",
      "FINORA Control Package signing key has been revoked.",
      packageId,
    );
  }


  if (
    trustedKey.algorithm !==
      SIGNATURE_ALGORITHM
  ) {
    return failure(
      "UNSUPPORTED_ALGORITHM",
      "FINORA trusted signing key algorithm is unsupported.",
      packageId,
    );
  }


  const keyValidFrom =
    parseIsoTimestamp(
      trustedKey.validFrom,
    );


  if (
    keyValidFrom === undefined
  ) {
    return failure(
      "SIGNING_KEY_NOT_VALID",
      "FINORA trusted signing key validity is invalid.",
      packageId,
    );
  }


  if (
    issuedAt <
      keyValidFrom
  ) {
    return failure(
      "SIGNING_KEY_NOT_VALID",
      "FINORA Control Package was issued before its signing key became valid.",
      packageId,
    );
  }


  if (
    trustedKey.validUntil
  ) {

    const keyValidUntil =
      parseIsoTimestamp(
        trustedKey.validUntil,
      );

    if (
      keyValidUntil === undefined ||
      issuedAt >
        keyValidUntil
    ) {
      return failure(
        "SIGNING_KEY_NOT_VALID",
        "FINORA Control Package was issued outside its signing-key validity.",
        packageId,
      );
    }
  }


  // ----------------------------------------------------------
  // 7. CRYPTOGRAPHIC SIGNATURE
  // ----------------------------------------------------------

  try {

    const publicKey =
      await importTrustedPublicKey(
        trustedKey,
      );


    const unsignedPackage =
      unsignedPackageFromSigned(
        controlPackage,
      );


    const canonicalPackage =
      canonicalizeFinoraUnsignedControlPackage(
        unsignedPackage,
      );


    const packageBytes =
      encodeFinoraCanonicalUtf8(
        canonicalPackage,
      );


    const signatureBytes =
      decodeBase64(
        controlPackage.signature.value,
      );


    /**
     * P-256 IEEE-P1363 signatures are exactly:
     *
     * 32 bytes R
     * +
     * 32 bytes S
     */
    if (
      signatureBytes.byteLength !==
        64
    ) {
      return failure(
        "INVALID_SIGNATURE",
        "FINORA Control Package signature length is invalid.",
        packageId,
      );
    }


    const verified =
      await globalThis.crypto.subtle.verify(
        {
          name:
            "ECDSA",

          hash:
            "SHA-256",
        },
        publicKey,
        copyToArrayBuffer(
          signatureBytes,
        ),
        copyToArrayBuffer(
          packageBytes,
        ),
      );


    if (!verified) {
      return failure(
        "INVALID_SIGNATURE",
        "FINORA Control Package signature verification failed.",
        packageId,
      );
    }

  } catch (error) {

    return failure(
      "INVALID_SIGNATURE",
      error instanceof Error
        ? error.message
        : "Unable to verify FINORA Control Package signature.",
      packageId,
    );
  }


  // ----------------------------------------------------------
  // SUCCESS
  // ----------------------------------------------------------

  return {
    valid:
      true,

    packageId,

    purpose:
      controlPackage.purpose,

    signingKeyId:
      controlPackage.signature.signingKeyId,
  };
}

// ============================================================
// END
// ============================================================