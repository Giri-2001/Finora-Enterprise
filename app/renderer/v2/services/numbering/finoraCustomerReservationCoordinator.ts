// FINORA_P1_731M_CENTRAL_RESERVATION_COORDINATOR
// Staging only. Not called by Customer Save.
import { readFinoraServerNumbering } from "./finoraServerNumberingRead";
import { reserveFinoraServerCustomerNumber } from "./finoraServerNumberReservation";
import { prepareFinoraCustomerRetryJournal, advanceFinoraCustomerRetryJournal, inspectFinoraCustomerRecovery } from "../../repositories/numbering/finoraCustomerReservationJournal";
import type { FinoraRetryScope } from "../../repositories/numbering/finoraCustomerReservationJournal";

export type CentralCustomerReservation =
  | { success: true; data: { customerId: string; customerNumber: number; requestKey: string } }
  | { success: false; errorCode: string };

function failure(errorCode: string): CentralCustomerReservation {
  return { success: false, errorCode };
}

export async function prepareCentralCustomerReservation(
  scope: FinoraRetryScope,
  requestKey: string,
): Promise<CentralCustomerReservation> {
  const decision = await inspectFinoraCustomerRecovery(scope);
  if (decision.action === "RECOVERY_BLOCKED") {
    return failure(decision.errorCode ?? "RETRY_RECOVERY_BLOCKED");
  }
  if (decision.action !== "CREATE_NEW_JOURNAL" &&
      decision.action !== "RETRY_SAME_RESERVATION_KEY") {
    return failure("PREVIOUS_CUSTOMER_REQUIRES_RECONCILIATION");
  }
  if (decision.action === "RETRY_SAME_RESERVATION_KEY" &&
      decision.requestKey !== requestKey) {
    return failure("PREVIOUS_RESERVATION_KEY_MUST_BE_REUSED");
  }

  const snapshot = await readFinoraServerNumbering(scope);
  if (!snapshot.success) return failure(snapshot.errorCode);
  if (snapshot.data.status !== "LOCKED" ||
      snapshot.data.nextCustomerNumber === null) {
    return failure("CENTRAL_NUMBERING_NOT_ACTIVATED");
  }

  const journal = await prepareFinoraCustomerRetryJournal(scope, requestKey);
  if (!journal.success || !journal.data) {
    return failure(journal.error ?? "USB_JOURNAL_PREPARE_FAILED");
  }
  if (journal.data.requestKey !== requestKey ||
      journal.data.status !== "PREPARED") {
    return failure("USB_JOURNAL_NOT_PREPARED");
  }

  const reserved = await reserveFinoraServerCustomerNumber(
    requestKey,
    {
      ownerId: scope.ownerId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      businessCode: snapshot.data.businessCode,
      branchCode: snapshot.data.branchCode,
    },
  );
  if (!reserved.success) return failure(reserved.errorCode);

  const advanced = await advanceFinoraCustomerRetryJournal(scope, {
    expectedStatus: "PREPARED",
    nextStatus: "RESERVED",
    requestKey,
    customerNumber: reserved.data.customerNumber,
    customerId: reserved.data.customerId,
  });

  if (!advanced.success || !advanced.data) {
    return failure("RESERVATION_REQUIRES_SAME_KEY_RECOVERY");
  }

  return {
    success: true,
    data: {
      customerId: reserved.data.customerId,
      customerNumber: reserved.data.customerNumber,
      requestKey,
    },
  };
}
