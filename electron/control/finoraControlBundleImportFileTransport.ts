// ============================================================
// FINORA ENTERPRISE OS™
//
// ELECTRON CONTROL
// CONTROL BUNDLE IMPORT FILE TRANSPORT
//
// RESPONSIBILITY:
//
// - Open native FINORA .finora file picker
// - Read the selected file through one native file handle
// - Enforce the CONTROL_BUNDLE v1 maximum file size
// - Parse JSON
// - Return parsed content to a main-process caller
//
// SECURITY:
//
// - MAIN PROCESS ONLY.
// - No renderer-provided filepath.
// - No renderer filesystem authority.
// - No cryptographic trust decision.
// - No Control Store mutation.
// - No signing or private-key access.
// - File extension is UX filtering only, never proof of trust.
// - Cryptographic verification remains the apply service's job.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

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

export const FINORA_CONTROL_BUNDLE_FILE_EXTENSION =
  ".finora" as const;

export const FINORA_CONTROL_BUNDLE_MAX_FILE_BYTES =
  4 *
  1024 *
  1024;

// ============================================================
// RESULT
// ============================================================

export type FinoraControlBundleImportFileResult =
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

      signedBundle:
        unknown;
    }
  | {
      success:
        false;

      error:
        string;
    };

// ============================================================
// HELPERS
// ============================================================

function failure(
  error:
    string,
): FinoraControlBundleImportFileResult {

  return {
    success:
      false,

    error,
  };
}

// ============================================================
// IMPORT
// ============================================================

export async function openFinoraControlBundleFile(
  parentWindow:
    BrowserWindow,
): Promise<
  FinoraControlBundleImportFileResult
> {

  if (
    parentWindow.isDestroyed()
  ) {
    return failure(
      "FINORA parent window is unavailable for Control Bundle import.",
    );
  }

  // ----------------------------------------------------------
  // NATIVE FILE SELECTION
  //
  // Renderer never chooses or supplies a filesystem path.
  // ----------------------------------------------------------

  const dialogResult =
    await dialog.showOpenDialog(
      parentWindow,
      {
        title:
          "Import FINORA Control Bundle",

        buttonLabel:
          "Import Bundle",

        filters: [
          {
            name:
              "FINORA Control Bundle",

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

  if (!selectedFilePath) {
    return failure(
      "FINORA Control Bundle import returned no selected file.",
    );
  }

  /*
   * Extension validation is only an early UX/sanity check.
   * It is NOT a trust decision. The outer signed package must
   * still pass native cryptographic verification later.
   */
  if (
    extname(
      selectedFilePath,
    ).toLowerCase() !==
      FINORA_CONTROL_BUNDLE_FILE_EXTENSION
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
        "Selected FINORA Control Bundle is not a regular file.",
      );
    }

    if (
      statistics.size <=
        0
    ) {
      return failure(
        "Selected FINORA Control Bundle is empty.",
      );
    }

    if (
      statistics.size >
        FINORA_CONTROL_BUNDLE_MAX_FILE_BYTES
    ) {
      return failure(
        "Selected FINORA Control Bundle exceeds the 4 MiB import limit.",
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
     * Recheck the actual bytes read. This keeps the transport
     * limit authoritative even if file metadata changes while
     * the handle is open.
     */
    if (
      bytesRead >
        FINORA_CONTROL_BUNDLE_MAX_FILE_BYTES
    ) {
      return failure(
        "Selected FINORA Control Bundle exceeds the 4 MiB import limit.",
      );
    }

    let signedBundle:
      unknown;

    try {

      signedBundle =
        JSON.parse(
          raw,
        );

    } catch {

      return failure(
        "Selected FINORA Control Bundle is not valid JSON.",
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

      signedBundle,
    };

  } catch (error) {

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to read the selected FINORA Control Bundle.",
    );

  } finally {

    if (handle) {

      try {

        await handle.close();

      } catch {

        /*
         * Best-effort close only.
         *
         * A close failure must not replace the authoritative
         * import/read result already produced above.
         */
      }
    }
  }
}

// ============================================================
// END
// ============================================================