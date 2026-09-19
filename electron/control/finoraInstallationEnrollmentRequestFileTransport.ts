/* ===========================================================
   FINORA ENTERPRISE OS™

   INSTALLATION ENROLLMENT REQUEST FILE TRANSPORT

   MODULE  : Native Control
   LAYER   : Electron Main
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Generate one native-signed Installation Enrollment Request
   - Wrap it in the FINORA enrollment-request file format
   - Let Electron main own the native Save dialog
   - Export the public enrollment request as a .finora file
   - Return only non-secret transport metadata

   SECURITY:

   - MAIN PROCESS ONLY.
   - No renderer-provided filepath.
   - No renderer-provided enrollment payload.
   - No renderer-provided signature.
   - No Control Center signing authority.
   - No branch activation authority.
   - No REGISTERED / DEMO authority.
   - No LOCAL / USB entitlement authority.
   - Native installation private key is never exported.
=========================================================== */

import {
  writeFile,
} from "node:fs/promises";

import {
  basename,
} from "node:path";

import {
  dialog,
} from "electron";

import type {
  BrowserWindow,
} from "electron";

import {
  createFinoraWindowsInstallationEnrollmentRequest,
} from "./finoraInstallationEnrollmentRequestService.js";

import type {
  FinoraWindowsInstallationEnrollmentRequest,
} from "./finoraInstallationEnrollmentRequestService.js";

import {
  persistFinoraPendingInstallationEnrollment,
  restoreFinoraPendingInstallationEnrollment,
} from "./finoraInstallationEnrollmentPendingStore.js";

import {
  loadFinoraBranchCertificationBootstrap,
  persistFinoraBranchCertificationBootstrapGenerated,
  restoreFinoraBranchCertificationBootstrapGenerated,
} from "./finoraBranchCertificationBootstrapStore.js";

import {
  generateFinoraBranchCertificationKeyMaterial,
  toFinoraBranchCertificationPublicKey,
} from "./finoraBranchCertificationCrypto.js";

// ============================================================
// FORMAT
// ============================================================

export const FINORA_INSTALLATION_ENROLLMENT_REQUEST_FILE_FORMAT =
  "FINORA_INSTALLATION_ENROLLMENT_REQUEST_V2" as const;

export const FINORA_INSTALLATION_ENROLLMENT_REQUEST_FILE_EXTENSION =
  ".finora" as const;

export const FINORA_INSTALLATION_ENROLLMENT_REQUEST_MAX_FILE_BYTES =
  64 * 1024;

// ============================================================
// FILE DTO
// ============================================================

export interface FinoraInstallationEnrollmentRequestFile {

  format:
    typeof FINORA_INSTALLATION_ENROLLMENT_REQUEST_FILE_FORMAT;

  request:
    FinoraWindowsInstallationEnrollmentRequest;

  schemaVersion:
    2;
}

// ============================================================
// RESULT
// ============================================================

export type FinoraInstallationEnrollmentRequestExportResult =
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

      installationId:
        string;

      bindingKeyId:
        string;

      publicKeyFingerprint:
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
): FinoraInstallationEnrollmentRequestExportResult {

  return {
    success:
      false,

    error,
  };
}

// ============================================================
// SAFE FILE NAME
// ============================================================

function createDefaultFileName(
  installationId:
    string,
): string {

  const safeInstallationId =
    installationId
      .replace(
        /[^A-Za-z0-9_-]/g,
        "-",
      )
      .slice(
        0,
        80,
      );

  return (
    "FINORA-INSTALLATION-ENROLLMENT-" +
    safeInstallationId +
    FINORA_INSTALLATION_ENROLLMENT_REQUEST_FILE_EXTENSION
  );
}

// ============================================================
// ENSURE EXTENSION
// ============================================================

function ensureFinoraExtension(
  filePath:
    string,
): string {

  return filePath
    .toLowerCase()
    .endsWith(
      FINORA_INSTALLATION_ENROLLMENT_REQUEST_FILE_EXTENSION,
    )
    ? filePath
    : (
        filePath +
        FINORA_INSTALLATION_ENROLLMENT_REQUEST_FILE_EXTENSION
      );
}

// ============================================================
// EXPORT
// ============================================================

export async function exportFinoraInstallationEnrollmentRequestFromNativeDialog(
  parentWindow:
    BrowserWindow,
): Promise<
  FinoraInstallationEnrollmentRequestExportResult
> {

  try {

    /*
     * Generation remains native/main-process owned.
     *
     * The resulting request contains only public device-binding
     * material plus the installation possession proof.
     */
    const existingBranchCertificationBootstrap =
      await loadFinoraBranchCertificationBootstrap();

    if (
      existingBranchCertificationBootstrap !==
        undefined &&
      existingBranchCertificationBootstrap.state !==
        "GENERATED_FOR_REQUEST"
    ) {
      throw new Error(
        "FINORA Branch Certification bootstrap is already branch-bound; a new Installation Enrollment Request cannot replace it.",
      );
    }

    /*
     * One branch holds one immutable Branch Certification keypair.
     *
     * A replacement Enrollment Request reuses the same keypair.
     * A fresh installation bootstrap generates the keypair once.
     */
    const certificationKeyMaterial =
      existingBranchCertificationBootstrap
        ?.certificationKeyMaterial ??
      generateFinoraBranchCertificationKeyMaterial(
        new Date(),
      );

    const branchCertificationPublicKey =
      toFinoraBranchCertificationPublicKey(
        certificationKeyMaterial,
      );

    const request =
      await createFinoraWindowsInstallationEnrollmentRequest(
        branchCertificationPublicKey,
      );

    const installationId =
      request.payload.deviceBinding.installationId;

    const saveResult =
      await dialog.showSaveDialog(
        parentWindow,
        {
          title:
            "Export FINORA Installation Enrollment Request",

          defaultPath:
            createDefaultFileName(
              installationId,
            ),

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

    const file:
      FinoraInstallationEnrollmentRequestFile = {

        format:
          FINORA_INSTALLATION_ENROLLMENT_REQUEST_FILE_FORMAT,

        request,

        schemaVersion:
          2,
      };

    const serialized =
      JSON.stringify(
        file,
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
        FINORA_INSTALLATION_ENROLLMENT_REQUEST_MAX_FILE_BYTES
    ) {
      return failure(
        "FINORA Installation Enrollment Request exceeds the supported file size limit.",
      );
    }

    const destination =
      ensureFinoraExtension(
        saveResult.filePath,
      );

    /*
     * Two protected stores participate in Request export:
     *
     * 1. Branch Certification bootstrap custody
     * 2. Pending Enrollment provenance
     *
     * Forward mutation order is intentionally:
     *
     *   Branch Certification -> Pending Enrollment -> external file
     *
     * This prevents a protected pending request from existing without
     * the Branch Certification private key required by that request.
     */
    const previousBranchCertificationBootstrap =
      await persistFinoraBranchCertificationBootstrapGenerated({
        requestId:
          request.payload.requestId,

        installationId:
          request.payload.deviceBinding.installationId,

        bindingKeyId:
          request.payload.deviceBinding.bindingKeyId,

        fingerprintAlgorithm:
          request.payload.deviceBinding.fingerprintAlgorithm,

        publicKeyFingerprint:
          request.payload.deviceBinding.publicKeyFingerprint,

        certificationKeyMaterial,

        generatedAt:
          certificationKeyMaterial.createdAt,
      });

    let previousPending:
      Awaited<
        ReturnType<
          typeof persistFinoraPendingInstallationEnrollment
        >
      >;

    try {

      previousPending =
        await persistFinoraPendingInstallationEnrollment({
          requestId:
            request.payload.requestId,

          installationId:
            request.payload.deviceBinding.installationId,

          bindingKeyId:
            request.payload.deviceBinding.bindingKeyId,

          fingerprintAlgorithm:
            request.payload.deviceBinding.fingerprintAlgorithm,

          publicKeyFingerprint:
            request.payload.deviceBinding.publicKeyFingerprint,

          requestedAt:
            request.payload.requestedAt,

          schemaVersion:
            1,
        });

    } catch (
      error
    ) {

      const certificationRestored =
        await restoreFinoraBranchCertificationBootstrapGenerated(
          request.payload.requestId,
          previousBranchCertificationBootstrap,
        );

      if (!certificationRestored) {
        throw new Error(
          "FINORA Enrollment Request pending-provenance persistence failed and Branch Certification bootstrap custody could not be restored safely.",
        );
      }

      throw error;
    }

    try {

      await writeFile(
        destination,
        serialized,
        {
          encoding:
            "utf8",
        },
      );

    } catch (
      error
    ) {

      let pendingRestored =
        false;

      let certificationRestored =
        false;

      let pendingRestoreFailed =
        false;

      let certificationRestoreFailed =
        false;

      try {
        pendingRestored =
          await restoreFinoraPendingInstallationEnrollment(
            request.payload.requestId,
            previousPending,
          );
      } catch {
        pendingRestoreFailed =
          true;
      }

      try {
        certificationRestored =
          await restoreFinoraBranchCertificationBootstrapGenerated(
            request.payload.requestId,
            previousBranchCertificationBootstrap,
          );
      } catch {
        certificationRestoreFailed =
          true;
      }

      if (
        !pendingRestored ||
        !certificationRestored ||
        pendingRestoreFailed ||
        certificationRestoreFailed
      ) {
        throw new Error(
          "FINORA Enrollment Request file export failed and its protected Pending Enrollment / Branch Certification state could not be restored safely.",
        );
      }

      throw error;
    }

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
        request.payload.requestId,

      installationId,

      bindingKeyId:
        request.payload.deviceBinding.bindingKeyId,

      publicKeyFingerprint:
        request.payload.deviceBinding.publicKeyFingerprint,
    };

  } catch (
    error
  ) {

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to export the FINORA Installation Enrollment Request.",
    );
  }
}

// ============================================================
// END
// ============================================================