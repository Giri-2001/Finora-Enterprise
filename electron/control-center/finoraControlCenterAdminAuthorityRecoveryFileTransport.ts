/* ============================================================
   FINORA ENTERPRISE OS
   CONTROL CENTER ADMIN AUTHORITY RECOVERY FILE TRANSPORT

   RESPONSIBILITIES:

   EXPORT
   - Accept an already-created encrypted recovery bundle.
   - Canonically serialize it.
   - Open native Save dialog.
   - Enforce dedicated recovery-file extension.
   - Persist through same-directory temporary file + rename.
   - Return filename/size only, never filesystem path.

   IMPORT
   - Open native Open dialog.
   - Read exactly one bounded recovery file.
   - Reject symbolic links / non-files / oversized content.
   - Require canonical UTF-8 JSON parse through recovery
     bundle contract validation.
   - Return canonical serialized encrypted bundle only.

   SECURITY:
   - No renderer-provided path.
   - No renderer-provided raw file bytes.
   - No Admin Security Code.
   - No plaintext private signing key.
   - No signing authority mutation.
   - User cancellation is non-error.
============================================================ */

import {
  app,
  dialog,
} from "electron";

import {
  promises as fs,
} from "node:fs";

import path from "node:path";

import {
  parseFinoraControlCenterAdminAuthorityRecoveryBundleV1,
  serializeFinoraControlCenterAdminAuthorityRecoveryBundleV1,
} from "./finoraControlCenterAdminAuthorityRecoveryBundle.js";

import type {
  FinoraControlCenterAdminAuthorityRecoveryBundleV1,
} from "./finoraControlCenterAdminAuthorityRecoveryBundle.js";

// ============================================================
// CONSTANTS
// ============================================================

export const FINORA_CONTROL_CENTER_ADMIN_RECOVERY_FILE_EXTENSION =
  ".finora-admin-recovery" as const;

export const FINORA_CONTROL_CENTER_ADMIN_RECOVERY_MAX_FILE_BYTES =
  1024 * 1024;

const DEFAULT_FILE_NAME =
  `FINORA-Control-Center-Admin-Authority-Recovery${FINORA_CONTROL_CENTER_ADMIN_RECOVERY_FILE_EXTENSION}`;

// ============================================================
// RESULT TYPES
// ============================================================

export interface FinoraControlCenterAdminRecoveryFileExportSuccess {
  success:
    true;

  cancelled:
    false;

  fileName:
    string;

  bytes:
    number;
}

export interface FinoraControlCenterAdminRecoveryFileExportCancelled {
  success:
    false;

  cancelled:
    true;
}

export interface FinoraControlCenterAdminRecoveryFileExportFailure {
  success:
    false;

  cancelled:
    false;

  error:
    string;
}

export type FinoraControlCenterAdminRecoveryFileExportResult =
  FinoraControlCenterAdminRecoveryFileExportSuccess |
  FinoraControlCenterAdminRecoveryFileExportCancelled |
  FinoraControlCenterAdminRecoveryFileExportFailure;

export interface FinoraControlCenterAdminRecoveryFileImportSuccess {
  success:
    true;

  cancelled:
    false;

  fileName:
    string;

  bytes:
    number;

  serializedBundle:
    string;
}

export interface FinoraControlCenterAdminRecoveryFileImportCancelled {
  success:
    false;

  cancelled:
    true;
}

export interface FinoraControlCenterAdminRecoveryFileImportFailure {
  success:
    false;

  cancelled:
    false;

  error:
    string;
}

export type FinoraControlCenterAdminRecoveryFileImportResult =
  FinoraControlCenterAdminRecoveryFileImportSuccess |
  FinoraControlCenterAdminRecoveryFileImportCancelled |
  FinoraControlCenterAdminRecoveryFileImportFailure;

// ============================================================
// HELPERS
// ============================================================

function ensureRecoveryExtension(
  selectedPath:
    string,
): string {
  if (
    selectedPath
      .toLowerCase()
      .endsWith(
        FINORA_CONTROL_CENTER_ADMIN_RECOVERY_FILE_EXTENSION,
      )
  ) {
    return selectedPath;
  }

  return (
    `${selectedPath}${FINORA_CONTROL_CENTER_ADMIN_RECOVERY_FILE_EXTENSION}`
  );
}

function assertAppReady():
  void {
  if (
    !app.isReady()
  ) {
    throw new Error(
      "FINORA Control Center Admin Recovery file transport requires Electron app readiness.",
    );
  }
}

// ============================================================
// PURE FILE CONTENT SERIALIZATION
// ============================================================

export function serializeFinoraControlCenterAdminAuthorityRecoveryFileContent(
  bundle:
    FinoraControlCenterAdminAuthorityRecoveryBundleV1,
): {
  content:
    string;

  bytes:
    number;
} {
  const content =
    serializeFinoraControlCenterAdminAuthorityRecoveryBundleV1(
      bundle,
    );

  const bytes =
    Buffer.byteLength(
      content,
      "utf8",
    );

  if (
    bytes ===
      0 ||
    bytes >
      FINORA_CONTROL_CENTER_ADMIN_RECOVERY_MAX_FILE_BYTES
  ) {
    throw new Error(
      "FINORA Admin Recovery file exceeds the supported size limit.",
    );
  }

  return {
    content,
    bytes,
  };
}

export function parseFinoraControlCenterAdminAuthorityRecoveryFileContent(
  content:
    Buffer,
): {
  bundle:
    FinoraControlCenterAdminAuthorityRecoveryBundleV1;

  serializedBundle:
    string;

  bytes:
    number;
} {
  if (
    content.length ===
      0 ||
    content.length >
      FINORA_CONTROL_CENTER_ADMIN_RECOVERY_MAX_FILE_BYTES
  ) {
    throw new Error(
      "FINORA Admin Recovery file size is invalid.",
    );
  }

  const decoded =
    content.toString(
      "utf8",
    );

  if (
    !Buffer.from(
      decoded,
      "utf8",
    ).equals(
      content,
    )
  ) {
    throw new Error(
      "FINORA Admin Recovery file is not valid UTF-8.",
    );
  }

  const bundle =
    parseFinoraControlCenterAdminAuthorityRecoveryBundleV1(
      decoded,
    );

  const serializedBundle =
    serializeFinoraControlCenterAdminAuthorityRecoveryBundleV1(
      bundle,
    );

  return {
    bundle,
    serializedBundle,
    bytes:
      content.length,
  };
}

// ============================================================
// EXPORT
// ============================================================

export async function exportFinoraControlCenterAdminAuthorityRecoveryFile(
  bundle:
    FinoraControlCenterAdminAuthorityRecoveryBundleV1,
): Promise<
  FinoraControlCenterAdminRecoveryFileExportResult
> {
  try {
    assertAppReady();

    const serialized =
      serializeFinoraControlCenterAdminAuthorityRecoveryFileContent(
        bundle,
      );

    const dialogResult =
      await dialog.showSaveDialog({
        title:
          "Export FINORA Admin Authority Recovery",

        defaultPath:
          path.join(
            app.getPath(
              "documents",
            ),
            DEFAULT_FILE_NAME,
          ),

        filters: [
          {
            name:
              "FINORA Admin Authority Recovery",

            extensions: [
              FINORA_CONTROL_CENTER_ADMIN_RECOVERY_FILE_EXTENSION.slice(
                1,
              ),
            ],
          },
        ],

        properties: [
          "showOverwriteConfirmation",
          "createDirectory",
        ],
      });

    if (
      dialogResult.canceled ||
      !dialogResult.filePath
    ) {
      return {
        success:
          false,

        cancelled:
          true,
      };
    }

    const finalPath =
      ensureRecoveryExtension(
        dialogResult.filePath,
      );

    const directory =
      path.dirname(
        finalPath,
      );

    const fileName =
      path.basename(
        finalPath,
      );

    const temporaryPath =
      path.join(
        directory,
        `.${fileName}.${process.pid}.${Date.now()}.tmp`,
      );

    let temporaryCreated =
      false;

    try {
      await fs.mkdir(
        directory,
        {
          recursive:
            true,
        },
      );

      await fs.writeFile(
        temporaryPath,
        serialized.content,
        {
          encoding:
            "utf8",

          mode:
            0o600,

          flag:
            "wx",
        },
      );

      temporaryCreated =
        true;

      await fs.rename(
        temporaryPath,
        finalPath,
      );

      temporaryCreated =
        false;
    }
    finally {
      if (
        temporaryCreated
      ) {
        await fs.rm(
          temporaryPath,
          {
            force:
              true,
          },
        ).catch(
          () =>
            undefined,
        );
      }
    }

    return {
      success:
        true,

      cancelled:
        false,

      fileName,

      bytes:
        serialized.bytes,
    };
  }
  catch (
    error
  ) {
    return {
      success:
        false,

      cancelled:
        false,

      error:
        error instanceof Error
          ? error.message
          : "FINORA Admin Authority Recovery file export failed.",
    };
  }
}

// ============================================================
// IMPORT
// ============================================================

export async function importFinoraControlCenterAdminAuthorityRecoveryFile():
  Promise<
    FinoraControlCenterAdminRecoveryFileImportResult
  > {
  try {
    assertAppReady();

    const dialogResult =
      await dialog.showOpenDialog({
        title:
          "Import FINORA Admin Authority Recovery",

        filters: [
          {
            name:
              "FINORA Admin Authority Recovery",

            extensions: [
              FINORA_CONTROL_CENTER_ADMIN_RECOVERY_FILE_EXTENSION.slice(
                1,
              ),
            ],
          },
        ],

        properties: [
          "openFile",
        ],
      });

    if (
      dialogResult.canceled ||
      dialogResult.filePaths.length !==
        1
    ) {
      return {
        success:
          false,

        cancelled:
          true,
      };
    }

    const selectedPath =
      dialogResult.filePaths[0];

    if (
      !selectedPath
        .toLowerCase()
        .endsWith(
          FINORA_CONTROL_CENTER_ADMIN_RECOVERY_FILE_EXTENSION,
        )
    ) {
      throw new Error(
        "FINORA Admin Recovery file extension is invalid.",
      );
    }

    const fileInfo =
      await fs.lstat(
        selectedPath,
      );

    if (
      fileInfo.isSymbolicLink() ||
      !fileInfo.isFile()
    ) {
      throw new Error(
        "FINORA Admin Recovery selection must be a regular file.",
      );
    }

    if (
      fileInfo.size ===
        0 ||
      fileInfo.size >
        FINORA_CONTROL_CENTER_ADMIN_RECOVERY_MAX_FILE_BYTES
    ) {
      throw new Error(
        "FINORA Admin Recovery file size is invalid.",
      );
    }

    const content =
      await fs.readFile(
        selectedPath,
      );

    const parsed =
      parseFinoraControlCenterAdminAuthorityRecoveryFileContent(
        content,
      );

    return {
      success:
        true,

      cancelled:
        false,

      fileName:
        path.basename(
          selectedPath,
        ),

      bytes:
        parsed.bytes,

      serializedBundle:
        parsed.serializedBundle,
    };
  }
  catch (
    error
  ) {
    return {
      success:
        false,

      cancelled:
        false,

      error:
        error instanceof Error
          ? error.message
          : "FINORA Admin Authority Recovery file import failed.",
    };
  }
}

// ============================================================
// END
// ============================================================