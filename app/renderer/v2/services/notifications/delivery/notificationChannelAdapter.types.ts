// ============================================================
// FINORA ENTERPRISE OS™
//
// NOTIFICATIONS ENGINE™
// CHANNEL ADAPTER CONTRACT
//
// RESPONSIBILITY:
//
// - Define the provider-agnostic customer delivery boundary.
// - Keep SMS / WhatsApp / Email provider details out of domain logic.
// - Normalize provider delivery outcomes.
// - Prevent renderer business logic from depending on vendor SDKs.
//
// IMPORTANT:
//
// - No provider secrets belong here.
// - No API keys or access tokens belong in renderer code.
// - No storage access.
// - No retry scheduling.
// - No Notification business rules.
// - No fake-success responses.
// - Provider implementations must return explicit outcomes.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  CustomerNotificationChannel,
  NotificationDeliveryRecord,
  NotificationId,
} from "../../../types/notifications/notification.types";

/* ============================================================
   PROVIDER DELIVERY REQUEST
============================================================ */

export interface NotificationChannelSendRequest {
  notificationId: NotificationId;

  deliveryId: string;

  channel: CustomerNotificationChannel;

  title: string;

  message: string;

  customerId: string;

  customerName?: string;

  phoneNumber?: string;

  whatsappNumber?: string;

  emailAddress?: string;
}

/* ============================================================
   NORMALIZED PROVIDER OUTCOME
============================================================ */

export type NotificationChannelSendOutcome =
  | {
      success: true;

      /*
       * Provider accepted the outbound message.
       *
       * This means SENT/accepted, not necessarily DELIVERED.
       */

      providerMessageId?: string;

      acceptedAt: string;
    }
  | {
      success: false;

      /*
       * Retryable means the Delivery Service may schedule
       * another attempt.
       */

      retryable: boolean;

      failureCode: string;

      failureMessage: string;
    };

/* ============================================================
   CHANNEL ADAPTER
============================================================ */

export interface NotificationChannelAdapter {
  readonly channel: CustomerNotificationChannel;

  /*
   * Return whether this adapter is configured and usable.
   *
   * Configuration checks must not expose secrets.
   */

  isConfigured(): Promise<boolean>;

  /*
   * Attempt one provider delivery.
   *
   * The adapter does NOT mutate NotificationDeliveryRecord.
   * Delivery Service owns lifecycle persistence.
   */

  send(
    request: NotificationChannelSendRequest,
  ): Promise<NotificationChannelSendOutcome>;
}

/* ============================================================
   DELIVERY CONTEXT
============================================================ */

export interface NotificationDeliveryExecutionContext {
  delivery: NotificationDeliveryRecord;

  title: string;

  message: string;
}

/* ============================================================
   ADAPTER REGISTRY
============================================================ */

export type NotificationChannelAdapterRegistry = Partial<
  Record<
    CustomerNotificationChannel,
    NotificationChannelAdapter
  >
>;

/* ============================================================
   END
============================================================ */
