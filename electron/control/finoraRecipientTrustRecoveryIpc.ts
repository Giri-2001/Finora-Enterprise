// ============================================================
// FINORA ENTERPRISE OS™
//
// RECIPIENT TRUST EMERGENCY RECOVERY IPC
//
// MODULE  : Electron Control Plane
// LAYER   : Dedicated Break-Glass Privileged IPC
// VERSION : 1.0
// STATUS  : Production Foundation
//
// RESPONSIBILITY:
//
// - Register the dedicated Recipient Trust Recovery import IPC
// - Accept only the exact dedicated Recovery main frame
// - Resolve the owning BrowserWindow inside Electron main
// - Delegate native import to the Recovery import coordinator
//
// SECURITY:
//
// - Renderer arguments: zero.
// - Renderer cannot supply filesystem path.
// - Renderer cannot supply signed Recovery bytes.
// - Renderer cannot supply trusted operational signing keys.
// - Renderer cannot supply Recovery Authority state.
// - Renderer cannot supply installation target.
// - Renderer cannot supply issuer/private-key material.
// - Renderer cannot supply replay sequence.
// - Renderer cannot supply recipient trust-store state.
// - No bootstrap authority exposed.
// - No ordinary FINORA Control IPC exposure.
// - No Control Center recipient-trust recovery exposure.
// - No Recipient Trust Maintenance authority reuse.
// - No direct recipient trust-store mutation.
// - No direct Recovery Authority store mutation.
// - No direct signed-Recovery apply implementation.
// ============================================================

import {
  BrowserWindow,
  ipcMain,
} from "electron";

import {
  isTrustedFinoraRecipientTrustRecoveryRenderer,
} from "./finoraRecipientTrustRecoveryWindow.js";

import {
  importFinoraRecipientTrustRecoveryFromNativeDialog,
} from "./finoraRecipientTrustRecoveryImportCoordinator.js";

import type {
  FinoraRecipientTrustRecoveryImportResult,
} from "./finoraRecipientTrustRecoveryImportCoordinator.js";

// ============================================================
// IPC CHANNEL
// ============================================================

export const FINORA_RECIPIENT_TRUST_RECOVERY_IPC_CHANNELS = {
  IMPORT_SIGNED_RECOVERY:
    "finora:recipient-trust-recovery:import-signed-recovery",
} as const;

// ============================================================
// FAILURE
// ============================================================

function failure(
  error:
    string,
): FinoraRecipientTrustRecoveryImportResult {
  return {
    success:
      false,

    error,
  };
}

// ============================================================
// REGISTRATION STATE
// ============================================================

let recipientTrustRecoveryHandlersRegistered =
  false;

// ============================================================
// REGISTER HANDLERS
// ============================================================

export function registerFinoraRecipientTrustRecoveryHandlers():
  void {
  if (
    recipientTrustRecoveryHandlersRegistered
  ) {
    return;
  }

  recipientTrustRecoveryHandlersRegistered =
    true;

  // ----------------------------------------------------------
  // IMPORT SIGNED RECIPIENT TRUST RECOVERY
  //
  // Native file selection, bounded read, authoritative clock
  // observation and signed Recovery application remain
  // downstream main-process work.
  // ----------------------------------------------------------

  ipcMain.handle(
    FINORA_RECIPIENT_TRUST_RECOVERY_IPC_CHANNELS
      .IMPORT_SIGNED_RECOVERY,
    async (
      event,
    ) => {
      // ------------------------------------------------------
      // DEDICATED RECOVERY RENDERER IDENTITY
      // ------------------------------------------------------

      if (
        !isTrustedFinoraRecipientTrustRecoveryRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "FINORA Recipient Trust Recovery import is restricted to the dedicated break-glass renderer.",
        );
      }

      // ------------------------------------------------------
      // OWNED BROWSERWINDOW
      // ------------------------------------------------------

      const parentWindow =
        BrowserWindow.fromWebContents(
          event.sender,
        );

      if (
        !parentWindow ||
        parentWindow.isDestroyed()
      ) {
        return failure(
          "The FINORA Recipient Trust Recovery window is not available for emergency Recovery import.",
        );
      }

      // ------------------------------------------------------
      // EXACT OWNING MAIN FRAME
      //
      // The dedicated Recovery-window predicate above binds the
      // sender to the privileged window. This second guard also
      // requires the event to originate from that BrowserWindow's
      // exact owning main frame rather than a child frame.
      // ------------------------------------------------------

      if (
        event.senderFrame !==
          parentWindow.webContents.mainFrame
      ) {
        return failure(
          "FINORA Recipient Trust Recovery import is restricted to the dedicated Recovery main frame.",
        );
      }

      // ------------------------------------------------------
      // AUTHORITATIVE NATIVE RECOVERY IMPORT
      // ------------------------------------------------------

      return importFinoraRecipientTrustRecoveryFromNativeDialog(
        parentWindow,
      );
    },
  );
}

// ============================================================
// END
// ============================================================