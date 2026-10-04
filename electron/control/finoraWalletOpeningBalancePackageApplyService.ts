/* ============================================================
   FINORA ENTERPRISE OS

   CONTROL PLANE
   SIGNED WALLET OPENING BALANCE APPLY SERVICE

   RESPONSIBILITY:
   - Verify trusted signed opening-balance authorization
   - Enforce exact Owner / Business / Branch target
   - Enforce exact Wallet identity
   - Enforce one-time canonical initialization
   - Never read spend authority from removable USB
   - Never silently reconstruct authority from backup
   - Initialize Canonical Wallet Authority only once

   IMPORTANT:
   - MAIN PROCESS TRUSTED BOUNDARY
   - No renderer write authority
   - No direct USB spend authority
   - No automatic legacy-wallet migration
   ============================================================ */

import type {
  FinoraControlStoreResult,
} from "./finoraControlStore.js";

function normalizeOpeningBalanceIdentityPart(
  value:
    string,
): string {

  const normalized =
    value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  if (!normalized) {
    throw new Error(
      "FINORA Wallet identity part cannot be empty.",
    );
  }

  return normalized;
}

function buildOpeningBalanceWalletId(
  input: {
    ownerId:
      string;

    businessId:
      string;

    branchId:
      string;
  },
): string {

  const ownerId =
    normalizeOpeningBalanceIdentityPart(
      input.ownerId,
    );

  const businessId =
    normalizeOpeningBalanceIdentityPart(
      input.businessId,
    );

  const branchId =
    normalizeOpeningBalanceIdentityPart(
      input.branchId,
    );

  return [
    "FINORA",
    "WALLET",
    ownerId,
    businessId,
    branchId,
  ].join(":");
}
import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

import {
  readFinoraControlStore,
} from "./finoraControlStore.js";

import {
  verifyFinoraSignedControlPackageBranchScope,
} from "./finoraSignedControlPackageVerifier.js";

import {
  createOpeningBalanceFinoraCanonicalWalletAuthority,
} from "./finoraCanonicalWalletAuthorityProvider.js";

export interface FinoraWalletOpeningBalancePackageApplyResult {
  packageId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  walletId:
    string;

  openingBalance:
    number;
}

function failure(
  error:
    string,
): FinoraControlStoreResult<
  FinoraWalletOpeningBalancePackageApplyResult
> {
  return {
    success:
      false,

    error,
  };
}

/**
 * Real signed-package verification and canonical initialization
 * will be wired in the next phase.
 *
 * This placeholder intentionally fails closed.
 */
export async function applyFinoraSignedWalletOpeningBalancePackage(
  signedPackage:
    unknown,

  trustedKeys:
    readonly FinoraBranchTrustedControlPublicKey[],

  now:
    Date,
): Promise<
  FinoraControlStoreResult<
    FinoraWalletOpeningBalancePackageApplyResult
  >
> {

  const storeResult =
    await readFinoraControlStore();

  if (
    !storeResult.success ||
    !storeResult.data
  ) {
    return failure(
      storeResult.error ??
      "Unable to load the FINORA Control Store.",
    );
  }

  const installation =
    storeResult.data.installation;

  if (!installation) {
    return failure(
      "FINORA installation identity is required before applying Wallet Opening Balance.",
    );
  }

  const verification =
    verifyFinoraSignedControlPackageBranchScope(
      signedPackage,
      trustedKeys,
      {
        ownerId:
          installation.ownerId,

        businessId:
          installation.businessId,

        branchId:
          installation.branchId,
      },
      now,
    );

  if (!verification.valid) {
    return failure(
      `${verification.reason}: ${verification.error}`,
    );
  }

  const controlPackage =
    verification.controlPackage;

  if (
    controlPackage.purpose !==
      "WALLET_OPENING_BALANCE"
  ) {
    return failure(
      "FINORA signed package purpose must be WALLET_OPENING_BALANCE.",
    );
  }

  if (
    controlPackage.payloadVersion !==
      1
  ) {
    return failure(
      "FINORA WALLET_OPENING_BALANCE payload version is unsupported.",
    );
  }

  const payload =
    controlPackage.payload;

  if (
    typeof payload !==
      "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return failure(
      "FINORA WALLET_OPENING_BALANCE payload is malformed.",
    );
  }

  const record =
    payload as Record<string, unknown>;

  const scope =
    record.scope;

  if (
    typeof scope !==
      "object" ||
    scope === null ||
    Array.isArray(scope)
  ) {
    return failure(
      "FINORA WALLET_OPENING_BALANCE scope is malformed.",
    );
  }

  const scopeRecord =
    scope as Record<string, unknown>;

  const walletId =
    String(
      record.walletId ??
      "",
    ).trim();

  const openingBalanceMinor =
    record.openingBalanceMinor;

  if (
    typeof scopeRecord.ownerId !==
      "string" ||
    typeof scopeRecord.businessId !==
      "string" ||
    typeof scopeRecord.branchId !==
      "string"
  ) {
    return failure(
      "FINORA WALLET_OPENING_BALANCE scope is invalid.",
    );
  }

  if (
    scopeRecord.ownerId !==
      installation.ownerId ||
    scopeRecord.businessId !==
      installation.businessId ||
    scopeRecord.branchId !==
      installation.branchId
  ) {
    return failure(
      "FINORA WALLET_OPENING_BALANCE scope does not match the verified installation.",
    );
  }

  if (!walletId) {
    return failure(
      "FINORA WALLET_OPENING_BALANCE walletId is required.",
    );
  }

  let expectedWalletId:
    string;

  try {

    expectedWalletId =
      buildOpeningBalanceWalletId({
        ownerId:
          scopeRecord.ownerId,

        businessId:
          scopeRecord.businessId,

        branchId:
          scopeRecord.branchId,
      });

  }
  catch (error) {

    return failure(
      error instanceof Error
        ? error.message
        : "FINORA WALLET_OPENING_BALANCE Wallet ID could not be derived.",
    );
  }

  if (
    walletId !==
      expectedWalletId
  ) {
    return failure(
      "FINORA WALLET_OPENING_BALANCE walletId does not match the deterministic Owner / Business / Branch Wallet identity.",
    );
  }

  if (
    typeof openingBalanceMinor !==
      "number" ||
    !Number.isSafeInteger(
      openingBalanceMinor,
    ) ||
    openingBalanceMinor < 0
  ) {
    return failure(
      "FINORA WALLET_OPENING_BALANCE opening balance is invalid.",
    );
  }

  const openingBalance =
    openingBalanceMinor / 100;

  let canonicalState;

  try {

    canonicalState =
      await createOpeningBalanceFinoraCanonicalWalletAuthority({
        ownerId:
          installation.ownerId,

        businessId:
          installation.businessId,

        branchId:
          installation.branchId,

        walletId,

        openingBalance,
      });

  }
  catch (error) {

    return failure(
      error instanceof Error
        ? error.message
        : "FINORA canonical Wallet Authority opening-balance creation failed.",
    );
  }

  return {
    success:
      true,

    data: {
      packageId:
        controlPackage.packageId,

      ownerId:
        canonicalState.ownerId,

      businessId:
        canonicalState.businessId,

      branchId:
        canonicalState.branchId,

      walletId:
        canonicalState.walletId,

      openingBalance:
        canonicalState.authoritativeBalance,
    },
  };
}




