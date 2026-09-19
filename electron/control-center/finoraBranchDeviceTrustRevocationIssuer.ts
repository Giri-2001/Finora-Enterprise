/* ============================================================
   FINORA ENTERPRISE OS
   CONTROL CENTER - SIGNED DEVICE REVOCATION ISSUER
============================================================ */

import type {
  FinoraControlCenterPackageValidity,
  FinoraControlCenterSignedPackage,
} from "./finoraControlCenterSigner.js";

import {
  signFinoraControlCenterPackage,
} from "./finoraControlCenterSigner.js";

import {
  FINORA_BRANCH_DEVICE_REVOCATION_PAYLOAD_VERSION,
  FINORA_BRANCH_DEVICE_REVOCATION_PURPOSE,
} from "../control/finoraBranchDeviceTrustRevocationPackage.types.js";

import type {
  FinoraBranchDeviceRevocationPackageTarget,
  FinoraBranchDeviceRevocationPayloadV1,
} from "../control/finoraBranchDeviceTrustRevocationPackage.types.js";

export interface SignFinoraBranchDeviceRevocationPackageInput {
  packageId: string;
  sequence: number;
  issuedAt: string;
  target: FinoraBranchDeviceRevocationPackageTarget;
  payload: unknown;
  packageValidity?: FinoraControlCenterPackageValidity;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isCanonicalTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function validateTarget(target: FinoraBranchDeviceRevocationPackageTarget): void {
  if (!hasText(target.ownerId) || !hasText(target.businessId) || !hasText(target.branchId) || !hasText(target.installationId) || !hasText(target.bindingKeyId) || target.fingerprintAlgorithm !== "SHA-256" || !hasText(target.publicKeyFingerprint)) {
    throw new Error("FINORA Device Revocation target identity is incomplete.");
  }
}

function validatePayload(value: unknown): FinoraBranchDeviceRevocationPayloadV1 {
  if (!isRecord(value)) throw new Error("FINORA Device Revocation payload must be an object.");
  const demo = value.dataContext === "DEMO";
  const expected = demo ? ["schemaVersion","action","issuedAt","userId","canonicalUsername","storageMode","dataContext","demoId","reason"] : ["schemaVersion","action","issuedAt","userId","canonicalUsername","storageMode","dataContext","reason"];
  if (!hasExactKeys(value, expected)) throw new Error("FINORA Device Revocation payload contains unexpected fields.");
  if (value.schemaVersion !== 1 || value.action !== "REVOKE" || !isCanonicalTimestamp(value.issuedAt) || !hasText(value.userId) || !hasText(value.canonicalUsername) || value.canonicalUsername !== value.canonicalUsername.trim().toLowerCase() || (value.storageMode !== "LOCAL" && value.storageMode !== "USB") || (value.dataContext !== "REAL" && value.dataContext !== "DEMO") || !hasText(value.reason)) {
    throw new Error("FINORA Device Revocation payload is invalid.");
  }
  if (demo && !hasText(value.demoId)) throw new Error("FINORA DEMO Device Revocation requires demoId.");
  return value as unknown as FinoraBranchDeviceRevocationPayloadV1;
}

export async function signFinoraBranchDeviceRevocationPackage(
  input: SignFinoraBranchDeviceRevocationPackageInput,
): Promise<FinoraControlCenterSignedPackage<Record<string, unknown>>> {
  if (!hasText(input.packageId)) throw new Error("FINORA Device Revocation packageId is required.");
  if (!Number.isSafeInteger(input.sequence) || input.sequence <= 0) throw new Error("FINORA Device Revocation sequence must be a positive safe integer.");
  if (!isCanonicalTimestamp(input.issuedAt)) throw new Error("FINORA Device Revocation package issuedAt is invalid.");
  validateTarget(input.target);
  const payload = validatePayload(input.payload);
  if (payload.issuedAt !== input.issuedAt) throw new Error("FINORA Device Revocation payload and package issuedAt timestamps must match.");
  return signFinoraControlCenterPackage({
    packageId: input.packageId,
    purpose: FINORA_BRANCH_DEVICE_REVOCATION_PURPOSE,
    target: {
      ownerId: input.target.ownerId,
      businessId: input.target.businessId,
      branchId: input.target.branchId,
      installationId: input.target.installationId,
      bindingKeyId: input.target.bindingKeyId,
      fingerprintAlgorithm: input.target.fingerprintAlgorithm,
      publicKeyFingerprint: input.target.publicKeyFingerprint,
    },
    issuedAt: input.issuedAt,
    ...(input.packageValidity === undefined ? {} : { validity: input.packageValidity }),
    sequence: input.sequence,
    payloadVersion: FINORA_BRANCH_DEVICE_REVOCATION_PAYLOAD_VERSION,
    payload: payload as unknown as Record<string, unknown>,
    schemaVersion: 1,
  });
}
