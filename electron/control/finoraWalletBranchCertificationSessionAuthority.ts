import {
  assertFinoraBranchCertificationKeyMaterial,
} from "./finoraBranchCertificationCrypto.js";

import type {
  FinoraBranchCertificationKeyMaterialV1,
} from "./finoraBranchCertificationContract.js";

type WalletBranchCertificationEntry = {
  ownerId: string;
  businessId: string;
  branchId: string;
  material: FinoraBranchCertificationKeyMaterialV1;
};

let current:
  WalletBranchCertificationEntry | undefined;

function requireText(
  value: string,
  label: string,
): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value !== value.trim()
  ) {
    throw new Error(
      `FINORA Wallet Branch Certification ${label} is invalid.`,
    );
  }

  return value;
}

export function installFinoraWalletBranchCertificationSessionAuthority(
  ownerId: string,
  businessId: string,
  branchId: string,
  material: FinoraBranchCertificationKeyMaterialV1,
): void {
  const canonicalOwnerId =
    requireText(ownerId, "ownerId");

  const canonicalBusinessId =
    requireText(businessId, "businessId");

  const canonicalBranchId =
    requireText(branchId, "branchId");

  assertFinoraBranchCertificationKeyMaterial(
    material,
  );

  current = {
    ownerId:
      canonicalOwnerId,

    businessId:
      canonicalBusinessId,

    branchId:
      canonicalBranchId,

    material,
  };
}

export function requireFinoraWalletBranchCertificationSessionAuthority(
  ownerId: string,
  businessId: string,
  branchId: string,
): FinoraBranchCertificationKeyMaterialV1 {
  const canonicalOwnerId =
    requireText(ownerId, "ownerId");

  const canonicalBusinessId =
    requireText(businessId, "businessId");

  const canonicalBranchId =
    requireText(branchId, "branchId");

  const value =
    current;

  if (
    !value ||
    value.ownerId !== canonicalOwnerId ||
    value.businessId !== canonicalBusinessId ||
    value.branchId !== canonicalBranchId
  ) {
    throw new Error(
      "FINORA Wallet Branch Certification runtime authority is unavailable for the authenticated branch.",
    );
  }

  assertFinoraBranchCertificationKeyMaterial(
    value.material,
  );

  return value.material;
}

export function isFinoraWalletBranchCertificationSessionAuthorityAvailableFor(
  ownerId: string,
  businessId: string,
  branchId: string,
): boolean {
  return (
    typeof ownerId === "string" &&
    typeof businessId === "string" &&
    typeof branchId === "string" &&
    current !== undefined &&
    current.ownerId === ownerId &&
    current.businessId === businessId &&
    current.branchId === branchId
  );
}

export function clearFinoraWalletBranchCertificationSessionAuthority():
  void {
  current =
    undefined;
}
