// ============================================================
// FINORA ENTERPRISE OS™
//
// NOTIFICATIONS ENGINE™
// BROWSER NOTIFICATION CONNECTIVITY
//
// RESPONSIBILITY:
//
// - Provide a renderer-safe connectivity pre-flight signal.
// - Implement the NotificationConnectivity contract.
// - Fail closed when browser connectivity state is unavailable.
//
// IMPORTANT:
//
// - navigator.onLine is only a connectivity hint.
// - It does NOT prove that an external provider is reachable.
// - Provider adapter outcomes remain authoritative.
// - No retry scheduling.
// - No storage access.
// - No provider secrets.
// - No network requests are performed here.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  NotificationConnectivity,
} from "./notificationDeliveryService";

/* ============================================================
   IMPLEMENTATION
============================================================ */

export class BrowserNotificationConnectivity
  implements NotificationConnectivity
{
  isOnline(): boolean {
    /*
     * Renderer environments currently include browser,
     * Electron renderer and Android WebView.
     *
     * If navigator is unavailable, fail closed so the Delivery
     * Service never assumes connectivity.
     */

    if (
      typeof navigator === "undefined" ||
      typeof navigator.onLine !== "boolean"
    ) {
      return false;
    }

    return navigator.onLine;
  }
}

/* ============================================================
   DEFAULT INSTANCE
============================================================ */

export const browserNotificationConnectivity =
  new BrowserNotificationConnectivity();

/* ============================================================
   END
============================================================ */
