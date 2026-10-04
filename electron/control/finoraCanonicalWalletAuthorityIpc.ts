import {
  ipcMain,
} from "electron";

import type {
  IpcMainInvokeEvent,
} from "electron";

import type {
  FinoraControlRendererValidator,
} from "./finoraControlIpc.js";

import type {
  FinoraCanonicalWalletAuthorityMutationInput,
  FinoraCanonicalWalletAuthorityProvider,
  FinoraCanonicalWalletAuthorityReadInput,
} from "./finoraCanonicalWalletAuthority.js";

import {
  readFinoraControlStore,
} from "./finoraControlStore.js";

import {
  createInitialFinoraCanonicalWalletAuthority,
} from "./finoraCanonicalWalletAuthorityProvider.js";

export const FINORA_CANONICAL_WALLET_AUTHORITY_CHANNELS = {
  READ:
    "finora:wallet-authority:read",

  COMMIT_MUTATION:
    "finora:wallet-authority:commit-mutation",

  INITIALIZE:
    "finora:wallet-authority:initialize",
} as const;

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {

  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function isText(
  value:
    unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function isReadInput(
  value:
    unknown,
): value is FinoraCanonicalWalletAuthorityReadInput {

  if (!isRecord(value)) {
    return false;
  }

  return (
    isText(value.ownerId) &&
    isText(value.businessId) &&
    isText(value.branchId) &&
    isText(value.walletId)
  );
}

function isMutationInput(
  value:
    unknown,
): value is FinoraCanonicalWalletAuthorityMutationInput {

  if (
    !isReadInput(
      value,
    )
  ) {
    return false;
  }

  const record =
    value as unknown as Record<string, unknown>;

  return (
    Number.isInteger(
      record.expectedAuthorityGeneration,
    ) &&
    Number(record.expectedAuthorityGeneration) >=
      0 &&
    Number.isInteger(
      record.expectedSpendCounter,
    ) &&
    Number(record.expectedSpendCounter) >=
      0 &&
    isText(
      record.expectedHeadHash,
    ) &&
    Number.isFinite(
      record.amount,
    ) &&
    Number(record.amount) >
      0 &&
    (
      record.mutationKind ===
        "DEBIT" ||
      record.mutationKind ===
        "RECHARGE"
    ) &&
    isText(
      record.mutationId,
    ) &&
    isText(
      record.occurredAt,
    )
  );
}

interface FinoraCanonicalWalletAuthorityInitializationRequest {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  walletId:
    string;
}

function isInitializationRequest(
  value:
    unknown,
): value is FinoraCanonicalWalletAuthorityInitializationRequest {

  if (!isRecord(value)) {
    return false;
  }

  return (
    isText(value.ownerId) &&
    isText(value.businessId) &&
    isText(value.branchId) &&
    isText(value.walletId)
  );
}

async function assertActiveBranchActivationScope(
  request:
    FinoraCanonicalWalletAuthorityInitializationRequest,
): Promise<void> {

  const result =
    await readFinoraControlStore();

  if (
    !result.success ||
    !result.data
  ) {
    throw new Error(
      result.error ??
        "Unable to load FINORA Control Store.",
    );
  }

  const activation =
    (
      result.data.activations ??
      []
    ).find(
      (item) =>
        item.ownerId ===
          request.ownerId &&
        item.businessId ===
          request.businessId &&
        item.branchId ===
          request.branchId &&
        item.status ===
          "ACTIVE",
    );

  if (!activation) {
    throw new Error(
      "FINORA active Branch Activation is required before Wallet Authority initialization.",
    );
  }
}
function isAuthorizedRenderer(
  event:
    IpcMainInvokeEvent,

  isTrustedRenderer:
    FinoraControlRendererValidator,
): boolean {

  const senderFrame =
    event.senderFrame;

  return (
    senderFrame !==
      null &&
    senderFrame ===
      event.sender.mainFrame &&
    isTrustedRenderer(
      senderFrame,
    )
  );
}

export function createUnavailableFinoraCanonicalWalletAuthorityProvider():
  FinoraCanonicalWalletAuthorityProvider {

  return {

    async readAuthority() {
      return {
        success:
          false,

        error:
          "FINORA canonical Wallet Authority is unavailable.",
      };
    },

    async commitMutation() {
      return {
        success:
          false,

        errorCode:
          "AUTHORITY_UNAVAILABLE",

        error:
          "FINORA canonical Wallet Authority is unavailable.",
      };
    },
  };
}

let handlersRegistered =
  false;

export function registerFinoraCanonicalWalletAuthorityHandlers(
  isTrustedRenderer:
    FinoraControlRendererValidator,

  provider:
    FinoraCanonicalWalletAuthorityProvider,
): void {

  if (handlersRegistered) {
    return;
  }

  handlersRegistered =
    true;

  ipcMain.handle(
    FINORA_CANONICAL_WALLET_AUTHORITY_CHANNELS.INITIALIZE,

    async (
      event,
      request:
        unknown,
    ) => {

      if (
        !isAuthorizedRenderer(
          event,
          isTrustedRenderer,
        )
      ) {
        return {
          success:
            false,

          error:
            "Untrusted renderer.",
        };
      }

      if (
        !isInitializationRequest(
          request,
        )
      ) {
        return {
          success:
            false,

          error:
            "Invalid FINORA canonical Wallet Authority initialization request.",
        };
      }

      try {

        await assertActiveBranchActivationScope(
          request,
        );

        const state =
          await createInitialFinoraCanonicalWalletAuthority(
            request,
          );

        return {
          success:
            true,

          data:
            state,
        };

      }
      catch (error) {

        return {
          success:
            false,

          error:
            error instanceof Error
              ? error.message
              : "FINORA canonical Wallet Authority initialization failed.",
        };

      }
    },
  );
  ipcMain.handle(
    FINORA_CANONICAL_WALLET_AUTHORITY_CHANNELS.READ,

    async (
      event,
      request:
        unknown,
    ) => {

      if (
        !isAuthorizedRenderer(
          event,
          isTrustedRenderer,
        )
      ) {
        return {
          success:
            false,

          error:
            "Untrusted renderer.",
        };
      }

      if (
        !isReadInput(
          request,
        )
      ) {
        return {
          success:
            false,

          error:
            "Invalid FINORA canonical Wallet Authority read request.",
        };
      }

      return provider.readAuthority(
        request,
      );
    },
  );

  ipcMain.handle(
    FINORA_CANONICAL_WALLET_AUTHORITY_CHANNELS.COMMIT_MUTATION,

    async (
      event,
      request:
        unknown,
    ) => {

      if (
        !isAuthorizedRenderer(
          event,
          isTrustedRenderer,
        )
      ) {
        return {
          success:
            false,

          errorCode:
            "AUTHORITY_UNAVAILABLE",

          error:
            "Untrusted renderer.",
        };
      }

      if (
        !isMutationInput(
          request,
        )
      ) {
        return {
          success:
            false,

          errorCode:
            "INVALID_MUTATION",

          error:
            "Invalid FINORA canonical Wallet Authority mutation request.",
        };
      }

      return provider.commitMutation(
        request,
      );
    },
  );
}



