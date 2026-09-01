// ============================================================
// FINORA ENTERPRISE OS™
//
// NOTIFICATIONS ENGINE™
// BUSINESS NOTIFICATION POLICY REPOSITORY
//
// RESPONSIBILITY:
//
// - Persist one Business-wide Notification policy.
// - Preserve Owner / Business isolation.
// - Keep Notification policy domain types storage-independent.
// - Use explicit BUSINESS_NOTIFICATION_POLICY persistence.
// - Fail closed on storage or policy-record corruption.
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
// - No Customer override resolution.
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
  BUSINESS_NOTIFICATION_POLICY_ENTITY,
} from "../../types/notifications/notificationPreferences.types";

import type {
  BusinessNotificationPolicy,
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

export interface BusinessNotificationPolicyRepositoryScope {
  ownerId: string;

  businessId: string;
}

/* ============================================================
   STORAGE RECORD
============================================================ */

interface BusinessNotificationPolicyStorageRecord
  extends BusinessNotificationPolicy {
  id: string;

  entity:
    typeof BUSINESS_NOTIFICATION_POLICY_ENTITY;
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

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeString(
  value: string,
): string {
  return String(value ?? "").trim();
}

function normalizeScope(
  scope: BusinessNotificationPolicyRepositoryScope,
): BusinessNotificationPolicyRepositoryScope {
  return {
    ownerId:
      normalizeString(scope.ownerId),

    businessId:
      normalizeString(scope.businessId),
  };
}

/* ============================================================
   LEGACY EVENT COMPATIBILITY
============================================================ */

function normalizeLegacyBusinessNotificationPolicyStorageRecord(
  record: BusinessNotificationPolicyStorageRecord,
): BusinessNotificationPolicyStorageRecord {
  const events =
    record.events;

  if (
    !events ||
    typeof events !== "object" ||
    typeof events.CUSTOMER_CREATED !== "undefined"
  ) {
    return record;
  }

  return {
    ...record,

    events: {
      ...events,

      CUSTOMER_CREATED:
        false,
    },
  };
}

/* ============================================================
   IDENTITY
============================================================ */

function buildBusinessNotificationPolicyId(
  scope: BusinessNotificationPolicyRepositoryScope,
): string {
  return [
    scope.ownerId,
    scope.businessId,
  ].join("::");
}

/* ============================================================
   QUERY
============================================================ */

function buildBusinessNotificationPolicyQuery(
  scope: BusinessNotificationPolicyRepositoryScope,
): StorageQuery {
  return {
    entity:
      BUSINESS_NOTIFICATION_POLICY_ENTITY,

    id:
      buildBusinessNotificationPolicyId(
        scope,
      ),
  };
}

/* ============================================================
   SCOPE VALIDATION
============================================================ */

function validateScope(
  scope: BusinessNotificationPolicyRepositoryScope,
): string | undefined {
  if (!scope.ownerId) {
    return "Owner ID is required for Business Notification policy persistence.";
  }

  if (!scope.businessId) {
    return "Business ID is required for Business Notification policy persistence.";
  }

  return undefined;
}

/* ============================================================
   POLICY VALIDATION
============================================================ */

function validateBusinessNotificationPolicy(
  scope: BusinessNotificationPolicyRepositoryScope,

  policy: BusinessNotificationPolicy,
): string | undefined {
  if (
    normalizeString(policy.ownerId) !==
    scope.ownerId
  ) {
    return "Business Notification policy Owner ID does not match the repository scope.";
  }

  if (
    normalizeString(policy.businessId) !==
    scope.businessId
  ) {
    return "Business Notification policy Business ID does not match the repository scope.";
  }

  if (typeof policy.enabled !== "boolean") {
    return "Business Notification policy master switch is invalid.";
  }

  if (
    !policy.channels ||
    typeof policy.channels !== "object"
  ) {
    return "Business Notification channel policy is required.";
  }

  for (
    const channel
    of CUSTOMER_NOTIFICATION_CHANNELS
  ) {
    if (
      typeof policy.channels[channel] !==
      "boolean"
    ) {
      return `Business Notification channel policy is invalid for ${channel}.`;
    }
  }

  if (
    !policy.events ||
    typeof policy.events !== "object"
  ) {
    return "Business Notification event policy is required.";
  }

  for (
    const eventType
    of NOTIFICATION_EVENT_TYPES
  ) {
    if (
      typeof policy.events[eventType] !==
      "boolean"
    ) {
      return `Business Notification event policy is invalid for ${eventType}.`;
    }
  }

  if (!normalizeString(policy.createdAt)) {
    return "Business Notification policy creation timestamp is required.";
  }

  if (!normalizeString(policy.updatedAt)) {
    return "Business Notification policy update timestamp is required.";
  }

  return undefined;
}

/* ============================================================
   STORAGE RECORD BUILDER
============================================================ */

function toStorageRecord(
  scope: BusinessNotificationPolicyRepositoryScope,

  policy: BusinessNotificationPolicy,
): BusinessNotificationPolicyStorageRecord {
  return {
    ...policy,

    id:
      buildBusinessNotificationPolicyId(
        scope,
      ),

    entity:
      BUSINESS_NOTIFICATION_POLICY_ENTITY,
  };
}

/* ============================================================
   STORAGE RECORD VALIDATION
============================================================ */

function validateStorageRecord(
  scope: BusinessNotificationPolicyRepositoryScope,

  record: BusinessNotificationPolicyStorageRecord,
): string | undefined {
  if (
    record.entity !==
    BUSINESS_NOTIFICATION_POLICY_ENTITY
  ) {
    return "Business Notification policy entity marker is invalid.";
  }

  if (
    normalizeString(record.id) !==
    buildBusinessNotificationPolicyId(scope)
  ) {
    return "Business Notification policy storage ID does not match the repository scope.";
  }

  return validateBusinessNotificationPolicy(
    scope,

    record,
  );
}

/* ============================================================
   STORAGE RECORD MAPPER
============================================================ */

function fromStorageRecord(
  record: BusinessNotificationPolicyStorageRecord,
): BusinessNotificationPolicy {
  const {
    id: _storageId,

    entity: _storageEntity,

    ...policy
  } = record;

  return policy;
}

/* ============================================================
   REPOSITORY
============================================================ */

export class BusinessNotificationPolicyRepository {
  /* ==========================================================
     FIND
  ========================================================== */

  async find(
    scope: BusinessNotificationPolicyRepositoryScope,
  ): Promise<
    StorageResult<
      BusinessNotificationPolicy | undefined
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
        BusinessNotificationPolicyStorageRecord
      >(
        buildBusinessNotificationPolicyQuery(
          normalizedScope,
        ),
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to load Business Notification policy.",
      };
    }

    if (!result.data) {
      return {
        success: true,

        data: undefined,
      };
    }

    const normalizedStorageRecord =
      normalizeLegacyBusinessNotificationPolicyStorageRecord(
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
    scope: BusinessNotificationPolicyRepositoryScope,

    policy: BusinessNotificationPolicy,

    options?: RepositoryWriteOptions,
  ): Promise<
    StorageResult<BusinessNotificationPolicy>
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

    const policyError =
      validateBusinessNotificationPolicy(
        normalizedScope,

        policy,
      );

    if (policyError) {
      return {
        success: false,

        error: policyError,
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
          "Unable to verify existing Business Notification policy.",
      };
    }

    if (existing.data) {
      return {
        success: false,

        error:
          "Business Notification policy already exists.",
      };
    }

    const storageRecord =
      toStorageRecord(
        normalizedScope,

        policy,
      );

    const result =
      await storageManager.save<
        BusinessNotificationPolicyStorageRecord
      >(
        storageRecord,

        options,
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to save Business Notification policy.",
      };
    }

    return {
      success: true,

      data: policy,
    };
  }

  /* ==========================================================
     UPDATE
  ========================================================== */

  async update(
    scope: BusinessNotificationPolicyRepositoryScope,

    policy: BusinessNotificationPolicy,

    options?: RepositoryWriteOptions,
  ): Promise<
    StorageResult<BusinessNotificationPolicy>
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

    const policyError =
      validateBusinessNotificationPolicy(
        normalizedScope,

        policy,
      );

    if (policyError) {
      return {
        success: false,

        error: policyError,
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
          "Unable to verify Business Notification policy.",
      };
    }

    if (!existing.data) {
      return {
        success: false,

        error:
          "Business Notification policy was not found.",
      };
    }

    const storageRecord =
      toStorageRecord(
        normalizedScope,

        policy,
      );

    const result =
      await storageManager.update<
        BusinessNotificationPolicyStorageRecord
      >(
        storageRecord,

        options,
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to update Business Notification policy.",
      };
    }

    return {
      success: true,

      data: policy,
    };
  }

  /* ==========================================================
     SAVE OR UPDATE
  ========================================================== */

  async saveOrUpdate(
    scope: BusinessNotificationPolicyRepositoryScope,

    policy: BusinessNotificationPolicy,

    options?: RepositoryWriteOptions,
  ): Promise<
    StorageResult<BusinessNotificationPolicy>
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
          "Unable to verify Business Notification policy.",
      };
    }

    if (existing.data) {
      return this.update(
        normalizedScope,

        policy,

        options,
      );
    }

    return this.save(
      normalizedScope,

      policy,

      options,
    );
  }
}

/* ============================================================
   SINGLETON
============================================================ */

export const businessNotificationPolicyRepository =
  new BusinessNotificationPolicyRepository();

/* ============================================================
   END
============================================================ */
