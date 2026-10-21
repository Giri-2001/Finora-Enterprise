import type { IpcMainInvokeEvent } from "electron";

/*
 * FINORA_P1_587K_RECOVERY_IPC_BOUNDARY
 *
 * Read-only foundation. Deliberately NOT registered.
 * Does not issue Wallet debits, reservations or settlements.
 * Caller MUST supply a server-authenticated recovery service.
 */

export interface FinoraWalletRecoveryView {
  operationId: string;
  sourceType: string;
  sourceReference: string;
  chargeCode: string;
  feeInr: string;
  reservationStatus:
    | "RESERVED"
    | "SETTLED"
    | "RELEASED"
    | "EXPIRED";
  recoveryStatus:
    | "AWAITING_RECONCILIATION"
    | "MANUAL_REVIEW"
    | "RECONCILED";
  reportedSaveStatus:
    | "UNKNOWN"
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "SAVED"
    | "FAILED";
  transactionId: string | null;
  allowNewBusinessSave: false;
  allowAutomaticSettlement: false;
  requiresReconciliation: true;
}

type RecoveryResult =
  | { success: true; data: FinoraWalletRecoveryView }
  | { success: false; errorCode: string };

export function createFinoraWalletRecoveryIpcBoundary(options: {
  authorize: (event: IpcMainInvokeEvent) => boolean;
  lookup: (operationId: string) => Promise<RecoveryResult>;
}) {
  let revision = 0;

  function invalidate(): void {
    revision++;
  }

  async function recovery(
    event: IpcMainInvokeEvent,
    operationId: unknown,
  ): Promise<RecoveryResult> {
    const fail = (errorCode: string): RecoveryResult => ({
      success: false,
      errorCode,
    });

    const validUuid =
      typeof operationId === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        operationId,
      );

    if (!validUuid) return fail("INVALID_REQUEST");

    const trusted = () => {
      try {
        return options.authorize(event) === true;
      } catch {
        return false;
      }
    };

    if (!trusted()) return fail("UNAUTHORIZED");

    const current = revision;

    try {
      const result = await options.lookup(operationId);

      if (current !== revision) {
        return fail("STALE_OPERATION");
      }

      if (!trusted()) return fail("UNAUTHORIZED");

      // FINORA_P1_588Q_RECOVERY_ERROR_ALLOWLIST
      // Preserve known recovery failures without exposing raw server data.
      if (!result || result.success !== true) {
        const code = result?.success === false
          ? result.errorCode
          : undefined;
        return fail(
          code === "UNAUTHORIZED" ||
          code === "OPERATION_NOT_FOUND" ||
          code === "INVALID_REQUEST" ||
          code === "INVALID_SERVER_RESPONSE" ||
          code === "SERVER_REJECTED" ||
          code === "STALE_OPERATION"
            ? code
            : "SERVER_UNAVAILABLE",
        );
      }

      const data = result.data;

      if (
        data?.operationId !== operationId ||
        !["RESERVED", "SETTLED", "RELEASED", "EXPIRED"].includes(
          data?.reservationStatus,
        ) ||
        !["AWAITING_RECONCILIATION", "MANUAL_REVIEW", "RECONCILED"].includes(
          data?.recoveryStatus,
        ) ||
        // FINORA_P1_588S_REPORTED_STATE_VALIDATION
        !["UNKNOWN", "NOT_STARTED", "IN_PROGRESS", "SAVED", "FAILED"].includes(
          String(data?.reportedSaveStatus),
        ) ||
        data?.allowNewBusinessSave !== false ||
        data?.allowAutomaticSettlement !== false ||
        data?.requiresReconciliation !== true ||
        typeof data?.sourceType !== "string" ||
        typeof data?.sourceReference !== "string" ||
        typeof data?.chargeCode !== "string" ||
        !/^(0|[1-9][0-9]*)\.[0-9]{2}$/.test(data?.feeInr ?? "") ||
        !(
          data?.transactionId === null ||
          (typeof data?.transactionId === "string" &&
            data.transactionId.length === 12)
        )
      ) {
        return fail("SERVER_REJECTED");
      }

      if (
        (data.reservationStatus === "SETTLED" &&
          data.transactionId === null) ||
        (data.reservationStatus !== "SETTLED" &&
          data.transactionId !== null)
      ) {
        return fail("SERVER_REJECTED");
      }

      return {
        success: true,
        data: {
          operationId: data.operationId,
          sourceType: data.sourceType,
          sourceReference: data.sourceReference,
          chargeCode: data.chargeCode,
          feeInr: data.feeInr,
          reservationStatus: data.reservationStatus,
          recoveryStatus: data.recoveryStatus,
          reportedSaveStatus: data.reportedSaveStatus,
          transactionId: data.transactionId,
          allowNewBusinessSave: false,
          allowAutomaticSettlement: false,
          requiresReconciliation: true,
        },
      };
    } catch {
      return fail("SERVER_UNAVAILABLE");
    }
  }

  return Object.freeze({ recovery, invalidate });
}