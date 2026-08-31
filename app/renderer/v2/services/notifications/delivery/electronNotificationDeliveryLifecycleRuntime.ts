// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// ELECTRON NOTIFICATION DELIVERY LIFECYCLE RUNTIME
//
// RESPONSIBILITY:
//
// - Compose the complete Electron customer delivery runtime.
// - Bind Delivery Service + Processor.
// - Bind operational Delivery Execution boundary.
// - Bind independent Delivery Lifecycle.
// - Keep all timing configuration explicit and injectable.
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
// - No hardcoded production retry intervals.
// - No hardcoded lifecycle discovery interval.
// - No 09:00 / 20:00 reminder scheduler rules.
// - This module creates runtime objects but does not start them.
// - No React.
// - No UI.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  ConfiguredNotificationRetryPolicyOptions,
} from "./configuredNotificationRetryPolicy";

import {
  createElectronNotificationDeliveryRuntime,
} from "./electronNotificationDeliveryRuntime";

import {
  NotificationDeliveryExecution,
} from "./notificationDeliveryExecution";

import {
  NotificationDeliveryLifecycle,
} from "./notificationDeliveryLifecycle";

import {
  NotificationSendingRecoveryService,
} from "./notificationSendingRecoveryService";

/* ============================================================
   CONFIGURATION
============================================================ */

export interface ElectronNotificationDeliveryLifecycleRuntimeOptions {
  retry:
    ConfiguredNotificationRetryPolicyOptions;

  /*
   * Lifecycle recovery/discovery interval.
   *
   * This is not provider retry timing.
   */

  fallbackWakeupMs:
    number;

  /*
   * Maximum age of durable SENDING before crash recovery.
   *
   * Production composition must provide this value.
   */
  sendingRecoveryStaleAfterMs:
    number;
}

/* ============================================================
   COMPOSED RUNTIME
============================================================ */

export interface ElectronNotificationDeliveryLifecycleRuntime {
  execution:
    NotificationDeliveryExecution;

  lifecycle:
    NotificationDeliveryLifecycle;
}

/* ============================================================
   FACTORY
============================================================ */

export function createElectronNotificationDeliveryLifecycleRuntime(
  options:
    ElectronNotificationDeliveryLifecycleRuntimeOptions,
): ElectronNotificationDeliveryLifecycleRuntime {
  const deliveryRuntime =
    createElectronNotificationDeliveryRuntime(
      options.retry,
    );

  const sendingRecovery =
    new NotificationSendingRecoveryService({
      staleAfterMs:
        options.sendingRecoveryStaleAfterMs,
    });

  const execution =
    new NotificationDeliveryExecution({
      processor:
        deliveryRuntime.processor,

      sendingRecovery,
    });

  const lifecycle =
    new NotificationDeliveryLifecycle({
      execution,

      fallbackWakeupMs:
        options.fallbackWakeupMs,
    });

  return {
    execution,

    lifecycle,
  };
}

/* ============================================================
   END
============================================================ */