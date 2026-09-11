/* ===========================================================
   FINORA ENTERPRISE OS™

   INSTALLATION ENROLLMENT RESPONSE VERIFIER

   MODULE  : Native Control
   LAYER   : Electron Main / Pure Verification
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Accept one untrusted parsed Enrollment Response file
   - Require an independently supplied Control Center
     public-key fingerprint
   - Require the exact locally expected enrollment requestId
   - Require the exact current native installation binding
   - Validate the complete bootstrap response structure
   - Validate the embedded initial Control Center P-256 trust key
   - Recompute and compare its SHA-256 SPKI fingerprint
   - Validate canonical Control Center signingKeyId
   - Verify payload digest
   - Verify Control Center IEEE-P1363 signature
   - Enforce notBefore / expiry using actual system time
   - Return only cryptographically verified bootstrap material

   SECURITY:

   - ELECTRON MAIN PROCESS ONLY.
   - No IPC registration.
   - No filesystem authority.
   - No trust-store mutation.
   - No Control Store mutation.
   - No trust-on-first-use.
   - Package-provided fingerprint is never independent authority.
   - No access activation authority.
   - No storage-entitlement authority.
=========================================================== */

import {
  timingSafeEqual,
} from "node:crypto";

import {
  canonicalizeFinoraControlCenterValue,
  createFinoraControlCenterPayloadDigest,
  createFinoraControlCenterSha256,
} from "../control-center/finoraControlCenterCanonicalization.js";

import {
  createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint,
  verifyFinoraControlCenterCanonicalSignature,
} from "../control-center/finoraControlCenterCrypto.js";

import {
  createFinoraInstallationBindingFingerprint,
} from "./finoraInstallationBindingCrypto.js";

import {
  validateFinoraRecipientTrustStoreState,
} from "./finoraRecipientTrustStore.js";

import {
  FINORA_INSTALLATION_ENROLLMENT_RESPONSE_FILE_FORMAT,
  FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PAYLOAD_VERSION,
  FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PURPOSE,
} from "./finoraInstallationEnrollmentResponse.types.js";

import type {
  FinoraInstallationEnrollmentInitialTrustedKey,
  FinoraSignedInstallationEnrollmentResponse,
} from "./finoraInstallationEnrollmentResponse.types.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

// ============================================================
// EXTERNAL VERIFICATION AUTHORITIES
// ============================================================

export interface FinoraEnrollmentResponseNativeBindingView {

  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  publicKeyFingerprint:
    string;
}

export interface VerifyFinoraInstallationEnrollmentResponseInput {

  value:
    unknown;

  /**
   * Independent operator / deployment-channel authority.
   *
   * This MUST NOT be copied from the response file itself.
   */
  expectedControlCenterPublicKeyFingerprint:
    string;

  /**
   * Exact request provenance established when this recipient
   * generated/exported its Enrollment Request.
   */
  expectedRequestId:
    string;

  /**
   * Exact current native installation binding.
   */
  nativeBinding:
    FinoraEnrollmentResponseNativeBindingView;
}

// ============================================================
// VERIFIED RESULT
// ============================================================

export interface FinoraVerifiedInstallationEnrollmentResponse {

  responseId:
    string;

  requestId:
    string;

  sequence:
    number;

  issuedAt:
    string;

  expiresAt:
    string;

  target: {
    ownerId:
      string;

    businessId:
      string;

    branchId:
      string;

    installationId:
      string;

    bindingKeyId:
      string;

    fingerprintAlgorithm:
      "SHA-256";

    publicKeyFingerprint:
      string;
  };

  businessCode:
    string;

  branchCode:
    string;

  trustedKey:
    FinoraBranchTrustedControlPublicKey;

  expectedControlCenterPublicKeyFingerprint:
    string;

  schemaVersion:
    1;
}

// ============================================================
// VERIFIED RESPONSE DIGEST
// ============================================================

export function createFinoraVerifiedInstallationEnrollmentResponseDigest(
  response:
    FinoraVerifiedInstallationEnrollmentResponse,
): string {

  const canonical =
    canonicalizeFinoraControlCenterValue(
      response,
    );

  return createFinoraControlCenterSha256(
    canonical,
  );
}

// ============================================================
// PROTECTED ACCEPTED-RESPONSE LATCH COMPARISON
//
// This helper is deliberately pure.
//
// The caller owns the authority for where the latch came from.
// Production recovery supplies only the validated encrypted
// pending-enrollment acceptedResponse record.
// ============================================================

export interface FinoraEnrollmentAcceptedResponseLatchView {

  responseId:
    string;

  responseDigest:
    string;
}

export function isExactFinoraVerifiedInstallationEnrollmentAcceptedResponse(
  response:
    FinoraVerifiedInstallationEnrollmentResponse,

  acceptedResponse:
    FinoraEnrollmentAcceptedResponseLatchView,
): boolean {

  return (
    response.responseId ===
      acceptedResponse.responseId &&
    createFinoraVerifiedInstallationEnrollmentResponseDigest(
      response,
    ) ===
      acceptedResponse.responseDigest
  );
}
// ============================================================
// VERIFICATION RESULT
// ============================================================
export type FinoraInstallationEnrollmentResponseVerificationResult =
  | {
      success:
        true;

      data:
        FinoraVerifiedInstallationEnrollmentResponse;
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
): FinoraInstallationEnrollmentResponseVerificationResult {

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
  maxLength:
    number,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.length >
      0 &&
    value.length <=
      maxLength &&
    value ===
      value.trim()
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

  return (
    actual.length ===
      expected.length &&
    actual.every(
      (
        key,
        index,
      ) =>
        key ===
          expected[index],
    )
  );
}

function parseCanonicalTimestamp(
  value:
    unknown,
): number | undefined {

  if (
    typeof value !==
      "string"
  ) {
    return undefined;
  }

  const parsed =
    Date.parse(
      value,
    );

  if (
    !Number.isFinite(
      parsed,
    )
  ) {
    return undefined;
  }

  if (
    new Date(
      parsed,
    ).toISOString() !==
      value
  ) {
    return undefined;
  }

  return parsed;
}

function isCanonicalSha256(
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
      bytes.length ===
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
      bytes.length !==
        expectedBytes
    ) {
      return false;
    }

    return true;

  } catch {
    return false;
  }
}

function fingerprintsMatch(
  expected:
    string,
  actual:
    string,
): boolean {

  const expectedBytes =
    Buffer.from(
      expected,
      "hex",
    );

  const actualBytes =
    Buffer.from(
      actual,
      "hex",
    );

  if (
    expectedBytes.length !==
      32 ||
    actualBytes.length !==
      32
  ) {
    return false;
  }

  return timingSafeEqual(
    expectedBytes,
    actualBytes,
  );
}

function cloneTrustedKey(
  key:
    FinoraInstallationEnrollmentInitialTrustedKey,
): FinoraBranchTrustedControlPublicKey {

  return {
    issuerId:
      key.issuerId,

    signingKeyId:
      key.signingKeyId,

    algorithm:
      key.algorithm,

    format:
      key.format,

    publicKey:
      key.publicKey,

    status:
      key.status,

    validFrom:
      key.validFrom,
  };
}

// ============================================================
// VERIFY
// ============================================================

function verifyFinoraInstallationEnrollmentResponseFileAtTime(
  input:
    VerifyFinoraInstallationEnrollmentResponseInput,

  verificationTimeMs:
    number | undefined,
): FinoraInstallationEnrollmentResponseVerificationResult {

  try {

    // --------------------------------------------------------
    // INDEPENDENT AUTHORITIES
    // --------------------------------------------------------

    if (
      !isCanonicalSha256(
        input.expectedControlCenterPublicKeyFingerprint,
      )
    ) {
      return failure(
        "FINORA Enrollment Response verification requires an independently supplied canonical lowercase Control Center SHA-256 fingerprint.",
      );
    }

    if (
      !hasText(
        input.expectedRequestId,
        256,
      ) ||
      !input.expectedRequestId.startsWith(
        "FINORA-ENROLLMENT-",
      )
    ) {
      return failure(
        "FINORA Enrollment Response expected request provenance is invalid.",
      );
    }

    if (
      !hasText(
        input.nativeBinding.installationId,
        256,
      ) ||
      !hasText(
        input.nativeBinding.bindingKeyId,
        128,
      ) ||
      input.nativeBinding.fingerprintAlgorithm !==
        "SHA-256" ||
      !isCanonicalSha256(
        input.nativeBinding.publicKeyFingerprint,
      )
    ) {
      return failure(
        "FINORA current native installation binding is invalid.",
      );
    }

    const expectedNativeBindingKeyId =
      `FINORA-BINDING-${input.nativeBinding.publicKeyFingerprint
        .slice(
          0,
          32,
        )
        .toUpperCase()}`;

    if (
      input.nativeBinding.bindingKeyId !==
        expectedNativeBindingKeyId
    ) {
      return failure(
        "FINORA current native installation bindingKeyId is not canonical.",
      );
    }

    // --------------------------------------------------------
    // FILE WRAPPER
    // --------------------------------------------------------

    if (!isRecord(input.value)) {
      return failure(
        "FINORA Installation Enrollment Response file must be an object.",
      );
    }

    if (
      !hasExactKeys(
        input.value,
        [
          "format",
          "response",
          "schemaVersion",
        ],
      ) ||
      input.value.format !==
        FINORA_INSTALLATION_ENROLLMENT_RESPONSE_FILE_FORMAT ||
      input.value.schemaVersion !==
        1
    ) {
      return failure(
        "FINORA Installation Enrollment Response file structure is invalid or unsupported.",
      );
    }

    const responseValue =
      input.value.response;

    if (!isRecord(responseValue)) {
      return failure(
        "FINORA Installation Enrollment Response envelope is invalid.",
      );
    }

    if (
      !hasExactKeys(
        responseValue,
        [
          "responseId",
          "purpose",
          "target",
          "issuedAt",
          "validity",
          "sequence",
          "payloadVersion",
          "payload",
          "issuer",
          "payloadDigest",
          "signature",
          "schemaVersion",
        ],
      )
    ) {
      return failure(
        "FINORA Installation Enrollment Response envelope structure is invalid.",
      );
    }

    if (
      !hasText(
        responseValue.responseId,
        256,
      ) ||
      !responseValue.responseId.startsWith(
        "FINORA-ENROLLMENT-RESPONSE-",
      ) ||
      responseValue.purpose !==
        FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PURPOSE ||
      responseValue.payloadVersion !==
        FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PAYLOAD_VERSION ||
      responseValue.schemaVersion !==
        1 ||
      !Number.isSafeInteger(
        responseValue.sequence,
      ) ||
      (
        responseValue.sequence as
          number
      ) <=
        0
    ) {
      return failure(
        "FINORA Installation Enrollment Response envelope metadata is invalid.",
      );
    }

    // --------------------------------------------------------
    // TARGET
    // --------------------------------------------------------

    const target =
      responseValue.target;

    if (
      !isRecord(target) ||
      !hasExactKeys(
        target,
        [
          "ownerId",
          "businessId",
          "branchId",
          "installationId",
          "bindingKeyId",
          "fingerprintAlgorithm",
          "publicKeyFingerprint",
        ],
      )
    ) {
      return failure(
        "FINORA Installation Enrollment Response target structure is invalid.",
      );
    }

    if (
      !hasText(
        target.ownerId,
        256,
      ) ||
      !hasText(
        target.businessId,
        256,
      ) ||
      !hasText(
        target.branchId,
        256,
      ) ||
      !hasText(
        target.installationId,
        256,
      ) ||
      !hasText(
        target.bindingKeyId,
        128,
      ) ||
      target.fingerprintAlgorithm !==
        "SHA-256" ||
      !isCanonicalSha256(
        target.publicKeyFingerprint,
      )
    ) {
      return failure(
        "FINORA Installation Enrollment Response target is invalid.",
      );
    }

    const expectedResponseBindingKeyId =
      `FINORA-BINDING-${target.publicKeyFingerprint
        .slice(
          0,
          32,
        )
        .toUpperCase()}`;

    if (
      target.bindingKeyId !==
        expectedResponseBindingKeyId
    ) {
      return failure(
        "FINORA Installation Enrollment Response target bindingKeyId is not canonical.",
      );
    }

    if (
      target.installationId !==
        input.nativeBinding.installationId ||
      target.bindingKeyId !==
        input.nativeBinding.bindingKeyId ||
      target.fingerprintAlgorithm !==
        input.nativeBinding.fingerprintAlgorithm ||
      target.publicKeyFingerprint !==
        input.nativeBinding.publicKeyFingerprint
    ) {
      return failure(
        "FINORA Installation Enrollment Response does not target this exact native installation binding.",
      );
    }

    // --------------------------------------------------------
    // VALIDITY
    // --------------------------------------------------------

    const validity =
      responseValue.validity;

    if (
      !isRecord(validity) ||
      !hasExactKeys(
        validity,
        [
          "notBefore",
          "expiresAt",
        ],
      )
    ) {
      return failure(
        "FINORA Installation Enrollment Response validity structure is invalid.",
      );
    }

    const issuedAtMs =
      parseCanonicalTimestamp(
        responseValue.issuedAt,
      );

    const notBeforeMs =
      parseCanonicalTimestamp(
        validity.notBefore,
      );

    const expiresAtMs =
      parseCanonicalTimestamp(
        validity.expiresAt,
      );

    if (
      issuedAtMs ===
        undefined ||
      notBeforeMs ===
        undefined ||
      expiresAtMs ===
        undefined ||
      responseValue.issuedAt !==
        validity.notBefore ||
      expiresAtMs <=
        issuedAtMs
    ) {
      return failure(
        "FINORA Installation Enrollment Response validity timestamps are invalid.",
      );
    }

    if (
      verificationTimeMs !==
        undefined
    ) {

      if (
        verificationTimeMs <
          notBeforeMs
      ) {
        return failure(
          "FINORA Installation Enrollment Response is not yet valid.",
        );
      }

      if (
        verificationTimeMs >
          expiresAtMs
      ) {
        return failure(
          "FINORA Installation Enrollment Response has expired.",
        );
      }
    }

    // --------------------------------------------------------
    // PAYLOAD
    // --------------------------------------------------------

    const payload =
      responseValue.payload;

    if (
      !isRecord(payload) ||
      !hasExactKeys(
        payload,
        [
          "requestId",
          "businessCode",
          "branchCode",
          "initialTrustedKey",
          "issuedAt",
          "schemaVersion",
        ],
      )
    ) {
      return failure(
        "FINORA Installation Enrollment Response payload structure is invalid.",
      );
    }

    if (
      !hasText(
        payload.requestId,
        256,
      ) ||
      payload.requestId !==
        input.expectedRequestId ||
      !hasText(
        payload.businessCode,
        64,
      ) ||
      !hasText(
        payload.branchCode,
        64,
      ) ||
      payload.issuedAt !==
        responseValue.issuedAt ||
      payload.schemaVersion !==
        1
    ) {
      return failure(
        "FINORA Installation Enrollment Response payload identity or request provenance is invalid.",
      );
    }

    // --------------------------------------------------------
    // INITIAL TRUST KEY
    // --------------------------------------------------------

    const trustedKeyValue =
      payload.initialTrustedKey;

    if (
      !isRecord(trustedKeyValue) ||
      !hasExactKeys(
        trustedKeyValue,
        [
          "issuerId",
          "signingKeyId",
          "algorithm",
          "format",
          "publicKey",
          "status",
          "validFrom",
        ],
      )
    ) {
      return failure(
        "FINORA Installation Enrollment Response initial trusted-key structure is invalid.",
      );
    }

    if (
      !hasText(
        trustedKeyValue.issuerId,
        256,
      ) ||
      !hasText(
        trustedKeyValue.signingKeyId,
        256,
      ) ||
      trustedKeyValue.algorithm !==
        "ECDSA_P256_SHA256" ||
      trustedKeyValue.format !==
        "SPKI_DER_BASE64" ||
      !isCanonicalBase64(
        trustedKeyValue.publicKey,
      ) ||
      trustedKeyValue.status !==
        "ACTIVE" ||
      parseCanonicalTimestamp(
        trustedKeyValue.validFrom,
      ) ===
        undefined
    ) {
      return failure(
        "FINORA Installation Enrollment Response initial trusted key is invalid.",
      );
    }

    const trustedKey =
      cloneTrustedKey(
        trustedKeyValue as unknown as
          FinoraInstallationEnrollmentInitialTrustedKey,
      );

    /*
     * Reuse the production recipient trust-store validator.
     *
     * This validates canonical trusted-key metadata and the SPKI
     * key structure/curve without persisting anything.
     */
    validateFinoraRecipientTrustStoreState({
      schemaVersion:
        1,

      trustedKeys: [
        trustedKey,
      ],
    });

    // --------------------------------------------------------
    // INDEPENDENT CONTROL CENTER FINGERPRINT
    // --------------------------------------------------------

    const actualControlCenterFingerprint =
      createFinoraInstallationBindingFingerprint(
        trustedKey.publicKey,
      );

    if (
      !fingerprintsMatch(
        input.expectedControlCenterPublicKeyFingerprint,
        actualControlCenterFingerprint,
      )
    ) {
      return failure(
        "FINORA Installation Enrollment Response Control Center public key does not match the independently supplied fingerprint.",
      );
    }

    const expectedSigningKeyId =
      createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint(
        actualControlCenterFingerprint,
      );

    if (
      trustedKey.signingKeyId !==
        expectedSigningKeyId
    ) {
      return failure(
        "FINORA Installation Enrollment Response signingKeyId does not match the verified Control Center public key.",
      );
    }

    // --------------------------------------------------------
    // ISSUER
    // --------------------------------------------------------

    const issuer =
      responseValue.issuer;

    if (
      !isRecord(issuer) ||
      !hasExactKeys(
        issuer,
        [
          "type",
          "issuerId",
          "signingKeyId",
        ],
      ) ||
      issuer.type !==
        "FINORA_CONTROL_CENTER" ||
      issuer.issuerId !==
        trustedKey.issuerId ||
      issuer.signingKeyId !==
        trustedKey.signingKeyId
    ) {
      return failure(
        "FINORA Installation Enrollment Response issuer does not match the independently verified Control Center key.",
      );
    }

    // --------------------------------------------------------
    // PAYLOAD DIGEST
    // --------------------------------------------------------

    const payloadDigest =
      responseValue.payloadDigest;

    if (
      !isRecord(payloadDigest) ||
      !hasExactKeys(
        payloadDigest,
        [
          "algorithm",
          "value",
        ],
      ) ||
      payloadDigest.algorithm !==
        "SHA-256" ||
      !isCanonicalSha256(
        payloadDigest.value,
      )
    ) {
      return failure(
        "FINORA Installation Enrollment Response payload digest is invalid.",
      );
    }

    const actualPayloadDigest =
      createFinoraControlCenterPayloadDigest(
        payload,
      );

    if (
      actualPayloadDigest.value !==
        payloadDigest.value
    ) {
      return failure(
        "FINORA Installation Enrollment Response payload digest verification failed.",
      );
    }

    // --------------------------------------------------------
    // SIGNATURE
    // --------------------------------------------------------

    const signature =
      responseValue.signature;

    if (
      !isRecord(signature) ||
      !hasExactKeys(
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
        trustedKey.signingKeyId ||
      !isCanonicalBase64(
        signature.value,
        64,
      )
    ) {
      return failure(
        "FINORA Installation Enrollment Response signature metadata is invalid.",
      );
    }

    const unsignedResponse = {
      responseId:
        responseValue.responseId,

      purpose:
        responseValue.purpose,

      target,

      issuedAt:
        responseValue.issuedAt,

      validity,

      sequence:
        responseValue.sequence,

      payloadVersion:
        responseValue.payloadVersion,

      payload,

      issuer,

      payloadDigest,

      schemaVersion:
        1 as const,
    };

    const canonicalResponse =
      canonicalizeFinoraControlCenterValue(
        unsignedResponse,
      );

    const signatureValid =
      verifyFinoraControlCenterCanonicalSignature(
        canonicalResponse,
        signature.value,
        trustedKey.publicKey,
      );

    if (!signatureValid) {
      return failure(
        "FINORA Installation Enrollment Response signature verification failed.",
      );
    }

    // --------------------------------------------------------
    // VERIFIED RESULT
    // --------------------------------------------------------

    const response =
      responseValue as unknown as
        FinoraSignedInstallationEnrollmentResponse;

    return {
      success:
        true,

      data: {
        responseId:
          response.responseId,

        requestId:
          response.payload.requestId,

        sequence:
          response.sequence,

        issuedAt:
          response.issuedAt,

        expiresAt:
          response.validity.expiresAt,

        target: {
          ...response.target,
        },

        businessCode:
          response.payload.businessCode,

        branchCode:
          response.payload.branchCode,

        trustedKey,

        expectedControlCenterPublicKeyFingerprint:
          input.expectedControlCenterPublicKeyFingerprint,

        schemaVersion:
          1,
      },
    };

  } catch (
    error
  ) {

    return failure(
      error instanceof Error
        ? error.message
        : "FINORA Installation Enrollment Response verification failed.",
    );
  }
}

// ============================================================
// STRICT CURRENT-TIME VERIFICATION
// ============================================================

export function verifyFinoraInstallationEnrollmentResponseFile(
  input:
    VerifyFinoraInstallationEnrollmentResponseInput,
): FinoraInstallationEnrollmentResponseVerificationResult {

  return verifyFinoraInstallationEnrollmentResponseFileAtTime(
    input,
    Date.now(),
  );
}

// ============================================================
// HISTORICAL ENROLLMENT RESPONSE EVIDENCE
//
// This path is for Control Center historical evidence
// verification only.
//
// It deliberately reuses the same complete Enrollment Response
// verifier used by normal recipient bootstrap:
//
// - exact file / envelope / payload structure,
// - exact purpose / schema / payload version,
// - request provenance,
// - exact installation binding,
// - canonical binding identity,
// - signed validity-envelope structure,
// - initial trusted-key validation,
// - independent Control Center public-key fingerprint,
// - issuer / signingKeyId consistency,
// - payload digest,
// - canonical ECDSA P-256 signature.
//
// DIFFERENCE FROM LIVE BOOTSTRAP:
//
// Current wall-clock notBefore / expiresAt authorization is not
// applied. Historical evidence can legitimately be inspected
// after its original bootstrap validity window has elapsed.
//
// The signed validity envelope itself remains mandatory and is
// still structurally validated by the common verifier.
//
// SECURITY:
//
// - No trust-on-first-use.
// - No package-provided trust authority.
// - No current-machine binding lookup.
// - The caller must supply binding authority obtained from the
//   cryptographically verified original Enrollment Request.
// - The caller must supply Control Center fingerprint authority
//   obtained independently from validated Control Center
//   current / retained public verification-key history.
// - No persistence.
// - No registry mutation.
// ============================================================

export interface VerifyFinoraInstallationEnrollmentResponseHistoricalEvidenceInput {

  value:
    unknown;

  expectedControlCenterPublicKeyFingerprint:
    string;

  expectedRequestId:
    string;

  verifiedRequestBinding:
    FinoraEnrollmentResponseNativeBindingView;
}

export function verifyFinoraInstallationEnrollmentResponseFileForHistoricalEvidence(
  input:
    VerifyFinoraInstallationEnrollmentResponseHistoricalEvidenceInput,
): FinoraInstallationEnrollmentResponseVerificationResult {

  return verifyFinoraInstallationEnrollmentResponseFileAtTime(
    {
      value:
        input.value,

      expectedControlCenterPublicKeyFingerprint:
        input.expectedControlCenterPublicKeyFingerprint,

      expectedRequestId:
        input.expectedRequestId,

      nativeBinding:
        input.verifiedRequestBinding,
    },
    undefined,
  );
}
// ============================================================
// PROTECTED LATCHED-RESPONSE RECOVERY VERIFICATION
//
// The supplied acceptedAt is not renderer authority.
// It comes only from the encrypted pending-enrollment store.
//
// Cryptographic verification, independent Control Center
// fingerprint, request provenance and native binding checks
// remain identical to first-time verification.
// ============================================================

export function verifyFinoraInstallationEnrollmentResponseFileForLatchedRecovery(
  input:
    VerifyFinoraInstallationEnrollmentResponseInput,
): FinoraInstallationEnrollmentResponseVerificationResult {

  /*
   * Recovery does not grant a general expiry bypass.
   *
   * This path is selectable only when encrypted main-process
   * pending state already contains an accepted-response latch.
   *
   * Signed validity structure is still validated by the
   * common verifier. Current notBefore / expiry enforcement
   * is omitted because this exact transaction already entered
   * bootstrap after strict current-time verification.
   *
   * The local-authority coordinator additionally requires
   * exact protected responseId + verified-response digest
   * equality before returning recovery material.
   */
  return verifyFinoraInstallationEnrollmentResponseFileAtTime(
    input,
    undefined,
  );
}
// ============================================================
// END
// ============================================================