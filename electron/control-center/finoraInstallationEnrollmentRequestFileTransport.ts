/* ===========================================================
   FINORA ENTERPRISE OS™

   INSTALLATION ENROLLMENT REQUEST FILE TRANSPORT

   MODULE  : Control Center
   LAYER   : Electron Main
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Let Control Center main process own native file selection
   - Accept only one .finora Enrollment Request file
   - Enforce a strict bounded file size before parsing
   - Decode strict UTF-8
   - Parse untrusted JSON
   - Verify the complete Enrollment Request cryptographically
   - Return only verified public enrollment data

   SECURITY:

   - CONTROL CENTER MAIN PROCESS ONLY.
   - No renderer-provided filepath.
   - No renderer-provided request bytes.
   - No private-key access.
   - No installation persistence.
   - No REGISTERED / DEMO authority.
   - No LOCAL / USB entitlement authority.
   - File selection does not imply approval.
=========================================================== */

import {
  readFile,
} from "node:fs/promises";

import {
  basename,
  extname,
} from "node:path";

import {
  TextDecoder,
} from "node:util";

import {
  dialog,
} from "electron";

import type {
  BrowserWindow,
} from "electron";

import {
  verifyFinoraInstallationEnrollmentRequestFile,
} from "./finoraInstallationEnrollmentRequestVerifier.js";

import type {
  FinoraVerifiedInstallationEnrollmentRequest,
} from "./finoraInstallationEnrollmentRequestVerifier.js";

// ============================================================
// CONSTANTS
// ============================================================

export const FINORA_INSTALLATION_ENROLLMENT_REQUEST_FILE_EXTENSION =
  ".finora" as const;

export const FINORA_INSTALLATION_ENROLLMENT_REQUEST_MAX_FILE_BYTES =
  64 * 1024;

// ============================================================
// RESULT
// ============================================================

export type FinoraInstallationEnrollmentRequestOpenResult =
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

      enrollment:
        FinoraVerifiedInstallationEnrollmentRequest;
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
): FinoraInstallationEnrollmentRequestOpenResult {

  return {
    success:
      false,

    error,
  };
}

// ============================================================
// OPEN + VERIFY
// ============================================================

export async function openVerifiedFinoraInstallationEnrollmentRequest(
  parentWindow:
    BrowserWindow,
): Promise<
  FinoraInstallationEnrollmentRequestOpenResult
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
            "Open FINORA Installation Enrollment Request",

          filters: [
            {
              name:
                "FINORA Installation Enrollment Request",

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
        "Exactly one FINORA Installation Enrollment Request file must be selected.",
      );
    }

    const filePath =
      selection.filePaths[0];

    if (
      extname(
        filePath,
      ).toLowerCase() !==
        FINORA_INSTALLATION_ENROLLMENT_REQUEST_FILE_EXTENSION
    ) {
      return failure(
        "FINORA Installation Enrollment Request must use the .finora file extension.",
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
        "FINORA Installation Enrollment Request file is empty.",
      );
    }

    if (
      bytes.byteLength >
        FINORA_INSTALLATION_ENROLLMENT_REQUEST_MAX_FILE_BYTES
    ) {
      return failure(
        "FINORA Installation Enrollment Request exceeds the supported file size limit.",
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
        "FINORA Installation Enrollment Request must contain valid UTF-8 JSON.",
      );
    }

    // --------------------------------------------------------
    // JSON PARSE
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
        "FINORA Installation Enrollment Request contains invalid JSON.",
      );
    }

    // --------------------------------------------------------
    // CRYPTOGRAPHIC VERIFICATION
    // --------------------------------------------------------

    const verification =
      verifyFinoraInstallationEnrollmentRequestFile(
        parsed,
      );

    if (!verification.success) {
      return failure(
        verification.error,
      );
    }

    // --------------------------------------------------------
    // VERIFIED RESULT
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

      enrollment:
        verification.data,
    };

  } catch (
    error
  ) {

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to open the FINORA Installation Enrollment Request.",
    );
  }
}

// ============================================================
// END
// ============================================================