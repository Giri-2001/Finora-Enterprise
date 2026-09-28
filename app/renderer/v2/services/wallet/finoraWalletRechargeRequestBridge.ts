/* ============================================================
   FINORA ENTERPRISE OS™

   WALLET RECHARGE REQUEST RENDERER BRIDGE

   SECURITY:
   - Renderer supplies only minimal payment intent evidence.
   - Native authority derives scope / display identity / binding.
   - Native authority owns signing and file transport.
============================================================ */

import {
  Capacitor,
  registerPlugin,
} from "@capacitor/core";

import type {
  WalletPaymentReference,
  WalletPaymentSource,
  WalletRechargePaymentMethod,
} from "../../types/wallet/wallet.types";


export interface FinoraWalletRechargeRequestExportInput {
  sessionId: string;
  paymentReference: WalletPaymentReference;
  amountMinor: number;
  paymentMethod: WalletRechargePaymentMethod;
  paymentSource: WalletPaymentSource;
}


export type FinoraWalletRechargeRequestExportResult =
  | {
      success: true;
      cancelled: true;
    }
  | {
      success: true;
      cancelled: false;
      fileName: string;
      bytesWritten: number;
      requestId: string;
      paymentReference: WalletPaymentReference;
    }
  | {
      success: false;
      error: string;
    };


export interface FinoraWalletRechargeRequestBridge {
  exportWalletRechargeRequest(
    input: FinoraWalletRechargeRequestExportInput,
  ): Promise<FinoraWalletRechargeRequestExportResult>;
}


export interface FinoraWalletControlBundleImportBridge {
  importControlBundle(
    input?: {
      sessionId?: string;
    },
  ): Promise<any>;
}


const androidControl =
  registerPlugin<FinoraWalletRechargeRequestBridge>(
    "FinoraControl",
  );


const androidControlBundleImport =
  registerPlugin<FinoraWalletControlBundleImportBridge>(
    "FinoraControlBundleImport",
  );


export function getFinoraWalletRechargeRequestBridge():
  FinoraWalletRechargeRequestBridge | undefined {

  if (
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android"
  ) {
    return androidControl;
  }


  const bridge =
    window.finora?.control as unknown as
      | FinoraWalletRechargeRequestBridge
      | undefined;


  if (
    !bridge ||
    typeof bridge.exportWalletRechargeRequest !== "function"
  ) {
    return undefined;
  }


  return bridge;
}


export function getFinoraWalletControlBundleImportBridge():
  FinoraWalletControlBundleImportBridge | undefined {

  if (
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android"
  ) {
    return androidControlBundleImport;
  }


  const bridge =
    window.finora?.control as unknown as
      | FinoraWalletControlBundleImportBridge
      | undefined;


  if (
    !bridge ||
    typeof bridge.importControlBundle !== "function"
  ) {
    return undefined;
  }


  return bridge;
}


/* ============================================================
   END
============================================================ */