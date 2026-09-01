// ============================================================
// FINORA ENTERPRISE OS™
//
// NOTIFICATIONS ENGINE™
// CUSTOMER NOTIFICATION PREFERENCE REPOSITORY
//
// RESPONSIBILITY:
//
// - Persist one Customer-specific Notification preference record.
// - Preserve Owner / Business / Branch / Customer isolation.
// - Keep Customer preference domain types storage-independent.
// - Use explicit CUSTOMER_NOTIFICATION_PREFERENCE persistence.
// - Fail closed on storage or preference-record corruption.
//
// IMPORTANT:
//
// - No React.
// - No UI.
// - No localStorage access.
// - No filesystem access.
// - No Electron IPC.
// - No scheduler rules.
// - No provider logic.
// - No Business policy resolution.
// - No Customer profile loading.
// - No hidden Notification defaults.
// - Storage access goes only through StorageManager.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import type {
  CustomerNotificationChannel,
  NotificationEventType,
} from "../../types/notifications/notification.types";

import {
  CUSTOMER_NOTIFICATION_PREFERENCE_ENTITY,
} from "../../types/notifications/notificationPreferences.types";

import type {
  CustomerNotificationPreference,
  CustomerNotificationPreferenceOverride,
} from "../../types/notifications/notificationPreferences.types";

import {
  storageManager,
} from "../../storage/storageManager";

import type {
  StorageQuery,
  StorageResult,
} from "../../storage/storage.types";

import type {
  RepositoryWriteOptions,
} from "../repository.types";

/* ============================================================
   SCOPE
============================================================ */

export interface CustomerNotificationPreferenceRepositoryScope {
  ownerId: string;

  businessId: string;

  branchId: string;

  customerId: string;
}

/* ============================================================
   STORAGE RECORD
============================================================ */

interface CustomerNotificationPreferenceStorageRecord
  extends CustomerNotificationPreference {
  id: string;

  entity:
    typeof CUSTOMER_NOTIFICATION_PREFERENCE_ENTITY;
}

/* ============================================================
   CANONICAL KEYS
============================================================ */

const CUSTOMER_NOTIFICATION_CHANNELS:
  readonly CustomerNotificationChannel[] = [
    "SMS",
    "WHATSAPP",
    "EMAIL",
  ];

const NOTIFICATION_EVENT_TYPES:
  readonly NotificationEventType[] = [
    "LOAN_DUE",
    "LOAN_OVERDUE",
    "LOAN_MATURITY",
    "CUSTOMER_CREATED",
    "COLLECTION_RECEIVED",
    "LOAN_CLOSED",
  ];

const VALID_OVERRIDES:
  readonly CustomerNotificationPreferenceOverride[] = [
    "INHERIT",
    "ENABLED",
    "DISABLED",
  ];

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeString(
  value: string,
): string {
  return String(value ?? "").trim();
}

function normalizeScope(
  scope: CustomerNotificationPreferenceRepositoryScope,
): CustomerNotificationPreferenceRepositoryScope {
  return {
    ownerId:
      normalizeString(scope.ownerId),

    businessId:
      normalizeString(scope.businessId),

    branchId:
      normalizeString(scope.branchId),

    customerId:
      normalizeString(scope.customerId),
  };
}

/* ============================================================
   LEGACY EVENT COMPATIBILITY
============================================================ */

function normalizeLegacyCustomerNotificationPreferenceStorageRecord(
  record: CustomerNotificationPreferenceStorageRecord,
): CustomerNotificationPreferenceStorageRecord {
  const eventOverrides =
    record.eventOverrides;

  if (
    !eventOverrides ||
    typeof eventOverrides !== "object" ||
    typeof eventOverrides.CUSTOMER_CREATED !== "undefined"
  ) {
    return record;
  }

  return {
    ...record,

    eventOverrides: {
      ...eventOverrides,

      CUSTOMER_CREATED:
        "INHERIT",
    },
  };
}

/* ============================================================
   IDENTITY
============================================================ */

function buildCustomerNotificationPreferenceId(
  scope: CustomerNotificationPreferenceRepositoryScope,
): string {
  return [
    scope.ownerId,
    scope.businessId,
    scope.branchId,
    scope.customerId,
  ].join("::");
}

/* ============================================================
   QUERY
============================================================ */

function buildCustomerNotificationPreferenceQuery(
  scope: CustomerNotificationPreferenceRepositoryScope,
): StorageQuery {
  return {
    entity:
      CUSTOMER_NOTIFICATION_PREFERENCE_ENTITY,

    id:
      buildCustomerNotificationPreferenceId(
        scope,
      ),
  };
}

/* ============================================================
   SCOPE VALIDATION
============================================================ */

function validateScope(
  scope: CustomerNotificationPreferenceRepositoryScope,
): string | undefined {
  if (!scope.ownerId) {
    return "Owner ID is required for Customer Notification preference persistence.";
  }

  if (!scope.businessId) {
    return "Business ID is required for Customer Notification preference persistence.";
  }

  if (!scope.branchId) {
    return "Branch ID is required for Customer Notification preference persistence.";
  }

  if (!scope.customerId) {
    return "Customer ID is required for Customer Notification preference persistence.";
  }

  return undefined;
}

/* ============================================================
   OVERRIDE VALIDATION
============================================================ */

function isValidOverride(
  value: unknown,
): value is CustomerNotificationPreferenceOverride {
  return VALID_OVERRIDES.includes(
    value as CustomerNotificationPreferenceOverride,
  );
}

/* ============================================================
   PREFERENCE VALIDATION
============================================================ */

function validateCustomerNotificationPreference(
  scope: CustomerNotificationPreferenceRepositoryScope,

  preference: CustomerNotificationPreference,
): string | undefined {
  if (
    normalizeString(preference.ownerId) !==
    scope.ownerId
  ) {
    return "Customer Notification preference Owner ID does not match the repository scope.";
  }

  if (
    normalizeString(preference.businessId) !==
    scope.businessId
  ) {
    return "Customer Notification preference Business ID does not match the repository scope.";
  }

  if (
    normalizeString(preference.branchId) !==
    scope.branchId
  ) {
    return "Customer Notification preference Branch ID does not match the repository scope.";
  }

  if (
    normalizeString(preference.customerId) !==
    scope.customerId
  ) {
    return "Customer Notification preference Customer ID does not match the repository scope.";
  }

  if (
    !preference.channelOverrides ||
    typeof preference.channelOverrides !== "object"
  ) {
    return "Customer Notification channel overrides are required.";
  }

  for (
    const channel
    of CUSTOMER_NOTIFICATION_CHANNELS
  ) {
    if (
      !isValidOverride(
        preference.channelOverrides[channel],
      )
    ) {
      return `Customer Notification channel override is invalid for ${channel}.`;
    }
  }

  if (
    !preference.eventOverrides ||
    typeof preference.eventOverrides !== "object"
  ) {
    return "Customer Notification event overrides are required.";
  }

  for (
    const eventType
    of NOTIFICATION_EVENT_TYPES
  ) {
    if (
      !isValidOverride(
        preference.eventOverrides[eventType],
      )
    ) {
      return `Customer Notification event override is invalid for ${eventType}.`;
    }
  }

  if (!normalizeString(preference.createdAt)) {
    return "Customer Notification preference creation timestamp is required.";
  }

  if (!normalizeString(preference.updatedAt)) {
    return "Customer Notification preference update timestamp is required.";
  }

  return undefined;
}

/* ============================================================
   STORAGE RECORD BUILDER
============================================================ */

function toStorageRecord(
  scope: CustomerNotificationPreferenceRepositoryScope,

  preference: CustomerNotificationPreference,
): CustomerNotificationPreferenceStorageRecord {
  return {
    ...preference,

    id:
      buildCustomerNotificationPreferenceId(
        scope,
      ),

    entity:
      CUSTOMER_NOTIFICATION_PREFERENCE_ENTITY,
  };
}

/* ============================================================
   STORAGE RECORD VALIDATION
============================================================ */

function validateStorageRecord(
  scope: CustomerNotificationPreferenceRepositoryScope,

  record: CustomerNotificationPreferenceStorageRecord,
): string | undefined {
  if (
    record.entity !==
    CUSTOMER_NOTIFICATION_PREFERENCE_ENTITY
  ) {
    return "Customer Notification preference entity marker is invalid.";
  }

  if (
    normalizeString(record.id) !==
    buildCustomerNotificationPreferenceId(scope)
  ) {
    return "Customer Notification preference storage ID does not match the repository scope.";
  }

  return validateCustomerNotificationPreference(
    scope,

    record,
  );
}

/* ============================================================
   STORAGE RECORD MAPPER
============================================================ */

function fromStorageRecord(
  record: CustomerNotificationPreferenceStorageRecord,
): CustomerNotificationPreference {
  const {
    id: _storageId,

    entity: _storageEntity,

    ...preference
  } = record;

  return preference;
}

/* ============================================================
   REPOSITORY
============================================================ */

export class CustomerNotificationPreferenceRepository {
  /* ==========================================================
     FIND
  ========================================================== */

  async find(
    scope: CustomerNotificationPreferenceRepositoryScope,
  ): Promise<
    StorageResult<
      CustomerNotificationPreference | undefined
    >
  > {
    const normalizedScope =
      normalizeScope(scope);

    const scopeError =
      validateScope(normalizedScope);

    if (scopeError) {
      return {
        success: false,

        error: scopeError,
      };
    }

    const result =
      await storageManager.get<
        CustomerNotificationPreferenceStorageRecord
      >(
        buildCustomerNotificationPreferenceQuery(
          normalizedScope,
        ),
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to load Customer Notification preference.",
      };
    }

    if (!result.data) {
      return {
        success: true,

        data: undefined,
      };
    }

    const normalizedStorageRecord =
      normalizeLegacyCustomerNotificationPreferenceStorageRecord(
        result.data,
      );

    const recordError =
      validateStorageRecord(
        normalizedScope,

        normalizedStorageRecord,
      );

    if (recordError) {
      return {
        success: false,

        error: recordError,
      };
    }

    return {
      success: true,

      data:
        fromStorageRecord(
          normalizedStorageRecord,
        ),
    };
  }

  /* ==========================================================
     SAVE
  ========================================================== */

  async save(
    scope: CustomerNotificationPreferenceRepositoryScope,

    preference: CustomerNotificationPreference,

    options?: RepositoryWriteOptions,
  ): Promise<
    StorageResult<CustomerNotificationPreference>
  > {
    const normalizedScope =
      normalizeScope(scope);

    const scopeError =
      validateScope(normalizedScope);

    if (scopeError) {
      return {
        success: false,

        error: scopeError,
      };
    }

    const preferenceError =
      validateCustomerNotificationPreference(
        normalizedScope,

        preference,
      );

    if (preferenceError) {
      return {
        success: false,

        error: preferenceError,
      };
    }

    const existing =
      await this.find(
        normalizedScope,
      );

    if (!existing.success) {
      return {
        success: false,

        error:
          existing.error ??
          "Unable to verify existing Customer Notification preference.",
      };
    }

    if (existing.data) {
      return {
        success: false,

        error:
          "Customer Notification preference already exists.",
      };
    }

    const storageRecord =
      toStorageRecord(
        normalizedScope,

        preference,
      );

    const result =
      await storageManager.save<
        CustomerNotificationPreferenceStorageRecord
      >(
        storageRecord,

        options,
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to save Customer Notification preference.",
      };
    }

    return {
      success: true,

      data: preference,
    };
  }

  /* ==========================================================
     UPDATE
  ========================================================== */

  async update(
    scope: CustomerNotificationPreferenceRepositoryScope,

    preference: CustomerNotificationPreference,

    options?: RepositoryWriteOptions,
  ): Promise<
    StorageResult<CustomerNotificationPreference>
  > {
    const normalizedScope =
      normalizeScope(scope);

    const scopeError =
      validateScope(normalizedScope);

    if (scopeError) {
      return {
        success: false,

        error: scopeError,
      };
    }

    const preferenceError =
      validateCustomerNotificationPreference(
        normalizedScope,

        preference,
      );

    if (preferenceError) {
      return {
        success: false,

        error: preferenceError,
      };
    }

    const existing =
      await this.find(
        normalizedScope,
      );

    if (!existing.success) {
      return {
        success: false,

        error:
          existing.error ??
          "Unable to verify Customer Notification preference.",
      };
    }

    if (!existing.data) {
      return {
        success: false,

        error:
          "Customer Notification preference was not found.",
      };
    }

    const storageRecord =
      toStorageRecord(
        normalizedScope,

        preference,
      );

    const result =
      await storageManager.update<
        CustomerNotificationPreferenceStorageRecord
      >(
        storageRecord,

        options,
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to update Customer Notification preference.",
      };
    }

    return {
      success: true,

      data: preference,
    };
  }

  /* ==========================================================
     SAVE OR UPDATE
  ========================================================== */

  async saveOrUpdate(
    scope: CustomerNotificationPreferenceRepositoryScope,

    preference: CustomerNotificationPreference,

    options?: RepositoryWriteOptions,
  ): Promise<
    StorageResult<CustomerNotificationPreference>
  > {
    const normalizedScope =
      normalizeScope(scope);

    const scopeError =
      validateScope(normalizedScope);

    if (scopeError) {
      return {
        success: false,

        error: scopeError,
      };
    }

    const existing =
      await this.find(
        normalizedScope,
      );

    if (!existing.success) {
      return {
        success: false,

        error:
          existing.error ??
          "Unable to verify Customer Notification preference.",
      };
    }

    if (existing.data) {
      return this.update(
        normalizedScope,

        preference,

        options,
      );
    }

    return this.save(
      normalizedScope,

      preference,

      options,
    );
  }
}

/* ============================================================
   SINGLETON
============================================================ */

export const customerNotificationPreferenceRepository =
  new CustomerNotificationPreferenceRepository();

/* ============================================================
   END
============================================================ */
