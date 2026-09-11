/* ============================================================
   FINORA ENTERPRISE OS™

   WALLET RECHARGE REQUEST RENDERER BRIDGE

   RESPONSIBILITY:

   - Resolve the secure preload Wallet Recharge Request export API.
   - Expose only the minimum pending-payment request contract.
   - Keep native filesystem/signing authority outside renderer.

   SECURITY:

   - No owner/business/branch identity is accepted here.
   - No installation/binding identity is accepted here.
   - No filesystem path is accepted or returned.
   - No signature material is accepted from renderer.
============================================================ */

import type {
  WalletPaymentSource,
  WalletRechargePaymentMethod,
} from "../../types/wallet/wallet.types";

export interface FinoraWalletRechargeRequestExportInput {

  sessionId:
    string;

  paymentReference:
    string;

  amountMinor:
    number;

  paymentMethod:
    WalletRechargePaymentMethod;

  paymentSource:
    WalletPaymentSource;
}

export type FinoraWalletRechargeRequestExportResult =
  | {
      success:
        true;

      cancelled:
        true;
    }
  | {
      success:
        true;

      cancelled:
        false;

      fileName:
        string;

      bytesWritten:
        number;

      requestId:
        string;

      paymentReference:
        string;
    }
  | {
      success:
        false;

      error:
        string;
    };

export interface FinoraWalletRechargeRequestBridge {

  exportWalletRechargeRequest(
    request:
      FinoraWalletRechargeRequestExportInput,
  ):
    Promise<
      FinoraWalletRechargeRequestExportResult
    >;
}

export function getFinoraWalletRechargeRequestBridge():
  FinoraWalletRechargeRequestBridge | undefined {

  const bridge =
    window.finora?.control as unknown as
      | FinoraWalletRechargeRequestBridge
      | undefined;

  if (
    !bridge ||
    typeof bridge.exportWalletRechargeRequest !==
      "function"
  ) {
    return undefined;
  }

  return bridge;
}

/* ============================================================
   END
============================================================ */