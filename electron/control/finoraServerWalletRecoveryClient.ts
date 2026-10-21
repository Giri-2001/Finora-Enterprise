/*
 * FINORA_P1_588C_RECOVERY_HTTP_CLIENT
 *
 * Main-process-only, read-only HTTP client.
 * Session ownership remains with the existing Proof Gateway.
 * No renderer-selected URL, branch, owner or fee.
 * This module is NOT wired into the live Gateway yet.
 */

const BASE =
  process.env.FINORA_LOCAL_WALLET_TEST === "1"
    ? "http://127.0.0.1:3001"
    : "https://api.finoraenterprise.com";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RecoveryStatus =
  | "RESERVED"
  | "SETTLED"
  | "RELEASED"
  | "EXPIRED";

type JournalStatus =
  | "AWAITING_RECONCILIATION"
  | "MANUAL_REVIEW"
  | "RECONCILED";

type ClientStatus =
  | "UNKNOWN"
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SAVED"
  | "FAILED";

export interface FinoraServerWalletRecovery {
  operationId: string;
  sourceType: "CUSTOMER" | "LOAN" | "COLLECTION";
  sourceReference: string;
  chargeCode: string;
  feeInr: string;
  reservationStatus: RecoveryStatus;
  recoveryStatus: JournalStatus;
  reportedSaveStatus: ClientStatus;
  transactionId: string | null;
  allowNewBusinessSave: false;
  allowAutomaticSettlement: false;
  requiresReconciliation: true;
}

type Result =
  | { success: true; data: FinoraServerWalletRecovery }
  | { success: false; errorCode: string };

const fail = (errorCode: string): Result =>
  ({ success: false, errorCode });

function object(value: unknown): Record<string, unknown> | null {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function text(value: unknown, max: number): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= max;
}

function parseRecovery(
  body: unknown,
  operationId: string,
): FinoraServerWalletRecovery | null {
  const envelope = object(body);
  if (
    !envelope ||
    envelope.ok !== true ||
    envelope.source !== "POSTGRESQL_USAGE_RECOVERY"
  ) return null;

  const r = object(envelope.recovery);
  if (
    !r ||
    r.operationId !== operationId ||
    !["CUSTOMER", "LOAN", "COLLECTION"].includes(
      String(r.sourceType),
    ) ||
    !text(r.sourceReference, 256) ||
    !text(r.chargeCode, 64) ||
    !(
      typeof r.feeInr === "string" &&
      /^(0|[1-9][0-9]{0,9})\.[0-9]{2}$/.test(r.feeInr)
    ) ||
    !["RESERVED", "SETTLED", "RELEASED", "EXPIRED"].includes(
      String(r.reservationStatus),
    ) ||
    !["AWAITING_RECONCILIATION", "MANUAL_REVIEW", "RECONCILED"].includes(
      String(r.recoveryStatus),
    ) ||
    !["UNKNOWN", "NOT_STARTED", "IN_PROGRESS", "SAVED", "FAILED"].includes(
      String(r.reportedSaveStatus),
    ) ||
    r.allowNewBusinessSave !== false ||
    r.allowAutomaticSettlement !== false ||
    r.requiresReconciliation !== true
  ) return null;

  if (
    (r.reservationStatus === "SETTLED" &&
      !(typeof r.transactionId === "string" &&
        /^[A-Za-z0-9_-]{12}$/.test(r.transactionId))) ||
    (r.reservationStatus !== "SETTLED" &&
      r.transactionId !== null)
  ) return null;

  return {
    operationId,
    sourceType: r.sourceType as FinoraServerWalletRecovery["sourceType"],
    sourceReference: r.sourceReference,
    chargeCode: r.chargeCode,
    feeInr: r.feeInr,
    reservationStatus: r.reservationStatus as RecoveryStatus,
    recoveryStatus: r.recoveryStatus as JournalStatus,
    reportedSaveStatus: r.reportedSaveStatus as ClientStatus,
    transactionId: r.transactionId as string | null,
    allowNewBusinessSave: false,
    allowAutomaticSettlement: false,
    requiresReconciliation: true,
  };
}

export function createFinoraServerWalletRecoveryClient(
  transport: typeof fetch = globalThis.fetch,
) {
  return async function recovery(
    sessionToken: string,
    operationId: string,
  ): Promise<Result> {
    if (!UUID.test(operationId ?? "")) {
      return fail("INVALID_REQUEST");
    }

    if (
      typeof sessionToken !== "string" ||
      sessionToken.length < 24 ||
      sessionToken.length > 4096 ||
      !/^[A-Za-z0-9._~-]+$/.test(sessionToken)
    ) return fail("UNAUTHORIZED");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await transport(
        `${BASE}/owner/wallet/usage-recovery/${operationId}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            authorization: `Bearer ${sessionToken}`,
          },
          redirect: "error",
          cache: "no-store",
          signal: controller.signal,
        },
      );

      if (response.status === 401) return fail("UNAUTHORIZED");
      if (response.status === 404) return fail("OPERATION_NOT_FOUND");
      if (response.status !== 200) return fail("SERVER_UNAVAILABLE");

      const contentType =
        response.headers.get("content-type") ?? "";

      if (
        contentType.split(";")[0].trim().toLowerCase() !==
        "application/json"
      ) return fail("INVALID_SERVER_RESPONSE");

      const parsed = parseRecovery(
        await response.json(),
        operationId,
      );

      return parsed
        ? { success: true, data: parsed }
        : fail("INVALID_SERVER_RESPONSE");
    } catch {
      return fail("SERVER_UNAVAILABLE");
    } finally {
      clearTimeout(timer);
    }
  };
}