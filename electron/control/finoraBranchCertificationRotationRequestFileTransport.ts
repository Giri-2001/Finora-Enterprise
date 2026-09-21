import {
  dialog,
} from "electron";

import type {
  BrowserWindow,
} from "electron";

import {
  basename,
} from "node:path";

import {
  writeFile,
} from "node:fs/promises";

import {
  loadFinoraBranchCertificationRotationPending,
} from "./finoraBranchCertificationRotationPendingStore.js";

import {
  createFinoraBranchCertificationRotationRequestFile,
} from "./finoraBranchCertificationRotationRequest.js";

import {
  createFinoraBranchCertificationRotationSignedRequest,
} from "./finoraBranchCertificationRotationSignedRequest.js";

// ============================================================
// FILE CONTRACT
// ============================================================

export const FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_FILE_EXTENSION =
  ".finora" as const;

export const FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_MAX_FILE_BYTES =
  128 * 1024;

export type FinoraBranchCertificationRotationRequestExportResult =
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

      bytesWritten:
        number;

      requestId:
        string;

      branchId:
        string;

      replacementCertificationKeyId:
        string;
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
): FinoraBranchCertificationRotationRequestExportResult {

  return {
    success:
      false,

    error,
  };
}

function safeFileToken(
  value:
    string,
): string {

  return value
    .replace(
      /[^A-Za-z0-9_-]/g,
      "-",
    )
    .slice(
      0,
      80,
    );
}

function createDefaultFileName(
  branchId:
    string,

  requestId:
    string,
): string {

  return (
    "FINORA-BRANCH-CERTIFICATION-ROTATION-" +
    safeFileToken(
      branchId,
    ) +
    "-" +
    safeFileToken(
      requestId,
    ) +
    FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_FILE_EXTENSION
  );
}

function ensureFinoraExtension(
  filePath:
    string,
): string {

  return filePath
    .toLowerCase()
    .endsWith(
      FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_FILE_EXTENSION,
    )
    ? filePath
    : (
        filePath +
        FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_FILE_EXTENSION
      );
}

// ============================================================
// EXPORT
// ============================================================

export async function exportFinoraBranchCertificationRotationRequest(
  parentWindow:
    BrowserWindow,
): Promise<
  FinoraBranchCertificationRotationRequestExportResult
> {

  try {
    const pending =
      await loadFinoraBranchCertificationRotationPending();

    if (
      pending ===
        undefined
    ) {
      return failure(
        "FINORA Branch Certification Rotation has no pending protected custody to export.",
      );
    }

    const requestFile =
      createFinoraBranchCertificationRotationRequestFile(
        pending,
      );

    const signedRequest =
      await createFinoraBranchCertificationRotationSignedRequest(
        requestFile,
      );

    const serialized =
      JSON.stringify(
        signedRequest,
        null,
        2,
      );

    const bytesWritten =
      Buffer.byteLength(
        serialized,
        "utf8",
      );

    if (
      bytesWritten <=
        0 ||
      bytesWritten >
        FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_MAX_FILE_BYTES
    ) {
      return failure(
        "FINORA Branch Certification Rotation request exceeds the supported file size limit.",
      );
    }

    /*
     * Private replacement key must never cross the export boundary.
     */
    if (
      serialized.includes(
        pending.replacementCertificationKeyMaterial.privateKey,
      ) ||
      serialized.includes(
        '"privateKey"',
      ) ||
      serialized.includes(
        "replacementCertificationKeyMaterial",
      )
    ) {
      return failure(
        "FINORA Branch Certification Rotation request attempted to expose private certification material.",
      );
    }

    const saveResult =
      await dialog.showSaveDialog(
        parentWindow,
        {
          title:
            "Export FINORA Branch Certification Rotation Request",

          defaultPath:
            createDefaultFileName(
              pending.branchId,
              pending.requestId,
            ),

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
            "createDirectory",
            "showOverwriteConfirmation",
          ],
        },
      );

    if (
      saveResult.canceled ||
      !saveResult.filePath
    ) {
      return {
        success:
          true,

        cancelled:
          true,
      };
    }

    const destination =
      ensureFinoraExtension(
        saveResult.filePath,
      );

    /*
     * Export failure leaves encrypted pending custody intact.
     * No recovery/rollback mutation is required here.
     */
    await writeFile(
      destination,
      serialized,
      {
        encoding:
          "utf8",
      },
    );

    return {
      success:
        true,

      cancelled:
        false,

      fileName:
        basename(
          destination,
        ),

      bytesWritten,

      requestId:
        pending.requestId,

      branchId:
        pending.branchId,

      replacementCertificationKeyId:
        pending.replacementCertificationKeyMaterial.keyId,
    };
  }
  catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to export FINORA Branch Certification Rotation Request.",
    );
  }
}