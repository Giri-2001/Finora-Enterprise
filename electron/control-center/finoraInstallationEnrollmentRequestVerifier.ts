/* ===========================================================
   FINORA ENTERPRISE OS™

   INSTALLATION ENROLLMENT REQUEST VERIFIER

   MODULE  : Control Center
   LAYER   : Main-Process Verification Authority
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Accept one untrusted parsed Enrollment Request file value
   - Enforce the exact FINORA enrollment-request file shape
   - Validate public native installation-binding metadata
   - Recompute the SHA-256 SPKI fingerprint
   - Verify the canonical bindingKeyId derivation
   - Verify the P-256 public key
   - Canonicalize the exact enrollment payload
   - Verify the native IEEE-P1363 possession signature
   - Return a verified immutable installation target

   SECURITY:

   - CONTROL CENTER MAIN PROCESS ONLY.
   - No renderer trust.
   - No filesystem authority.
   - No recipient private-key access.
   - No Control Center signing in this service.
   - Verification does NOT authorize REGISTERED / DEMO.
   - Verification does NOT grant LOCAL / USB storage.
   - Verification does NOT persist installation identity.
   - Approval remains a separate Control Center authority step.
=========================================================== */

import {
  assertFinoraP256SpkiPublicKey,
  createFinoraInstallationBindingFingerprint,
  verifyFinoraInstallationBindingCanonicalValue,
} from "../control/finoraInstallationBindingCrypto.js";

import {
  canonicalizeFinoraControlCenterValue,
} from "./finoraControlCenterCanonicalization.js";

// ============================================================
// CONSTANTS
// ============================================================

export const FINORA_INSTALLATION_ENROLLMENT_REQUEST_FILE_FORMAT =
  "FINORA_INSTALLATION_ENROLLMENT_REQUEST_V1" as const;

// ============================================================
// TYPES
// ============================================================

type NativePublicBinding =
  Parameters<
    typeof verifyFinoraInstallationBindingCanonicalValue
  >[2];

export interface FinoraVerifiedInstallationEnrollmentTarget {

  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  publicKeyFingerprint:
    string;

  schemaVersion:
    1;
}

export interface FinoraVerifiedInstallationEnrollmentRequest {

  requestId:
    string;

  deviceBinding:
    NativePublicBinding;

  requestedAt:
    string;

  target:
    FinoraVerifiedInstallationEnrollmentTarget;

  schemaVersion:
    1;
}

export type FinoraInstallationEnrollmentVerificationResult =
  | {
      success:
        true;

      data:
        FinoraVerifiedInstallationEnrollmentRequest;
    }
  | {
      success:
        false;

      error:
        string;
    };

// ============================================================
// HELPERS
// ============================================================

function failure(
  error:
    string,
): FinoraInstallationEnrollmentVerificationResult {

  return {
    success:
      false,

    error,
  };
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
  maxLength =
    512,
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
  expectedKeys:
    readonly string[],
): boolean {

  const actual =
    Object.keys(
      value,
    ).sort();

  const expected =
    [...expectedKeys].sort();

  if (
    actual.length !==
      expected.length
  ) {
    return false;
  }

  return actual.every(
    (
      key,
      index,
    ) =>
      key ===
        expected[index],
  );
}

function isCanonicalIsoTimestamp(
  value:
    unknown,
): value is string {

  if (!hasText(value, 64)) {
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

function isCanonicalBase64(
  value:
    unknown,
  expectedBytes?:
    number,
): value is string {

  if (
    typeof value !==
      "string" ||
    value.length ===
      0
  ) {
    return false;
  }

  try {
    const bytes =
      Buffer.from(
        value,
        "base64",
      );

    if (
      bytes.byteLength ===
        0 ||
      bytes.toString(
        "base64",
      ) !==
        value
    ) {
      return false;
    }

    if (
      expectedBytes !==
        undefined &&
      bytes.byteLength !==
        expectedBytes
    ) {
      return false;
    }

    return true;

  } catch {
    return false;
  }
}

// ============================================================
// VERIFY
// ============================================================

export function verifyFinoraInstallationEnrollmentRequestFile(
  value:
    unknown,
): FinoraInstallationEnrollmentVerificationResult {

  // ----------------------------------------------------------
  // OUTER FILE
  // ----------------------------------------------------------

  if (!isRecord(value)) {
    return failure(
      "FINORA Installation Enrollment Request file must be an object.",
    );
  }

  if (
    !hasExactKeys(
      value,
      [
        "format",
        "request",
        "schemaVersion",
      ],
    )
  ) {
    return failure(
      "FINORA Installation Enrollment Request file structure is invalid.",
    );
  }

  if (
    value.format !==
      FINORA_INSTALLATION_ENROLLMENT_REQUEST_FILE_FORMAT ||
    value.schemaVersion !==
      1
  ) {
    return failure(
      "FINORA Installation Enrollment Request file format is unsupported.",
    );
  }

  const request =
    value.request;

  if (!isRecord(request)) {
    return failure(
      "FINORA Installation Enrollment Request is invalid.",
    );
  }

  if (
    !hasExactKeys(
      request,
      [
        "payload",
        "signature",
        "schemaVersion",
      ],
    ) ||
    request.schemaVersion !==
      1
  ) {
    return failure(
      "FINORA Installation Enrollment Request structure is invalid.",
    );
  }

  // ----------------------------------------------------------
  // PAYLOAD
  // ----------------------------------------------------------

  const payload =
    request.payload;

  if (!isRecord(payload)) {
    return failure(
      "FINORA Installation Enrollment payload is invalid.",
    );
  }

  if (
    !hasExactKeys(
      payload,
      [
        "requestId",
        "deviceBinding",
        "requestedAt",
        "schemaVersion",
      ],
    ) ||
    payload.schemaVersion !==
      1
  ) {
    return failure(
      "FINORA Installation Enrollment payload structure is invalid.",
    );
  }

  if (
    !hasText(
      payload.requestId,
      256,
    ) ||
    !payload.requestId.startsWith(
      "FINORA-ENROLLMENT-",
    )
  ) {
    return failure(
      "FINORA Installation Enrollment requestId is invalid.",
    );
  }

  if (
    !isCanonicalIsoTimestamp(
      payload.requestedAt,
    )
  ) {
    return failure(
      "FINORA Installation Enrollment requestedAt is invalid.",
    );
  }

  // ----------------------------------------------------------
  // PUBLIC DEVICE BINDING
  // ----------------------------------------------------------

  const deviceBinding =
    payload.deviceBinding;

  if (!isRecord(deviceBinding)) {
    return failure(
      "FINORA Installation Enrollment device binding is invalid.",
    );
  }

  if (
    !hasExactKeys(
      deviceBinding,
      [
        "installationId",
        "bindingKeyId",
        "platform",
        "algorithm",
        "publicKeyFormat",
        "publicKey",
        "fingerprintAlgorithm",
        "publicKeyFingerprint",
        "createdAt",
        "schemaVersion",
      ],
    )
  ) {
    return failure(
      "FINORA Installation Enrollment device-binding structure is invalid.",
    );
  }

  if (
    !hasText(
      deviceBinding.installationId,
      256,
    ) ||
    !hasText(
      deviceBinding.bindingKeyId,
      128,
    ) ||
    deviceBinding.platform !==
      "WINDOWS" ||
    deviceBinding.algorithm !==
      "ECDSA_P256_SHA256" ||
    deviceBinding.publicKeyFormat !==
      "SPKI_DER_BASE64" ||
    deviceBinding.fingerprintAlgorithm !==
      "SHA-256" ||
    deviceBinding.schemaVersion !==
      1 ||
    !isCanonicalIsoTimestamp(
      deviceBinding.createdAt,
    )
  ) {
    return failure(
      "FINORA Installation Enrollment device-binding metadata is invalid.",
    );
  }

  if (
    !isCanonicalBase64(
      deviceBinding.publicKey,
    )
  ) {
    return failure(
      "FINORA Installation Enrollment public key is invalid.",
    );
  }

  if (
    !isCanonicalSha256Fingerprint(
      deviceBinding.publicKeyFingerprint,
    )
  ) {
    return failure(
      "FINORA Installation Enrollment public-key fingerprint is invalid.",
    );
  }

  // ----------------------------------------------------------
  // P-256 PUBLIC KEY
  // ----------------------------------------------------------

  try {
    assertFinoraP256SpkiPublicKey(
      deviceBinding.publicKey,
    );
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "FINORA Installation Enrollment public key is not a valid P-256 SPKI key.",
    );
  }

  // ----------------------------------------------------------
  // FINGERPRINT
  // ----------------------------------------------------------

  let actualFingerprint:
    string;

  try {
    actualFingerprint =
      createFinoraInstallationBindingFingerprint(
        deviceBinding.publicKey,
      );
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to derive the FINORA Installation Enrollment public-key fingerprint.",
    );
  }

  if (
    actualFingerprint !==
      deviceBinding.publicKeyFingerprint
  ) {
    return failure(
      "FINORA Installation Enrollment public-key fingerprint does not match the supplied public key.",
    );
  }

  // ----------------------------------------------------------
  // CANONICAL BINDING KEY ID
  // ----------------------------------------------------------

  const expectedBindingKeyId =
    `FINORA-BINDING-${actualFingerprint
      .slice(
        0,
        32,
      )
      .toUpperCase()}`;

  if (
    deviceBinding.bindingKeyId !==
      expectedBindingKeyId
  ) {
    return failure(
      "FINORA Installation Enrollment bindingKeyId is not canonical for the supplied public key.",
    );
  }

  // ----------------------------------------------------------
  // SIGNATURE ENVELOPE
  // ----------------------------------------------------------

  const signature =
    request.signature;

  if (!isRecord(signature)) {
    return failure(
      "FINORA Installation Enrollment possession signature is invalid.",
    );
  }

  if (
    !hasExactKeys(
      signature,
      [
        "algorithm",
        "encoding",
        "canonicalization",
        "bindingKeyId",
        "value",
      ],
    )
  ) {
    return failure(
      "FINORA Installation Enrollment signature structure is invalid.",
    );
  }

  if (
    signature.algorithm !==
      "ECDSA_P256_SHA256" ||
    signature.encoding !==
      "IEEE_P1363" ||
    signature.canonicalization !==
      "FINORA_CANONICAL_JSON_V1" ||
    signature.bindingKeyId !==
      deviceBinding.bindingKeyId ||
    !isCanonicalBase64(
      signature.value,
      64,
    )
  ) {
    return failure(
      "FINORA Installation Enrollment possession signature metadata is invalid.",
    );
  }

  // ----------------------------------------------------------
  // CANONICAL PAYLOAD + POSSESSION PROOF
  // ----------------------------------------------------------

  let canonicalPayload:
    string;

  try {
    canonicalPayload =
      canonicalizeFinoraControlCenterValue(
        payload,
      );
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to canonicalize the FINORA Installation Enrollment payload.",
    );
  }

  const publicBinding =
    deviceBinding as unknown as
      NativePublicBinding;

  const signatureValid =
    verifyFinoraInstallationBindingCanonicalValue(
      canonicalPayload,
      signature.value,
      publicBinding,
    );

  if (!signatureValid) {
    return failure(
      "FINORA Installation Enrollment possession signature verification failed.",
    );
  }

  // ----------------------------------------------------------
  // VERIFIED RESULT
  // ----------------------------------------------------------

  return {
    success:
      true,

    data: {
      requestId:
        payload.requestId,

      deviceBinding:
        publicBinding,

      requestedAt:
        payload.requestedAt,

      target: {
        installationId:
          deviceBinding.installationId,

        bindingKeyId:
          deviceBinding.bindingKeyId,

        fingerprintAlgorithm:
          "SHA-256",

        publicKeyFingerprint:
          deviceBinding.publicKeyFingerprint,

        schemaVersion:
          1,
      },

      schemaVersion:
        1,
    },
  };
}

// ============================================================
// END
// ============================================================