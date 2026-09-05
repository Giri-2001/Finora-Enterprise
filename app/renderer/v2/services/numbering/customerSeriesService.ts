// ============================================================
// FINORA ENTERPRISE OS™
//
// IDENTITY & NUMBERING ENGINE
// CUSTOMER SERIES SERVICE
//
// RESPONSIBILITY:
//
// - Load the Customer Series for the provisioned branch
// - Lock the owner-selected starting Customer number once
// - Resolve immutable Business / Branch numbering codes from
//   the signed FINORA Business Profile
// - Keep Customer Series business rules outside repositories
//
// IMPORTANT:
//
// - No direct localStorage access.
// - No direct filesystem access.
// - No Electron IPC.
// - No React.
// - No Customer record creation.
// - No Loan / Collection / Receipt sequence logic.
// - Owner controls only startingCustomerNumber.
// - Business / Branch codes come only from the signed Business Profile.
//
// VERSION : 1.2
// STATUS  : Production Foundation
// ============================================================

import {
  CUSTOMER_NUMBER_MAX,
  CUSTOMER_NUMBER_MIN,
} from "../../constants/numbering/numbering.constants";

import {
  numberingSeriesRepository,
} from "../../repositories/numbering/numberingSeriesRepository";

import {
  resolveFinoraNumberingScope,
} from "./finoraNumberingScopeService";

import type {
  CustomerNumberPreview,
  CustomerSeriesConfiguration,
  CustomerSeriesSetupInput,
  CustomerSeriesSetupPreview,
  FinoraNumberingScope,
} from "../../types/numbering/numbering.types";

import type {
  StorageResult,
} from "../../storage/storage.types";

import {
  formatCustomerId,
} from "../../utils/numbering/numbering.formatter";

// ============================================================
// HELPERS
// ============================================================

function validateStartingCustomerNumber(
  value: number,
): string | null {
  if (!Number.isSafeInteger(value)) {
    return "Starting Customer number must be a whole number.";
  }

  if (
    value < CUSTOMER_NUMBER_MIN ||
    value > CUSTOMER_NUMBER_MAX
  ) {
    return (
      `Starting Customer number must be between ${CUSTOMER_NUMBER_MIN} and ${CUSTOMER_NUMBER_MAX}.`
    );
  }

  return null;
}

// ============================================================
// STORED CUSTOMER SERIES SCOPE VALIDATION
// ============================================================

function validateStoredCustomerSeriesScope(
  configuration:
    CustomerSeriesConfiguration,
  scope:
    FinoraNumberingScope,
): StorageResult<void> {

  if (
    configuration.ownerId !==
      scope.ownerId ||
    configuration.businessId !==
      scope.businessId ||
    configuration.branchId !==
      scope.branchId ||
    configuration.businessCode !==
      scope.businessCode ||
    configuration.branchCode !==
      scope.branchCode
  ) {

    return {
      success:
        false,

      error:
        "Stored Customer Series identity does not match the authoritative FINORA numbering scope.",
    };
  }

  return {
    success:
      true,
  };
}

// ============================================================
// CUSTOMER RESERVATION SERIALIZATION
//
// StorageManager exposes independent read / update operations.
// Reserving a Customer number therefore needs one service-level
// critical section so concurrent callers cannot reserve the
// same next number inside this FINORA runtime.
// ============================================================

let customerReservationQueue:
  Promise<void> =
    Promise.resolve();

async function withCustomerReservationLock<T>(
  operation:
    () => Promise<T>,
): Promise<T> {
  const previousOperation =
    customerReservationQueue;

  let releaseCurrentOperation:
    () => void =
      () => undefined;

  customerReservationQueue =
    new Promise<void>(
      (resolve) => {
        releaseCurrentOperation =
          resolve;
      },
    );

  await previousOperation;

  try {
    return await operation();
  } finally {
    releaseCurrentOperation();
  }
}

// ============================================================
// LOAD CUSTOMER SERIES
// ============================================================

export async function loadCustomerSeriesConfiguration():
  Promise<
    StorageResult<
      CustomerSeriesConfiguration | undefined
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

  const configurationResult =
    await numberingSeriesRepository.findByBranch(
      scope.businessId,
      scope.branchId,
    );

  if (!configurationResult.success) {

    return {
      success:
        false,

      error:
        configurationResult.error ??
        "Unable to load Customer Series configuration.",
    };
  }

  const configuration =
    configurationResult.data;

  if (!configuration) {
    return configurationResult;
  }

  const scopeValidation =
    validateStoredCustomerSeriesScope(
      configuration,
      scope,
    );

  if (!scopeValidation.success) {

    return {
      success:
        false,

      error:
        scopeValidation.error ??
        "Stored Customer Series scope validation failed.",
    };
  }

  return configurationResult;
}
// ============================================================
// PREVIEW CUSTOMER SERIES SETUP
// ============================================================

/**
 * Preview an owner-selected Customer Series starting number
 * before the series is permanently locked.
 *
 * IMPORTANT:
 *
 * - Does NOT persist anything.
 * - Does NOT reserve or consume a Customer number.
 * - Business / Branch codes come only from the signed Business Profile.
 * - Owner controls only startingCustomerNumber.
 */
export async function previewCustomerSeriesSetup(
  input:
    CustomerSeriesSetupInput,
): Promise<
  StorageResult<
    CustomerSeriesSetupPreview
  >
> {

  const validationError =
    validateStartingCustomerNumber(
      input.startingCustomerNumber,
    );

  if (validationError) {
    return {
      success:
        false,

      error:
        validationError,
    };
  }

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

  try {

    return {
      success:
        true,

      data: {
        customerNumber:
          input.startingCustomerNumber,

        customerId:
          formatCustomerId(
            scope.businessCode,
            scope.branchCode,
            input.startingCustomerNumber,
          ),

        businessCode:
          scope.businessCode,

        branchCode:
          scope.branchCode,
      },
    };

  } catch (error) {

    return {
      success:
        false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to preview the Customer Series setup.",
    };
  }
}
// ============================================================
// LOCK CUSTOMER SERIES
// ============================================================

/**
 * Permanently lock the Customer Series starting number for the
 * currently provisioned Business + Branch.
 *
 * Missing Customer Series record means UNCONFIGURED.
 *
 * A successful setup writes the first persisted record directly
 * as LOCKED. Normal Settings cannot unlock or replace it.
 */
export async function lockCustomerSeries(
  input:
    CustomerSeriesSetupInput,
): Promise<
  StorageResult<
    CustomerSeriesConfiguration
  >
> {

  const validationError =
    validateStartingCustomerNumber(
      input.startingCustomerNumber,
    );

  if (validationError) {
    return {
      success:
        false,

      error:
        validationError,
    };
  }

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

  const existingResult =
    await numberingSeriesRepository.findByBranch(
      scope.businessId,
      scope.branchId,
    );

  if (!existingResult.success) {

    return {
      success:
        false,

      error:
        existingResult.error ??
        "Unable to verify Customer Series configuration.",
    };
  }

  if (existingResult.data) {

    const existingScopeValidation =
      validateStoredCustomerSeriesScope(
        existingResult.data,
        scope,
      );

    if (
      !existingScopeValidation.success
    ) {

      return {
        success:
          false,

        error:
          existingScopeValidation.error ??
          "Existing Customer Series scope validation failed.",
      };
    }

    return {
      success:
        false,

      error:
        "Customer Series is already locked for this branch.",
    };
  }

  const now =
    new Date().toISOString();

  const configuration:
    CustomerSeriesConfiguration = {

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

    startingCustomerNumber:
      input.startingCustomerNumber,

    lastIssuedCustomerNumber:
      null,

    status:
      "LOCKED",

    lockedAt:
      now,

    createdAt:
      now,

    updatedAt:
      now,
  };

  return numberingSeriesRepository.save(
    configuration,
    {
      ownerId:
        scope.ownerId,
    },
  );
}
// ============================================================
// PREVIEW NEXT CUSTOMER NUMBER
// ============================================================

/**
 * Preview the next Customer number without consuming it.
 *
 * Opening or cancelling the Customer wizard therefore does not
 * create gaps in the permanent Customer Series.
 */
export async function previewNextCustomerNumber():
  Promise<
    StorageResult<
      CustomerNumberPreview
    >
  > {
  const configurationResult =
    await loadCustomerSeriesConfiguration();

  if (!configurationResult.success) {
    return {
      success: false,

      error:
        configurationResult.error ??
        "Unable to load Customer Series configuration.",
    };
  }

  const configuration =
    configurationResult.data;

  if (!configuration) {
    return {
      success: false,

      error:
        "Customer Series has not been configured for this branch.",
    };
  }

  if (configuration.status !== "LOCKED") {
    return {
      success: false,

      error:
        "Customer Series is not locked for this branch.",
    };
  }

  const nextCustomerNumber =
    configuration.lastIssuedCustomerNumber === null
      ? configuration.startingCustomerNumber
      : configuration.lastIssuedCustomerNumber + 1;

  if (
    nextCustomerNumber >
    CUSTOMER_NUMBER_MAX
  ) {
    return {
      success: false,

      error:
        "Customer Series has reached its maximum number.",
    };
  }

  try {
    return {
      success: true,

      data: {
        customerNumber:
          nextCustomerNumber,

        customerId:
          formatCustomerId(
            configuration.businessCode,
            configuration.branchCode,
            nextCustomerNumber,
          ),
      },
    };
  } catch (error) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to preview the next Customer ID.",
    };
  }
}

// ============================================================
// RESERVE NEXT CUSTOMER NUMBER
// ============================================================

/**
 * Permanently reserve the next Customer number.
 *
 * IMPORTANT:
 *
 * - This operation CONSUMES the Customer sequence.
 * - The persisted lastIssuedCustomerNumber is advanced before
 *   the caller creates the Customer record.
 * - A reserved number is never rolled back or recycled.
 * - If downstream Customer creation later fails, a numbering
 *   gap is acceptable and safer than duplicate/reused IDs.
 */
async function reserveNextCustomerNumberUnlocked():
  Promise<
    StorageResult<
      CustomerNumberPreview
    >
  > {
  const configurationResult =
    await loadCustomerSeriesConfiguration();

  if (!configurationResult.success) {
    return {
      success: false,

      error:
        configurationResult.error ??
        "Unable to load Customer Series configuration.",
    };
  }

  const configuration =
    configurationResult.data;

  if (!configuration) {
    return {
      success: false,

      error:
        "Customer Series has not been configured for this branch.",
    };
  }

  if (configuration.status !== "LOCKED") {
    return {
      success: false,

      error:
        "Customer Series is not locked for this branch.",
    };
  }

  const nextCustomerNumber =
    configuration.lastIssuedCustomerNumber === null
      ? configuration.startingCustomerNumber
      : configuration.lastIssuedCustomerNumber + 1;

  if (
    nextCustomerNumber >
    CUSTOMER_NUMBER_MAX
  ) {
    return {
      success: false,

      error:
        "Customer Series has reached its maximum number.",
    };
  }

  let customerId: string;

  try {
    customerId =
      formatCustomerId(
        configuration.businessCode,
        configuration.branchCode,
        nextCustomerNumber,
      );
  } catch (error) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to reserve the next Customer ID.",
    };
  }

  const now =
    new Date().toISOString();

  const updateResult =
    await numberingSeriesRepository.update(
      {
        ...configuration,

        lastIssuedCustomerNumber:
          nextCustomerNumber,

        updatedAt:
          now,
      },
      {
        ownerId:
          configuration.ownerId,
      },
    );

  if (!updateResult.success) {
    return {
      success: false,

      error:
        updateResult.error ??
        "Unable to reserve the next Customer number.",
    };
  }

  return {
    success: true,

    data: {
      customerNumber:
        nextCustomerNumber,

      customerId,
    },
  };
}

// ============================================================
// SERIALIZED RESERVATION API
// ============================================================

/**
 * Permanently reserve the next Customer number through a
 * serialized critical section.
 *
 * Every waiting caller reloads the latest persisted Customer
 * Series only after the previous reservation has completed.
 */
export async function reserveNextCustomerNumber():
  Promise<
    StorageResult<
      CustomerNumberPreview
    >
  > {
  return withCustomerReservationLock(
    reserveNextCustomerNumberUnlocked,
  );
}

// ============================================================
// END
// ============================================================
