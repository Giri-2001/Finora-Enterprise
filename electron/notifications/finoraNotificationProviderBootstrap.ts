// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// PRIVILEGED NOTIFICATION PROVIDER BOOTSTRAP
//
// RESPONSIBILITY:
//
// - Register production privileged Notification providers.
// - Keep provider registration in the Electron main process.
// - Complete provider registration before IPC registry snapshot.
//
// SECURITY:
//
// - MAIN PROCESS ONLY.
// - No renderer mutation.
// - No credentials are exposed here.
// - Provider configuration remains in encrypted privileged store.
//
// ============================================================

import {
  registerFinoraNotificationProvider,
} from "./finoraNotificationProviderRegistry.js";

import {
  msg91SmsNotificationProvider,
} from "./providers/msg91SmsNotificationProvider.js";

import {
  msg91WhatsappNotificationProvider,
} from "./providers/msg91WhatsappNotificationProvider.js";

import {
  resendEmailNotificationProvider,
} from "./providers/resendEmailNotificationProvider.js";

/* ============================================================
   REGISTER PROVIDERS
============================================================ */

export function registerFinoraNotificationProviders():
  void {
  registerFinoraNotificationProvider(
    msg91SmsNotificationProvider,
  );

  registerFinoraNotificationProvider(
    msg91WhatsappNotificationProvider,
  );

  registerFinoraNotificationProvider(
    resendEmailNotificationProvider,
  );
}

/* ============================================================
   END
============================================================ */