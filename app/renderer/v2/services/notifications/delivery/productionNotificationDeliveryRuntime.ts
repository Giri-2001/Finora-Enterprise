// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// PRODUCTION NOTIFICATION DELIVERY RUNTIME
//
// RESPONSIBILITY:
//
// - Bind FINORA production Notification delivery timing policy.
// - Create the singleton Electron Delivery execution runtime.
// - Expose the independent customer Delivery Lifecycle.
//
// SECURITY:
//
// - No provider secrets.
// - No API keys or access tokens.
// - No direct ipcRenderer access.
// - Provider execution crosses only the secure preload bridge.
//
// IMPORTANT:
//
// - This module composes runtime objects only.
// - Importing this module does NOT start delivery execution.
// - Lifecycle start / stop belongs to authenticated App wiring.
// - No 09:00 / 20:00 reminder scheduler rules.
// - No React.
// - No UI.
//
// VERSION : 1.0
// STATUS  : Production
// ============================================================

import {
  NOTIFICATION_DELIVERY_FALLBACK_WAKEUP_MS,
  NOTIFICATION_OFFLINE_RETRY_DELAY_MS,
  NOTIFICATION_PROVIDER_FAILURE_RETRY_DELAYS_MS,
  NOTIFICATION_SENDING_STALE_AFTER_MS,
} from "../../../constants/notifications/notificationDeliveryRuntime.constants";

import {
  createElectronNotificationDeliveryLifecycleRuntime,
} from "./electronNotificationDeliveryLifecycleRuntime";

/* ============================================================
   RUNTIME
============================================================ */

export const productionNotificationDeliveryRuntime =
  createElectronNotificationDeliveryLifecycleRuntime({
    retry: {
      offlineRetryDelayMs:
        NOTIFICATION_OFFLINE_RETRY_DELAY_MS,

      providerFailureRetryDelaysMs:
        NOTIFICATION_PROVIDER_FAILURE_RETRY_DELAYS_MS,
    },

    fallbackWakeupMs:
      NOTIFICATION_DELIVERY_FALLBACK_WAKEUP_MS,

    sendingRecoveryStaleAfterMs:
      NOTIFICATION_SENDING_STALE_AFTER_MS,
  });

/* ============================================================
   PUBLIC LIFECYCLE
============================================================ */

export const notificationDeliveryLifecycle =
  productionNotificationDeliveryRuntime.lifecycle;

/* ============================================================
   PUBLIC EXECUTION
============================================================ */

export const notificationDeliveryExecution =
  productionNotificationDeliveryRuntime.execution;

/* ============================================================
   END
============================================================ */