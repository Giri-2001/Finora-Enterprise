// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL PLANE
// TRUSTED PUBLIC KEY TYPES
//
// RESPONSIBILITY:
//
// - Define trusted FINORA Control Center public keys
// - Support signing-key rotation
// - Support signing-key revocation
// - Bind one public key to one trusted Control Center issuer
// - Keep all PRIVATE key material outside Branch Client code
//
// IMPORTANT:
//
// - TYPES ONLY.
// - PUBLIC verification material only.
// - No private keys.
// - No signing.
// - No storage mutation.
// - No activation mutation.
// - No wallet mutation.
//
// SECURITY MODEL:
//
// Control Center:
//   PRIVATE KEY + PUBLIC KEY
//
// Branch Client:
//   PUBLIC KEY ONLY
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  FinoraControlIssuerId,
  FinoraControlSigningKeyId,
  FinoraControlSignatureAlgorithm,
} from "./finoraControlPackage.types";

// ============================================================
// PUBLIC KEY FORMAT
// ============================================================

export type FinoraControlPublicKeyFormat =
  "SPKI_DER_BASE64";

// ============================================================
// TRUST STATUS
// ============================================================

export type FinoraControlTrustedKeyStatus =
  | "ACTIVE"
  | "RETIRED"
  | "REVOKED";

// ============================================================
// TRUSTED PUBLIC KEY
// ============================================================

export interface FinoraControlTrustedPublicKey {

  issuerId:
    FinoraControlIssuerId;

  signingKeyId:
    FinoraControlSigningKeyId;

  algorithm:
    FinoraControlSignatureAlgorithm;

  format:
    FinoraControlPublicKeyFormat;

  /**
   * Base64 encoded DER SubjectPublicKeyInfo.
   *
   * PUBLIC material only.
   */
  publicKey:
    string;

  status:
    FinoraControlTrustedKeyStatus;

  /**
   * Earliest package issuedAt timestamp for which this key
   * may be trusted.
   */
  validFrom:
    string;

  /**
   * Optional final package issuedAt timestamp for which this key
   * may be trusted.
   *
   * Supports planned key rotation.
   */
  validUntil?:
    string;

  createdAt:
    string;

  schemaVersion:
    1;
}

// ============================================================
// TRUST STORE
// ============================================================

export interface FinoraControlTrustStore {

  keys:
    FinoraControlTrustedPublicKey[];

  schemaVersion:
    1;
}

// ============================================================
// END
// ============================================================