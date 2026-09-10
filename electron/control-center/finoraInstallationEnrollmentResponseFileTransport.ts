/* ===========================================================
   FINORA ENTERPRISE OS™

   INSTALLATION ENROLLMENT RESPONSE FILE TRANSPORT

   MODULE  : Control Center
   LAYER   : Electron Main
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Accept one already-signed Installation Enrollment Response
   - Validate the immutable bootstrap-envelope structure needed
     before export
   - Wrap it in the canonical Enrollment Response file contract
   - Let Electron main own the native Save dialog
   - Enforce the .finora file extension
   - Enforce a bounded serialized file size
   - Write UTF-8 JSON to operator-selected removable/local media
   - Return only safe export metadata

   SECURITY:

   - CONTROL CENTER MAIN PROCESS ONLY.
   - No renderer-provided filepath.
   - No renderer-provided response bytes.
   - No renderer-provided signature.
   - No private-key access.
   - No recipient persistence.
   - No REGISTERED / DEMO authority.
   - No LOCAL / USB entitlement authority.
=========================================================== */

import {
  writeFile,
} from "node:fs/promises";

import {
  basename,
  extname,
} from "node:path";

import {
  dialog,
} from "electron";

import type {
  BrowserWindow,
} from "electron";

import {
  FINORA_INSTALLATION_ENROLLMENT_RESPONSE_FILE_FORMAT,
  FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PURPOSE,
} from "../control/finoraInstallationEnrollmentResponse.types.js";

import type {
  FinoraInstallationEnrollmentResponseFile,
  FinoraSignedInstallationEnrollmentResponse,
} from "../control/finoraInstallationEnrollmentResponse.types.js";

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

export type FinoraInstallationEnrollmentResponseExportResult =
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

      responseId:
        string;

      requestId:
        string;

      installationId:
        string;
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
): FinoraInstallationEnrollmentResponseExportResult {

  return {
    success:
      false,

    error,
  };
}

// ============================================================
// BASIC VALIDATION
// ============================================================

function isCanonicalIsoTimestamp(
  value:
    string,
): boolean {

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

function validateSignedResponseForExport(
  response:
    FinoraSignedInstallationEnrollmentResponse,
): void {

  if (
    response.purpose !==
      FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PURPOSE ||
    response.schemaVersion !==
      1 ||
    response.payloadVersion !==
      1
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response envelope is unsupported.",
    );
  }

  if (
    !response.responseId.startsWith(
      "FINORA-ENROLLMENT-RESPONSE-",
    ) ||
    !response.payload.requestId.startsWith(
      "FINORA-ENROLLMENT-",
    )
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response identifiers are invalid.",
    );
  }

  if (
    !Number.isSafeInteger(
      response.sequence,
    ) ||
    response.sequence <=
      0
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response sequence is invalid.",
    );
  }

  if (
    !isCanonicalIsoTimestamp(
      response.issuedAt,
    ) ||
    !isCanonicalIsoTimestamp(
      response.validity.notBefore,
    ) ||
    !isCanonicalIsoTimestamp(
      response.validity.expiresAt,
    ) ||
    !isCanonicalIsoTimestamp(
      response.payload.issuedAt,
    )
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response timestamps are invalid.",
    );
  }

  if (
    response.issuedAt !==
      response.payload.issuedAt ||
    response.issuedAt !==
      response.validity.notBefore
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response authoritative timestamps do not match.",
    );
  }

  if (
    Date.parse(
      response.validity.expiresAt,
    ) <=
      Date.parse(
        response.issuedAt,
      )
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response expiry is invalid.",
    );
  }

  if (
    !response.target.ownerId.trim() ||
    !response.target.businessId.trim() ||
    !response.target.branchId.trim() ||
    !response.target.installationId.trim() ||
    !response.target.bindingKeyId.trim() ||
    response.target.fingerprintAlgorithm !==
      "SHA-256" ||
    !/^[0-9a-f]{64}$/.test(
      response.target.publicKeyFingerprint,
    )
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response target is invalid.",
    );
  }

  const expectedBindingKeyId =
    `FINORA-BINDING-${response.target.publicKeyFingerprint
      .slice(
        0,
        32,
      )
      .toUpperCase()}`;

  if (
    response.target.bindingKeyId !==
      expectedBindingKeyId
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response target bindingKeyId is invalid.",
    );
  }

  if (
    response.issuer.type !==
      "FINORA_CONTROL_CENTER" ||
    !response.issuer.issuerId.trim() ||
    !response.issuer.signingKeyId.trim()
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response issuer metadata is invalid.",
    );
  }

  if (
    response.payload.initialTrustedKey.issuerId !==
      response.issuer.issuerId ||
    response.payload.initialTrustedKey.signingKeyId !==
      response.issuer.signingKeyId ||
    response.payload.initialTrustedKey.status !==
      "ACTIVE" ||
    response.payload.initialTrustedKey.algorithm !==
      "ECDSA_P256_SHA256" ||
    response.payload.initialTrustedKey.format !==
      "SPKI_DER_BASE64" ||
    !response.payload.initialTrustedKey.publicKey
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response initial trusted key does not match the signing issuer.",
    );
  }

  if (
    response.payloadDigest.algorithm !==
      "SHA-256" ||
    !/^[0-9a-f]{64}$/.test(
      response.payloadDigest.value,
    )
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response payload digest is invalid.",
    );
  }

  if (
    response.signature.algorithm !==
      "ECDSA_P256_SHA256" ||
    response.signature.encoding !==
      "IEEE_P1363" ||
    response.signature.canonicalization !==
      "FINORA_CANONICAL_JSON_V1" ||
    response.signature.signingKeyId !==
      response.issuer.signingKeyId ||
    !response.signature.value
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response signature metadata is invalid.",
    );
  }

  if (
    !response.payload.businessCode.trim() ||
    !response.payload.branchCode.trim()
  ) {
    throw new Error(
      "FINORA Installation Enrollment Response numbering codes are invalid.",
    );
  }
}

// ============================================================
// EXPORT
// ============================================================

export async function exportFinoraInstallationEnrollmentResponseFile(
  parentWindow:
    BrowserWindow,

  response:
    FinoraSignedInstallationEnrollmentResponse,
): Promise<
  FinoraInstallationEnrollmentResponseExportResult
> {

  try {

    // --------------------------------------------------------
    // STRUCTURAL FAIL-CLOSED CHECK
    // --------------------------------------------------------

    validateSignedResponseForExport(
      response,
    );

    // --------------------------------------------------------
    // FILE WRAPPER
    // --------------------------------------------------------

    const file:
      FinoraInstallationEnrollmentResponseFile = {

        format:
          FINORA_INSTALLATION_ENROLLMENT_RESPONSE_FILE_FORMAT,

        response,

        schemaVersion:
          1,
      };

    const serialized =
      JSON.stringify(
        file,
        null,
        2,
      );

    const bytes =
      Buffer.from(
        serialized,
        "utf8",
      );

    if (
      bytes.byteLength <=
        0 ||
      bytes.byteLength >
        FINORA_INSTALLATION_ENROLLMENT_RESPONSE_MAX_FILE_BYTES
    ) {
      return failure(
        "FINORA Installation Enrollment Response exceeds the supported export size limit.",
      );
    }

    // --------------------------------------------------------
    // NATIVE SAVE DIALOG
    // --------------------------------------------------------

    const selection =
      await dialog.showSaveDialog(
        parentWindow,
        {
          title:
            "Export FINORA Installation Enrollment Response",

          defaultPath:
            `${response.responseId}${FINORA_INSTALLATION_ENROLLMENT_RESPONSE_FILE_EXTENSION}`,

          filters: [
            {
              name:
                "FINORA Installation Enrollment Response",

              extensions: [
                "finora",
              ],
            },
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

    let filePath =
      selection.filePath;

    if (
      extname(
        filePath,
      ).toLowerCase() !==
        FINORA_INSTALLATION_ENROLLMENT_RESPONSE_FILE_EXTENSION
    ) {
      filePath =
        `${filePath}${FINORA_INSTALLATION_ENROLLMENT_RESPONSE_FILE_EXTENSION}`;
    }

    // --------------------------------------------------------
    // WRITE
    // --------------------------------------------------------

    await writeFile(
      filePath,
      bytes,
    );

    // --------------------------------------------------------
    // SAFE RESULT
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

      bytesWritten:
        bytes.byteLength,

      responseId:
        response.responseId,

      requestId:
        response.payload.requestId,

      installationId:
        response.target.installationId,
    };

  } catch (
    error
  ) {

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to export the FINORA Installation Enrollment Response.",
    );
  }
}

// ============================================================
// END
// ============================================================