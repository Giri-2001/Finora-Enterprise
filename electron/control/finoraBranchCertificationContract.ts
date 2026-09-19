/*
 * FINORA ENTERPRISE
 * BRANCH CERTIFICATION CONTRACT
 *
 * Dedicated portable branch-level asymmetric authority.
 *
 * This key is NOT:
 * - the current device installation key,
 * - a Control Center signing key,
 * - a Password or Security Code verifier.
 *
 * The public half may be pinned by Control Center.
 * The private half is branch-held secret material and must never
 * be exposed to renderer code or exported as public enrollment
 * evidence.
 */

export const FINORA_BRANCH_CERTIFICATION_SCHEMA_VERSION =
  1 as const;

export const FINORA_BRANCH_CERTIFICATION_VAULT_SCHEMA_VERSION =
  1 as const;

export const FINORA_BRANCH_CERTIFICATION_ALGORITHM =
  "ECDSA_P256_SHA256" as const;

export const FINORA_BRANCH_CERTIFICATION_PUBLIC_KEY_FORMAT =
  "SPKI_DER_BASE64" as const;

export const FINORA_BRANCH_CERTIFICATION_PRIVATE_KEY_FORMAT =
  "PKCS8_DER_BASE64" as const;

export const FINORA_BRANCH_CERTIFICATION_FINGERPRINT_ALGORITHM =
  "SHA-256" as const;

export const FINORA_BRANCH_CERTIFICATION_SIGNATURE_ENCODING =
  "BASE64" as const;

export const FINORA_BRANCH_CERTIFICATION_CANONICALIZATION =
  "FINORA_CANONICAL_JSON_V1" as const;

export const FINORA_BRANCH_CERTIFICATION_KEY_ID_PREFIX =
  "FINORA-BRANCH-CERT-" as const;

export interface FinoraBranchCertificationPublicKeyV1 {

  keyId:
    string;

  algorithm:
    typeof FINORA_BRANCH_CERTIFICATION_ALGORITHM;

  publicKeyFormat:
    typeof FINORA_BRANCH_CERTIFICATION_PUBLIC_KEY_FORMAT;

  publicKey:
    string;

  fingerprintAlgorithm:
    typeof FINORA_BRANCH_CERTIFICATION_FINGERPRINT_ALGORITHM;

  publicKeyFingerprint:
    string;

  createdAt:
    string;

  schemaVersion:
    typeof FINORA_BRANCH_CERTIFICATION_SCHEMA_VERSION;
}

export interface FinoraBranchCertificationKeyMaterialV1
  extends FinoraBranchCertificationPublicKeyV1 {

  privateKeyFormat:
    typeof FINORA_BRANCH_CERTIFICATION_PRIVATE_KEY_FORMAT;

  privateKey:
    string;

  vaultSchemaVersion:
    typeof FINORA_BRANCH_CERTIFICATION_VAULT_SCHEMA_VERSION;
}

export interface FinoraBranchCertificationSignatureV1 {

  algorithm:
    typeof FINORA_BRANCH_CERTIFICATION_ALGORITHM;

  encoding:
    typeof FINORA_BRANCH_CERTIFICATION_SIGNATURE_ENCODING;

  canonicalization:
    typeof FINORA_BRANCH_CERTIFICATION_CANONICALIZATION;

  keyId:
    string;

  value:
    string;
}