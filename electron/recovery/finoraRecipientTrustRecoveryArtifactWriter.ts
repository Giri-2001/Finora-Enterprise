// ============================================================
// FINORA ENTERPRISE OS™
//
// RECIPIENT TRUST RECOVERY .FINORA ARTIFACT WRITER
//
// MODULE  : Offline Recovery Authority
// LAYER   : Native Signed-Artifact Export
// VERSION : 1.0
// STATUS  : Production Foundation
//
// RESPONSIBILITY:
//
// - Validate one already-signed Recipient Trust Recovery envelope
// - Serialize it as bounded UTF-8 JSON
// - Open a native Electron Save dialog
// - Enforce the .finora extension
// - Write through an exclusive temporary file
// - Rename the complete temporary artifact into final position
// - Return only bounded export metadata
//
// SECURITY:
//
// - No package signing.
// - No private-key access.
// - No Recovery Authority vault access.
// - No sequence-ledger access.
// - No recipient trust-store access.
// - No recipient Recovery public-anchor access.
// - No renderer / IPC / preload.
// - Caller does not supply an arbitrary output path directly;
//   the native Save dialog owns final path selection.
//
// COMPATIBILITY:
//
// Recipient-side Recovery import is bounded to 4 MiB, therefore
// this writer enforces the same maximum serialized artifact size.
//
// DURABILITY LIMIT:
//
// Temp + rename prevents partial normal writes, but this module
// does not claim fsync/power-loss durability or arbitrary
// same-user filesystem tamper resistance.
// ============================================================

import {
  BrowserWindow,
  dialog,
} from "electron";

import fs from "node:fs/promises";

import path from "node:path";

import {
  randomUUID,
} from "node:crypto";

import {
  validateFinoraRecipientTrustRecoverySignedEnvelope,
} from "../control/finoraRecipientTrustRecoveryContract.js";

import type {
  FinoraRecipientTrustRecoverySignedEnvelope,
} from "../control/finoraRecipientTrustRecoveryContract.js";

// ============================================================
// CONSTANTS
// ============================================================

export const FINORA_RECIPIENT_TRUST_RECOVERY_FILE_EXTENSION =
  ".finora" as const;

export const FINORA_RECIPIENT_TRUST_RECOVERY_MAX_FILE_BYTES =
  4 *
  1024 *
  1024;

// ============================================================
// RESULT
// ============================================================

export type FinoraRecipientTrustRecoveryArtifactExportResult =
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
    }
  | {
      success:
        false;

      error:
        string;
    };

// ============================================================
// RESULT HELPER
// ============================================================

function failure(
  error:
    string,
): FinoraRecipientTrustRecoveryArtifactExportResult {
  return {
    success:
      false,

    error,
  };
}

// ============================================================
// BASIC HELPERS
// ============================================================

function isNonEmptyString(
  value:
    unknown,
): value is
  string {
  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

// ============================================================
// FILE NAME
// ============================================================

function createSuggestedFileName(
  packageId:
    string,
): string {
  const safePackageId =
    packageId
      .trim()
      .replace(
        /[^A-Za-z0-9._-]+/g,
        "_",
      )
      .replace(
        /^[_\-.]+|[_\-.]+$/g,
        "",
      )
      .slice(
        0,
        160,
      );

  const baseName =
    safePackageId.length >
      0
      ? safePackageId
      : "FINORA-RECIPIENT-TRUST-RECOVERY";

  return `${baseName}${FINORA_RECIPIENT_TRUST_RECOVERY_FILE_EXTENSION}`;
}

function ensureFinoraExtension(
  filePath:
    string,
): string {
  if (
    /\.finora$/i.test(
      filePath,
    )
  ) {
    return filePath;
  }

  return (
    filePath +
    FINORA_RECIPIENT_TRUST_RECOVERY_FILE_EXTENSION
  );
}

// ============================================================
// SERIALIZATION
// ============================================================

export function serializeFinoraRecipientTrustRecoveryArtifact(
  signedRecovery:
    FinoraRecipientTrustRecoverySignedEnvelope,
): {
  content:
    string;

  bytes:
    number;
} {
  validateFinoraRecipientTrustRecoverySignedEnvelope(
    signedRecovery,
  );

  const content =
    `${JSON.stringify(
      signedRecovery,
      null,
      2,
    )}\n`;

  const bytes =
    Buffer.byteLength(
      content,
      "utf8",
    );

  if (
    bytes <=
      0
  ) {
    throw new Error(
      "FINORA Recipient Trust Recovery artifact serialization produced an empty file.",
    );
  }

  if (
    bytes >
      FINORA_RECIPIENT_TRUST_RECOVERY_MAX_FILE_BYTES
  ) {
    throw new Error(
      "FINORA Recipient Trust Recovery exceeds the supported 4 MiB .finora file size limit.",
    );
  }

  return {
    content,
    bytes,
  };
}

// ============================================================
// NATIVE EXPORT
// ============================================================

export async function exportFinoraRecipientTrustRecoveryArtifact(
  parentWindow:
    BrowserWindow,

  signedRecovery:
    FinoraRecipientTrustRecoverySignedEnvelope,
): Promise<
  FinoraRecipientTrustRecoveryArtifactExportResult
> {
  // ----------------------------------------------------------
  // PARENT WINDOW
  // ----------------------------------------------------------

  if (
    parentWindow.isDestroyed()
  ) {
    return failure(
      "FINORA Recipient Trust Recovery export window is no longer available.",
    );
  }

  // ----------------------------------------------------------
  // VALIDATE + SERIALIZE BEFORE NATIVE FILE SELECTION
  // ----------------------------------------------------------

  let serialized:
    {
      content:
        string;

      bytes:
        number;
    };

  try {
    serialized =
      serializeFinoraRecipientTrustRecoveryArtifact(
        signedRecovery,
      );
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to prepare FINORA Recipient Trust Recovery artifact.",
    );
  }

  const suggestedFileName =
    createSuggestedFileName(
      signedRecovery.packageId,
    );

  // ----------------------------------------------------------
  // NATIVE SAVE DIALOG
  // ----------------------------------------------------------

  let dialogResult:
    Electron.SaveDialogReturnValue;

  try {
    dialogResult =
      await dialog.showSaveDialog(
        parentWindow,
        {
          title:
            "Export FINORA Recipient Trust Recovery",

          defaultPath:
            suggestedFileName,

          buttonLabel:
            "Export .finora",

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
            "showOverwriteConfirmation",
            "createDirectory",
          ],
        },
      );
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to open the FINORA Recipient Trust Recovery export dialog.",
    );
  }

  if (
    dialogResult.canceled ||
    !isNonEmptyString(
      dialogResult.filePath,
    )
  ) {
    return {
      success:
        true,

      cancelled:
        true,
    };
  }

  // ----------------------------------------------------------
  // FINAL / TEMP PATHS
  // ----------------------------------------------------------

  const finalPath =
    ensureFinoraExtension(
      dialogResult.filePath,
    );

  const directory =
    path.dirname(
      finalPath,
    );

  const finalFileName =
    path.basename(
      finalPath,
    );

  const temporaryPath =
    path.join(
      directory,
      `.${finalFileName}.${process.pid}.${randomUUID()}.tmp`,
    );

  let temporaryCreated =
    false;

  // ----------------------------------------------------------
  // EXCLUSIVE TEMP WRITE -> RENAME
  // ----------------------------------------------------------

  try {
    await fs.writeFile(
      temporaryPath,
      serialized.content,
      {
        encoding:
          "utf8",

        flag:
          "wx",
      },
    );

    temporaryCreated =
      true;

    // --------------------------------------------------------
    // DEFENSIVE TEMP SIZE CHECK
    // --------------------------------------------------------

    const temporaryStat =
      await fs.stat(
        temporaryPath,
      );

    if (
      temporaryStat.size !==
        serialized.bytes ||
      temporaryStat.size >
        FINORA_RECIPIENT_TRUST_RECOVERY_MAX_FILE_BYTES
    ) {
      throw new Error(
        "FINORA Recipient Trust Recovery temporary artifact size verification failed.",
      );
    }

    await fs.rename(
      temporaryPath,
      finalPath,
    );

    temporaryCreated =
      false;

    return {
      success:
        true,

      cancelled:
        false,

      fileName:
        finalFileName,

      bytesWritten:
        serialized.bytes,
    };
  } catch (
    error
  ) {
    if (
      temporaryCreated
    ) {
      try {
        await fs.unlink(
          temporaryPath,
        );
      } catch {
        // Best-effort cleanup only.
      }
    }

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to export FINORA Recipient Trust Recovery artifact.",
    );
  }
}

// ============================================================
// END
// ============================================================