/* ============================================================
   FINORA ENTERPRISE OS
   VERIFIED BRANCH DEVICE REVOCATION PACKAGE APPLY SERVICE
============================================================ */

import {
  canonicalizeFinoraCredentialUsername,
  commitFinoraDeviceRevocationReplay,
  precheckFinoraDeviceRevocationReplay,
  readFinoraControlStore,
  runFinoraControlPackageApplySerialized,
} from "./finoraControlStore.js";

import type { FinoraControlStoreResult } from "./finoraControlStore.js";

import {
  verifyFinoraSignedControlPackageNative,
} from "./finoraSignedControlPackageVerifier.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

import {
  getFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  revokeFinoraWindowsBranchDeviceTrust,
} from "./finoraBranchDeviceTrustRevocationAuthority.js";

import {
  FINORA_BRANCH_DEVICE_REVOCATION_PAYLOAD_VERSION,
  FINORA_BRANCH_DEVICE_REVOCATION_PURPOSE,
} from "./finoraBranchDeviceTrustRevocationPackage.types.js";

import type {
  FinoraBranchDeviceRevocationPayloadV1,
} from "./finoraBranchDeviceTrustRevocationPackage.types.js";

export interface FinoraBranchDeviceRevocationApplyResult {
  status: "REVOKED" | "ALREADY_REVOKED";
  matchedRecords: number;
  changedRecords: number;
  revokedAt?: string;
}

function failure(error: string): FinoraControlStoreResult<FinoraBranchDeviceRevocationApplyResult> {
  return { success: false, error };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
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
  return actual.length === wanted.length && actual.every((item, index) => item === wanted[index]);
}

function isRevocationPayload(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const baseKeys = ["schemaVersion","action","issuedAt","userId","canonicalUsername","storageMode","dataContext","reason"];
  const expectedKeys = value.dataContext === "DEMO" ? [...baseKeys,"demoId"] : baseKeys;
  if (!hasExactKeys(value, expectedKeys)) return false;
  if (value.schemaVersion !== 1 || value.action !== "REVOKE" || !isCanonicalTimestamp(value.issuedAt) || !isNonEmptyString(value.userId) || !isNonEmptyString(value.canonicalUsername) || (value.storageMode !== "LOCAL" && value.storageMode !== "USB") || (value.dataContext !== "REAL" && value.dataContext !== "DEMO") || !isNonEmptyString(value.reason)) return false;
  if (canonicalizeFinoraCredentialUsername(value.canonicalUsername) !== value.canonicalUsername) return false;
  return value.dataContext === "DEMO" ? isNonEmptyString(value.demoId) : value.demoId === undefined;
}

export async function applyFinoraSignedBranchDeviceRevocationPackage(
  signedPackage: unknown,
  trustedKeys: readonly FinoraBranchTrustedControlPublicKey[],
  now: Date,
): Promise<FinoraControlStoreResult<FinoraBranchDeviceRevocationApplyResult>> {
  const storeResult = await readFinoraControlStore();
  if (!storeResult.success || !storeResult.data) return failure(storeResult.error ?? "Unable to load the FINORA Control Store.");
  const installation = storeResult.data.installation;
  if (!installation) return failure("FINORA installation identity is required before Device Revocation apply.");

  let nativeBinding;
  try { nativeBinding = await getFinoraWindowsInstallationBinding(); }
  catch (error) { return failure(error instanceof Error ? error.message : "Unable to load the FINORA native installation binding."); }
  if (!nativeBinding) return failure("FINORA native installation binding is required before Device Revocation apply.");
  if (nativeBinding.installationId !== installation.installationId || nativeBinding.fingerprintAlgorithm !== "SHA-256") return failure("FINORA native installation binding does not match the Control Store installation identity.");

  const expectedTarget = {
    ownerId: installation.ownerId,
    businessId: installation.businessId,
    branchId: installation.branchId,
    installationId: installation.installationId,
    bindingKeyId: nativeBinding.bindingKeyId,
    fingerprintAlgorithm: "SHA-256" as const,
    publicKeyFingerprint: nativeBinding.publicKeyFingerprint,
  };

  const verification = verifyFinoraSignedControlPackageNative(signedPackage, trustedKeys, expectedTarget, now);
  if (!verification.valid) return failure(`${verification.reason}: ${verification.error}`);
  const controlPackage = verification.controlPackage;

  if (controlPackage.purpose !== FINORA_BRANCH_DEVICE_REVOCATION_PURPOSE) return failure("FINORA Control Package purpose must be DEVICE_REVOCATION.");
  if (controlPackage.payloadVersion !== FINORA_BRANCH_DEVICE_REVOCATION_PAYLOAD_VERSION) return failure("FINORA Device Revocation payload version is unsupported.");
  if (!isRevocationPayload(controlPackage.payload)) return failure("FINORA Device Revocation payload structure is invalid.");

  const payload = controlPackage.payload as unknown as FinoraBranchDeviceRevocationPayloadV1;
  if (payload.issuedAt !== controlPackage.issuedAt) return failure("FINORA Device Revocation payload issuedAt does not match the signed envelope.");

  const appliedAt = now.toISOString();

  return runFinoraControlPackageApplySerialized(async () => {
    const replayInput = {
      packageId: controlPackage.packageId,
      issuerId: controlPackage.issuer.issuerId,
      purpose: FINORA_BRANCH_DEVICE_REVOCATION_PURPOSE,
      sequence: controlPackage.sequence,
      target: {
        ownerId: installation.ownerId,
        businessId: installation.businessId,
        branchId: installation.branchId,
        installationId: installation.installationId,
      },
      appliedAt,
    };

    const precheck = await precheckFinoraDeviceRevocationReplay(replayInput);
    if (!precheck.success) return failure(precheck.error ?? "FINORA Device Revocation replay precheck failed.");

    const revoked = await revokeFinoraWindowsBranchDeviceTrust({ target: expectedTarget, payload });
    if (!revoked.success) return failure(`${revoked.errorCode}: ${revoked.error}`);

    const committed = await commitFinoraDeviceRevocationReplay(replayInput);
    if (!committed.success) return failure(committed.error ?? "FINORA Device Revocation replay commit failed.");

    return {
      success: true,
      data: {
        status: revoked.status,
        matchedRecords: revoked.matchedRecords,
        changedRecords: revoked.changedRecords,
        ...(revoked.revokedAt === undefined ? {} : { revokedAt: revoked.revokedAt }),
      },
    };
  });
}

// ============================================================
// END
// ============================================================
