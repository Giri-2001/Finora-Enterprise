// ============================================================
// FINORA ENTERPRISE OS™
//
// RECIPIENT TRUST EMERGENCY RECOVERY
// DEDICATED BREAK-GLASS PRELOAD
//
// MODULE  : Electron Control Plane
// LAYER   : Dedicated Break-Glass Privileged Preload
// VERSION : 1.0
// STATUS  : Production Foundation
//
// RESPONSIBILITY:
//
// - Expose the narrow Recipient Trust Recovery renderer bridge
// - Invoke only the dedicated signed Recovery import IPC
// - Keep emergency recipient-trust recovery isolated from:
//   * ordinary FINORA application renderer
//   * FINORA Control Center issuer renderer
//   * ordinary Recipient Trust Maintenance renderer
//
// SECURITY:
//
// - Dedicated Recipient Trust Recovery BrowserWindow preload only.
// - One zero-argument import action.
// - No filesystem path input.
// - No signed package bytes input.
// - No trusted operational signing keys input.
// - No recovery authority input.
// - No installation target input.
// - No issuer/private-key input.
// - No replay sequence input.
// - No trust-store state input.
// - No bootstrap authority.
// - No ordinary window.finora.control reuse.
// - No Control Center signing bridge reuse.
// - No Recipient Trust Maintenance bridge reuse.
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

const RECIPIENT_TRUST_RECOVERY_CHANNELS = {
  IMPORT_SIGNED_RECOVERY:
    "finora:recipient-trust-recovery:import-signed-recovery",
} as const;

// ============================================================
// IMPORT RESULT
// ============================================================

export type FinoraRecipientTrustRecoveryBridgeImportResult =
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
        Readonly<
          Record<
            string,
            unknown
          >
        >;
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

export interface FinoraRecipientTrustRecoveryBridge {
  importSignedRecovery:
    () =>
      Promise<
        FinoraRecipientTrustRecoveryBridgeImportResult
      >;
}

// ============================================================
// BRIDGE
// ============================================================

const recipientTrustRecoveryBridge:
  FinoraRecipientTrustRecoveryBridge = {
    importSignedRecovery:
      () =>
        ipcRenderer.invoke(
          RECIPIENT_TRUST_RECOVERY_CHANNELS
            .IMPORT_SIGNED_RECOVERY,
        ) as Promise<
          FinoraRecipientTrustRecoveryBridgeImportResult
        >,
  };

// ============================================================
// EXPOSE
// ============================================================

contextBridge.exposeInMainWorld(
  "finoraRecipientTrustRecovery",
  recipientTrustRecoveryBridge,
);

// ============================================================
// END
// ============================================================