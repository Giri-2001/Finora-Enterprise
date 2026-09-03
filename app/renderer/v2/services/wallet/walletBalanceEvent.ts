/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   WALLET BALANCE EVENT

   RESPONSIBILITY:

   - Publish successful Wallet balance changes
   - Subscribe global UI consumers to live balance changes
   - Keep one canonical renderer event name
   - Carry authoritative post-transaction balance

   IMPORTANT:

   - No Wallet calculation.
   - No Wallet persistence.
   - No React.
   - No polling.
============================================================ */

export const FINORA_WALLET_BALANCE_UPDATED_EVENT =
  "FINORA_WALLET_BALANCE_UPDATED" as const;

export interface WalletBalanceUpdatedDetail {
  walletId:
    string;

  availableBalance:
    number;
}

export type WalletBalanceUpdatedListener = (
  detail: WalletBalanceUpdatedDetail,
) => void;

/* ============================================================
   PUBLISH
============================================================ */

export function publishWalletBalanceUpdate(
  detail: WalletBalanceUpdatedDetail,
): void {
  const walletId =
    String(
      detail.walletId ?? "",
    ).trim();

  const availableBalance =
    Number(
      detail.availableBalance,
    );

  if (
    typeof window === "undefined" ||
    !walletId ||
    !Number.isFinite(
      availableBalance,
    ) ||
    availableBalance < 0
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<WalletBalanceUpdatedDetail>(
      FINORA_WALLET_BALANCE_UPDATED_EVENT,
      {
        detail: {
          walletId,

          availableBalance,
        },
      },
    ),
  );
}

/* ============================================================
   SUBSCRIBE
============================================================ */

export function subscribeWalletBalanceUpdates(
  listener: WalletBalanceUpdatedListener,
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleWalletBalanceUpdate(
    event: Event,
  ): void {
    const customEvent =
      event as CustomEvent<WalletBalanceUpdatedDetail>;

    const detail =
      customEvent.detail;

    if (!detail) {
      return;
    }

    listener(
      detail,
    );
  }

  window.addEventListener(
    FINORA_WALLET_BALANCE_UPDATED_EVENT,
    handleWalletBalanceUpdate,
  );

  return () => {
    window.removeEventListener(
      FINORA_WALLET_BALANCE_UPDATED_EVENT,
      handleWalletBalanceUpdate,
    );
  };
}

/* ============================================================
   END
============================================================ */
