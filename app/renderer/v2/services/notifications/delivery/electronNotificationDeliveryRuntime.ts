// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// ELECTRON NOTIFICATION DELIVERY RUNTIME
//
// RESPONSIBILITY:
//
// - Compose the renderer Notification delivery execution stack.
// - Bind secure Electron channel adapters.
// - Bind browser/Electron connectivity detection.
// - Bind configured retry policy.
// - Bind provider-availability execution gate.
// - Expose a ready NotificationDeliveryProcessor instance.
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
// - Retry delays are injected explicitly.
// - No hardcoded production retry intervals belong here.
// - This module does not start timers.
// - This module does not start lifecycle execution.
// - No React.
// - No UI.
// - No scheduler 09:00 / 20:00 rules.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  BrowserNotificationConnectivity,
} from "./browserNotificationConnectivity";

import {
  ConfiguredNotificationRetryPolicy,
} from "./configuredNotificationRetryPolicy";

import type {
  ConfiguredNotificationRetryPolicyOptions,
} from "./configuredNotificationRetryPolicy";

import {
  NotificationDeliveryProcessor,
} from "./notificationDeliveryProcessor";

import {
  NotificationDeliveryService,
} from "./notificationDeliveryService";

import {
  electronNotificationChannelAdapterRegistry,
} from "./electronNotificationChannelAdapterRegistry";

import {
  canExecuteElectronNotificationDelivery,
} from "./electronNotificationDeliveryExecutionGate";

/* ============================================================
   RUNTIME
============================================================ */

export interface ElectronNotificationDeliveryRuntime {
  deliveryService:
    NotificationDeliveryService;

  processor:
    NotificationDeliveryProcessor;
}

/* ============================================================
   FACTORY
============================================================ */

export function createElectronNotificationDeliveryRuntime(
  retryOptions:
    ConfiguredNotificationRetryPolicyOptions,
): ElectronNotificationDeliveryRuntime {
  const connectivity =
    new BrowserNotificationConnectivity();

  const retryPolicy =
    new ConfiguredNotificationRetryPolicy(
      retryOptions,
    );

  const deliveryService =
    new NotificationDeliveryService({
      connectivity,

      adapters:
        electronNotificationChannelAdapterRegistry,

      retryPolicy,
    });

  const processor =
    new NotificationDeliveryProcessor({
      deliveryService,

      canExecute:
        canExecuteElectronNotificationDelivery,
    });

  return {
    deliveryService,

    processor,
  };
}

/* ============================================================
   END
============================================================ */