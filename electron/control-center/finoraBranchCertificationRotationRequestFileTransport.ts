import {
  basename,
  extname,
} from "node:path";

import {
  readFile,
} from "node:fs/promises";

import {
  dialog,
  type BrowserWindow,
} from "electron";

import {
  FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_FILE_EXTENSION,
  FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_MAX_FILE_BYTES,
} from "../control/finoraBranchCertificationRotationRequestFileTransport.js";

import {
  verifyFinoraBranchCertificationRotationSignedRequest,
  type FinoraVerifiedBranchCertificationRotationRequest,
} from "./finoraBranchCertificationRotationRequestVerifier.js";

// ============================================================
// RESULT CONTRACT
// ============================================================

export type FinoraBranchCertificationRotationRequestOpenResult =
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

      verifiedRequest:
        FinoraVerifiedBranchCertificationRotationRequest;
    }
  | {
      success:
        false;

      error:
        string;
    };

function failure(
  error:
    string,
): FinoraBranchCertificationRotationRequestOpenResult {

  return {
    success:
      false,

    error,
  };
}

// ============================================================
// STRICT SERIALIZED VERIFY
// ============================================================

export async function parseAndVerifyFinoraBranchCertificationRotationRequest(
  serialized:
    string,
): Promise<
  FinoraVerifiedBranchCertificationRotationRequest
> {

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        serialized,
      );
  }
  catch {
    throw new Error(
      "FINORA Branch Certification Rotation request file is not valid JSON.",
    );
  }

  return await verifyFinoraBranchCertificationRotationSignedRequest(
    parsed,
  );
}

// ============================================================
// OPEN + VERIFY
// ============================================================

export async function openVerifiedFinoraBranchCertificationRotationRequest(
  parentWindow:
    BrowserWindow,
): Promise<
  FinoraBranchCertificationRotationRequestOpenResult
> {

  if (
    !parentWindow ||
    parentWindow.isDestroyed()
  ) {
    return failure(
      "The FINORA Control Center window is unavailable for Branch Certification Rotation request selection.",
    );
  }

  try {
    const selection =
      await dialog.showOpenDialog(
        parentWindow,
        {
          title:
            "Open FINORA Branch Certification Rotation Request",

          filters: [
            {
              name:
                "FINORA Branch Certification Rotation Request",

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
        "Exactly one FINORA Branch Certification Rotation Request file must be selected.",
      );
    }

    const filePath =
      selection.filePaths[0];

    if (
      extname(
        filePath,
      ).toLowerCase() !==
        FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_FILE_EXTENSION
    ) {
      return failure(
        "FINORA Branch Certification Rotation Request must use the .finora file extension.",
      );
    }

    const bytes =
      await readFile(
        filePath,
      );

    if (
      bytes.byteLength <=
        0
    ) {
      return failure(
        "FINORA Branch Certification Rotation Request file is empty.",
      );
    }

    if (
      bytes.byteLength >
        FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_MAX_FILE_BYTES
    ) {
      return failure(
        "FINORA Branch Certification Rotation Request exceeds the supported file size limit.",
      );
    }

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
    }
    catch {
      return failure(
        "FINORA Branch Certification Rotation Request is not valid UTF-8.",
      );
    }

    const verifiedRequest =
      await parseAndVerifyFinoraBranchCertificationRotationRequest(
        serialized,
      );

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

      verifiedRequest,
    };
  }
  catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to open and verify FINORA Branch Certification Rotation Request.",
    );
  }
}