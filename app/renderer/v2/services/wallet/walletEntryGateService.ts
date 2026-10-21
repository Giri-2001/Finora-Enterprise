import {
  getFinoraServerWalletBridge,
} from "./finoraServerWalletBridge";
import type {
  ServerWalletServiceCode,
} from "./finoraServerWalletBridge";
/* ============================================================
   FINORA ENTERPRISE OS™

   WALLET ENTRY GATE SERVICE

   RESPONSIBILITY:
   - Resolve authoritative Wallet requirements before new entries
   - Use exact Owner + Business + Branch scope
   - Use authoritative Control Center / release pricing
   - Use authoritative persisted Wallet balance
   - Never mutate Wallet balance
   - Never hardcode business pricing

   PHASE 1:
   - Customer create gate

   FUTURE:
   - Loan create gate
   - Collection max-fee gate
   - Subscription precedence integration
============================================================ */

import type {
  WalletScope,
} from "../../types/wallet/wallet.types";

import {
  resolveFinoraAuthoritativeEffectivePrice,
} from "../pricing/finoraEffectivePricingAuthorityService";

import {
  FINORA_COLLECTION_PROCESSING_UPPER_THRESHOLD,
  resolveFinoraCollectionProcessingPrice,
} from "../pricing/finoraCollectionProcessingPricing";

import {
  authorizeFinoraCommercialWrite,
} from "../activation/finoraCommercialWriteGuard";

import type {
  FinoraCommercialWriteCapability,
} from "../../types/activation/finoraBranchAccess.types";

import {
  loadWalletBalance,
} from "./walletWorkspaceService";

/* ============================================================
   RESULT
============================================================ */

export type FinoraWalletEntryGateReason =
  | "NONE"
  | "WALLET_INSUFFICIENT"
  | "COMMERCIAL_ACCESS_DENIED"
  | "UNAVAILABLE";

export interface FinoraWalletEntryGateResult {
  canEnter: boolean;

  reason:
    FinoraWalletEntryGateReason;

  requiredFee:
    number | null;

  availableBalance:
    number | null;

  message:
    string | null;
}

/* ============================================================
   MESSAGE
============================================================ */

/* FINORA_P1_585G_SERVER_GATE
 * UI entry check only. Does not authorize or execute a debit.
 */
async function checkFinoraLiveWalletEntry(
  scope: WalletScope,
  charge: ServerWalletServiceCode | "COLLECTION_MAX",
): Promise<FinoraWalletEntryGateResult> {
  const blocked = (): FinoraWalletEntryGateResult => ({
    canEnter: false,
    reason: "UNAVAILABLE",
    requiredFee: null,
    availableBalance: null,
    message: "Internet and verified FINORA Wallet access are required.",
  });

  if (!scope.ownerId || !scope.businessId || !scope.branchId) {
    return blocked();
  }

  const bridge = getFinoraServerWalletBridge();
  if (!bridge) return blocked();

  const money = (value: unknown): number | null => {
    if (
      typeof value !== "string" ||
      !/^(0|[1-9]\d{0,9})\.\d{2}$/.test(value)
    ) return null;

    const amount = Number(value);
    return Number.isSafeInteger(amount * 100) ? amount : null;
  };

  try {
    const [balance, pricing] = await Promise.all([
      bridge.balance(),
      bridge.pricing(),
    ]);

    if (
      !balance.success ||
      !pricing.success ||
      balance.data.source !== "POSTGRESQL_WALLETS" ||
      balance.data.currency !== "INR" ||
      pricing.data.source !== "FINORA_POSTGRESQL_PRICING" ||
      pricing.data.branchId !== scope.branchId ||
      !Array.isArray(pricing.data.plans) ||
      pricing.data.plans.length !== 4
    ) return blocked();

    const availableBalance = money(balance.data.balanceInr);
    if (availableBalance === null) return blocked();

    const codes: ServerWalletServiceCode[] =
      charge === "COLLECTION_MAX"
        ? [
            "COLLECTION_BELOW_25000",
            "COLLECTION_25000_TO_50000",
            "COLLECTION_ABOVE_50000",
          ]
        : [charge];

    const fees = pricing.data.plans.map(plan => {
      const amounts = codes.map(code => money(plan.fees?.[code]));

      if (amounts.some(value => value === null)) return null;

      return Math.max(...(amounts as number[]));
    });

    if (
      fees.some(fee => fee === null) ||
      fees.some(fee => fee !== fees[0])
    ) return blocked();

    const requiredFee = fees[0];

    if (
      requiredFee === null ||
      requiredFee <= 0
    ) return blocked();

    const canEnter = availableBalance >= requiredFee;

    return {
      canEnter,
      reason: canEnter ? "NONE" : "WALLET_INSUFFICIENT",
      requiredFee,
      availableBalance,
      message: canEnter
        ? null
        : FINORA_WALLET_ENTRY_LOCK_MESSAGE,
    };
  } catch {
    return blocked();
  }
}
export const FINORA_WALLET_ENTRY_LOCK_MESSAGE =
  "Recharge wallet to continue.";
async function resolveCommercialAccessEntryGate(
  capability: FinoraCommercialWriteCapability,
): Promise<FinoraWalletEntryGateResult | null> {
  const decision =
    await authorizeFinoraCommercialWrite(
      capability,
    );

  if (decision.allowed) {
    return null;
  }

  return {
    canEnter: false,
    reason: "COMMERCIAL_ACCESS_DENIED",
    requiredFee: null,
    availableBalance: null,
    message: decision.reason,
  };
}


export async function resolveLoanCreateWalletEntryGate(
  scope: WalletScope,
): Promise<FinoraWalletEntryGateResult> {
  const accessGate =
    await resolveCommercialAccessEntryGate(
      "DISBURSE_LOAN",
    );

  if (accessGate) {
    return accessGate;
  }
  return checkFinoraLiveWalletEntry(scope, "LOAN_DISBURSEMENT");



}
/* ============================================================
   CUSTOMER CREATE
============================================================ */

export async function resolveCustomerCreateWalletEntryGate(
  scope: WalletScope,
): Promise<FinoraWalletEntryGateResult> {

  const accessGate =
    await resolveCommercialAccessEntryGate(
      "CREATE_CUSTOMER",
    );

  if (accessGate) {
    return accessGate;
  }
  return checkFinoraLiveWalletEntry(scope, "CUSTOMER_CREATE");



}
export async function resolveCollectionCreateWalletEntryGate(
  scope: WalletScope,
): Promise<FinoraWalletEntryGateResult> {
  const accessGate =
    await resolveCommercialAccessEntryGate(
      "POST_COLLECTION",
    );

  if (accessGate) {
    return accessGate;
  }
  return checkFinoraLiveWalletEntry(scope, "COLLECTION_MAX");



}
