/* ===========================================================
   FINORA ENTERPRISE OS™

   INSTALLATION ENROLLMENT RESPONSE FILE TRANSPORT

   MODULE  : Native Control
   LAYER   : Electron Main
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Let recipient Electron main own native file selection
   - Accept exactly one .finora Enrollment Response file
   - Enforce a strict bounded read before parsing
   - Decode strict UTF-8
   - Parse untrusted JSON
   - Delegate local provenance / native-binding /
     cryptographic verification to the main-process coordinator
   - Return only safe verified response metadata

   SECURITY:

   - ELECTRON MAIN PROCESS ONLY.
   - No renderer-provided filepath.
   - No renderer-provided file bytes.
   - Expected Control Center fingerprint is a separate
     operator/deployment-channel input, never read from the file.
   - No recipient trust bootstrap.
   - No installation persistence.
   - No pending-request clear.
   - No branch activation authority.
   - No storage entitlement authority.
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
  verifyFinoraInstallationEnrollmentResponseAgainstLocalAuthority,
} from "./finoraInstallationEnrollmentResponseVerificationCoordinator.js";

import type {
  FinoraVerifiedInstallationEnrollmentResponse,
} from "./finoraInstallationEnrollmentResponseVerifier.js";

// ============================================================
// CONSTANTS
// ============================================================

export const FINORA_INSTALLATION_ENROLLMENT_RESPONSE_FILE_EXTENSION =
  ".finora" as const;

export const FINORA_INSTALLATION_ENROLLMENT_RESPONSE_MAX_FILE_BYTES =
  64 * 1024;

// ============================================================
// RESULT
// ============================================================

export type FinoraInstallationEnrollmentResponseOpenResult =
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

      response:
        FinoraVerifiedInstallationEnrollmentResponse;
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
): FinoraInstallationEnrollmentResponseOpenResult {

  return {
    success:
      false,

    error,
  };
}

// ============================================================
// OPEN + VERIFY
// ============================================================

export async function openVerifiedFinoraInstallationEnrollmentResponse(
  parentWindow:
    BrowserWindow,

  expectedControlCenterPublicKeyFingerprint:
    string,
): Promise<
  FinoraInstallationEnrollmentResponseOpenResult
> {

  try {

    // --------------------------------------------------------
    // INDEPENDENT FINGERPRINT INPUT
    //
    // Fail before opening a file when the separately supplied
    // trust pin is not canonical.
    // --------------------------------------------------------

    if (
      !/^[0-9a-f]{64}$/.test(
        expectedControlCenterPublicKeyFingerprint,
      )
    ) {
      return failure(
        "FINORA Enrollment Response import requires the independently supplied lowercase 64-character Control Center SHA-256 fingerprint.",
      );
    }

    // --------------------------------------------------------
    // NATIVE FILE SELECTION
    // --------------------------------------------------------

    const selection =
      await dialog.showOpenDialog(
        parentWindow,
        {
          title:
            "Import FINORA Installation Enrollment Response",

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
        "Exactly one FINORA Installation Enrollment Response file must be selected.",
      );
    }

    const filePath =
      selection.filePaths[0];

    if (
      extname(
        filePath,
      ).toLowerCase() !==
        FINORA_INSTALLATION_ENROLLMENT_RESPONSE_FILE_EXTENSION
    ) {
      return failure(
        "FINORA Installation Enrollment Response must use the .finora file extension.",
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
        "FINORA Installation Enrollment Response file is empty.",
      );
    }

    if (
      bytes.byteLength >
        FINORA_INSTALLATION_ENROLLMENT_RESPONSE_MAX_FILE_BYTES
    ) {
      return failure(
        "FINORA Installation Enrollment Response exceeds the supported file size limit.",
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
        "FINORA Installation Enrollment Response must contain valid UTF-8 JSON.",
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
        "FINORA Installation Enrollment Response contains invalid JSON.",
      );
    }

    // --------------------------------------------------------
    // LOCAL + CRYPTOGRAPHIC VERIFICATION
    // --------------------------------------------------------

    const verification =
      await verifyFinoraInstallationEnrollmentResponseAgainstLocalAuthority(
        parsed,
        expectedControlCenterPublicKeyFingerprint,
      );

    if (!verification.success) {
      return failure(
        verification.error,
      );
    }

    // --------------------------------------------------------
    // SAFE VERIFIED RESULT
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

      response:
        verification.data,
    };

  } catch (
    error
  ) {

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to import the FINORA Installation Enrollment Response.",
    );
  }
}

// ============================================================
// END
// ============================================================