/* ===========================================================
   FINORA ENTERPRISE OS™

   NOTIFICATIONS ENGINE™

   DOMAIN TYPES

   RESPONSIBILITY:
   - Define the canonical Notification domain contract
   - Separate owner in-app notifications from customer delivery
   - Define delivery lifecycle and retry state
   - Preserve Customer / Loan / Collection source references
   - Keep operational notification data LOCAL / USB compatible

   IMPORTANT:
   - UI components do not define Notification business state.
   - Delivery status is separate from owner read/unread state.
   - Customer channels are SMS / WhatsApp / Email.
   - Owner notifications use the FINORA in-app Notification Center.
   - Closed or fully-paid Loan suppression belongs to Rules Engine.
   - Scheduling rules belong to Notification Scheduler.
=========================================================== */

import type {
  CustomerId,
} from "../customers/customer.identity.types";

/* ===========================================================
   IDENTIFIERS
=========================================================== */

export type NotificationId = string;

export type NotificationDeliveryId = string;

/* ===========================================================
   ENTITY MARKERS
=========================================================== */

export const NOTIFICATION_ENTITY = "NOTIFICATION" as const;

export const NOTIFICATION_DELIVERY_ENTITY =
  "NOTIFICATION_DELIVERY" as const;

/* ===========================================================
   AUDIENCE
=========================================================== */

export type NotificationAudience =
  | "OWNER"
  | "CUSTOMER";

/* ===========================================================
   CHANNELS
=========================================================== */

export type NotificationChannel =
  | "IN_APP"
  | "SMS"
  | "WHATSAPP"
  | "EMAIL";

export type CustomerNotificationChannel =
  Exclude<NotificationChannel, "IN_APP">;

/* ===========================================================
   EVENT TYPES
=========================================================== */

export type NotificationEventType =
  | "LOAN_DUE"
  | "LOAN_OVERDUE"
  | "LOAN_MATURITY"
  | "COLLECTION_RECEIVED"
  | "LOAN_CLOSED";

/* ===========================================================
   PRIORITY
=========================================================== */

export type NotificationPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

/* ===========================================================
   OWNER READ STATE
=========================================================== */

export type NotificationReadState =
  | "UNREAD"
  | "READ";

/* ===========================================================
   DELIVERY LIFECYCLE
=========================================================== */

export type NotificationDeliveryStatus =
  | "SCHEDULED"
  | "SENDING"
  | "SENT"
  | "DELIVERED"
  | "FAILED"
  | "SKIPPED"
  | "CANCELLED";

/* ===========================================================
   SOURCE REFERENCES
=========================================================== */

export interface NotificationSourceReference {
  customerId: CustomerId;

  loanId?: string;

  loanNumber?: string;

  collectionId?: string;

  collectionNumber?: string;

  receiptNumber?: string;
}
/* ===========================================================
   EXTERNAL TEMPLATE CONTEXT
=========================================================== */

/**
 * Vendor-neutral structured context for external customer
 * message templates.
 *
 * Provider integrations map templateKey to their own
 * provider-specific template / flow identity.
 *
 * Rendered Notification message text must never be parsed back
 * into template variables by a provider adapter.
 */
export interface NotificationTemplateContext {
  /*
   * Stable FINORA template identity.
   *
   * Example shape:
   * SCHEDULED_LOAN::LOAN_DUE::TELUGU
   *
   * The value is FINORA-owned, not a vendor template ID.
   */

  templateKey: string;

  /*
   * Original Customer language preference and the language
   * actually used when FINORA generated the content.
   */

  requestedLanguage?: string;

  resolvedLanguage?: string;

  /*
   * Named normalized values required by external provider
   * templates.
   *
   * Provider-specific parameter names do not belong here.
   */

  variables: Record<string, string>;

  schemaVersion: 1;
}

/* ===========================================================
   CANONICAL NOTIFICATION RECORD
=========================================================== */

export interface NotificationRecordBase {
  /*
   * Storage ID.
   *
   * Kept separate from source Loan / Collection identifiers.
   */

  id: NotificationId;

  /*
   * Compatibility domain identifier.
   *
   * Existing FINORA storage routing recognizes notificationId.
   * The repository will keep id and notificationId identical.
   */

  notificationId: NotificationId;

  entity: typeof NOTIFICATION_ENTITY;

  ownerId: string;

  businessId: string;

  branchId: string;

  eventType: NotificationEventType;

  priority: NotificationPriority;

  title: string;

  message: string;

  source: NotificationSourceReference;

  /*
   * Optional time at which this logical notification
   * becomes eligible for processing.
   */

  scheduledFor?: string;

  createdAt: string;

  updatedAt: string;
}

/* ===========================================================
   OWNER NOTIFICATION RECORD
=========================================================== */

/**
 * Owner notifications participate in the FINORA Notification
 * Center read / unread lifecycle.
 */
export interface OwnerNotificationRecord
  extends NotificationRecordBase {
  audience: "OWNER";

  readState: NotificationReadState;

  readAt?: string;
}

/* ===========================================================
   CUSTOMER NOTIFICATION RECORD
=========================================================== */

/**
 * Customer logical notifications do not have an in-app
 * read / unread lifecycle.
 *
 * Their external lifecycle belongs exclusively to
 * NotificationDeliveryRecord.
 */
export interface CustomerNotificationRecord
  extends NotificationRecordBase {
  audience: "CUSTOMER";

  /*
   * Optional for legacy records and Customer Notification event
   * types that do not require an external provider template.
   */

  templateContext?: NotificationTemplateContext;

  readState?: never;

  readAt?: never;
}

/* ===========================================================
   CANONICAL NOTIFICATION RECORD
=========================================================== */

export type NotificationRecord =
  | OwnerNotificationRecord
  | CustomerNotificationRecord;

/* ===========================================================
   DELIVERY RECIPIENT
=========================================================== */

export interface NotificationDeliveryRecipient {
  customerId: CustomerId;

  customerName?: string;

  phoneNumber?: string;

  whatsappNumber?: string;

  emailAddress?: string;
}

/* ===========================================================
   CUSTOMER DELIVERY RECORD
=========================================================== */

export interface NotificationDeliveryRecord {
  id: NotificationDeliveryId;

  entity: typeof NOTIFICATION_DELIVERY_ENTITY;

  notificationId: NotificationId;

  ownerId: string;

  businessId: string;

  branchId: string;

  channel: CustomerNotificationChannel;

  recipient: NotificationDeliveryRecipient;

  status: NotificationDeliveryStatus;

  /*
   * Number of actual delivery attempts already made.
   */

  attemptCount: number;

  /*
   * Retry scheduling remains explicit.
   *
   * Offline / provider failures must never be recorded
   * as a successful delivery.
   */

  nextRetryAt?: string;

  lastAttemptAt?: string;

  /*
   * Provider tracking metadata.
   *
   * providerMessageId is required for later delivery-status
   * reconciliation without coupling the domain model to a
   * specific SMS / WhatsApp / Email vendor.
   */

  providerMessageId?: string;

  sentAt?: string;

  deliveredAt?: string;

  skippedAt?: string;

  cancelledAt?: string;

  failureCode?: string;

  failureMessage?: string;

  /*
   * Manual resend is auditable.
   */

  resendRequestedAt?: string;

  createdAt: string;

  updatedAt: string;
}

/* ===========================================================
   DELIVERY SUMMARY
=========================================================== */

export interface NotificationDeliverySummary {
  notificationId: NotificationId;

  total: number;

  scheduled: number;

  sending: number;

  sent: number;

  delivered: number;

  failed: number;

  skipped: number;

  cancelled: number;

  lastSentAt?: string;
}

/* ===========================================================
   END
=========================================================== */
