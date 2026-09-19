// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH USB REPLACEMENT NATIVE TRANSPORT
// PHASE : 5.6M-1C1
// ============================================================
//
// Electron main owns native directory selection.
// Renderer does not provide a source or target filesystem path.
//
// ============================================================

import {
  dialog,
} from "electron";

import type {
  BrowserWindow,
} from "electron";

import type {
  FinoraUsbReplacementSelectionDependencies,
  FinoraUsbReplacementSelectionPurpose,
} from "./finoraPortableBranchAuthUsbReplacementSelectionAuthority.js";

// ============================================================
// CONTRACT
// ============================================================

export type FinoraUsbReplacementRootValidator =
  (
    root:
      string,
  ) =>
    Promise<boolean>;

// ============================================================
// NATIVE DEPENDENCIES
// ============================================================

export function createFinoraUsbReplacementNativeSelectionDependencies(
  parentWindow:
    BrowserWindow,
  validateUsbRoot:
    FinoraUsbReplacementRootValidator,
): FinoraUsbReplacementSelectionDependencies {
  return {
    selectDirectory:
      async (
        purpose:
          FinoraUsbReplacementSelectionPurpose,
      ) => {
        if (
          !parentWindow ||
          parentWindow.isDestroyed()
        ) {
          throw new Error(
            "FINORA parent window is unavailable for USB replacement.",
          );
        }

        const sourceSelection =
          purpose ===
            "SOURCE";

        const selection =
          await dialog.showOpenDialog(
            parentWindow,
            {
              title:
                sourceSelection
                  ? "Select Existing FINORA USB"
                  : "Select Replacement FINORA USB",

              buttonLabel:
                sourceSelection
                  ? "Select Existing USB"
                  : "Select Replacement USB",

              properties: [
                "openDirectory",
              ],
            },
          );

        if (
          selection.canceled ||
          selection.filePaths.length ===
            0
        ) {
          return null;
        }

        return (
          selection.filePaths[0] ??
          null
        );
      },

    validateUsbRoot,
  };
}