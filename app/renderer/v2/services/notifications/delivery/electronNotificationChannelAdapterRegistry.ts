// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// ELECTRON NOTIFICATION CHANNEL ADAPTER REGISTRY
//
// RESPONSIBILITY:
//
// - Compose renderer Notification channel adapters for Electron.
// - Route SMS / WhatsApp / Email through the secure preload
//   Notification provider bridge.
// - Keep provider-specific implementation outside renderer code.
//
// SECURITY:
//
// - No provider secrets.
// - No API keys or access tokens.
// - No direct ipcRenderer access.
// - No provider SDK imports.
//
// IMPORTANT:
//
// - This registry does not execute deliveries by itself.
// - Delivery processor runtime wiring is intentionally separate.
// - Missing privileged providers remain unconfigured.
// - No storage access.
// - No retry scheduling.
// - No React.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  NotificationChannelAdapterRegistry,
} from "./notificationChannelAdapter.types";

import {
  createElectronNotificationChannelAdapter,
} from "./electronNotificationChannelAdapter";

/* ============================================================
   REGISTRY
============================================================ */

export const electronNotificationChannelAdapterRegistry:
  NotificationChannelAdapterRegistry = {
    SMS:
      createElectronNotificationChannelAdapter(
        "SMS",
      ),

    WHATSAPP:
      createElectronNotificationChannelAdapter(
        "WHATSAPP",
      ),

    EMAIL:
      createElectronNotificationChannelAdapter(
        "EMAIL",
      ),
  };

/* ============================================================
   END
============================================================ */