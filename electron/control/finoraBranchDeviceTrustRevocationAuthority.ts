/* ============================================================
   FINORA ENTERPRISE OS
   WINDOWS BRANCH DEVICE TRUST REVOCATION MUTATION AUTHORITY
============================================================ */

import {
  runFinoraBranchDeviceTrustMutationSerialized,
} from "./finoraBranchDeviceTrustAuthority.js";

import {
  loadFinoraBranchDeviceTrustStore,
  persistFinoraBranchDeviceTrustStore,
} from "./finoraBranchDeviceTrustStore.js";

import {
  assertFinoraBranchDeviceTrustLifecycleTransition,
} from "./finoraBranchDeviceTrustLifecycle.js";

import type {
  FinoraBranchDeviceTrustRecord,
} from "./finoraBranchDeviceTrustStore.js";

import type {
  FinoraBranchDeviceRevocationPackageTarget,
  FinoraBranchDeviceRevocationPayloadV1,
} from "./finoraBranchDeviceTrustRevocationPackage.types.js";

export interface FinoraBranchDeviceTrustRevocationMutationInput {
  target: FinoraBranchDeviceRevocationPackageTarget;
  payload: FinoraBranchDeviceRevocationPayloadV1;
}

export type FinoraBranchDeviceTrustRevocationMutationResult =
  | { success: true; status: "REVOKED" | "ALREADY_REVOKED"; matchedRecords: number; changedRecords: number; revokedAt?: string }
  | { success: false; errorCode: "DEVICE_TRUST_NOT_FOUND" | "DEVICE_TRUST_STORE_FAILED" | "DEVICE_TRUST_CLOCK_ROLLBACK" | "DEVICE_TRUST_PERSIST_FAILED"; error: string };

function matchesRevocation(
  record: FinoraBranchDeviceTrustRecord,
  input: FinoraBranchDeviceTrustRevocationMutationInput,
): boolean {
  const { target, payload } = input;
  return (
    record.userId === payload.userId &&
    record.canonicalUsername === payload.canonicalUsername &&
    record.ownerId === target.ownerId &&
    record.businessId === target.businessId &&
    record.branchId === target.branchId &&
    record.storageMode === payload.storageMode &&
    record.dataContext === payload.dataContext &&
    (record.demoId ?? undefined) === (payload.demoId ?? undefined) &&
    record.platform === "WINDOWS" &&
    record.installationId === target.installationId &&
    record.bindingKeyId === target.bindingKeyId &&
    record.fingerprintAlgorithm === target.fingerprintAlgorithm &&
    record.publicKeyFingerprint === target.publicKeyFingerprint
  );
}

async function revokeInternal(
  input: FinoraBranchDeviceTrustRevocationMutationInput,
): Promise<FinoraBranchDeviceTrustRevocationMutationResult> {
  let store;
  try {
    store = await loadFinoraBranchDeviceTrustStore();
  } catch {
    return { success: false, errorCode: "DEVICE_TRUST_STORE_FAILED", error: "FINORA Device Trust state could not be validated." };
  }

  if (!store) {
    return { success: false, errorCode: "DEVICE_TRUST_NOT_FOUND", error: "FINORA Device Trust state does not exist for this branch." };
  }

  const matchingRecords = store.records.filter((record) => matchesRevocation(record, input));
  if (matchingRecords.length === 0) {
    return { success: false, errorCode: "DEVICE_TRUST_NOT_FOUND", error: "FINORA exact Device Trust authority to revoke was not found." };
  }

  const activeRecords = matchingRecords.filter((record) => record.status === "ACTIVE");
  if (activeRecords.length === 0) {
    return {
      success: true,
      status: "ALREADY_REVOKED",
      matchedRecords: matchingRecords.length,
      changedRecords: 0,
      revokedAt: matchingRecords.find((record) => record.status === "REVOKED")?.revokedAt,
    };
  }

  const revokedAt = new Date().toISOString();
  if (Date.parse(revokedAt) < Date.parse(store.updatedAt) || activeRecords.some((record) => Date.parse(revokedAt) < Date.parse(record.trustedAt))) {
    return { success: false, errorCode: "DEVICE_TRUST_CLOCK_ROLLBACK", error: "FINORA Device Trust revocation clock is behind persisted authority state." };
  }

  const nextRecords: FinoraBranchDeviceTrustRecord[] = store.records.map((record) => {
    if (!matchesRevocation(record, input) || record.status === "REVOKED") return record;
    assertFinoraBranchDeviceTrustLifecycleTransition(
      { status: "ACTIVE" },
      { status: "REVOKED", revokedAt },
    );
    return { ...record, status: "REVOKED" as const, revokedAt, updatedAt: revokedAt };
  });

  try {
    await persistFinoraBranchDeviceTrustStore({ ...store, records: nextRecords, updatedAt: revokedAt });
  } catch {
    return { success: false, errorCode: "DEVICE_TRUST_PERSIST_FAILED", error: "FINORA could not persist the revoked Device Trust authority." };
  }

  return {
    success: true,
    status: "REVOKED",
    matchedRecords: matchingRecords.length,
    changedRecords: activeRecords.length,
    revokedAt,
  };
}

export function revokeFinoraWindowsBranchDeviceTrust(
  input: FinoraBranchDeviceTrustRevocationMutationInput,
): Promise<FinoraBranchDeviceTrustRevocationMutationResult> {
  return runFinoraBranchDeviceTrustMutationSerialized(() => revokeInternal(input));
}
