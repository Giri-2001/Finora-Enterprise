// ============================================================
// FINORA ENTERPRISE OS™
//
// NOTIFICATIONS ENGINE™
// NOTIFICATION PREFERENCES TYPES
//
// RESPONSIBILITY:
//
// - Define Business-wide Notification policy.
// - Define Customer-specific Notification preferences.
// - Keep Business policy separate from Customer overrides.
// - Preserve explicit inheritance semantics.
// - Support LOCAL / USB operational persistence.
//
// IMPORTANT:
//
// - TYPES ONLY.
// - No storage access.
// - No provider calls.
// - No scheduler logic.
// - No retry logic.
// - No UI.
// - No hidden delivery defaults.
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
} from "./notification.types";

/* ============================================================
   ENTITY NAMES
============================================================ */

export const BUSINESS_NOTIFICATION_POLICY_ENTITY =
  "BUSINESS_NOTIFICATION_POLICY" as const;

export const CUSTOMER_NOTIFICATION_PREFERENCE_ENTITY =
  "CUSTOMER_NOTIFICATION_PREFERENCE" as const;

/* ============================================================
   BUSINESS CHANNEL POLICY
============================================================ */

export type BusinessNotificationChannelPolicy =
  Record<
    CustomerNotificationChannel,
    boolean
  >;

/* ============================================================
   BUSINESS EVENT POLICY
============================================================ */

export type BusinessNotificationEventPolicy =
  Record<
    NotificationEventType,
    boolean
  >;

/* ============================================================
   CUSTOMER OVERRIDE
============================================================ */

/**
 * INHERIT
 *   Use the effective Business policy.
 *
 * ENABLED
 *   Customer explicitly allows this channel / event.
 *   Business policy still remains authoritative and may block it.
 *
 * DISABLED
 *   Customer explicitly blocks this channel / event.
 */
export type CustomerNotificationPreferenceOverride =
  | "INHERIT"
  | "ENABLED"
  | "DISABLED";

/* ============================================================
   CUSTOMER CHANNEL OVERRIDES
============================================================ */

export type CustomerNotificationChannelOverrides =
  Record<
    CustomerNotificationChannel,
    CustomerNotificationPreferenceOverride
  >;

/* ============================================================
   CUSTOMER EVENT OVERRIDES
============================================================ */

export type CustomerNotificationEventOverrides =
  Record<
    NotificationEventType,
    CustomerNotificationPreferenceOverride
  >;

/* ============================================================
   BUSINESS NOTIFICATION POLICY
============================================================ */

/**
 * One Business-wide Notification policy.
 *
 * Logical identity:
 *
 * ownerId + businessId
 *
 * A missing Business policy must not silently enable external
 * customer delivery. Effective-policy resolution will fail
 * closed until an explicit Business policy exists.
 */
export interface BusinessNotificationPolicy {
  ownerId: string;

  businessId: string;

  /**
   * Master Business Notification switch.
   */
  enabled: boolean;

  /**
   * External customer delivery channel controls.
   */
  channels: BusinessNotificationChannelPolicy;

  /**
   * Notification event controls.
   */
  events: BusinessNotificationEventPolicy;

  createdAt: string;

  updatedAt: string;
}

/* ============================================================
   CUSTOMER NOTIFICATION PREFERENCE
============================================================ */

/**
 * One Customer-specific Notification preference record.
 *
 * Logical identity:
 *
 * ownerId + businessId + branchId + customerId
 *
 * Customer overrides can never bypass a Business-level block.
 */
export interface CustomerNotificationPreference {
  ownerId: string;

  businessId: string;

  branchId: string;

  customerId: string;

  channelOverrides:
    CustomerNotificationChannelOverrides;

  eventOverrides:
    CustomerNotificationEventOverrides;

  createdAt: string;

  updatedAt: string;
}

/* ============================================================
   END
============================================================ */
