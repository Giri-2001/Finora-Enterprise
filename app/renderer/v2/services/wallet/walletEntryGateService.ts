/*
 * FINORA C79-R92
 * Subscription-only commercial entry gate.
 *
 * Entry is governed by authenticated commercial authorization.
 * No Wallet balance checks or per-operation fees.
 *
 * The commercial write guard validates subscription validity
 * again at the actual save boundary.
 */

import type {
  WalletScope,
} from "../../types/wallet/wallet.types";

import {
  authorizeFinoraCommercialWrite,
} from "../activation/finoraCommercialWriteGuard";

import type {
  FinoraCommercialWriteCapability,
} from "../../types/activation/finoraBranchAccess.types";

export type FinoraWalletEntryGateReason =
  | "NONE"
  | "WALLET_INSUFFICIENT"
  | "COMMERCIAL_ACCESS_DENIED"
  | "UNAVAILABLE";

export interface FinoraWalletEntryGateResult {
  canEnter: boolean;
  reason: FinoraWalletEntryGateReason;
  requiredFee: number | null;
  availableBalance: number | null;
  message: string | null;
}

// Retained for compatibility with existing imports.
export const FINORA_WALLET_ENTRY_LOCK_MESSAGE =
  "An ACTIVE PAISARULE subscription is required.";

async function resolveSubscriptionEntryGate(
  scope: WalletScope,
  capability: FinoraCommercialWriteCapability,
): Promise<FinoraWalletEntryGateResult> {
  const denied = (message: string): FinoraWalletEntryGateResult => ({
    canEnter: false,
    reason: "COMMERCIAL_ACCESS_DENIED",
    requiredFee: null,
    availableBalance: null,
    message,
  });

  if (
    !scope.ownerId ||
    !scope.businessId ||
    !scope.branchId
  ) {
    return denied("Authenticated FINORA branch scope is required.");
  }

  try {
    const decision = await authorizeFinoraCommercialWrite(
      capability,
    );

    if (!decision.allowed) {
      return denied(
        decision.reason ||
        "An ACTIVE PAISARULE subscription is required.",
      );
    }

    return {
      canEnter: true,
      reason: "NONE",
      requiredFee: 0,
      availableBalance: null,
      message: null,
    };
  } catch {
    return denied(
      "Subscription verification is unavailable. Please reconnect.",
    );
  }
}

export function resolveCustomerCreateWalletEntryGate(
  scope: WalletScope,
): Promise<FinoraWalletEntryGateResult> {
  return resolveSubscriptionEntryGate(
    scope,
    "CREATE_CUSTOMER",
  );
}

export function resolveLoanCreateWalletEntryGate(
  scope: WalletScope,
): Promise<FinoraWalletEntryGateResult> {
  return resolveSubscriptionEntryGate(
    scope,
    "DISBURSE_LOAN",
  );
}

export function resolveCollectionCreateWalletEntryGate(
  scope: WalletScope,
): Promise<FinoraWalletEntryGateResult> {
  return resolveSubscriptionEntryGate(
    scope,
    "POST_COLLECTION",
  );
}