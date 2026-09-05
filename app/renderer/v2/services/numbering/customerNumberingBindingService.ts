// ============================================================
// FINORA ENTERPRISE OS™
//
// IDENTITY & NUMBERING ENGINE
// CUSTOMER NUMBERING BINDING SERVICE
//
// RESPONSIBILITY:
//
// - Resolve canonical numbering roots for current Customers
// - Resolve immutable numbering bindings for historical Customers
// - Preview a prospective historical Customer root without
//   consuming the Customer master series
// - Permanently reserve and bind a Customer root only when
//   downstream hierarchical numbering actually requires it
//
// IMPORTANT:
//
// - Historical visible Customer IDs are NEVER rewritten.
// - Canonical Customers do NOT require binding records.
// - No timestamp / suffix guessing.
// - Preview does NOT create a binding.
// - Final binding reservation consumes one Customer master number.
// - Reserved Customer numbers are never rolled back or recycled.
// - Same-runtime binding creation is serialized per Customer.
// - Cross-process atomic locking is future hardening.
// - No direct localStorage access.
// - No direct filesystem access.
// - No React.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  CUSTOMER_NUMBER_MAX,
  CUSTOMER_NUMBER_MIN,
} from "../../constants/numbering/numbering.constants";

import {
  customerNumberingBindingRepository,
} from "../../repositories/numbering/customerNumberingBindingRepository";

import {
  resolveFinoraNumberingScope,
} from "./finoraNumberingScopeService";

import {
  previewNextCustomerNumber,
  reserveNextCustomerNumber,
} from "./customerSeriesService";

import type {
  CustomerNumberingBinding,
  CustomerNumberPreview,
  FinoraNumberingScope,
} from "../../types/numbering/numbering.types";

import type {
  StorageResult,
} from "../../storage/storage.types";

import {
  formatCustomerId,
} from "../../utils/numbering/numbering.formatter";

// ============================================================
// ACTIVE NUMBERING SCOPE
// ============================================================

type ActiveNumberingScope =
  FinoraNumberingScope;

// ============================================================
// LOAD ACTIVE NUMBERING SCOPE
//
// Authoritative numbering codes come from the signed FINORA
// Business Profile through the shared Numbering Scope service.
// ============================================================

async function loadActiveNumberingScope():
  Promise<
    StorageResult<
      ActiveNumberingScope
    >
  > {

  return resolveFinoraNumberingScope();
}
// ============================================================
// CANONICAL CUSTOMER CHECK
//
// Canonical current-format Customer:
//
// FIN-CUS-{BUSINESS}-{BRANCH}-{######}
//
// Historical IDs such as:
//
// FIN-CUS-1787213515479
//
// are intentionally treated as historical and are not parsed
// or rewritten.
//
// A canonical-shaped ID belonging to another provisioned
// Business / Branch fails closed instead of being rebound.
// ============================================================

function resolveCanonicalCustomerRoot(
  customerId: string,
  scope:
    ActiveNumberingScope,
): StorageResult<
  CustomerNumberPreview | undefined
> {

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

  const canonicalShape =
    parts.length === 5 &&
    parts[0] === "FIN" &&
    parts[1] === "CUS" &&
    /^\d{6}$/.test(
      parts[4] ?? "",
    );

  if (!canonicalShape) {
    return {
      success: true,
      data: undefined,
    };
  }

  const customerNumber =
    Number(parts[4]);

  if (
    !Number.isSafeInteger(
      customerNumber,
    ) ||
    customerNumber <
      CUSTOMER_NUMBER_MIN ||
    customerNumber >
      CUSTOMER_NUMBER_MAX
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
    canonicalCustomerId !==
    normalizedCustomerId
  ) {
    return {
      success: false,

      error:
        "Canonical Customer ID does not belong to the active FINORA Business and Branch.",
    };
  }

  return {
    success: true,

    data: {
      customerNumber,
      customerId:
        canonicalCustomerId,
    },
  };
}

// ============================================================
// VALIDATE STORED BINDING
// ============================================================

function resolveBindingRoot(
  binding:
    CustomerNumberingBinding,
  requestedCustomerId: string,
  scope:
    ActiveNumberingScope,
): StorageResult<
  CustomerNumberPreview
> {

  const normalizedRequestedId =
    requestedCustomerId.trim();

  if (
    binding.ownerId !==
      scope.ownerId ||
    binding.businessId !==
      scope.businessId ||
    binding.branchId !==
      scope.branchId ||
    binding.businessCode !==
      scope.businessCode ||
    binding.branchCode !==
      scope.branchCode ||
    binding.legacyCustomerId !==
      normalizedRequestedId
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

    data: {
      customerNumber:
        binding.customerNumber,

      customerId:
        binding.canonicalCustomerId,
    },
  };
}

// ============================================================
// LOAD EXISTING HISTORICAL BINDING
// ============================================================

async function loadHistoricalBindingRoot(
  historicalCustomerId: string,
  scope:
    ActiveNumberingScope,
): Promise<
  StorageResult<
    CustomerNumberPreview | undefined
  >
> {

  const bindingResult =
    await customerNumberingBindingRepository
      .findByLegacyCustomer(
        scope.businessId,
        scope.branchId,
        historicalCustomerId,
      );

  if (!bindingResult.success) {
    return {
      success: false,

      error:
        bindingResult.error ??
        "Unable to load Customer numbering binding.",
    };
  }

  if (!bindingResult.data) {
    return {
      success: true,
      data: undefined,
    };
  }

  return resolveBindingRoot(
    bindingResult.data,
    historicalCustomerId,
    scope,
  );
}

// ============================================================
// PREVIEW CUSTOMER NUMBERING ROOT
//
// Current canonical Customer:
// - return its existing root.
//
// Historical Customer with binding:
// - return its existing bound root.
//
// Historical Customer without binding:
// - preview the next Customer master number only.
// - DO NOT consume it.
// - DO NOT persist a binding.
// ============================================================

export async function previewCustomerNumberingRoot(
  customerId: string,
): Promise<
  StorageResult<
    CustomerNumberPreview
  >
> {

  const normalizedCustomerId =
    customerId.trim();

  if (!normalizedCustomerId) {
    return {
      success: false,
      error: "Customer ID is required.",
    };
  }

  const scopeResult =
    await loadActiveNumberingScope();

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

  const canonicalResult =
    resolveCanonicalCustomerRoot(
      normalizedCustomerId,
      scope,
    );

  if (!canonicalResult.success) {
    return {
      success: false,
      error: canonicalResult.error,
    };
  }

  if (canonicalResult.data) {
    return {
      success: true,
      data: canonicalResult.data,
    };
  }

  const bindingResult =
    await loadHistoricalBindingRoot(
      normalizedCustomerId,
      scope,
    );

  if (!bindingResult.success) {
    return {
      success: false,
      error: bindingResult.error,
    };
  }

  if (bindingResult.data) {
    return {
      success: true,
      data: bindingResult.data,
    };
  }

  return previewNextCustomerNumber();
}

// ============================================================
// HISTORICAL BINDING SERIALIZATION
//
// Same-runtime calls for one historical Customer must not each
// reserve a different hidden Customer root.
//
// Customer master reservation itself is separately serialized
// by customerSeriesService.
// ============================================================

const customerBindingQueues =
  new Map<
    string,
    Promise<void>
  >();

async function withCustomerBindingLock<T>(
  customerId: string,
  operation:
    () => Promise<T>,
): Promise<T> {

  const lockKey =
    customerId
      .trim()
      .toUpperCase();

  const previousOperation =
    customerBindingQueues.get(
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

  customerBindingQueues.set(
    lockKey,
    currentOperation,
  );

  await previousOperation;

  try {
    return await operation();
  } finally {
    releaseCurrentOperation();

    if (
      customerBindingQueues.get(
        lockKey,
      ) === currentOperation
    ) {
      customerBindingQueues.delete(
        lockKey,
      );
    }
  }
}

// ============================================================
// RESOLVE OR CREATE CUSTOMER NUMBERING ROOT ? UNLOCKED
//
// Canonical Customer:
// - no binding required.
//
// Historical Customer with existing binding:
// - reuse immutable binding.
//
// Historical Customer without binding:
// - permanently reserve one Customer master number;
// - persist immutable historical ? canonical root binding.
//
// A reserved root is not recycled if binding persistence later
// fails. A numbering gap is acceptable.
// ============================================================

async function resolveOrCreateCustomerNumberingRootUnlocked(
  customerId: string,
): Promise<
  StorageResult<
    CustomerNumberPreview
  >
> {

  const normalizedCustomerId =
    customerId.trim();

  if (!normalizedCustomerId) {
    return {
      success: false,
      error: "Customer ID is required.",
    };
  }

  const scopeResult =
    await loadActiveNumberingScope();

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

  const canonicalResult =
    resolveCanonicalCustomerRoot(
      normalizedCustomerId,
      scope,
    );

  if (!canonicalResult.success) {
    return {
      success: false,
      error: canonicalResult.error,
    };
  }

  if (canonicalResult.data) {
    return {
      success: true,
      data: canonicalResult.data,
    };
  }

  const existingBindingResult =
    await loadHistoricalBindingRoot(
      normalizedCustomerId,
      scope,
    );

  if (!existingBindingResult.success) {
    return {
      success: false,
      error: existingBindingResult.error,
    };
  }

  if (existingBindingResult.data) {
    return {
      success: true,
      data: existingBindingResult.data,
    };
  }

  const reservationResult =
    await reserveNextCustomerNumber();

  if (
    !reservationResult.success ||
    !reservationResult.data
  ) {
    return {
      success: false,

      error:
        reservationResult.error ??
        "Unable to reserve a Customer numbering root.",
    };
  }

  const reservedRoot =
    reservationResult.data;

  const now =
    new Date().toISOString();

  const binding:
    CustomerNumberingBinding = {

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

      legacyCustomerId:
        normalizedCustomerId,

      canonicalCustomerId:
        reservedRoot.customerId,

      customerNumber:
        reservedRoot.customerNumber,

      createdAt:
        now,
  };

  const saveResult =
    await customerNumberingBindingRepository
      .save(
        binding,
        {
          ownerId:
            scope.ownerId,
        },
      );

  if (saveResult.success) {
    return {
      success: true,
      data: reservedRoot,
    };
  }

  // ----------------------------------------------------------
  // CROSS-RUNTIME COMPATIBILITY CHECK
  //
  // Another runtime may have created the immutable binding
  // after this runtime reserved its Customer root.
  //
  // Reload once. If a valid binding now exists, use it.
  // The extra reserved root remains a legitimate permanent gap.
  // ----------------------------------------------------------

  const concurrentBindingResult =
    await loadHistoricalBindingRoot(
      normalizedCustomerId,
      scope,
    );

  if (
    concurrentBindingResult.success &&
    concurrentBindingResult.data
  ) {
    return {
      success: true,
      data: concurrentBindingResult.data,
    };
  }

  return {
    success: false,

    error:
      saveResult.error ??
      "Unable to persist Customer numbering binding.",
  };
}

// ============================================================
// FINAL RESOLUTION API
// ============================================================

export async function resolveOrCreateCustomerNumberingRoot(
  customerId: string,
): Promise<
  StorageResult<
    CustomerNumberPreview
  >
> {

  return withCustomerBindingLock(
    customerId,
    () =>
      resolveOrCreateCustomerNumberingRootUnlocked(
        customerId,
      ),
  );
}

// ============================================================
// END
// ============================================================
