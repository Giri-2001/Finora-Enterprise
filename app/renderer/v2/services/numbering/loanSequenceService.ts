// ============================================================
// FINORA ENTERPRISE OS™
//
// IDENTITY & NUMBERING ENGINE
// LOAN SEQUENCE SERVICE
//
// RESPONSIBILITY:
//
// - Resolve the Customer root number from a canonical FINORA
//   Customer ID
// - Resolve Business / Branch numbering codes from the signed
//   FINORA Business Profile
// - Preview the next per-Customer Loan sequence
// - Permanently reserve the next per-Customer Loan sequence
// - Format the authoritative hierarchical Loan Number
//
// IMPORTANT:
//
// - No direct localStorage access.
// - No direct filesystem access.
// - No Electron IPC.
// - No React.
// - No Loan record creation.
// - No owner-editable Loan starting sequence.
// - Every Customer begins at Loan sequence 001.
// - Reserved Loan sequences are never rolled back or recycled.
// - Reservation serialization protects this FINORA JS runtime.
// - Cross-process atomic locking is future hardening.
//
// VERSION : 1.1
// STATUS  : Production Foundation
// ============================================================

import {
  CUSTOMER_NUMBER_MAX,
  CUSTOMER_NUMBER_MIN,
  LOAN_SEQUENCE_MAX,
  LOAN_SEQUENCE_MIN,
} from "../../constants/numbering/numbering.constants";

import {
  loanSequenceRepository,
} from "../../repositories/numbering/loanSequenceRepository";

import {
  resolveFinoraNumberingScope,
} from "./finoraNumberingScopeService";

import {
  previewCustomerNumberingRoot,
  resolveOrCreateCustomerNumberingRoot,
} from "./customerNumberingBindingService";

import type {
  FinoraNumberingScope,
  LoanNumberPreview,
  LoanSequenceState,
} from "../../types/numbering/numbering.types";

import type {
  StorageResult,
} from "../../storage/storage.types";

import {
  formatCustomerId,
  formatLoanNumber,
} from "../../utils/numbering/numbering.formatter";

// ============================================================
// RESOLVED CUSTOMER SCOPE
// ============================================================

interface ResolvedLoanCustomerScope
  extends FinoraNumberingScope {

  customerId:
    string;

  customerNumber:
    number;
}

type LoanCustomerScopeResolutionMode =
  | "PREVIEW"
  | "RESERVE";

// ============================================================
// CUSTOMER ROOT PARSER
//
// Canonical Customer Number:
//
// FIN-CUS-{BUSINESS}-{BRANCH}-{CUSTOMER}
//
// Historical Customer IDs are intentionally NOT rewritten or
// guessed here. Their migration / compatibility policy remains
// a separate explicit Numbering Engine responsibility.
// ============================================================

function parseCanonicalCustomerNumber(
  customerId: string,
  businessCode: string,
  branchCode: string,
): StorageResult<number> {

  const normalizedCustomerId =
    customerId.trim().toUpperCase();

  if (!normalizedCustomerId) {
    return {
      success: false,
      error: "Customer ID is required.",
    };
  }

  const parts =
    normalizedCustomerId.split("-");

  if (
    parts.length !== 5 ||
    parts[0] !== "FIN" ||
    parts[1] !== "CUS"
  ) {
    return {
      success: false,

      error:
        "Customer ID is not a canonical FINORA Customer Number.",
    };
  }

  const customerNumberText =
    parts[4];

  if (!/^\d{6}$/.test(customerNumberText)) {
    return {
      success: false,

      error:
        "Customer ID does not contain a valid 6-digit Customer number.",
    };
  }

  const customerNumber =
    Number(customerNumberText);

  if (
    !Number.isSafeInteger(customerNumber) ||
    customerNumber < CUSTOMER_NUMBER_MIN ||
    customerNumber > CUSTOMER_NUMBER_MAX
  ) {
    return {
      success: false,

      error:
        "Customer number is outside the supported FINORA range.",
    };
  }

  let canonicalCustomerId:
    string;

  try {
    canonicalCustomerId =
      formatCustomerId(
        businessCode,
        branchCode,
        customerNumber,
      );
  } catch (error) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to validate the Customer ID.",
    };
  }

  if (
    normalizedCustomerId !==
    canonicalCustomerId
  ) {
    return {
      success: false,

      error:
        "Customer ID does not belong to the provisioned FINORA Business and Branch.",
    };
  }

  return {
    success: true,
    data: customerNumber,
  };
}

// ============================================================
// RESOLVE CUSTOMER NUMBERING SCOPE
// ============================================================

async function resolveLoanCustomerScope(
  customerId: string,
  mode:
    LoanCustomerScopeResolutionMode,
): Promise<
  StorageResult<
    ResolvedLoanCustomerScope
  >
> {

  const scopeResult =
    await resolveFinoraNumberingScope();

  if (
    !scopeResult.success ||
    !scopeResult.data
  ) {

    return {
      success:
        false,

      error:
        scopeResult.error ??
        "Unable to resolve the authoritative FINORA numbering scope.",
    };
  }

  const scope =
    scopeResult.data;

  const rootResult =
    mode === "RESERVE"
      ? await resolveOrCreateCustomerNumberingRoot(
          customerId,
        )
      : await previewCustomerNumberingRoot(
          customerId,
        );

  if (
    !rootResult.success ||
    !rootResult.data
  ) {

    return {
      success:
        false,

      error:
        rootResult.error ??
        "Unable to resolve the Customer numbering root.",
    };
  }

  const root =
    rootResult.data;

  const customerNumberResult =
    parseCanonicalCustomerNumber(
      root.customerId,
      scope.businessCode,
      scope.branchCode,
    );

  if (
    !customerNumberResult.success ||
    customerNumberResult.data === undefined
  ) {

    return {
      success:
        false,

      error:
        customerNumberResult.error ??
        "Unable to validate the Customer numbering root.",
    };
  }

  if (
    customerNumberResult.data !==
      root.customerNumber
  ) {

    return {
      success:
        false,

      error:
        "Resolved Customer numbering root is inconsistent.",
    };
  }

  return {
    success:
      true,

    data: {
      ...scope,

      customerId:
        root.customerId,

      customerNumber:
        root.customerNumber,
    },
  };
}
// ============================================================
// LOAN RESERVATION SERIALIZATION
//
// One queue per Customer avoids duplicate Loan sequence
// reservations inside this FINORA JS runtime while allowing
// unrelated Customers to reserve independently.
// ============================================================

const loanReservationQueues =
  new Map<
    string,
    Promise<void>
  >();

async function withLoanReservationLock<T>(
  customerId: string,
  operation:
    () => Promise<T>,
): Promise<T> {

  const lockKey =
    customerId.trim().toUpperCase();

  const previousOperation =
    loanReservationQueues.get(
      lockKey,
    ) ??
    Promise.resolve();

  let releaseCurrentOperation:
    () => void =
      () => undefined;

  const currentOperation =
    new Promise<void>(
      (resolve) => {
        releaseCurrentOperation =
          resolve;
      },
    );

  loanReservationQueues.set(
    lockKey,
    currentOperation,
  );

  await previousOperation;

  try {
    return await operation();
  } finally {
    releaseCurrentOperation();

    if (
      loanReservationQueues.get(
        lockKey,
      ) === currentOperation
    ) {
      loanReservationQueues.delete(
        lockKey,
      );
    }
  }
}

// ============================================================
// NEXT LOAN SEQUENCE
// ============================================================

function resolveNextLoanSequence(
  state:
    LoanSequenceState | undefined,
): StorageResult<number> {

  const nextLoanSequence =
    state?.lastIssuedLoanSequence === null ||
    state?.lastIssuedLoanSequence === undefined
      ? LOAN_SEQUENCE_MIN
      : state.lastIssuedLoanSequence + 1;

  if (
    nextLoanSequence >
    LOAN_SEQUENCE_MAX
  ) {
    return {
      success: false,

      error:
        "This Customer has reached the maximum FINORA Loan sequence.",
    };
  }

  return {
    success: true,
    data: nextLoanSequence,
  };
}

// ============================================================
// PREVIEW NEXT LOAN NUMBER
//
// Preview never consumes the Loan sequence.
// ============================================================

export async function previewNextLoanNumber(
  customerId: string,
): Promise<
  StorageResult<
    LoanNumberPreview
  >
> {

  const scopeResult =
    await resolveLoanCustomerScope(
      customerId,
      "PREVIEW",
    );

  if (
    !scopeResult.success ||
    !scopeResult.data
  ) {
    return {
      success: false,

      error:
        scopeResult.error ??
        "Unable to resolve Loan numbering scope.",
    };
  }

  const scope =
    scopeResult.data;

  const stateResult =
    await loanSequenceRepository.findByCustomer(
      scope.businessId,
      scope.branchId,
      scope.customerId,
    );

  if (!stateResult.success) {
    return {
      success: false,

      error:
        stateResult.error ??
        "Unable to load the Customer Loan sequence.",
    };
  }

  const nextSequenceResult =
    resolveNextLoanSequence(
      stateResult.data,
    );

  if (
    !nextSequenceResult.success ||
    nextSequenceResult.data === undefined
  ) {
    return {
      success: false,

      error:
        nextSequenceResult.error ??
        "Unable to resolve the next Loan sequence.",
    };
  }

  const loanSequence =
    nextSequenceResult.data;

  try {
    return {
      success: true,

      data: {
        customerNumber:
          scope.customerNumber,

        loanSequence,

        loanNumber:
          formatLoanNumber(
            scope.businessCode,
            scope.branchCode,
            scope.customerNumber,
            loanSequence,
          ),
      },
    };
  } catch (error) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to preview the next Loan Number.",
    };
  }
}

// ============================================================
// RESERVE NEXT LOAN NUMBER ? UNLOCKED
//
// Reservation is persisted BEFORE downstream Loan creation.
//
// Once successfully reserved:
//
// - it is permanently consumed;
// - it is never recycled;
// - a downstream Loan-create failure may therefore create a gap.
// ============================================================

async function reserveNextLoanNumberUnlocked(
  customerId: string,
): Promise<
  StorageResult<
    LoanNumberPreview
  >
> {

  const scopeResult =
    await resolveLoanCustomerScope(
      customerId,
      "RESERVE",
    );

  if (
    !scopeResult.success ||
    !scopeResult.data
  ) {
    return {
      success: false,

      error:
        scopeResult.error ??
        "Unable to resolve Loan numbering scope.",
    };
  }

  const scope =
    scopeResult.data;

  const stateResult =
    await loanSequenceRepository.findByCustomer(
      scope.businessId,
      scope.branchId,
      scope.customerId,
    );

  if (!stateResult.success) {
    return {
      success: false,

      error:
        stateResult.error ??
        "Unable to load the Customer Loan sequence.",
    };
  }

  const existingState =
    stateResult.data;

  const nextSequenceResult =
    resolveNextLoanSequence(
      existingState,
    );

  if (
    !nextSequenceResult.success ||
    nextSequenceResult.data === undefined
  ) {
    return {
      success: false,

      error:
        nextSequenceResult.error ??
        "Unable to resolve the next Loan sequence.",
    };
  }

  const loanSequence =
    nextSequenceResult.data;

  let loanNumber:
    string;

  try {
    loanNumber =
      formatLoanNumber(
        scope.businessCode,
        scope.branchCode,
        scope.customerNumber,
        loanSequence,
      );
  } catch (error) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to reserve the next Loan Number.",
    };
  }

  const now =
    new Date().toISOString();

  let persistenceResult:
    StorageResult<
      LoanSequenceState
    >;

  if (!existingState) {
    persistenceResult =
      await loanSequenceRepository.save(
        {
          ownerId:
            scope.ownerId,

          businessId:
            scope.businessId,

          branchId:
            scope.branchId,

          businessCode:
            scope.businessCode,

          branchCode:
            scope.branchCode,

          customerId:
            scope.customerId,

          customerNumber:
            scope.customerNumber,

          lastIssuedLoanSequence:
            loanSequence,

          createdAt:
            now,

          updatedAt:
            now,
        },
        {
          ownerId:
            scope.ownerId,
        },
      );
  } else {

    if (
      existingState.ownerId !==
        scope.ownerId ||
      existingState.businessId !==
        scope.businessId ||
      existingState.branchId !==
        scope.branchId ||
      existingState.businessCode !==
        scope.businessCode ||
      existingState.branchCode !==
        scope.branchCode ||
      existingState.customerId !==
        scope.customerId ||
      existingState.customerNumber !==
        scope.customerNumber
    ) {
      return {
        success: false,

        error:
          "Stored Loan sequence identity does not match the active FINORA Customer scope.",
      };
    }

    persistenceResult =
      await loanSequenceRepository.update(
        {
          ...existingState,

          lastIssuedLoanSequence:
            loanSequence,

          updatedAt:
            now,
        },
        {
          ownerId:
            scope.ownerId,
        },
      );
  }

  if (!persistenceResult.success) {
    return {
      success: false,

      error:
        persistenceResult.error ??
        "Unable to reserve the next Loan sequence.",
    };
  }

  return {
    success: true,

    data: {
      customerNumber:
        scope.customerNumber,

      loanSequence,

      loanNumber,
    },
  };
}

// ============================================================
// SERIALIZED RESERVATION API
// ============================================================

export async function reserveNextLoanNumber(
  customerId: string,
): Promise<
  StorageResult<
    LoanNumberPreview
  >
> {

  return withLoanReservationLock(
    customerId,
    () =>
      reserveNextLoanNumberUnlocked(
        customerId,
      ),
  );
}

// ============================================================
// END
// ============================================================
