// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// NOTIFICATION ARTIFACT IPC
//
// RESPONSIBILITY:
//
// - Expose a narrow trusted-renderer save boundary for durable
//   FINORA Notification artifacts.
// - Keep physical filesystem roots inside Electron main.
// - Keep provider-side artifact reads inside the privileged
//   main-process boundary.
// - Reject untrusted renderer requests.
//
// IMPORTANT:
//
// - MAIN PROCESS ONLY.
// - No React.
// - No provider credentials.
// - No arbitrary filesystem path input.
// - Renderer receives SAVE only.
// - Artifact READ remains privileged and is not exposed here.
// - Artifact DELETE remains privileged and is not exposed here.
// - No cloud storage.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  ipcMain,
} from "electron";

import type {
  FinoraNotificationArtifactSaveRequest,
} from "./finoraNotificationArtifact.types.js";

import type {
  FinoraNotificationArtifactStore,
} from "./finoraNotificationArtifactStore.js";

/* ============================================================
   IPC CHANNELS
============================================================ */

export const FINORA_NOTIFICATION_ARTIFACT_IPC_CHANNELS = {
  SAVE:
    "finora:notification-artifacts:save",
} as const;

/* ============================================================
   TRUSTED RENDERER VALIDATOR
============================================================ */

export type FinoraNotificationArtifactRendererValidator =
  (
    senderFrame:
      Electron.WebFrameMain | null,
  ) => boolean;

/* ============================================================
   REGISTRATION GUARD
============================================================ */

let notificationArtifactHandlersRegistered =
  false;

/* ============================================================
   REGISTER HANDLERS
============================================================ */

export function registerFinoraNotificationArtifactHandlers(
  isTrustedRenderer:
    FinoraNotificationArtifactRendererValidator,

  artifactStore:
    FinoraNotificationArtifactStore,
): void {
  if (
    notificationArtifactHandlersRegistered
  ) {
    return;
  }

  notificationArtifactHandlersRegistered =
    true;

  /* ----------------------------------------------------------
     SAVE

     Renderer supplies:
     - deterministic artifact identity
     - FINORA storage mode
     - FINORA scope
     - PNG Base64 payload

     Renderer does NOT supply:
     - filesystem root
     - directory path
     - arbitrary file path
  ---------------------------------------------------------- */

  ipcMain.handle(
    FINORA_NOTIFICATION_ARTIFACT_IPC_CHANNELS.SAVE,

    async (
      event,
      request:
        unknown,
    ) => {
      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return {
          success: false as const,

          error:
            "Untrusted renderer.",
        };
      }

      /*
       * Runtime validation remains authoritative inside
       * FinoraNotificationArtifactStore.save().
       *
       * IPC data is treated as unknown until that privileged
       * validation boundary accepts it.
       */

      return artifactStore.save(
        request as
          FinoraNotificationArtifactSaveRequest,
      );
    },
  );
}

/* ============================================================
   END
============================================================ */