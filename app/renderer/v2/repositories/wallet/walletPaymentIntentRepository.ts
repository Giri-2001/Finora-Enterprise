/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   WALLET PAYMENT INTENT REPOSITORY

   RESPONSIBILITY:
   - Persist Wallet recharge payment intents
   - Read payment intents by payment reference
   - Update payment intent lifecycle state
   - Keep provider metadata gateway-neutral

   IMPORTANT:
   - No React.
   - No UI.
   - No provider API calls.
   - No balance mutation.
   - Storage access goes through StorageManager.
   - paymentReference is the canonical storage identity.

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */

import type {
  WalletPaymentIntent,
} from "../../types/wallet/wallet.payment.types";

import {
  storageManager,
} from "../../storage/storageManager";

import type {
  StorageQuery,
  StorageResult,
} from "../../storage/storage.types";

/* ============================================================
   CONSTANTS
============================================================ */

const WALLET_PAYMENT_INTENT_ENTITY =
  "WALLET_PAYMENT_INTENT" as const;

/* ============================================================
   STORAGE RECORD
============================================================ */

type WalletPaymentIntentStorageRecord =
  WalletPaymentIntent & {
    id:
      string;

    entity:
      typeof WALLET_PAYMENT_INTENT_ENTITY;
  };

/* ============================================================
   STORAGE CONVERSION
============================================================ */

function toWalletPaymentIntentStorageRecord(
  intent: WalletPaymentIntent,
): WalletPaymentIntentStorageRecord {
  return {
    ...intent,

    id:
      String(intent.paymentReference).trim(),

    entity:
      WALLET_PAYMENT_INTENT_ENTITY,
  };
}

/* ============================================================
   QUERY BUILDER
============================================================ */

function buildWalletPaymentIntentQuery(
  query?: Partial<StorageQuery>,
): StorageQuery {
  return {
    entity:
      WALLET_PAYMENT_INTENT_ENTITY,

    id:
      query?.id,

    ownerId:
      query?.ownerId,

    demoId:
      query?.demoId,

    limit:
      query?.limit,

    offset:
      query?.offset,
  };
}

/* ============================================================
   VALIDATION
============================================================ */

function validateWalletPaymentIntent(
  intent: WalletPaymentIntent,
): string | undefined {
  if (!String(intent.paymentReference ?? "").trim()) {
    return "Payment reference is required.";
  }

  if (!String(intent.walletId ?? "").trim()) {
    return "Wallet ID is required.";
  }

  if (!String(intent.ownerId ?? "").trim()) {
    return "Owner ID is required.";
  }

  if (!String(intent.businessId ?? "").trim()) {
    return "Business ID is required.";
  }

  if (!String(intent.branchId ?? "").trim()) {
    return "Branch ID is required.";
  }

  if (
    !Number.isFinite(intent.amount) ||
    intent.amount <= 0
  ) {
    return "Payment intent amount must be greater than zero.";
  }

  if (!String(intent.paymentMethod ?? "").trim()) {
    return "Payment method is required.";
  }

  if (!String(intent.paymentSource ?? "").trim()) {
    return "Payment source is required.";
  }

  if (!String(intent.status ?? "").trim()) {
    return "Payment intent status is required.";
  }

  if (!String(intent.createdAt ?? "").trim()) {
    return "Payment intent createdAt is required.";
  }

  if (!String(intent.updatedAt ?? "").trim()) {
    return "Payment intent updatedAt is required.";
  }

  return undefined;
}

/* ============================================================
   GET ALL PAYMENT INTENTS
============================================================ */

export async function getWalletPaymentIntentsResult(
  query?: Partial<StorageQuery>,
): Promise<StorageResult<WalletPaymentIntent[]>> {
  try {
    const result =
      await storageManager.getAll<WalletPaymentIntentStorageRecord>(
        buildWalletPaymentIntentQuery(query),
      );

    if (!result.success) {
      return {
        success:
          false,

        error:
          result.error ??
          "Unable to load Wallet payment intents.",
      };
    }

    return {
      success:
        true,

      data:
        result.data ?? [],
    };
  } catch (error) {
    return {
      success:
        false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to load Wallet payment intents.",
    };
  }
}

/* ============================================================
   GET BY PAYMENT REFERENCE
============================================================ */

export async function getWalletPaymentIntentByReferenceResult(
  paymentReference: string,
): Promise<StorageResult<WalletPaymentIntent | undefined>> {
  const normalizedPaymentReference =
    String(paymentReference ?? "").trim();

  if (!normalizedPaymentReference) {
    return {
      success:
        false,

      error:
        "Payment reference is required.",
    };
  }

  try {
    const result =
      await storageManager.get<WalletPaymentIntentStorageRecord>(
        buildWalletPaymentIntentQuery({
          id:
            normalizedPaymentReference,
        }),
      );

    if (!result.success) {
      return {
        success:
          false,

        error:
          result.error ??
          "Unable to load Wallet payment intent.",
      };
    }

    return {
      success:
        true,

      data:
        result.data,
    };
  } catch (error) {
    return {
      success:
        false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to load Wallet payment intent.",
    };
  }
}

/* ============================================================
   ADD PAYMENT INTENT
============================================================ */

export async function addWalletPaymentIntent(
  intent: WalletPaymentIntent,
): Promise<StorageResult<WalletPaymentIntent>> {
  const validationError =
    validateWalletPaymentIntent(intent);

  if (validationError) {
    return {
      success:
        false,

      error:
        validationError,
    };
  }

  const paymentReference =
    String(intent.paymentReference).trim();

  const existing =
    await storageManager.get<WalletPaymentIntentStorageRecord>(
      buildWalletPaymentIntentQuery({
        id:
          paymentReference,
      }),
    );

  if (!existing.success) {
    return {
      success:
        false,

      error:
        existing.error ??
        "Unable to verify existing Wallet payment intent.",
    };
  }

  if (existing.data) {
    return {
      success:
        false,

      error:
        "Wallet payment intent already exists.",
    };
  }

  const result =
    await storageManager.save<WalletPaymentIntentStorageRecord>(
      toWalletPaymentIntentStorageRecord(intent),
    );

  if (!result.success) {
    return {
      success:
        false,

      error:
        result.error ??
        "Unable to save Wallet payment intent.",
    };
  }

  return {
    success:
      true,

    data:
      intent,
  };
}

/* ============================================================
   UPDATE PAYMENT INTENT
============================================================ */

export async function updateWalletPaymentIntent(
  intent: WalletPaymentIntent,
): Promise<StorageResult<WalletPaymentIntent>> {
  const validationError =
    validateWalletPaymentIntent(intent);

  if (validationError) {
    return {
      success:
        false,

      error:
        validationError,
    };
  }

  const paymentReference =
    String(intent.paymentReference).trim();

  const existing =
    await storageManager.get<WalletPaymentIntentStorageRecord>(
      buildWalletPaymentIntentQuery({
        id:
          paymentReference,
      }),
    );

  if (!existing.success) {
    return {
      success:
        false,

      error:
        existing.error ??
        "Unable to verify Wallet payment intent.",
    };
  }

  if (!existing.data) {
    return {
      success:
        false,

      error:
        "Wallet payment intent does not exist.",
    };
  }

  const result =
    await storageManager.update<WalletPaymentIntentStorageRecord>(
      toWalletPaymentIntentStorageRecord(intent),
    );

  if (!result.success) {
    return {
      success:
        false,

      error:
        result.error ??
        "Unable to update Wallet payment intent.",
    };
  }

  return {
    success:
      true,

    data:
      intent,
  };
}

/* ============================================================
   END
============================================================ */
