/*
============================================================
FINORA ENTERPRISE
FRESH-DEVICE RUNTIME AUTHORITY SEED IPC
============================================================

SECURITY BOUNDARY

- Renderer supplies only sessionId + Password + Security Code.
- Renderer does not control branch scope.
- Renderer does not control storage mode.
- Renderer does not control filesystem roots.
- Renderer does not provide Branch Certification key material.
- Only trusted Electron main-frame callers are accepted.
============================================================
*/

import {
  ipcMain,
} from "electron";

import type {
  WebFrameMain,
} from "electron";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import type {
  FinoraPortableFreshDeviceRuntimeAuthorityStore,
} from "./finoraPortableFreshDeviceRuntimeAuthorityStore.js";

import {
  seedFinoraPortableFreshDeviceRuntimeAuthorityFromAuthenticatedSession,
} from "./finoraPortableFreshDeviceRuntimeAuthoritySeedService.js";

import type {
  FinoraPortableFreshDeviceRuntimeAuthoritySeedRequest,
} from "./finoraPortableFreshDeviceRuntimeAuthoritySeedCoordinator.js";

export const FINORA_FRESH_DEVICE_RUNTIME_AUTHORITY_SEED_CHANNEL =
  "finora:fresh-device-runtime-authority:seed" as const;

export type FinoraFreshDeviceRuntimeAuthoritySeedRendererTrust =
  (
    senderFrame:
      WebFrameMain |
      null,
  ) =>
    boolean;

let handlersRegistered =
  false;

export function registerFinoraPortableFreshDeviceRuntimeAuthoritySeedHandlers(
  isTrustedRenderer:
    FinoraFreshDeviceRuntimeAuthoritySeedRendererTrust,

  portableBranchAuthStore:
    FinoraPortableBranchAuthStore,

  runtimeAuthorityStore:
    FinoraPortableFreshDeviceRuntimeAuthorityStore,
): void {
  if (handlersRegistered) {
    return;
  }

  ipcMain.handle(
    FINORA_FRESH_DEVICE_RUNTIME_AUTHORITY_SEED_CHANNEL,

    async (
      event,
      input:
        unknown,
    ) => {
      const senderFrame =
        event.senderFrame;

      if (
        senderFrame ===
          null ||
        senderFrame !==
          event.sender.mainFrame ||
        !isTrustedRenderer(
          senderFrame,
        )
      ) {
        return {
          success:
            false as const,

          errorCode:
            "UNAUTHORIZED",

          error:
            "FINORA rejected an unauthorized fresh-device runtime-authority seed request.",
        };
      }

      return seedFinoraPortableFreshDeviceRuntimeAuthorityFromAuthenticatedSession(
        input as
          FinoraPortableFreshDeviceRuntimeAuthoritySeedRequest,
        portableBranchAuthStore,
        runtimeAuthorityStore,
      );
    },
  );

  handlersRegistered =
    true;
}