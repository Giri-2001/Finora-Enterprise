/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST EMERGENCY RECOVERY IMPORT FILE TRANSPORT

   MODULE  : Electron Control Plane
   LAYER   : Main-Process Native File Transport
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Open the dedicated native FINORA Recipient Trust Recovery
     picker
   - Accept only .finora file-selection candidates
   - Enforce a bounded 4 MiB transport limit
   - Use one opened file handle for stat + read
   - Recheck the actual UTF-8 bytes read
   - Parse selected content as JSON
   - Return the parsed signed-recovery candidate to the
     authoritative emergency recovery import coordinator

   SECURITY:

   - Electron main process only.
   - No renderer-provided filepath.
   - No renderer-provided package bytes.
   - No renderer-provided trusted keys.
   - No renderer-provided installation target.
   - No recovery authority creation.
   - No cryptographic trust decision.
   - No recipient trust mutation.
   - No recovery-root mutation.
   - Extension validation is transport/UX only.
=========================================================== */

import {
  dialog,
} from "electron";

import type {
  BrowserWindow,
} from "electron";

import {
  open,
} from "node:fs/promises";

import {
  basename,
  extname,
} from "node:path";

// ============================================================
// CONSTANTS
// ============================================================

export const FINORA_RECIPIENT_TRUST_RECOVERY_FILE_EXTENSION =
  ".finora" as const;

export const FINORA_RECIPIENT_TRUST_RECOVERY_MAX_FILE_BYTES =
  4 * 1024 * 1024;

// ============================================================
// RESULT
// ============================================================

export type FinoraRecipientTrustRecoveryImportFileResult =
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

      signedRecovery:
        unknown;
    }
  | {
      success:
        false;

      error:
        string;
    };

// ============================================================
// FAILURE
// ============================================================

function failure(
  error:
    string,
): FinoraRecipientTrustRecoveryImportFileResult {
  return {
    success:
      false,

    error,
  };
}

// ============================================================
// OPEN
// ============================================================

export async function openFinoraRecipientTrustRecoveryFile(
  parentWindow:
    BrowserWindow,
): Promise<
  FinoraRecipientTrustRecoveryImportFileResult
> {
  // ----------------------------------------------------------
  // PARENT WINDOW
  // ----------------------------------------------------------

  if (
    parentWindow.isDestroyed()
  ) {
    return failure(
      "FINORA parent window is unavailable for Recipient Trust Recovery import.",
    );
  }

  // ----------------------------------------------------------
  // NATIVE FILE SELECTION
  //
  // No filesystem path crosses a renderer or IPC boundary.
  // ----------------------------------------------------------

  const dialogResult =
    await dialog.showOpenDialog(
      parentWindow,
      {
        title:
          "Import FINORA Recipient Trust Recovery",

        buttonLabel:
          "Import Recovery",

        filters: [
          {
            name:
              "FINORA Recipient Trust Recovery",

            extensions: [
              "finora",
            ],
          },
        ],

        properties: [
          "openFile",
        ],
      },
    );

  if (
    dialogResult.canceled ||
    dialogResult.filePaths.length ===
      0
  ) {
    return {
      success:
        true,

      cancelled:
        true,
    };
  }

  const selectedFilePath =
    dialogResult.filePaths[0];

  if (
    !selectedFilePath
  ) {
    return failure(
      "FINORA Recipient Trust Recovery import returned no selected file.",
    );
  }

  /*
   * Extension validation is only an early transport / UX check.
   *
   * It is NOT a trust decision. The parsed signed recovery must
   * still pass recovery-root, native-target, temporal, signature,
   * operational-current-key, replay and sequence authorization in
   * the authoritative recovery apply chain.
   */
  if (
    extname(
      selectedFilePath,
    ).toLowerCase() !==
      FINORA_RECIPIENT_TRUST_RECOVERY_FILE_EXTENSION
  ) {
    return failure(
      "Selected file must use the .finora extension.",
    );
  }

  // ----------------------------------------------------------
  // SINGLE-HANDLE BOUNDED READ
  //
  // Stat and read use the same opened file handle, reducing
  // pathname replacement exposure between size check and read.
  // ----------------------------------------------------------

  let handle:
    Awaited<
      ReturnType<
        typeof open
      >
    > |
    undefined;

  try {
    handle =
      await open(
        selectedFilePath,
        "r",
      );

    const statistics =
      await handle.stat();

    if (
      !statistics.isFile()
    ) {
      return failure(
        "Selected FINORA Recipient Trust Recovery is not a regular file.",
      );
    }

    if (
      statistics.size <=
        0
    ) {
      return failure(
        "Selected FINORA Recipient Trust Recovery is empty.",
      );
    }

    if (
      statistics.size >
        FINORA_RECIPIENT_TRUST_RECOVERY_MAX_FILE_BYTES
    ) {
      return failure(
        "Selected FINORA Recipient Trust Recovery exceeds the 4 MiB import limit.",
      );
    }

    const raw =
      await handle.readFile({
        encoding:
          "utf8",
      });

    const bytesRead =
      Buffer.byteLength(
        raw,
        "utf8",
      );

    /*
     * Recheck actual bytes consumed so the transport limit remains
     * authoritative even if metadata changes while the already
     * opened file handle is being consumed.
     */
    if (
      bytesRead >
        FINORA_RECIPIENT_TRUST_RECOVERY_MAX_FILE_BYTES
    ) {
      return failure(
        "Selected FINORA Recipient Trust Recovery exceeds the 4 MiB import limit.",
      );
    }

    let signedRecovery:
      unknown;

    try {
      signedRecovery =
        JSON.parse(
          raw,
        );
    } catch {
      return failure(
        "Selected FINORA Recipient Trust Recovery is not valid JSON.",
      );
    }

    return {
      success:
        true,

      cancelled:
        false,

      fileName:
        basename(
          selectedFilePath,
        ),

      bytesRead,

      signedRecovery,
    };
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to read the selected FINORA Recipient Trust Recovery.",
    );
  } finally {
    if (
      handle
    ) {
      try {
        await handle.close();
      } catch {
        // Read result already decided. No secondary close failure
        // overrides the primary transport result.
      }
    }
  }
}

// ============================================================
// END
// ============================================================