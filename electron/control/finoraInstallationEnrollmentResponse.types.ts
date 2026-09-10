/* ===========================================================
   FINORA ENTERPRISE OS™

   INSTALLATION ENROLLMENT RESPONSE CONTRACT

   MODULE  : Control Plane
   LAYER   : Bootstrap Contract
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Define the one-time signed Enrollment Response contract
   - Bind one verified native installation to operator-assigned
     Owner / Business / Branch identity
   - Carry immutable Business / Branch numbering codes
   - Carry the initial Control Center public trust key
   - Preserve authoritative responseId / sequence / issuedAt
   - Preserve short bootstrap validity

   SECURITY:

   - This is NOT a normal post-trust Control Package.
   - It intentionally does NOT extend FinoraControlPackagePurpose.
   - It does NOT authorize REGISTERED / DEMO access.
   - It does NOT grant LOCAL / USB storage entitlement.
   - Recipient must independently know the expected Control
     Center public-key fingerprint before bootstrap.
=========================================================== */

// ============================================================
// CONSTANTS
// ============================================================

export const FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PURPOSE =
  "INSTALLATION_ENROLLMENT_RESPONSE" as const;

export const FINORA_INSTALLATION_ENROLLMENT_RESPONSE_FILE_FORMAT =
  "FINORA_INSTALLATION_ENROLLMENT_RESPONSE_V1" as const;

export const FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PAYLOAD_VERSION =
  1 as const;

// ============================================================
// INSTALLATION TARGET
// ============================================================

export interface FinoraInstallationEnrollmentResponseTarget {

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
}

// ============================================================
// INITIAL CONTROL CENTER TRUST KEY
// ============================================================

export interface FinoraInstallationEnrollmentInitialTrustedKey {

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
    "ACTIVE";

  validFrom:
    string;
}

// ============================================================
// PAYLOAD
// ============================================================

export interface FinoraInstallationEnrollmentResponsePayload {

  requestId:
    string;

  businessCode:
    string;

  branchCode:
    string;

  initialTrustedKey:
    FinoraInstallationEnrollmentInitialTrustedKey;

  issuedAt:
    string;

  schemaVersion:
    1;
}

// ============================================================
// VALIDITY
// ============================================================

export interface FinoraInstallationEnrollmentResponseValidity {

  notBefore:
    string;

  expiresAt:
    string;
}

// ============================================================
// SIGNED RESPONSE
// ============================================================

export interface FinoraSignedInstallationEnrollmentResponse {

  responseId:
    string;

  purpose:
    typeof FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PURPOSE;

  target:
    FinoraInstallationEnrollmentResponseTarget;

  issuedAt:
    string;

  validity:
    FinoraInstallationEnrollmentResponseValidity;

  sequence:
    number;

  payloadVersion:
    typeof FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PAYLOAD_VERSION;

  payload:
    FinoraInstallationEnrollmentResponsePayload;

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

// ============================================================
// FILE WRAPPER
// ============================================================

export interface FinoraInstallationEnrollmentResponseFile {

  format:
    typeof FINORA_INSTALLATION_ENROLLMENT_RESPONSE_FILE_FORMAT;

  response:
    FinoraSignedInstallationEnrollmentResponse;

  schemaVersion:
    1;
}

// ============================================================
// END
// ============================================================