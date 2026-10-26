/*
 * FINORA_P1_729U_CROSS_DEVICE_NUMBERING_READ
 *
 * Shared read-only server numbering adapter.
 * Windows: trusted Electron IPC.
 * Android: authenticated native FinoraControl Plugin.
 *
 * No local or USB numbering fallback.
 * No number reservation or database mutation.
 */

import { Capacitor } from "@capacitor/core";
import { finoraControlShared } from "../finoraControlShared";

export interface ServerNumberingScope {
  ownerId: string;
  businessId: string;
  branchId: string;
}

export interface ServerNumberingSnapshot extends ServerNumberingScope {
  businessCode: string;
  branchCode: string;
  startingCustomerNumber: number;
  lastIssuedCustomerNumber: number | null;
  nextCustomerNumber: number | null;
  status: "LOCKED";
  lockedAt: string;
}

export type ServerNumberingReadResult =
  | { success: true; data: ServerNumberingSnapshot }
  | { success: false; errorCode: string };

type NativeResponse = {
  success?: boolean;
  data?: unknown;
};

type NumberingHost = Window & {
  finoraAccountNumbering?: {
    get: () => Promise<unknown>;
  };
};

function object(value: unknown):
  value is Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value);
}

function validString(value: unknown): value is string {
  return typeof value === "string" &&
    value.trim().length > 0;
}

function validNumber(value: unknown): value is number {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 1 &&
    value <= 999999;
}

function failure(errorCode: string): ServerNumberingReadResult {
  return { success: false, errorCode };
}

function validate(
  response: unknown,
  expected: ServerNumberingScope,
): ServerNumberingReadResult {
  if (!object(response) ||
      response.ok !== true ||
      response.source !== "FINORA_POSTGRESQL_NUMBERING" ||
      !object(response.numbering)) {
    return failure("NUMBERING_SERVER_RESPONSE_INVALID");
  }

  const n = response.numbering;

  if (
    n.ownerId !== expected.ownerId ||
    n.businessId !== expected.businessId ||
    n.branchId !== expected.branchId
  ) {
    return failure("NUMBERING_SERVER_SCOPE_MISMATCH");
  }

  if (
    !validString(n.businessCode) ||
    !validString(n.branchCode) ||
    !validNumber(n.startingCustomerNumber) ||
    n.status !== "LOCKED" ||
    !validString(n.lockedAt) ||
    !Number.isFinite(Date.parse(n.lockedAt))
  ) {
    return failure("NUMBERING_SERVER_STATE_INVALID");
  }

  const start = n.startingCustomerNumber;
  const last = n.lastIssuedCustomerNumber;

  if (
    last !== null &&
    (!validNumber(last) || last < start)
  ) {
    return failure("NUMBERING_SERVER_COUNTER_INVALID");
  }

  const expectedNext = last === null ? start : last + 1;
  const next = expectedNext > 999999 ? null : expectedNext;

  if (n.nextCustomerNumber !== next) {
    return failure("NUMBERING_SERVER_NEXT_MISMATCH");
  }

  return {
    success: true,
    data: {
      ownerId: expected.ownerId,
      businessId: expected.businessId,
      branchId: expected.branchId,
      businessCode: n.businessCode,
      branchCode: n.branchCode,
      startingCustomerNumber: start,
      lastIssuedCustomerNumber: last,
      nextCustomerNumber: next,
      status: "LOCKED",
      lockedAt: n.lockedAt,
    },
  };
}

export async function readFinoraServerNumbering(
  expectedScope: ServerNumberingScope,
): Promise<ServerNumberingReadResult> {
  if (
    !expectedScope ||
    !validString(expectedScope.ownerId) ||
    !validString(expectedScope.businessId) ||
    !validString(expectedScope.branchId)
  ) {
    return failure("NUMBERING_AUTHORIZED_SCOPE_REQUIRED");
  }

  try {
    if (Capacitor.isNativePlatform()) {
      const native = finoraControlShared as unknown as {
        getServerCustomerNumbering?: () => Promise<NativeResponse>;
      };

      if (typeof native.getServerCustomerNumbering !== "function") {
        return failure("ANDROID_NUMBERING_BRIDGE_UNAVAILABLE");
      }

      const result = await native.getServerCustomerNumbering();

      if (result?.success !== true) {
        return failure("ANDROID_NUMBERING_READ_UNAVAILABLE");
      }

      return validate(result.data, expectedScope);
    }

    const host = window as NumberingHost;

    if (typeof host.finoraAccountNumbering?.get !== "function") {
      return failure("WINDOWS_NUMBERING_BRIDGE_UNAVAILABLE");
    }

    const response = await host.finoraAccountNumbering.get();

    if (
      !object(response) ||
      response.success !== true
    ) {
      const rawServerCode =
        (response as { errorCode?: unknown } | null)?.errorCode;

      // FINORA_P1_732N_SERVER_ERROR_PROPAGATION
      // Never convert server rejection into a false success.
      // Expose only safe machine-readable error codes.
      const safeServerCode =
        typeof rawServerCode === "string" &&
        /^[A-Z][A-Z0-9_]{2,79}$/.test(rawServerCode)
          ? rawServerCode
          : "WINDOWS_NUMBERING_READ_UNAVAILABLE";

      return failure(safeServerCode);
    }

    return validate(response.data, expectedScope);
  } catch {
    return failure("SERVER_NUMBERING_READ_FAILED");
  }
}