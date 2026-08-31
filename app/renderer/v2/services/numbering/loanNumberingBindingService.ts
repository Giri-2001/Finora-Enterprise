// ============================================================
// FINORA ENTERPRISE OS™
//
// IDENTITY & NUMBERING ENGINE
// LOAN NUMBERING BINDING SERVICE
//
// RESPONSIBILITY:
//
// - Preserve historical visible Loan Numbers unchanged
// - Resolve canonical hierarchical Loan numbering roots
// - Preview a prospective hidden canonical root without
//   consuming a Loan sequence
// - Permanently reserve and bind a canonical root only when
//   required by a downstream transaction
// - Validate immutable stored Loan numbering bindings
//
// IMPORTANT:
//
// - No direct localStorage access.
// - No direct filesystem access.
// - No Electron IPC.
// - No UI logic.
// - Historical Loan records are never rewritten.
// - No timestamp / suffix guessing.
// - Canonical Loans require no binding.
// - Preview never consumes a Loan sequence.
// - Binding creation permanently consumes one Loan sequence.
// - A failed binding save may create a legal sequence gap.
// - Same-runtime serialization protects one historical Loan.
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
  loanNumberingBindingRepository,
} from "../../repositories/numbering/loanNumberingBindingRepository";

import {
  customerNumberingBindingRepository,
} from "../../repositories/numbering/customerNumberingBindingRepository";

import {
  loadFinoraInstallationIdentity,
} from "../activation/activationService";

import {
  previewNextLoanNumber,
  reserveNextLoanNumber,
} from "./loanSequenceService";

import type {
  FinoraNumberingScope,
  LoanNumberingBinding,
} from "../../types/numbering/numbering.types";

import type {
  StorageResult,
} from "../../storage/storage.types";

import {
  formatCustomerId,
  formatLoanNumber,
  normalizeNumberingCode,
} from "../../utils/numbering/numbering.formatter";

// ============================================================
// RESOLVED LOAN NUMBERING ROOT
// ============================================================

export interface ResolvedLoanNumberingRoot
  extends FinoraNumberingScope {

  customerId:
    string;

  sourceLoanNumber:
    string;

  canonicalLoanNumber:
    string;

  customerNumber:
    number;

  loanSequence:
    number;

  isHistoricalBinding:
    boolean;
}

// ============================================================
// HELPERS
// ============================================================

function normalizeProvisionedCode(
  value: string | undefined,
  label: string,
): StorageResult<string> {

  if (!value?.trim()) {
    return {
      success: false,

      error:
        `FINORA ${label} is not provisioned for this installation.`,
    };
  }

  try {
    return {
      success: true,

      data:
        normalizeNumberingCode(
          value,
        ),
    };
  } catch (error) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : `FINORA ${label} is invalid.`,
    };
  }
}

// ============================================================
// CANONICAL LOAN PARSER
//
// FIN-LOAN-{BUSINESS}-{BRANCH}-{CUSTOMER}-{LOAN}
// ============================================================

function parseCanonicalLoanNumber(
  loanNumber: string,
  businessCode: string,
  branchCode: string,
): StorageResult<{
  customerNumber: number;
  loanSequence: number;
}> {

  const normalizedLoanNumber =
    loanNumber.trim().toUpperCase();

  if (!normalizedLoanNumber) {
    return {
      success: false,
      error: "Loan Number is required.",
    };
  }

  const parts =
    normalizedLoanNumber.split("-");

  if (
    parts.length !== 6 ||
    parts[0] !== "FIN" ||
    parts[1] !== "LOAN"
  ) {
    return {
      success: false,

      error:
        "Loan Number is not a canonical FINORA Loan Number.",
    };
  }

  const customerNumberText =
    parts[4];

  const loanSequenceText =
    parts[5];

  if (!/^\d{6}$/.test(customerNumberText)) {
    return {
      success: false,

      error:
        "Loan Number does not contain a valid 6-digit Customer number.",
    };
  }

  if (!/^\d{3}$/.test(loanSequenceText)) {
    return {
      success: false,

      error:
        "Loan Number does not contain a valid 3-digit Loan sequence.",
    };
  }

  const customerNumber =
    Number(customerNumberText);

  const loanSequence =
    Number(loanSequenceText);

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

  if (
    !Number.isSafeInteger(loanSequence) ||
    loanSequence < LOAN_SEQUENCE_MIN ||
    loanSequence > LOAN_SEQUENCE_MAX
  ) {
    return {
      success: false,

      error:
        "Loan sequence is outside the supported FINORA range.",
    };
  }

  let canonicalLoanNumber:
    string;

  try {
    canonicalLoanNumber =
      formatLoanNumber(
        businessCode,
        branchCode,
        customerNumber,
        loanSequence,
      );
  } catch (error) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to validate the Loan Number.",
    };
  }

  if (
    normalizedLoanNumber !==
    canonicalLoanNumber
  ) {
    return {
      success: false,

      error:
        "Loan Number does not belong to the provisioned FINORA Business and Branch.",
    };
  }

  return {
    success: true,

    data: {
      customerNumber,
      loanSequence,
    },
  };
}

// ============================================================
// ACTIVE INSTALLATION SCOPE
// ============================================================

async function resolveInstallationScope(): Promise<
  StorageResult<
    FinoraNumberingScope
  >
> {

  const installationResult =
    await loadFinoraInstallationIdentity();

  if (!installationResult.success) {
    return {
      success: false,

      error:
        installationResult.error ??
        "Unable to load FINORA installation identity.",
    };
  }

  const installation =
    installationResult.data;

  if (!installation) {
    return {
      success: false,

      error:
        "FINORA installation has not been provisioned.",
    };
  }

  const businessCodeResult =
    normalizeProvisionedCode(
      installation.businessCode,
      "Business Code",
    );

  if (
    !businessCodeResult.success ||
    !businessCodeResult.data
  ) {
    return {
      success: false,

      error:
        businessCodeResult.error ??
        "FINORA Business Code is required.",
    };
  }

  const branchCodeResult =
    normalizeProvisionedCode(
      installation.branchCode,
      "Branch Code",
    );

  if (
    !branchCodeResult.success ||
    !branchCodeResult.data
  ) {
    return {
      success: false,

      error:
        branchCodeResult.error ??
        "FINORA Branch Code is required.",
    };
  }

  return {
    success: true,

    data: {
      ownerId:
        installation.ownerId,

      businessId:
        installation.businessId,

      branchId:
        installation.branchId,

      businessCode:
        businessCodeResult.data,

      branchCode:
        branchCodeResult.data,
    },
  };
}

// ============================================================
// STORED BINDING VALIDATION
// ============================================================

function validateStoredBinding(
  binding: LoanNumberingBinding,
  scope: FinoraNumberingScope,
  customerId: string,
  legacyLoanNumber: string,
): StorageResult<
  ResolvedLoanNumberingRoot
> {

  if (
    binding.ownerId !== scope.ownerId ||
    binding.businessId !== scope.businessId ||
    binding.branchId !== scope.branchId ||
    binding.businessCode !== scope.businessCode ||
    binding.branchCode !== scope.branchCode ||
    binding.customerId !== customerId ||
    binding.legacyLoanNumber !== legacyLoanNumber
  ) {
    return {
      success: false,

      error:
        "Stored Loan numbering binding does not match the active FINORA Loan scope.",
    };
  }

  const parsedResult =
    parseCanonicalLoanNumber(
      binding.canonicalLoanNumber,
      scope.businessCode,
      scope.branchCode,
    );

  if (
    !parsedResult.success ||
    !parsedResult.data
  ) {
    return {
      success: false,

      error:
        parsedResult.error ??
        "Stored canonical Loan Number is invalid.",
    };
  }

  if (
    parsedResult.data.customerNumber !==
      binding.customerNumber ||
    parsedResult.data.loanSequence !==
      binding.loanSequence
  ) {
    return {
      success: false,

      error:
        "Stored Loan numbering binding is internally inconsistent.",
    };
  }

  return {
    success: true,

    data: {
      ...scope,

      customerId,

      sourceLoanNumber:
        legacyLoanNumber,

      canonicalLoanNumber:
        binding.canonicalLoanNumber,

      customerNumber:
        binding.customerNumber,

      loanSequence:
        binding.loanSequence,

      isHistoricalBinding:
        true,
    },
  };
}

// ============================================================
// EXISTING CUSTOMER ROOT FOR CANONICAL LOAN VALIDATION
//
// A canonical Loan must belong to the supplied Customer.
//
// Canonical Customer:
// - validate its embedded Customer Number directly.
//
// Historical Customer:
// - an existing immutable Customer numbering binding is required.
// - prospective preview roots are intentionally NOT accepted.
// - no Customer sequence is consumed here.
// ============================================================

async function resolveExistingCustomerNumber(
  scope: FinoraNumberingScope,
  customerId: string,
): Promise<
  StorageResult<number>
> {

  const normalizedCustomerId =
    customerId.trim();

  if (!normalizedCustomerId) {
    return {
      success: false,
      error: "Customer ID is required.",
    };
  }

  const canonicalParts =
    normalizedCustomerId
      .toUpperCase()
      .split("-");

  const canonicalShape =
    canonicalParts.length === 5 &&
    canonicalParts[0] === "FIN" &&
    canonicalParts[1] === "CUS" &&
    /^\d{6}$/.test(
      canonicalParts[4] ?? "",
    );

  if (canonicalShape) {
    const customerNumber =
      Number(canonicalParts[4]);

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
          scope.businessCode,
          scope.branchCode,
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
      normalizedCustomerId.toUpperCase() !==
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

  const bindingResult =
    await customerNumberingBindingRepository.findByLegacyCustomer(
      scope.businessId,
      scope.branchId,
      normalizedCustomerId,
    );

  if (!bindingResult.success) {
    return {
      success: false,

      error:
        bindingResult.error ??
        "Unable to load Customer numbering binding.",
    };
  }

  const binding =
    bindingResult.data;

  if (!binding) {
    return {
      success: false,

      error:
        "Historical Customer has no established FINORA numbering root for this canonical Loan.",
    };
  }

  if (
    binding.ownerId !== scope.ownerId ||
    binding.businessId !== scope.businessId ||
    binding.branchId !== scope.branchId ||
    binding.businessCode !== scope.businessCode ||
    binding.branchCode !== scope.branchCode ||
    binding.legacyCustomerId !== normalizedCustomerId
  ) {
    return {
      success: false,

      error:
        "Stored Customer numbering binding does not match the active FINORA scope.",
    };
  }

  let expectedCanonicalCustomerId:
    string;

  try {
    expectedCanonicalCustomerId =
      formatCustomerId(
        scope.businessCode,
        scope.branchCode,
        binding.customerNumber,
      );
  } catch (error) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Stored Customer numbering binding is invalid.",
    };
  }

  if (
    binding.canonicalCustomerId !==
    expectedCanonicalCustomerId
  ) {
    return {
      success: false,

      error:
        "Stored Customer numbering binding has an invalid canonical Customer root.",
    };
  }

  return {
    success: true,
    data: binding.customerNumber,
  };
}

// ============================================================
// EXISTING CANONICAL LOAN
// ============================================================

async function resolveCanonicalLoan(
  scope: FinoraNumberingScope,
  customerId: string,
  loanNumber: string,
): Promise<
  StorageResult<
    ResolvedLoanNumberingRoot
  >
> {

  const parsedResult =
    parseCanonicalLoanNumber(
      loanNumber,
      scope.businessCode,
      scope.branchCode,
    );

  if (
    !parsedResult.success ||
    !parsedResult.data
  ) {
    return {
      success: false,

      error:
        parsedResult.error ??
        "Unable to resolve canonical Loan Number.",
    };
  }

  const customerNumberResult =
    await resolveExistingCustomerNumber(
      scope,
      customerId,
    );

  if (
    !customerNumberResult.success ||
    customerNumberResult.data === undefined
  ) {
    return {
      success: false,

      error:
        customerNumberResult.error ??
        "Unable to validate canonical Loan Customer ownership.",
    };
  }

  if (
    customerNumberResult.data !==
    parsedResult.data.customerNumber
  ) {
    return {
      success: false,

      error:
        "Canonical Loan Number does not belong to the supplied FINORA Customer.",
    };
  }

  return {
    success: true,

    data: {
      ...scope,

      customerId,

      sourceLoanNumber:
        loanNumber,

      canonicalLoanNumber:
        loanNumber.trim().toUpperCase(),

      customerNumber:
        parsedResult.data.customerNumber,

      loanSequence:
        parsedResult.data.loanSequence,

      isHistoricalBinding:
        false,
    },
  };
}

// ============================================================
// CANONICAL SHAPE CHECK
// ============================================================

function looksLikeCanonicalLoanNumber(
  loanNumber: string,
): boolean {

  const parts =
    loanNumber
      .trim()
      .toUpperCase()
      .split("-");

  return (
    parts.length === 6 &&
    parts[0] === "FIN" &&
    parts[1] === "LOAN"
  );
}

// ============================================================
// PREVIEW HISTORICAL LOAN ROOT
//
// No Loan sequence is consumed.
// No binding is persisted.
// ============================================================

export async function previewLoanNumberingRoot(
  customerId: string,
  loanNumber: string,
): Promise<
  StorageResult<
    ResolvedLoanNumberingRoot
  >
> {

  const normalizedCustomerId =
    customerId.trim();

  const normalizedLoanNumber =
    loanNumber.trim();

  if (!normalizedCustomerId) {
    return {
      success: false,
      error: "Customer ID is required.",
    };
  }

  if (!normalizedLoanNumber) {
    return {
      success: false,
      error: "Loan Number is required.",
    };
  }

  const scopeResult =
    await resolveInstallationScope();

  if (
    !scopeResult.success ||
    !scopeResult.data
  ) {
    return {
      success: false,

      error:
        scopeResult.error ??
        "Unable to resolve FINORA numbering scope.",
    };
  }

  const scope =
    scopeResult.data;

  if (
    looksLikeCanonicalLoanNumber(
      normalizedLoanNumber,
    )
  ) {
    return resolveCanonicalLoan(
      scope,
      normalizedCustomerId,
      normalizedLoanNumber,
    );
  }

  const existingResult =
    await loanNumberingBindingRepository.findByLegacyLoan(
      scope.businessId,
      scope.branchId,
      normalizedCustomerId,
      normalizedLoanNumber,
    );

  if (!existingResult.success) {
    return {
      success: false,

      error:
        existingResult.error ??
        "Unable to load Loan numbering binding.",
    };
  }

  if (existingResult.data) {
    return validateStoredBinding(
      existingResult.data,
      scope,
      normalizedCustomerId,
      normalizedLoanNumber,
    );
  }

  const previewResult =
    await previewNextLoanNumber(
      normalizedCustomerId,
    );

  if (
    !previewResult.success ||
    !previewResult.data
  ) {
    return {
      success: false,

      error:
        previewResult.error ??
        "Unable to preview historical Loan numbering root.",
    };
  }

  return {
    success: true,

    data: {
      ...scope,

      customerId:
        normalizedCustomerId,

      sourceLoanNumber:
        normalizedLoanNumber,

      canonicalLoanNumber:
        previewResult.data.loanNumber,

      customerNumber:
        previewResult.data.customerNumber,

      loanSequence:
        previewResult.data.loanSequence,

      isHistoricalBinding:
        true,
    },
  };
}

// ============================================================
// HISTORICAL LOAN BINDING SERIALIZATION
// ============================================================

const loanBindingQueues =
  new Map<
    string,
    Promise<void>
  >();

async function withLoanBindingLock<T>(
  customerId: string,
  loanNumber: string,
  operation:
    () => Promise<T>,
): Promise<T> {

  const lockKey =
    [
      customerId.trim().toUpperCase(),
      loanNumber.trim().toUpperCase(),
    ].join("::");

  const previousOperation =
    loanBindingQueues.get(
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

  loanBindingQueues.set(
    lockKey,
    currentOperation,
  );

  await previousOperation;

  try {
    return await operation();
  } finally {
    releaseCurrentOperation();

    if (
      loanBindingQueues.get(
        lockKey,
      ) === currentOperation
    ) {
      loanBindingQueues.delete(
        lockKey,
      );
    }
  }
}

// ============================================================
// RESOLVE / CREATE HISTORICAL LOAN ROOT ? UNLOCKED
// ============================================================

async function resolveOrCreateLoanNumberingRootUnlocked(
  customerId: string,
  loanNumber: string,
): Promise<
  StorageResult<
    ResolvedLoanNumberingRoot
  >
> {

  const normalizedCustomerId =
    customerId.trim();

  const normalizedLoanNumber =
    loanNumber.trim();

  if (!normalizedCustomerId) {
    return {
      success: false,
      error: "Customer ID is required.",
    };
  }

  if (!normalizedLoanNumber) {
    return {
      success: false,
      error: "Loan Number is required.",
    };
  }

  const scopeResult =
    await resolveInstallationScope();

  if (
    !scopeResult.success ||
    !scopeResult.data
  ) {
    return {
      success: false,

      error:
        scopeResult.error ??
        "Unable to resolve FINORA numbering scope.",
    };
  }

  const scope =
    scopeResult.data;

  if (
    looksLikeCanonicalLoanNumber(
      normalizedLoanNumber,
    )
  ) {
    return resolveCanonicalLoan(
      scope,
      normalizedCustomerId,
      normalizedLoanNumber,
    );
  }

  const existingResult =
    await loanNumberingBindingRepository.findByLegacyLoan(
      scope.businessId,
      scope.branchId,
      normalizedCustomerId,
      normalizedLoanNumber,
    );

  if (!existingResult.success) {
    return {
      success: false,

      error:
        existingResult.error ??
        "Unable to load Loan numbering binding.",
    };
  }

  if (existingResult.data) {
    return validateStoredBinding(
      existingResult.data,
      scope,
      normalizedCustomerId,
      normalizedLoanNumber,
    );
  }

  const reservationResult =
    await reserveNextLoanNumber(
      normalizedCustomerId,
    );

  if (
    !reservationResult.success ||
    !reservationResult.data
  ) {
    return {
      success: false,

      error:
        reservationResult.error ??
        "Unable to reserve historical Loan numbering root.",
    };
  }

  const reservation =
    reservationResult.data;

  const binding:
    LoanNumberingBinding = {

      ...scope,

      customerId:
        normalizedCustomerId,

      legacyLoanNumber:
        normalizedLoanNumber,

      canonicalLoanNumber:
        reservation.loanNumber,

      customerNumber:
        reservation.customerNumber,

      loanSequence:
        reservation.loanSequence,

      createdAt:
        new Date().toISOString(),
    };

  const saveResult =
    await loanNumberingBindingRepository.save(
      binding,
      {
        ownerId:
          scope.ownerId,
      },
    );

  if (saveResult.success) {
    return validateStoredBinding(
      binding,
      scope,
      normalizedCustomerId,
      normalizedLoanNumber,
    );
  }

  // ==========================================================
  // CROSS-RUNTIME COMPATIBILITY RELOAD
  //
  // Another runtime may have persisted the immutable binding
  // after our initial read.
  //
  // Our independently reserved Loan sequence remains a legal
  // permanent gap if that occurred.
  // ==========================================================

  const reloadResult =
    await loanNumberingBindingRepository.findByLegacyLoan(
      scope.businessId,
      scope.branchId,
      normalizedCustomerId,
      normalizedLoanNumber,
    );

  if (
    reloadResult.success &&
    reloadResult.data
  ) {
    return validateStoredBinding(
      reloadResult.data,
      scope,
      normalizedCustomerId,
      normalizedLoanNumber,
    );
  }

  return {
    success: false,

    error:
      saveResult.error ??
      "Unable to persist Loan numbering binding.",
  };
}

// ============================================================
// SERIALIZED RESOLVE / CREATE API
// ============================================================

export async function resolveOrCreateLoanNumberingRoot(
  customerId: string,
  loanNumber: string,
): Promise<
  StorageResult<
    ResolvedLoanNumberingRoot
  >
> {

  return withLoanBindingLock(
    customerId,
    loanNumber,
    () =>
      resolveOrCreateLoanNumberingRootUnlocked(
        customerId,
        loanNumber,
      ),
  );
}

// ============================================================
// END
// ============================================================
