import { Capacitor } from "@capacitor/core";
import { finoraControlShared } from "../finoraControlShared";
import type {
  ServerWalletResult,
  ServerWalletBalance,
} from "./finoraServerWalletBridge";

// FINORA_P1_722I_ANDROID_READ_ONLY
// Native, server-authenticated balance only.
// Never infer Wallet authority from Reception session alone.

type NativeWalletResponse = {
  success?: boolean;
  errorCode?: string;
  wallet?: {
    ok?: boolean;
    walletId?: string;
    balanceInr?: string;
    currency?: string;
    source?: string;
    updatedAt?: string;
  };
};

export function isFinoraAndroidWallet(): boolean {
  return Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android";
}

export async function getFinoraAndroidWalletBalance():
  Promise<ServerWalletResult<ServerWalletBalance>> {

  if (!isFinoraAndroidWallet()) {
    return { success: false, errorCode: "ANDROID_ONLY" };
  }

  try {
    const plugin = finoraControlShared as {
      getServerWalletBalance: () => Promise<NativeWalletResponse>;
    };

    const response = await plugin.getServerWalletBalance();

    if (response?.success !== true) {
      return {
        success: false,
        errorCode: "WALLET_SESSION_NOT_AUTHORIZED",
      };
    }

    const wallet = response.wallet;

    if (
      wallet?.ok !== true ||
      wallet.source !== "POSTGRESQL_WALLETS" ||
      wallet.currency !== "INR" ||
      typeof wallet.walletId !== "string" ||
      !/^[0-9]{8,12}$/.test(wallet.walletId) ||
      typeof wallet.balanceInr !== "string" ||
      !/^(0|[1-9][0-9]{0,9})(?:\.[0-9]{1,2})?$/.test(wallet.balanceInr) ||
      typeof wallet.updatedAt !== "string" ||
      !Number.isFinite(Date.parse(wallet.updatedAt))
    ) {
      return {
        success: false,
        errorCode: "INVALID_SERVER_RESPONSE",
      };
    }

    const [rupees, paise = ""] = wallet.balanceInr.split(".");
    const normalizedBalance = rupees + "." + paise.padEnd(2, "0");

    return {
      success: true,
      data: {
        source: "POSTGRESQL_WALLETS",
        walletId: wallet.walletId,
        balanceInr: normalizedBalance,
        currency: "INR",
        updatedAt: wallet.updatedAt,
      },
    };
  } catch {
    return {
      success: false,
      errorCode: "SERVER_UNAVAILABLE",
    };
  }
}