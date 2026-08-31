// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// ELECTRON DELIVERY EXECUTION GATE
//
// RESPONSIBILITY:
//
// - Decide whether one due Notification Delivery may enter the
//   provider execution lifecycle.
// - Defer deliveries when the privileged provider bridge or
//   channel configuration is unavailable.
// - Prevent processor wake-ups from converting temporary
//   provider absence into permanent FAILED deliveries.
//
// SECURITY:
//
// - No provider secrets.
// - No API keys or access tokens.
// - No direct ipcRenderer access.
// - No provider send calls.
//
// IMPORTANT:
//
// - This gate only checks execution availability.
// - NotificationDeliveryService still re-checks configuration
//   immediately before the provider attempt.
// - No storage access.
// - No retry scheduling.
// - No Notification persistence.
// - No React.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  NotificationDeliveryRecord,
} from "../../../types/notifications/notification.types";

import {
  electronNotificationChannelAdapterRegistry,
} from "./electronNotificationChannelAdapterRegistry";

/* ============================================================
   EXECUTION AVAILABILITY
============================================================ */

export async function canExecuteElectronNotificationDelivery(
  delivery:
    NotificationDeliveryRecord,
): Promise<boolean> {
  const adapter =
    electronNotificationChannelAdapterRegistry[
      delivery.channel
    ];

  if (!adapter) {
    return false;
  }

  if (
    adapter.channel !==
    delivery.channel
  ) {
    return false;
  }

  try {
    return (
      await adapter.isConfigured()
    ) === true;
  } catch {
    /*
     * Availability checks fail closed.
     *
     * The Delivery remains unchanged and may be reconsidered
     * by a later lifecycle wake-up.
     */

    return false;
  }
}

/* ============================================================
   END
============================================================ */