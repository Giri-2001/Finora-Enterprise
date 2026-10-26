// FINORA_P1_730N_SHARED_NUMBER_RESERVATION
// PostgreSQL is the only authority for new Customer numbers.
// No USB/local fallback. No credentials in renderer.

import { Capacitor } from "@capacitor/core";
import { finoraControlShared } from "../finoraControlShared";
import { formatCustomerId } from "../../utils/numbering/numbering.formatter";

export interface FinoraReservationScope {
  ownerId: string;
  businessId: string;
  branchId: string;
  businessCode: string;
  branchCode: string;
}

export type FinoraReservationResult =
  | {
      success: true;
      data: {
        customerNumber: number;
        customerId: string;
        replay: boolean;
      };
    }
  | { success: false; errorCode: string };

function record(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function failure(errorCode: string): FinoraReservationResult {
  return { success: false, errorCode };
}

function validateResponse(
  value: unknown,
  expected: FinoraReservationScope,
): FinoraReservationResult {
  if (!record(value) || value.ok !== true ||
      value.source !== "FINORA_POSTGRESQL_NUMBERING" ||
      typeof value.replay !== "boolean" ||
      !record(value.reservation)) {
    return failure("INVALID_SERVER_RESERVATION");
  }

  const row = value.reservation;

  if (row.businessCode !== expected.businessCode ||
      row.branchCode !== expected.branchCode) {
    return failure("NUMBERING_RESERVATION_SCOPE_MISMATCH");
  }

  const number = row.customerNumber;

  if (typeof number !== "number" ||
      !Number.isSafeInteger(number) ||
      number < 1 || number > 999999) {
    return failure("INVALID_RESERVED_CUSTOMER_NUMBER");
  }

  try {
    const customerId = formatCustomerId(
      expected.businessCode,
      expected.branchCode,
      number,
    );

    return {
      success: true,
      data: {
        customerNumber: number,
        customerId,
        replay: value.replay,
      },
    };
  } catch {
    return failure("INVALID_RESERVED_CUSTOMER_ID");
  }
}

export async function reserveFinoraServerCustomerNumber(
  requestKey: string,
  expectedScope: FinoraReservationScope,
): Promise<FinoraReservationResult> {
  if (typeof requestKey !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestKey)) {
    return failure("VALID_IDEMPOTENCY_KEY_REQUIRED");
  }

  if (!expectedScope ||
      ![expectedScope.ownerId, expectedScope.businessId,
        expectedScope.branchId, expectedScope.businessCode,
        expectedScope.branchCode].every(
          value => typeof value === "string" && value.trim().length > 0
        )) {
    return failure("AUTHORIZED_NUMBERING_SCOPE_REQUIRED");
  }

  try {
    if (Capacitor.isNativePlatform()) {
      const native = finoraControlShared as unknown as {
        reserveServerCustomerNumber?: (args: {
          requestKey: string;
        }) => Promise<unknown>;
      };

      if (typeof native.reserveServerCustomerNumber !== "function") {
        return failure("ANDROID_RESERVATION_BRIDGE_UNAVAILABLE");
      }

      const reply = await native.reserveServerCustomerNumber({ requestKey });

      if (!record(reply) || reply.success !== true) {
        return failure("ANDROID_RESERVATION_UNAVAILABLE");
      }

      return validateResponse(reply.data, expectedScope);
    }

    const host = window as Window & {
      finoraAccountNumberingReservation?: {
        reserve: (key: string) => Promise<unknown>;
      };
    };

    if (typeof host.finoraAccountNumberingReservation?.reserve !== "function") {
      return failure("WINDOWS_RESERVATION_BRIDGE_UNAVAILABLE");
    }

    const reply = await host.finoraAccountNumberingReservation.reserve(requestKey);

    if (!record(reply) || reply.success !== true) {
      return failure("WINDOWS_RESERVATION_UNAVAILABLE");
    }

    return validateResponse(reply.data, expectedScope);
  } catch {
    return failure("SERVER_NUMBERING_RESERVATION_FAILED");
  }
}
