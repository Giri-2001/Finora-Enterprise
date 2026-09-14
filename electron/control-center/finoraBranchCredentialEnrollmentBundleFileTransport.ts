import {
  dialog,
} from "electron";

import type {
  BrowserWindow,
} from "electron";

import {
  randomUUID,
} from "node:crypto";

import {
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";

import {
  basename,
  dirname,
  join,
} from "node:path";

import {
  FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE_FILE_EXTENSION,
  FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE_MAX_FILE_BYTES,
} from "../control/finoraBranchCredentialEnrollmentBundleFileContract.js";

import {
  validateFinoraBranchCredentialEnrollmentBundle,
} from "../control/finoraBranchCredentialEnrollmentBundle.js";

export interface FinoraBranchCredentialEnrollmentBundleExportSuccess {
  success:
    true;

  cancelled:
    false;

  fileName:
    string;

  bytesWritten:
    number;
}

export interface FinoraBranchCredentialEnrollmentBundleExportCancelled {
  success:
    true;

  cancelled:
    true;
}

export interface FinoraBranchCredentialEnrollmentBundleExportFailure {
  success:
    false;

  error:
    string;
}

export type FinoraBranchCredentialEnrollmentBundleExportResult =
  | FinoraBranchCredentialEnrollmentBundleExportSuccess
  | FinoraBranchCredentialEnrollmentBundleExportCancelled
  | FinoraBranchCredentialEnrollmentBundleExportFailure;

function failure(
  error:
    string,
):
  FinoraBranchCredentialEnrollmentBundleExportFailure {

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

  const token =
    value
      .replace(
        /[^A-Za-z0-9_-]/g,
        "-",
      )
      .slice(
        0,
        80,
      );

  return token.length >
    0
    ? token
    : "BRANCH";
}

function ensureFinoraExtension(
  filePath:
    string,
): string {

  return filePath
    .toLowerCase()
    .endsWith(
      FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE_FILE_EXTENSION,
    )
    ? filePath
    : (
        filePath +
        FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE_FILE_EXTENSION
      );
}

export function serializeFinoraBranchCredentialEnrollmentBundleFile(
  value:
    unknown,
): {
  content:
    string;

  bytes:
    number;
} {

  const validation =
    validateFinoraBranchCredentialEnrollmentBundle(
      value,
    );

  if (!validation.valid) {
    throw new Error(
      validation.error,
    );
  }

  let content:
    string;

  try {
    content =
      JSON.stringify(
        validation.bundle,
        null,
        2,
      );
  } catch {
    throw new Error(
      "FINORA Branch Credential Enrollment Bundle could not be serialized.",
    );
  }

  const bytes =
    Buffer.byteLength(
      content,
      "utf8",
    );

  if (
    bytes <=
      0 ||
    bytes >
      FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE_MAX_FILE_BYTES
  ) {
    throw new Error(
      "FINORA Branch Credential Enrollment Bundle exceeds the supported .finora file size limit.",
    );
  }

  return {
    content,
    bytes,
  };
}

export async function exportFinoraBranchCredentialEnrollmentBundleFile(
  parentWindow:
    BrowserWindow,

  bundle:
    unknown,
): Promise<
  FinoraBranchCredentialEnrollmentBundleExportResult
> {

  if (
    !parentWindow ||
    parentWindow.isDestroyed()
  ) {
    return failure(
      "The FINORA Control Center window is not available for Credential Enrollment export.",
    );
  }

  const validation =
    validateFinoraBranchCredentialEnrollmentBundle(
      bundle,
    );

  if (!validation.valid) {
    return failure(
      validation.error,
    );
  }

  let serialized:
    {
      content:
        string;

      bytes:
        number;
    };

  try {
    serialized =
      serializeFinoraBranchCredentialEnrollmentBundleFile(
        validation.bundle,
      );
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to prepare the FINORA Branch Credential Enrollment Bundle for export.",
    );
  }

  const branchId =
    validation.bundle
      .branchAccessPackage
      .target
      .branchId;

  const suggestedFileName =
    (
      "FINORA-BRANCH-CREDENTIAL-ENROLLMENT-" +
      safeFileToken(
        branchId,
      ) +
      FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE_FILE_EXTENSION
    );

  const selection =
    await dialog.showSaveDialog(
      parentWindow,
      {
        title:
          "Export FINORA Branch Credential Enrollment",

        defaultPath:
          suggestedFileName,

        buttonLabel:
          "Export .finora",

        filters: [
          {
            name:
              "FINORA Branch Credential Enrollment",

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

  if (
    selection.canceled ||
    !selection.filePath
  ) {
    return {
      success:
        true,

      cancelled:
        true,
    };
  }

  const finalPath =
    ensureFinoraExtension(
      selection.filePath,
    );

  const finalFileName =
    basename(
      finalPath,
    );

  const temporaryPath =
    join(
      dirname(
        finalPath,
      ),
      (
        "." +
        finalFileName +
        "." +
        process.pid +
        "." +
        randomUUID() +
        ".tmp"
      ),
    );

  let temporaryCreated =
    false;

  try {
    await writeFile(
      temporaryPath,
      serialized.content,
      {
        encoding:
          "utf8",

        flag:
          "wx",

        mode:
          0o600,
      },
    );

    temporaryCreated =
      true;

    await rename(
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

  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to export the FINORA Branch Credential Enrollment Bundle.",
    );

  } finally {
    if (temporaryCreated) {
      await unlink(
        temporaryPath,
      ).catch(
        () =>
          undefined,
      );
    }
  }
}