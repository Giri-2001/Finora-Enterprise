// ============================================================
// FINORA ENTERPRISE OS™
//
// RECIPIENT TRUST MAINTENANCE IPC
//
// MODULE  : Electron Control Plane
// LAYER   : Dedicated Privileged IPC
// VERSION : 1.0
// STATUS  : Production Foundation
//
// RESPONSIBILITY:
//
// - Register the dedicated Recipient Trust Maintenance import IPC
// - Accept only the exact dedicated maintenance main frame
// - Resolve the owning BrowserWindow inside Electron main
// - Delegate native import to the existing coordinator
//
// SECURITY:
//
// - Renderer arguments: zero.
// - Renderer cannot supply filesystem path.
// - Renderer cannot supply signed transition bytes.
// - Renderer cannot supply trusted signing keys.
// - Renderer cannot supply installation target.
// - Renderer cannot supply issuer/private-key material.
// - Renderer cannot supply replay sequence.
// - Renderer cannot supply trust-store state.
// - No bootstrap authority exposed.
// - No ordinary FINORA Control IPC exposure.
// - No Control Center recipient-trust mutation exposure.
// - No direct trust-store mutation.
// - No direct signed-transition apply implementation.
// ============================================================

import {
  BrowserWindow,
  ipcMain,
} from "electron";

import {
  isTrustedFinoraRecipientTrustMaintenanceRenderer,
} from "./finoraRecipientTrustMaintenanceWindow.js";

import {
  importFinoraRecipientTrustTransitionFromNativeDialog,
} from "./finoraRecipientTrustTransitionImportCoordinator.js";

import type {
  FinoraRecipientTrustTransitionImportResult,
} from "./finoraRecipientTrustTransitionImportCoordinator.js";

// ============================================================
// IPC CHANNEL
// ============================================================

export const FINORA_RECIPIENT_TRUST_MAINTENANCE_IPC_CHANNELS = {
  IMPORT_SIGNED_TRUST_TRANSITION:
    "finora:recipient-trust-maintenance:import-signed-trust-transition",
} as const;

// ============================================================
// FAILURE
// ============================================================

function failure(
  error:
    string,
): FinoraRecipientTrustTransitionImportResult {
  return {
    success:
      false,

    error,
  };
}

// ============================================================
// REGISTRATION STATE
// ============================================================

let recipientTrustMaintenanceHandlersRegistered =
  false;

// ============================================================
// REGISTER HANDLERS
// ============================================================

export function registerFinoraRecipientTrustMaintenanceHandlers():
  void {
  if (
    recipientTrustMaintenanceHandlersRegistered
  ) {
    return;
  }

  recipientTrustMaintenanceHandlersRegistered =
    true;

  // ----------------------------------------------------------
  // IMPORT SIGNED RECIPIENT TRUST TRANSITION
  //
  // File selection, file reading and authoritative signed
  // transition application remain downstream main-process work.
  // ----------------------------------------------------------

  ipcMain.handle(
    FINORA_RECIPIENT_TRUST_MAINTENANCE_IPC_CHANNELS
      .IMPORT_SIGNED_TRUST_TRANSITION,
    async (
      event,
    ) => {
      if (
        !isTrustedFinoraRecipientTrustMaintenanceRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "FINORA Recipient Trust Maintenance import is restricted to the dedicated privileged renderer.",
        );
      }

      const parentWindow =
        BrowserWindow.fromWebContents(
          event.sender,
        );

      if (
        !parentWindow ||
        parentWindow.isDestroyed()
      ) {
        return failure(
          "The FINORA Recipient Trust Maintenance window is not available for trust-transition import.",
        );
      }

      if (
        event.senderFrame !==
          parentWindow.webContents.mainFrame
      ) {
        return failure(
          "FINORA Recipient Trust Maintenance import is restricted to the dedicated maintenance main frame.",
        );
      }

      return importFinoraRecipientTrustTransitionFromNativeDialog(
        parentWindow,
      );
    },
  );
}

// ============================================================
// END
// ============================================================