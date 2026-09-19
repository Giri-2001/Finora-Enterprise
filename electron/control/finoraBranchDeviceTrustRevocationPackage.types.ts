/* ============================================================
   FINORA ENTERPRISE OS
   SIGNED BRANCH DEVICE TRUST REVOCATION PACKAGE CONTRACT
============================================================ */

export const FINORA_BRANCH_DEVICE_REVOCATION_PURPOSE =
  "DEVICE_REVOCATION" as const;

export const FINORA_BRANCH_DEVICE_REVOCATION_PAYLOAD_VERSION =
  1 as const;

export interface FinoraBranchDeviceRevocationPackageTarget {
  ownerId: string;
  businessId: string;
  branchId: string;
  installationId: string;
  bindingKeyId: string;
  fingerprintAlgorithm: "SHA-256";
  publicKeyFingerprint: string;
}

export type FinoraBranchDeviceRevocationStorageMode =
  | "LOCAL"
  | "USB";

export type FinoraBranchDeviceRevocationDataContext =
  | "REAL"
  | "DEMO";

export interface FinoraBranchDeviceRevocationPayloadV1 {
  schemaVersion: 1;
  action: "REVOKE";
  issuedAt: string;

  userId: string;
  canonicalUsername: string;

  storageMode: FinoraBranchDeviceRevocationStorageMode;
  dataContext: FinoraBranchDeviceRevocationDataContext;
  demoId?: string;

  reason: string;
}

/*
 * Revocation intentionally excludes authStateId, authGeneration and
 * Portable Auth fingerprint lineage. The signed authority targets the
 * exact branch user + native device binding across credential rotation.
 */
