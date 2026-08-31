// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// PRIVILEGED NOTIFICATION PROVIDER CONTRACT
//
// RESPONSIBILITY:
//
// - Define the Electron main-process provider boundary.
// - Keep provider credentials outside renderer code.
// - Normalize SMS / WhatsApp / Email provider outcomes.
// - Provide a narrow contract for Notification IPC handlers.
//
// SECURITY:
//
// - No provider secrets belong in this contract.
// - No API keys or access tokens may cross to the renderer.
// - Renderer receives only configuration state and normalized
//   delivery outcomes.
// - Provider implementations remain privileged.
//
// IMPORTANT:
//
// - No React.
// - No renderer storage.
// - No Notification persistence.
// - No retry scheduling.
// - No Loan rules.
// - No scheduler clock rules.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   CHANNEL
============================================================ */

export type FinoraNotificationProviderChannel =
  | "SMS"
  | "WHATSAPP"
  | "EMAIL";

/* ============================================================
   SEND REQUEST
============================================================ */

export interface FinoraNotificationProviderSendRequest {
  notificationId: string;

  /*
   * Durable Delivery identity.
   *
   * Provider implementations MUST use this identity as the
   * idempotency key whenever the selected provider supports
   * idempotent request semantics.
   */

  deliveryId: string;

  channel: FinoraNotificationProviderChannel;

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

export type FinoraNotificationProviderSendOutcome =
  | {
      success: true;

      /*
       * Provider accepted the outbound message.
       *
       * Accepted does not mean customer delivery was confirmed.
       */

      providerMessageId?: string;

      acceptedAt: string;
    }
  | {
      success: false;

      /*
       * Whether the renderer Delivery Service may schedule
       * another attempt through its configured retry policy.
       */

      retryable: boolean;

      failureCode: string;

      failureMessage: string;
    };

/* ============================================================
   PRIVILEGED PROVIDER ADAPTER
============================================================ */

export interface FinoraNotificationProviderAdapter {
  readonly channel:
    FinoraNotificationProviderChannel;

  /*
   * Returns whether this provider is configured and usable.
   *
   * This method MUST NOT expose credential material.
   */

  isConfigured():
    boolean | Promise<boolean>;

  /*
   * Executes one outbound provider request.
   *
   * Provider implementations MUST return an explicit outcome.
   * They must never fabricate success when no provider accepted
   * the message.
   */

  send(
    request:
      FinoraNotificationProviderSendRequest,
  ):
    Promise<
      FinoraNotificationProviderSendOutcome
    >;
}

/* ============================================================
   PROVIDER REGISTRY
============================================================ */

export type FinoraNotificationProviderRegistry =
  Partial<
    Record<
      FinoraNotificationProviderChannel,
      FinoraNotificationProviderAdapter
    >
  >;

/* ============================================================
   IPC RESULT
============================================================ */

export type FinoraNotificationProviderIpcResult<T> =
  | {
      success: true;

      data: T;
    }
  | {
      success: false;

      error: string;
    };

/* ============================================================
   END
============================================================ */