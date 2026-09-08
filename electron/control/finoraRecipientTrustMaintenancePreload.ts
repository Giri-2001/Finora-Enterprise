// ============================================================
// FINORA ENTERPRISE OS™
//
// RECIPIENT TRUST MAINTENANCE
// DEDICATED PRIVILEGED PRELOAD
//
// MODULE  : Electron Control Plane
// LAYER   : Dedicated Privileged Preload
// VERSION : 1.0
// STATUS  : Production Foundation
//
// RESPONSIBILITY:
//
// - Expose the narrow Recipient Trust Maintenance renderer bridge
// - Invoke only the dedicated signed trust-transition import IPC
// - Keep recipient trust-root mutation isolated from:
//   * ordinary FINORA application renderer
//   * FINORA Control Center issuer renderer
//
// SECURITY:
//
// - Dedicated Recipient Trust Maintenance BrowserWindow preload only.
// - One zero-argument import action.
// - No filesystem path input.
// - No signed package bytes input.
// - No trusted signing keys input.
// - No installation target input.
// - No issuer/private-key input.
// - No replay sequence input.
// - No trust-store state input.
// - No bootstrap authority.
// - No ordinary window.finora.control reuse.
// - No Control Center signing bridge reuse.
// ============================================================

import {
  contextBridge,
  ipcRenderer,
} from "electron";

// ============================================================
// IPC CHANNEL
//
// Duplicated intentionally instead of importing main-process
// IPC handler code into the preload boundary.
// ============================================================

const RECIPIENT_TRUST_MAINTENANCE_CHANNELS = {
  IMPORT_SIGNED_TRUST_TRANSITION:
    "finora:recipient-trust-maintenance:import-signed-trust-transition",
} as const;

// ============================================================
// IMPORT RESULT
// ============================================================

export type FinoraRecipientTrustMaintenanceImportResult =
  | {
      success:
        true;

      cancelled:
        true;
    }
  | {
      success:
        true;

      cancelled:
        false;

      fileName:
        string;

      bytesRead:
        number;

      applySummary:
        Readonly<Record<string, unknown>>;
    }
  | {
      success:
        false;

      error:
        string;
    };

// ============================================================
// BRIDGE CONTRACT
// ============================================================

export interface FinoraRecipientTrustMaintenanceBridge {
  importSignedTrustTransition:
    () =>
      Promise<
        FinoraRecipientTrustMaintenanceImportResult
      >;
}

// ============================================================
// BRIDGE
// ============================================================

const recipientTrustMaintenanceBridge:
  FinoraRecipientTrustMaintenanceBridge = {
    importSignedTrustTransition:
      () =>
        ipcRenderer.invoke(
          RECIPIENT_TRUST_MAINTENANCE_CHANNELS
            .IMPORT_SIGNED_TRUST_TRANSITION,
        ) as Promise<
          FinoraRecipientTrustMaintenanceImportResult
        >,
  };

// ============================================================
// EXPOSE
// ============================================================

contextBridge.exposeInMainWorld(
  "finoraRecipientTrustMaintenance",
  recipientTrustMaintenanceBridge,
);

// ============================================================
// END
// ============================================================