// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// CONTROL BUNDLE .FINORA FILE TRANSPORT
//
// RESPONSIBILITY:
//
// - Validate one already-signed CONTROL_BUNDLE for export
// - Serialize the signed package as bounded UTF-8 JSON
// - Own the native Save dialog
// - Enforce the .finora file extension
// - Write through a same-directory temporary file
// - Return narrow export metadata to the caller
//
// IMPORTANT:
//
// - ELECTRON MAIN PROCESS ONLY.
// - No IPC registration in this module.
// - No renderer-provided filesystem path.
// - No signing authority.
// - No private-key access.
// - No recipient Control Store mutation.
// - Structural export validation is NOT cryptographic verification.
// - Temporary-file replacement is durability-oriented only;
//   no cross-process or system-wide atomicity claim is made.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  dialog,
  type BrowserWindow,
} from "electron";

import {
  randomUUID,
} from "node:crypto";

import {
  promises as fs,
} from "node:fs";

import path from "node:path";

import type {
  FinoraControlCenterSignedPackage,
} from "./finoraControlCenterSigner.js";

// ============================================================
// LIMITS
// ============================================================

export const FINORA_CONTROL_BUNDLE_FILE_EXTENSION =
  ".finora" as const;

export const FINORA_CONTROL_BUNDLE_MAX_FILE_BYTES =
  4 * 1024 * 1024;

// ============================================================
// RESULT
// ============================================================

export interface FinoraControlBundleExportSuccess {

  success:
    true;

  cancelled:
    false;

  fileName:
    string;

  bytesWritten:
    number;
}

export interface FinoraControlBundleExportCancelled {

  success:
    true;

  cancelled:
    true;
}

export interface FinoraControlBundleExportFailure {

  success:
    false;

  error:
    string;
}

export type FinoraControlBundleExportResult =
  | FinoraControlBundleExportSuccess
  | FinoraControlBundleExportCancelled
  | FinoraControlBundleExportFailure;

// ============================================================
// HELPERS
// ============================================================

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {

  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function isNonEmptyString(
  value:
    unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function isCanonicalTimestamp(
  value:
    unknown,
): value is string {

  if (!isNonEmptyString(value)) {
    return false;
  }

  const parsed =
    Date.parse(
      value,
    );

  return (
    Number.isFinite(
      parsed,
    ) &&
    new Date(
      parsed,
    ).toISOString() ===
      value
  );
}

function failure(
  error:
    string,
): FinoraControlBundleExportFailure {

  return {
    success:
      false,

    error,
  };
}

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
      .slice(
        0,
        160,
      );

  const baseName =
    safePackageId.length >
      0
      ? safePackageId
      : "FINORA-CONTROL-BUNDLE";

  return (
    `${baseName}${FINORA_CONTROL_BUNDLE_FILE_EXTENSION}`
  );
}

function ensureFinoraExtension(
  selectedPath:
    string,
): string {

  if (
    selectedPath
      .toLowerCase()
      .endsWith(
        FINORA_CONTROL_BUNDLE_FILE_EXTENSION,
      )
  ) {
    return selectedPath;
  }

  return (
    `${selectedPath}${FINORA_CONTROL_BUNDLE_FILE_EXTENSION}`
  );
}

// ============================================================
// EXPORTABLE SIGNED BUNDLE STRUCTURE
// ============================================================

function isExportableSignedControlBundle(
  value:
    unknown,
): value is FinoraControlCenterSignedPackage<
  Record<string, unknown>
> {

  if (!isRecord(value)) {
    return false;
  }

  if (
    value.schemaVersion !==
      1 ||
    value.purpose !==
      "CONTROL_BUNDLE" ||
    value.payloadVersion !==
      1 ||
    !isNonEmptyString(
      value.packageId,
    ) ||
    !isCanonicalTimestamp(
      value.issuedAt,
    ) ||
    !Number.isSafeInteger(
      value.sequence,
    ) ||
    (
      value.sequence as number
    ) <=
      0 ||
    !isRecord(
      value.target,
    ) ||
    !isRecord(
      value.issuer,
    ) ||
    !isRecord(
      value.payload,
    ) ||
    !isRecord(
      value.payloadDigest,
    ) ||
    !isRecord(
      value.signature,
    )
  ) {
    return false;
  }

  const issuer =
    value.issuer;

  const payload =
    value.payload;

  const payloadDigest =
    value.payloadDigest;

  const signature =
    value.signature;

  if (
    issuer.type !==
      "FINORA_CONTROL_CENTER" ||
    !isNonEmptyString(
      issuer.issuerId,
    ) ||
    !isNonEmptyString(
      issuer.signingKeyId,
    ) ||
    payload.bundleFormat !==
      "FINORA_CONTROL_BUNDLE_V1" ||
    payload.schemaVersion !==
      1 ||
    payload.issuedAt !==
      value.issuedAt ||
    !Array.isArray(
      payload.packages,
    ) ||
    payload.packages.length <
      1 ||
    payload.packages.length >
      5 ||
    payloadDigest.algorithm !==
      "SHA-256" ||
    typeof payloadDigest.value !==
      "string" ||
    !/^[0-9a-f]{64}$/.test(
      payloadDigest.value,
    ) ||
    signature.algorithm !==
      "ECDSA_P256_SHA256" ||
    signature.encoding !==
      "IEEE_P1363" ||
    signature.canonicalization !==
      "FINORA_CANONICAL_JSON_V1" ||
    !isNonEmptyString(
      signature.signingKeyId,
    ) ||
    !isNonEmptyString(
      signature.value,
    ) ||
    issuer.signingKeyId !==
      signature.signingKeyId
  ) {
    return false;
  }

  return true;
}

// ============================================================
// SERIALIZE
// ============================================================

export function serializeFinoraControlBundleFile(
  signedBundle:
    unknown,
): {
  content:
    string;

  bytes:
    number;
} {

  if (
    !isExportableSignedControlBundle(
      signedBundle,
    )
  ) {
    throw new Error(
      "A valid signed FINORA CONTROL_BUNDLE package is required for export.",
    );
  }

  let content:
    string;

  try {
    content =
      JSON.stringify(
        signedBundle,
      );
  } catch {
    throw new Error(
      "FINORA CONTROL_BUNDLE could not be serialized.",
    );
  }

  if (
    typeof content !==
      "string" ||
    content.length ===
      0
  ) {
    throw new Error(
      "FINORA CONTROL_BUNDLE serialization produced no file content.",
    );
  }

  const bytes =
    Buffer.byteLength(
      content,
      "utf8",
    );

  if (
    bytes >
      FINORA_CONTROL_BUNDLE_MAX_FILE_BYTES
  ) {
    throw new Error(
      "FINORA CONTROL_BUNDLE exceeds the supported .finora file size limit.",
    );
  }

  return {
    content,
    bytes,
  };
}

// ============================================================
// EXPORT
// ============================================================

export async function exportFinoraControlBundleFile(
  parentWindow:
    BrowserWindow,

  signedBundle:
    unknown,

  suggestedFileNameOverride?:
    string,
): Promise<
  FinoraControlBundleExportResult
> {

  if (
    !parentWindow ||
    parentWindow.isDestroyed()
  ) {
    return failure(
      "The FINORA Control Center window is not available for bundle export.",
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
      serializeFinoraControlBundleFile(
        signedBundle,
      );
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to prepare the FINORA Control Bundle for export.",
    );
  }

  const controlBundle =
    signedBundle as
      FinoraControlCenterSignedPackage<
        Record<string, unknown>
      >;

  let suggestedFileName:
    string;

  if (
    suggestedFileNameOverride ===
      undefined
  ) {
    suggestedFileName =
      createSuggestedFileName(
        controlBundle.packageId,
      );
  } else {
    const candidate =
      suggestedFileNameOverride.trim();

    if (
      candidate.length === 0 ||
      candidate.length > 180 ||
      path.basename(candidate) !== candidate ||
      /[\\/]/.test(candidate) ||
      !candidate.toLowerCase().endsWith(".finora")
    ) {
      return failure(
        "FINORA Control Bundle suggested filename override is invalid.",
      );
    }

    suggestedFileName =
      candidate;
  }

  const dialogResult =
    await dialog.showSaveDialog(
      parentWindow,
      {
        title:
          "Export FINORA Control Bundle",

        defaultPath:
          suggestedFileName,

        buttonLabel:
          "Export .finora",

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
          "showOverwriteConfirmation",
          "createDirectory",
        ],
      },
    );

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

  } catch (error) {

    if (temporaryCreated) {
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
        : "Unable to export the FINORA Control Bundle file.",
    );
  }
}

// ============================================================
// END
// ============================================================