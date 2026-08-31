// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// ELECTRON NOTIFICATION CHANNEL ADAPTER
//
// RESPONSIBILITY:
//
// - Adapt the secure Electron preload Notification bridge to the
//   renderer NotificationChannelAdapter contract.
// - Keep provider-specific implementation outside renderer code.
// - Normalize bridge failures into explicit delivery outcomes.
// - Preserve durable deliveryId across the privileged boundary.
//
// SECURITY:
//
// - No provider secrets.
// - No API keys or access tokens.
// - No direct ipcRenderer access.
// - Only window.finora.notifications is used.
//
// IMPORTANT:
//
// - No storage access.
// - No retry scheduling.
// - No Notification persistence.
// - No Loan rules.
// - No scheduler clock rules.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  CustomerNotificationChannel,
} from "../../../types/notifications/notification.types";

import type {
  NotificationChannelAdapter,
  NotificationChannelSendOutcome,
  NotificationChannelSendRequest,
} from "./notificationChannelAdapter.types";

/* ============================================================
   BRIDGE RESOLUTION
============================================================ */

function getNotificationBridge() {
  return window.finora?.notifications;
}

/* ============================================================
   ADAPTER
============================================================ */

export class ElectronNotificationChannelAdapter
  implements NotificationChannelAdapter
{
  constructor(
    readonly channel:
      CustomerNotificationChannel,
  ) {}

  /* ==========================================================
     CONFIGURATION
  ========================================================== */

  async isConfigured():
    Promise<boolean> {
    const bridge =
      getNotificationBridge();

    if (!bridge) {
      return false;
    }

    try {
      const result =
        await bridge.isConfigured({
          channel:
            this.channel,
        });

      return (
        result.success === true &&
        result.data === true
      );
    } catch {
      /*
       * Configuration checks fail closed.
       *
       * Delivery Service will not attempt provider execution
       * when configuration cannot be verified.
       */

      return false;
    }
  }

  /* ==========================================================
     SEND
  ========================================================== */

  async send(
    request:
      NotificationChannelSendRequest,
  ):
    Promise<
      NotificationChannelSendOutcome
    > {
    if (
      request.channel !==
      this.channel
    ) {
      return {
        success: false,

        retryable: false,

        failureCode:
          "CHANNEL_ADAPTER_MISMATCH",

        failureMessage:
          "Electron Notification adapter does not match the requested channel.",
      };
    }

    const bridge =
      getNotificationBridge();

    if (!bridge) {
      return {
        success: false,

        retryable: false,

        failureCode:
          "NOTIFICATION_BRIDGE_UNAVAILABLE",

        failureMessage:
          "Secure FINORA Notification provider bridge is unavailable.",
      };
    }

    try {
      const result =
        await bridge.send({
          notificationId:
            request.notificationId,

          deliveryId:
            request.deliveryId,

          channel:
            request.channel,

          title:
            request.title,

          message:
            request.message,

          customerId:
            request.customerId,

          ...(request.customerName
            ? {
                customerName:
                  request.customerName,
              }
            : {}),

          ...(request.phoneNumber
            ? {
                phoneNumber:
                  request.phoneNumber,
              }
            : {}),

          ...(request.whatsappNumber
            ? {
                whatsappNumber:
                  request.whatsappNumber,
              }
            : {}),

          ...(request.emailAddress
            ? {
                emailAddress:
                  request.emailAddress,
              }
            : {}),
        });

      if (!result.success) {
        return {
          success: false,

          retryable: false,

          failureCode:
            "NOTIFICATION_BRIDGE_FAILURE",

          failureMessage:
            result.error ??
            "Secure FINORA Notification provider bridge failed.",
        };
      }

      if (result.data === undefined) {
        return {
          success: false,

          retryable: false,

          failureCode:
            "NOTIFICATION_BRIDGE_INVALID_RESPONSE",

          failureMessage:
            "Secure FINORA Notification provider bridge returned no delivery outcome.",
        };
      }

      return result.data;
    } catch (error) {
      /*
       * Throw unexpected bridge exceptions.
       *
       * NotificationDeliveryService owns PROVIDER_EXCEPTION
       * lifecycle persistence and configured retry scheduling.
       */

      throw (
        error instanceof Error
          ? error
          : new Error(
              "Secure FINORA Notification provider bridge failed unexpectedly.",
            )
      );
    }
  }
}

/* ============================================================
   FACTORY
============================================================ */

export function createElectronNotificationChannelAdapter(
  channel:
    CustomerNotificationChannel,
):
  NotificationChannelAdapter {
  return new ElectronNotificationChannelAdapter(
    channel,
  );
}

/* ============================================================
   END
============================================================ */