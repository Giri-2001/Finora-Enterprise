import {
  assertFinoraBranchCertificationPublicKey,
  signFinoraBranchCertificationCanonicalValue,
  verifyFinoraBranchCertificationCanonicalValue,
} from "./finoraBranchCertificationCrypto.js";

import type {
  FinoraBranchCertificationKeyMaterialV1,
  FinoraBranchCertificationPublicKeyV1,
} from "./finoraBranchCertificationContract.js";

import {
  FINORA_BRANCH_REGISTRY_RECOVERY_REQUEST_FORMAT,
  FINORA_BRANCH_REGISTRY_RECOVERY_REQUEST_SCHEMA_VERSION,
} from "./finoraBranchRegistryRecoveryRequestContract.js";

import type {
  FinoraBranchRegistryRecoveryRequestPayloadV1,
  FinoraSignedBranchRegistryRecoveryRequestV1,
} from "./finoraBranchRegistryRecoveryRequestContract.js";

function requiredString(
  value: unknown,
  field: string,
): asserts value is string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `FINORA Branch Registry Recovery ${field} is required.`,
    );
  }
}

function exactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  label: string,
): void {
  const actualKeys = Object.keys(value).sort();
  const expectedKeys = [...expected].sort();

  if (
    actualKeys.length !== expectedKeys.length ||
    actualKeys.some(
      (key, index) => key !== expectedKeys[index],
    )
  ) {
    throw new Error(
      `FINORA Branch Registry Recovery ${label} contains unexpected or missing fields.`,
    );
  }
}

export function assertFinoraBranchRegistryRecoveryRequestPayload(
  value: unknown,
): asserts value is FinoraBranchRegistryRecoveryRequestPayloadV1 {

  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(
      "FINORA Branch Registry Recovery payload is required.",
    );
  }

  const payload = value as Record<string, unknown>;

  exactKeys(
    payload,
    [
      "format",
      "schemaVersion",
      "requestId",
      "nonce",
      "ownerId",
      "businessId",
      "branchId",
      "businessCode",
      "branchCode",
      "branchCertificationPublicKey",
      "portabilityProvenance",
      "issuedAt",
    ],
    "payload",
  );

  if (
    payload.format !== FINORA_BRANCH_REGISTRY_RECOVERY_REQUEST_FORMAT ||
    payload.schemaVersion !== FINORA_BRANCH_REGISTRY_RECOVERY_REQUEST_SCHEMA_VERSION
  ) {
    throw new Error(
      "Unsupported FINORA Branch Registry Recovery request.",
    );
  }

  requiredString(payload.requestId, "requestId");
  requiredString(payload.nonce, "nonce");
  requiredString(payload.ownerId, "ownerId");
  requiredString(payload.businessId, "businessId");
  requiredString(payload.branchId, "branchId");
  requiredString(payload.businessCode, "businessCode");
  requiredString(payload.branchCode, "branchCode");
  requiredString(payload.issuedAt, "issuedAt");

  if (Number.isNaN(Date.parse(payload.issuedAt))) {
    throw new Error(
      "FINORA Branch Registry Recovery issuedAt is invalid.",
    );
  }

  const publicKey =
    payload.branchCertificationPublicKey as
      FinoraBranchCertificationPublicKeyV1;

  assertFinoraBranchCertificationPublicKey(
    publicKey,
  );

  const provenance = payload.portabilityProvenance;

  if (
    !provenance ||
    typeof provenance !== "object" ||
    Array.isArray(provenance)
  ) {
    throw new Error(
      "FINORA Branch Registry Recovery portability provenance is required.",
    );
  }

  const p = provenance as Record<string, unknown>;

  exactKeys(
    p,
    [
      "sourceAuthorizationId",
      "signedPortabilityAuthorityPackage",
      "verifiedControlSigner",
    ],
    "portability provenance",
  );

  requiredString(
    p.sourceAuthorizationId,
    "sourceAuthorizationId",
  );

  if (
    !p.signedPortabilityAuthorityPackage ||
    typeof p.signedPortabilityAuthorityPackage !== "object" ||
    Array.isArray(p.signedPortabilityAuthorityPackage)
  ) {
    throw new Error(
      "Signed portability authority package is required.",
    );
  }

  if (
    !p.verifiedControlSigner ||
    typeof p.verifiedControlSigner !== "object" ||
    Array.isArray(p.verifiedControlSigner)
  ) {
    throw new Error(
      "Verified Control signer is required.",
    );
  }
}

export function canonicalizeFinoraBranchRegistryRecoveryRequestPayload(
  payload: FinoraBranchRegistryRecoveryRequestPayloadV1,
): string {

  assertFinoraBranchRegistryRecoveryRequestPayload(
    payload,
  );

  return JSON.stringify(payload);
}

export function signFinoraBranchRegistryRecoveryRequest(
  payload: FinoraBranchRegistryRecoveryRequestPayloadV1,
  material: FinoraBranchCertificationKeyMaterialV1,
): FinoraSignedBranchRegistryRecoveryRequestV1 {

  if (
    material.keyId !==
    payload.branchCertificationPublicKey.keyId
  ) {
    throw new Error(
      "Recovery signing key does not match Branch Certification key.",
    );
  }

  return {
    payload,
    signature:
      signFinoraBranchCertificationCanonicalValue(
        canonicalizeFinoraBranchRegistryRecoveryRequestPayload(
          payload,
        ),
        material,
      ),
  };
}

export function verifyFinoraBranchRegistryRecoveryRequestSignature(
  request: FinoraSignedBranchRegistryRecoveryRequestV1,
  expectedScope: {
    ownerId: string;
    businessId: string;
    branchId: string;
  },
): boolean {

  try {
    assertFinoraBranchRegistryRecoveryRequestPayload(
      request.payload,
    );

    if (
      request.payload.ownerId !== expectedScope.ownerId ||
      request.payload.businessId !== expectedScope.businessId ||
      request.payload.branchId !== expectedScope.branchId
    ) {
      return false;
    }

    return verifyFinoraBranchCertificationCanonicalValue(
      canonicalizeFinoraBranchRegistryRecoveryRequestPayload(
        request.payload,
      ),
      request.signature,
      request.payload.branchCertificationPublicKey,
    );
  } catch {
    return false;
  }
}
