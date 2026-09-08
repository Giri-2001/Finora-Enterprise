/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST TRANSITION IMPORT FILE TRANSPORT

   MODULE  : Electron Control Plane
   LAYER   : Main-Process Native File Transport
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Open the native FINORA Recipient Trust Transition picker
   - Accept only .finora file-selection candidates
   - Enforce a bounded 4 MiB transport limit
   - Use one opened file handle for stat + read
   - Recheck the actual UTF-8 bytes read
   - Parse the selected file as JSON
   - Return the parsed signed-transition candidate to the
     authoritative recipient trust-transition apply boundary

   SECURITY:

   - MAIN PROCESS ONLY.
   - No IPC.
   - No renderer.
   - No renderer-provided filesystem path.
   - No caller-provided filesystem path.
   - No trusted signing keys.
   - No installation target input.
   - No recipient trust-store access.
   - No trust mutation.
   - No signing.
   - No private-key material.

   IMPORTANT:

   File extension and JSON parsing are transport checks only.

   They are NOT trust decisions.

   Signed-envelope validation, native installation targeting,
   cryptographic signer verification, replay protection and
   recipient trust mutation remain authoritative inside the
   recipient trust-transition apply service.
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

export const FINORA_RECIPIENT_TRUST_TRANSITION_FILE_EXTENSION =
  ".finora" as const;

export const FINORA_RECIPIENT_TRUST_TRANSITION_MAX_FILE_BYTES =
  4 * 1024 * 1024;

// ============================================================
// RESULT
// ============================================================

export type FinoraRecipientTrustTransitionImportFileResult =
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

      signedTransition:
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
): FinoraRecipientTrustTransitionImportFileResult {
  return {
    success:
      false,

    error,
  };
}

// ============================================================
// OPEN
// ============================================================

export async function openFinoraRecipientTrustTransitionFile(
  parentWindow:
    BrowserWindow,
): Promise<
  FinoraRecipientTrustTransitionImportFileResult
> {
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
          "Import FINORA Recipient Trust Transition",

        buttonLabel:
          "Import Trust Transition",

        filters: [
          {
            name:
              "FINORA Recipient Trust Transition",

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
      "FINORA Recipient Trust Transition import returned no selected file.",
    );
  }

  /*
   * Extension validation is only an early UX / transport check.
   *
   * It is NOT a trust decision. The parsed signed transition
   * must still pass the authoritative signed-envelope,
   * installation-target, cryptographic and replay checks in
   * the recipient trust-transition apply service.
   */
  if (
    extname(
      selectedFilePath,
    ).toLowerCase() !==
      FINORA_RECIPIENT_TRUST_TRANSITION_FILE_EXTENSION
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
        "Selected FINORA Recipient Trust Transition is not a regular file.",
      );
    }

    if (
      statistics.size <=
        0
    ) {
      return failure(
        "Selected FINORA Recipient Trust Transition is empty.",
      );
    }

    if (
      statistics.size >
        FINORA_RECIPIENT_TRUST_TRANSITION_MAX_FILE_BYTES
    ) {
      return failure(
        "Selected FINORA Recipient Trust Transition exceeds the 4 MiB import limit.",
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
     * Recheck actual bytes read so the transport limit remains
     * authoritative even if metadata changes while the already
     * opened file handle is being consumed.
     */
    if (
      bytesRead >
        FINORA_RECIPIENT_TRUST_TRANSITION_MAX_FILE_BYTES
    ) {
      return failure(
        "Selected FINORA Recipient Trust Transition exceeds the 4 MiB import limit.",
      );
    }

    let signedTransition:
      unknown;

    try {
      signedTransition =
        JSON.parse(
          raw,
        );
    } catch {
      return failure(
        "Selected FINORA Recipient Trust Transition is not valid JSON.",
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

      signedTransition,
    };
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to read the selected FINORA Recipient Trust Transition.",
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