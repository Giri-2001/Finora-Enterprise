import {
  basename,
  extname,
} from "node:path";

import {
  writeFile,
} from "node:fs/promises";

import {
  dialog,
  type BrowserWindow,
} from "electron";

import {
  FINORA_BRANCH_CERTIFICATION_ROTATION_PAYLOAD_VERSION,
  FINORA_BRANCH_CERTIFICATION_ROTATION_PURPOSE,
  assertFinoraBranchCertificationRotationPayload,
} from "../control/finoraBranchCertificationRotationContract.js";

import type {
  FinoraBranchCertificationRotationPayloadV1,
} from "../control/finoraBranchCertificationRotationContract.js";

import type {
  FinoraControlCenterSignedPackage,
} from "./finoraControlCenterSigner.js";

// ============================================================
// FILE CONTRACT
// ============================================================

export const FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_FILE_FORMAT =
  "FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_V1" as const;

export const FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_FILE_EXTENSION =
  ".finora" as const;

export const FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_MAX_FILE_BYTES =
  256 * 1024;

export interface FinoraBranchCertificationRotationAuthorityFileV1 {

  format:
    typeof FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_FILE_FORMAT;

  signedPackage:
    FinoraControlCenterSignedPackage<
      FinoraBranchCertificationRotationPayloadV1
    >;

  schemaVersion:
    1;
}

// ============================================================
// EXPORT RESULT
// ============================================================

export type FinoraBranchCertificationRotationAuthorityExportResult =
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

      packageId:
        string;

      requestId:
        string;

      sequence:
        number;
    }
  | {
      success:
        false;

      error:
        string;
    };

// ============================================================
// HELPERS
// ============================================================

function failure(
  error:
    string,
): FinoraBranchCertificationRotationAuthorityExportResult {

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

  const normalized =
    value
      .replace(
        /[^A-Za-z0-9_-]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "",
      )
      .slice(
        0,
        80,
      );

  return normalized.length >
    0
    ? normalized
    : "ROTATION";
}

function validateSignedRotationAuthority(
  value:
    FinoraControlCenterSignedPackage<
      FinoraBranchCertificationRotationPayloadV1
    >,
): void {

  if (
    value.purpose !==
      FINORA_BRANCH_CERTIFICATION_ROTATION_PURPOSE ||
    value.schemaVersion !==
      1 ||
    value.payloadVersion !==
      FINORA_BRANCH_CERTIFICATION_ROTATION_PAYLOAD_VERSION ||
    !value.packageId ||
    !Number.isSafeInteger(
      value.sequence,
    ) ||
    value.sequence <=
      0 ||
    !Number.isFinite(
      Date.parse(
        value.issuedAt,
      ),
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation signed authority metadata is invalid.",
    );
  }

  assertFinoraBranchCertificationRotationPayload(
    value.payload,
  );

  if (
    value.target.ownerId !==
      value.payload.ownerId ||
    value.target.businessId !==
      value.payload.businessId ||
    value.target.branchId !==
      value.payload.branchId ||
    value.target.installationId !==
      value.payload.requestingInstallationId ||
    value.target.bindingKeyId !==
      value.payload.requestingBindingKeyId ||
    value.target.fingerprintAlgorithm !==
      value.payload.requestingFingerprintAlgorithm ||
    value.target.publicKeyFingerprint !==
      value.payload.requestingPublicKeyFingerprint
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation signed authority target does not match its payload.",
    );
  }

  if (
    value.issuer.type !==
      "FINORA_CONTROL_CENTER" ||
    !value.issuer.issuerId ||
    !value.issuer.signingKeyId ||
    value.signature.algorithm !==
      "ECDSA_P256_SHA256" ||
    value.signature.encoding !==
      "IEEE_P1363" ||
    value.signature.canonicalization !==
      "FINORA_CANONICAL_JSON_V1" ||
    value.signature.signingKeyId !==
      value.issuer.signingKeyId
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation signed authority signature metadata is invalid.",
    );
  }

  const signatureBytes =
    Buffer.from(
      value.signature.value,
      "base64",
    );

  if (
    signatureBytes.byteLength !==
      64 ||
    signatureBytes.toString(
      "base64",
    ) !==
      value.signature.value
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation signed authority signature encoding is invalid.",
    );
  }
}

// ============================================================
// SERIALIZE
// ============================================================

export function serializeFinoraBranchCertificationRotationAuthorityFile(
  signedPackage:
    FinoraControlCenterSignedPackage<
      FinoraBranchCertificationRotationPayloadV1
    >,
): {
  content:
    string;

  bytes:
    number;
} {

  validateSignedRotationAuthority(
    signedPackage,
  );

  const file:
    FinoraBranchCertificationRotationAuthorityFileV1 = {

      format:
        FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_FILE_FORMAT,

      signedPackage,

      schemaVersion:
        1,
  };

  const content =
    JSON.stringify(
      file,
      null,
      2,
    );

  if (
    content.includes(
      '"privateKey"',
    ) ||
    content.includes(
      "replacementCertificationKeyMaterial",
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation authority export attempted to expose private certification material.",
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
      FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_MAX_FILE_BYTES
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation authority exceeds the supported export size limit.",
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

export async function exportFinoraBranchCertificationRotationAuthorityFile(
  parentWindow:
    BrowserWindow,

  signedPackage:
    FinoraControlCenterSignedPackage<
      FinoraBranchCertificationRotationPayloadV1
    >,
): Promise<
  FinoraBranchCertificationRotationAuthorityExportResult
> {

  if (
    !parentWindow ||
    parentWindow.isDestroyed()
  ) {
    return failure(
      "The FINORA Control Center window is unavailable for Branch Certification Rotation authority export.",
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
      serializeFinoraBranchCertificationRotationAuthorityFile(
        signedPackage,
      );
  }
  catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to prepare FINORA Branch Certification Rotation authority export.",
    );
  }

  const defaultFileName =
    [
      "FIN-BCR-DONE",
      safeFileToken(
        signedPackage.payload.branchId,
      ),
      safeFileToken(
        signedPackage.payload.requestId,
      ),
    ].join(
      "-",
    ) +
    FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_FILE_EXTENSION;

  try {
    const selection =
      await dialog.showSaveDialog(
        parentWindow,
        {
          title:
            "Export FINORA Branch Certification Rotation Authority",

          defaultPath:
            defaultFileName,

          buttonLabel:
            "Export .finora",

          filters: [
            {
              name:
                "FINORA Branch Certification Rotation Authority",

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

    let destination =
      selection.filePath;

    if (
      extname(
        destination,
      ).toLowerCase() !==
        FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_FILE_EXTENSION
    ) {
      destination =
        destination +
        FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_FILE_EXTENSION;
    }

    await writeFile(
      destination,
      serialized.content,
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

      bytesWritten:
        serialized.bytes,

      packageId:
        signedPackage.packageId,

      requestId:
        signedPackage.payload.requestId,

      sequence:
        signedPackage.sequence,
    };
  }
  catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to export FINORA Branch Certification Rotation authority.",
    );
  }
}