/* ============================================================
   FINORA ENTERPRISE OS

   CONTROL CENTER

   HISTORICAL INSTALLATION ENROLLMENT RESPONSE FILE TRANSPORT

   RESPONSIBILITY:

   - Let Control Center main process own native file selection
   - Accept exactly one .finora historical Enrollment Response file
   - Enforce a bounded file size before parsing
   - Decode strict UTF-8
   - Parse JSON as untrusted data
   - Return file metadata plus the untrusted parsed value

   SECURITY:

   - CONTROL CENTER MAIN PROCESS ONLY
   - No renderer-provided filepath
   - No renderer-provided file bytes
   - No cryptographic verification
   - No Control Center key-vault access
   - No recipient native-binding authority
   - No Branch Registry access or mutation
   - No trust-on-first-use
   - Successful file parsing does NOT authenticate the Response
   - Historical authentication remains owned by the dedicated
     historical Enrollment Response authority
============================================================ */

import {
  dialog,
} from "electron";

import type {
  BrowserWindow,
} from "electron";

import {
  readFile,
} from "node:fs/promises";

import {
  basename,
  extname,
} from "node:path";

// ============================================================
// CONSTANTS
// ============================================================

export const FINORA_HISTORICAL_INSTALLATION_ENROLLMENT_RESPONSE_FILE_EXTENSION =
  ".finora" as const;

export const FINORA_HISTORICAL_INSTALLATION_ENROLLMENT_RESPONSE_MAX_FILE_BYTES =
  64 * 1024;

// ============================================================
// RESULT
// ============================================================

export type FinoraHistoricalInstallationEnrollmentResponseOpenResult =
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

      value:
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
): FinoraHistoricalInstallationEnrollmentResponseOpenResult {

  return {
    success:
      false,

    error,
  };
}

// ============================================================
// OPEN + PARSE UNTRUSTED HISTORICAL RESPONSE
// ============================================================

export async function openFinoraHistoricalInstallationEnrollmentResponseFile(
  parentWindow:
    BrowserWindow,
): Promise<
  FinoraHistoricalInstallationEnrollmentResponseOpenResult
> {

  try {

    // --------------------------------------------------------
    // NATIVE FILE SELECTION
    // --------------------------------------------------------

    const selection =
      await dialog.showOpenDialog(
        parentWindow,
        {
          title:
            "Import Historical FINORA Installation Enrollment Response",

          filters: [
            {
              name:
                "FINORA Installation Enrollment Response",

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
      selection.canceled ||
      selection.filePaths.length ===
        0
    ) {
      return {
        success:
          true,

        cancelled:
          true,
      };
    }

    if (
      selection.filePaths.length !==
        1
    ) {
      return failure(
        "FINORA historical Installation Enrollment Response import requires exactly one file.",
      );
    }

    const filePath =
      selection.filePaths[0];

    // --------------------------------------------------------
    // EXTENSION
    // --------------------------------------------------------

    if (
      extname(
        filePath,
      ).toLowerCase() !==
        FINORA_HISTORICAL_INSTALLATION_ENROLLMENT_RESPONSE_FILE_EXTENSION
    ) {
      return failure(
        "FINORA historical Installation Enrollment Response must use the .finora file extension.",
      );
    }

    // --------------------------------------------------------
    // BOUNDED READ
    // --------------------------------------------------------

    const bytes =
      await readFile(
        filePath,
      );

    if (
      bytes.byteLength <=
        0
    ) {
      return failure(
        "FINORA historical Installation Enrollment Response file is empty.",
      );
    }

    if (
      bytes.byteLength >
        FINORA_HISTORICAL_INSTALLATION_ENROLLMENT_RESPONSE_MAX_FILE_BYTES
    ) {
      return failure(
        "FINORA historical Installation Enrollment Response exceeds the supported file size limit.",
      );
    }

    // --------------------------------------------------------
    // STRICT UTF-8
    // --------------------------------------------------------

    let serialized:
      string;

    try {

      const decoder =
        new TextDecoder(
          "utf-8",
          {
            fatal:
              true,
          },
        );

      serialized =
        decoder.decode(
          bytes,
        );

    } catch {

      return failure(
        "FINORA historical Installation Enrollment Response must contain valid UTF-8 JSON.",
      );
    }

    // --------------------------------------------------------
    // UNTRUSTED JSON
    // --------------------------------------------------------

    let parsed:
      unknown;

    try {

      parsed =
        JSON.parse(
          serialized,
        );

    } catch {

      return failure(
        "FINORA historical Installation Enrollment Response contains invalid JSON.",
      );
    }

    // --------------------------------------------------------
    // UNTRUSTED RESULT
    //
    // No authentication occurs here.
    // --------------------------------------------------------

    return {
      success:
        true,

      cancelled:
        false,

      fileName:
        basename(
          filePath,
        ),

      bytesRead:
        bytes.byteLength,

      value:
        parsed,
    };

  } catch (
    error
  ) {

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to open the FINORA historical Installation Enrollment Response.",
    );
  }
}

// ============================================================
// END
// ============================================================