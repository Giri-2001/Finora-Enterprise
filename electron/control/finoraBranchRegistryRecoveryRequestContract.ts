import type {
  FinoraBranchCertificationPublicKeyV1,
  FinoraBranchCertificationSignatureV1,
} from "./finoraBranchCertificationContract.js";

export const FINORA_BRANCH_REGISTRY_RECOVERY_REQUEST_FORMAT =
  "FINORA_BRANCH_REGISTRY_RECOVERY_REQUEST" as const;

export const FINORA_BRANCH_REGISTRY_RECOVERY_REQUEST_SCHEMA_VERSION =
  1 as const;

export interface FinoraBranchRegistryRecoveryPortabilityProvenanceV1 {
  sourceAuthorizationId: string;
  signedPortabilityAuthorityPackage: unknown;
  verifiedControlSigner: unknown;
}

export interface FinoraBranchRegistryRecoveryRequestPayloadV1 {
  format: typeof FINORA_BRANCH_REGISTRY_RECOVERY_REQUEST_FORMAT;
  schemaVersion: typeof FINORA_BRANCH_REGISTRY_RECOVERY_REQUEST_SCHEMA_VERSION;
  requestId: string;
  nonce: string;
  ownerId: string;
  businessId: string;
  branchId: string;
  businessCode: string;
  branchCode: string;
  branchCertificationPublicKey: FinoraBranchCertificationPublicKeyV1;
  portabilityProvenance: FinoraBranchRegistryRecoveryPortabilityProvenanceV1;
  issuedAt: string;
}

export interface FinoraSignedBranchRegistryRecoveryRequestV1 {
  payload: FinoraBranchRegistryRecoveryRequestPayloadV1;
  signature: FinoraBranchCertificationSignatureV1;
}
