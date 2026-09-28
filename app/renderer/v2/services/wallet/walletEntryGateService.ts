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

export const FINORA_WALLET_ENTRY_LOCK_MESSAGE =
  "Please recharge your wallet to unlock this button.";
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

const pricingResult =
    await resolveFinoraAuthoritativeEffectivePrice({
      chargeCode:
        "LOAN_DISBURSEMENT",

      scope: {
        ownerId:
          scope.ownerId,

        businessId:
          scope.businessId,

        branchId:
          scope.branchId,
      },
    });

  if (!pricingResult.success) {
    return {
      canEnter:
        false,

      reason:
        "UNAVAILABLE",

      requiredFee:
        null,

      availableBalance:
        null,

      message:
        FINORA_WALLET_ENTRY_LOCK_MESSAGE,
    };
  }

  const walletResult =
    await loadWalletBalance(
      scope,
    );

  if (!walletResult.success) {
    return {
      canEnter:
        false,

      reason:
        "UNAVAILABLE",

      requiredFee:
        pricingResult.quote.amount,

      availableBalance:
        null,

      message:
        FINORA_WALLET_ENTRY_LOCK_MESSAGE,
    };
  }

  const requiredFee =
    pricingResult.quote.amount;

  const availableBalance =
    walletResult.data.availableBalance;

  const canEnter =
    availableBalance >= requiredFee;

  return {
    canEnter,

    reason:
      canEnter
        ? "NONE"
        : "WALLET_INSUFFICIENT",

    requiredFee,

    availableBalance,

    message:
      canEnter
        ? null
        : FINORA_WALLET_ENTRY_LOCK_MESSAGE,
  };
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

const pricingResult =
    await resolveFinoraAuthoritativeEffectivePrice({
      chargeCode:
        "CUSTOMER_NUMBER_GENERATION",

      scope: {
        ownerId:
          scope.ownerId,

        businessId:
          scope.businessId,

        branchId:
          scope.branchId,
      },
    });

  if (!pricingResult.success) {
    return {
      canEnter:
        false,

      reason:
        "UNAVAILABLE",

      requiredFee:
        null,

      availableBalance:
        null,

      message:
        FINORA_WALLET_ENTRY_LOCK_MESSAGE,
    };
  }

  const walletResult =
    await loadWalletBalance(scope);

  if (!walletResult.success) {
    return {
      canEnter:
        false,

      reason:
        "UNAVAILABLE",

      requiredFee:
        pricingResult.quote.amount,

      availableBalance:
        null,

      message:
        FINORA_WALLET_ENTRY_LOCK_MESSAGE,
    };
  }

  const requiredFee =
    pricingResult.quote.amount;

  const availableBalance =
    walletResult.data.availableBalance;

  const canEnter =
    availableBalance >= requiredFee;

  return {
    canEnter,

    reason:
      canEnter
        ? "NONE"
        : "WALLET_INSUFFICIENT",

    requiredFee,

    availableBalance,

    message:
      canEnter
        ? null
        : FINORA_WALLET_ENTRY_LOCK_MESSAGE,
  };
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

  const pricingScope = {
    ownerId:
      scope.ownerId,

    businessId:
      scope.businessId,

    branchId:
      scope.branchId,
  };

  const aboveResult =
    resolveFinoraCollectionProcessingPrice(
      FINORA_COLLECTION_PROCESSING_UPPER_THRESHOLD + 1,
      pricingScope,
    );

  if (!aboveResult.success) {
    return {
      canEnter: false,
      reason: "UNAVAILABLE",
      requiredFee: null,
      availableBalance: null,
      message:
        FINORA_WALLET_ENTRY_LOCK_MESSAGE,
    };
  }

  const requiredFee =
    aboveResult.quote.amount;

  const walletResult =
    await loadWalletBalance(
      scope,
    );

  if (!walletResult.success) {
    return {
      canEnter: false,
      reason: "UNAVAILABLE",
      requiredFee,
      availableBalance: null,
      message:
        FINORA_WALLET_ENTRY_LOCK_MESSAGE,
    };
  }

  const availableBalance =
    walletResult.data.availableBalance;

  const canEnter =
    availableBalance >=
    requiredFee;

  return {
    canEnter,
    reason:
      canEnter
        ? "NONE"
        : "WALLET_INSUFFICIENT",
    requiredFee,
    availableBalance,
    message:
      canEnter
        ? null
        : FINORA_WALLET_ENTRY_LOCK_MESSAGE,
  };
}

