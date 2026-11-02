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

// FINORA_W9_J10_RECHARGE_BRIDGE
// Authenticated native Wallet session owns the bearer.
// Native encrypted storage owns pending retry identity.
// This facade never reads or stores a bearer token.

export type FinoraAndroidRechargeInput = {
  walletId: string;
  amountInr: number;
  paymentMethod: "PHONEPE" | "GOOGLE_PAY";
  idempotencyKey: string;
};

export type FinoraAndroidRechargeReceipt = {
  source: "POSTGRESQL_RECHARGE_REQUESTS";
  request: {
    requestId: string;
    walletId: string;
    amountInr: string;
    paymentMethod: "PHONEPE" | "GOOGLE_PAY";
    status: "PENDING" | "APPROVED" | "DECLINED";
    createdAt: string;
  };
  replayed: boolean;
};

export type FinoraAndroidRechargePending = {
  pending: boolean;
  amountInr: number | null;
  paymentMethod: "PHONEPE" | "GOOGLE_PAY" | null;
};

type NativeRechargeEnvelope = {
  success?: boolean;
  errorCode?: string;
  data?: unknown;
  intentCleared?: boolean;
};

type NativeRechargeMethods = {
  submitServerWalletRecharge(
    input: FinoraAndroidRechargeInput
  ): Promise<NativeRechargeEnvelope>;
  getPendingServerWalletRecharge(): Promise<NativeRechargeEnvelope>;
  resumeServerWalletRecharge(): Promise<NativeRechargeEnvelope>;
};

function rechargeRecord(value: unknown): Record<string, unknown> | null {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function rechargeUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function rechargeFailure(
  response: NativeRechargeEnvelope | null
): ServerWalletResult<never> {
  const allowed = [
    "INVALID_REQUEST",
    "UNAUTHORIZED",
    "WALLET_SESSION_NOT_AUTHORIZED",
    "WALLET_NOT_AVAILABLE",
    "RATE_LIMITED",
    "SERVER_UNAVAILABLE",
    "INVALID_SERVER_RESPONSE",
    "LOCAL_RECHARGE_INTENT_CONFLICT",
    "LOCAL_RECHARGE_INTENT_SCOPE_CONFLICT",
    "SERVER_RECHARGE_IDEMPOTENCY_CONFLICT",
    "RECHARGE_INTENT_STORAGE_UNAVAILABLE",
    "NO_PENDING_RECHARGE_INTENT",
    "RECHARGE_OUTCOME_UNCONFIRMED",
  ];
  const code = response?.errorCode;
  return {
    success: false,
    errorCode: typeof code === "string" && allowed.includes(code)
      ? code
      : "RECHARGE_OUTCOME_UNCONFIRMED",
  };
}

function validateNativeRechargeReceipt(
  value: unknown,
  expected: {
    walletId: string;
    amountInr: number;
    paymentMethod: "PHONEPE" | "GOOGLE_PAY";
  } | null,
): FinoraAndroidRechargeReceipt | null {
  const data = rechargeRecord(value);
  const request = rechargeRecord(data?.request);
  if (!data || !request ||
      data.source !== "POSTGRESQL_RECHARGE_REQUESTS" ||
      typeof data.replayed !== "boolean" ||
      !rechargeUuid(request.requestId) ||
      typeof request.walletId !== "string" ||
      !/^[0-9]{8,12}$/.test(request.walletId) ||
      typeof request.amountInr !== "string" ||
      !/^(?:[1-9][0-9]{0,3})\.00$/.test(request.amountInr) ||
      typeof request.paymentMethod !== "string" ||
      (request.paymentMethod !== "PHONEPE" &&
        request.paymentMethod !== "GOOGLE_PAY") ||
      (request.status !== "PENDING" &&
        request.status !== "APPROVED" &&
        request.status !== "DECLINED") ||
      typeof request.createdAt !== "string" ||
      request.createdAt.length === 0 ||
      request.createdAt.length > 40 ||
      !Number.isFinite(Date.parse(request.createdAt))) {
    return null;
  }

  if (expected &&
      (request.walletId !== expected.walletId ||
       request.amountInr !== expected.amountInr.toFixed(2) ||
       request.paymentMethod !== expected.paymentMethod)) {
    return null;
  }

  return {
    source: "POSTGRESQL_RECHARGE_REQUESTS",
    request: {
      requestId: request.requestId,
      walletId: request.walletId,
      amountInr: request.amountInr,
      paymentMethod: request.paymentMethod,
      status: request.status,
      createdAt: request.createdAt,
    },
    replayed: data.replayed,
  };
}

function nativeRechargePlugin(): NativeRechargeMethods {
  return finoraControlShared as unknown as NativeRechargeMethods;
}

export async function submitFinoraAndroidWalletRecharge(
  input: FinoraAndroidRechargeInput
): Promise<ServerWalletResult<FinoraAndroidRechargeReceipt>> {
  if (!isFinoraAndroidWallet()) {
    return { success: false, errorCode: "ANDROID_ONLY" };
  }

  if (!/^[0-9]{8,12}$/.test(input.walletId) ||
      !Number.isSafeInteger(input.amountInr) ||
      input.amountInr < 50 ||
      input.amountInr > 2000 ||
      (input.paymentMethod !== "PHONEPE" &&
       input.paymentMethod !== "GOOGLE_PAY") ||
      !rechargeUuid(input.idempotencyKey)) {
    return { success: false, errorCode: "INVALID_REQUEST" };
  }

  try {
    const response =
      await nativeRechargePlugin().submitServerWalletRecharge(input);

    if (response?.success !== true) {
      return rechargeFailure(response);
    }

    const receipt = validateNativeRechargeReceipt(response.data, input);

    return receipt
      ? { success: true, data: receipt }
      : { success: false, errorCode: "INVALID_SERVER_RESPONSE" };
  } catch {
    return { success: false, errorCode: "RECHARGE_OUTCOME_UNCONFIRMED" };
  }
}

export async function getFinoraAndroidWalletRechargePending():
  Promise<ServerWalletResult<FinoraAndroidRechargePending>> {
  if (!isFinoraAndroidWallet()) {
    return { success: false, errorCode: "ANDROID_ONLY" };
  }

  try {
    const response =
      await nativeRechargePlugin().getPendingServerWalletRecharge();

    if (response?.success !== true) {
      return rechargeFailure(response);
    }

    const data = rechargeRecord(response.data);

    if (!data || typeof data.pending !== "boolean") {
      return { success: false, errorCode: "INVALID_SERVER_RESPONSE" };
    }

    if (data.pending === false) {
      if (data.amountInr !== null || data.paymentMethod !== null) {
        return { success: false, errorCode: "INVALID_SERVER_RESPONSE" };
      }
      return {
        success: true,
        data: { pending: false, amountInr: null, paymentMethod: null },
      };
    }

    if (typeof data.amountInr !== "number" ||
        !Number.isSafeInteger(data.amountInr) ||
        data.amountInr < 50 ||
        data.amountInr > 2000 ||
        (data.paymentMethod !== "PHONEPE" &&
         data.paymentMethod !== "GOOGLE_PAY")) {
      return { success: false, errorCode: "INVALID_SERVER_RESPONSE" };
    }

    return {
      success: true,
      data: {
        pending: true,
        amountInr: data.amountInr,
        paymentMethod: data.paymentMethod,
      },
    };
  } catch {
    return { success: false, errorCode: "RECHARGE_OUTCOME_UNCONFIRMED" };
  }
}

export async function resumeFinoraAndroidWalletRecharge(
  expected: {
    walletId: string;
    amountInr: number;
    paymentMethod: "PHONEPE" | "GOOGLE_PAY";
  }
): Promise<ServerWalletResult<FinoraAndroidRechargeReceipt>> {
  if (!isFinoraAndroidWallet()) {
    return { success: false, errorCode: "ANDROID_ONLY" };
  }

  if (!/^[0-9]{8,12}$/.test(expected.walletId) ||
      !Number.isSafeInteger(expected.amountInr) ||
      expected.amountInr < 50 ||
      expected.amountInr > 2000 ||
      (expected.paymentMethod !== "PHONEPE" &&
       expected.paymentMethod !== "GOOGLE_PAY")) {
    return { success: false, errorCode: "INVALID_REQUEST" };
  }

  try {
    // No UUID argument: native encrypted store supplies original UUID.
    const response =
      await nativeRechargePlugin().resumeServerWalletRecharge();

    if (response?.success !== true) {
      return rechargeFailure(response);
    }

    const receipt = validateNativeRechargeReceipt(
      response.data,
      expected,
    );

    return receipt
      ? { success: true, data: receipt }
      : { success: false, errorCode: "INVALID_SERVER_RESPONSE" };
  } catch {
    return { success: false, errorCode: "RECHARGE_OUTCOME_UNCONFIRMED" };
  }
}
