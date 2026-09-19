/* ============================================================
   FINORA ENTERPRISE OS™

   WALLET RECHARGE REQUEST FILE TRANSPORT

   MODULE  : Wallet
   LAYER   : Native Electron Transport
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Create one signed Owner Wallet Recharge Request natively.
   - Present native Save dialog.
   - Persist bounded UTF-8 .finora bytes.
   - Return safe metadata only.

   SECURITY:

   - No raw filesystem path returned.
   - No private-key access.
   - No Wallet mutation.
   - Filename is never authorization authority.
============================================================ */

import {
  basename,
} from "node:path";

import {
  writeFile,
} from "node:fs/promises";

import {
  BrowserWindow,
  dialog,
} from "electron";

import {
  createFinoraWalletRechargeRequest,
  type CreateFinoraWalletRechargeRequestInput,
} from "./finoraWalletRechargeRequestService.js";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import {
  FINORA_WALLET_RECHARGE_REQUEST_FILE_EXTENSION,
  createFinoraWalletRechargeRequestFileName,
  serializeFinoraWalletRechargeRequestFile,
} from "./finoraWalletRechargeRequestFileContract.js";

export {
  FINORA_WALLET_RECHARGE_REQUEST_FILE_FORMAT,
  FINORA_WALLET_RECHARGE_REQUEST_FILE_EXTENSION,
  FINORA_WALLET_RECHARGE_REQUEST_MAX_FILE_BYTES,
  createFinoraWalletRechargeRequestFile,
  createFinoraWalletRechargeRequestFileName,
  serializeFinoraWalletRechargeRequestFile,
} from "./finoraWalletRechargeRequestFileContract.js";

export type {
  FinoraWalletRechargeRequestFile,
  FinoraWalletRechargeRequestFileV1,
} from "./finoraWalletRechargeRequestFileContract.js";

export type FinoraWalletRechargeRequestExportResult =
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

      paymentReference:
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
): FinoraWalletRechargeRequestExportResult {

  return {
    success:
      false,

    error,
  };
}

function ensureFinoraExtension(
  filePath:
    string,
): string {

  return filePath
    .toLowerCase()
    .endsWith(
      FINORA_WALLET_RECHARGE_REQUEST_FILE_EXTENSION,
    )
    ? filePath
    : (
        filePath +
        FINORA_WALLET_RECHARGE_REQUEST_FILE_EXTENSION
      );
}

export async function exportFinoraWalletRechargeRequestFromNativeDialog(
  parentWindow:
    BrowserWindow,

  input:
    CreateFinoraWalletRechargeRequestInput,

  portableStore:
    FinoraPortableBranchAuthStore,
): Promise<
  FinoraWalletRechargeRequestExportResult
> {

  try {

    const request =
      await createFinoraWalletRechargeRequest(
        input,
        portableStore,
      );

    const defaultFileName =
      createFinoraWalletRechargeRequestFileName(
        request,
      );

    const {
      serialized,
      bytes,
    } =
      serializeFinoraWalletRechargeRequestFile(
        request,
      );

    const saveResult =
      await dialog.showSaveDialog(
        parentWindow,
        {
          title:
            "Download FINORA Wallet Recharge Request",

          defaultPath:
            defaultFileName,

          filters: [
            {
              name:
                "FINORA Wallet Recharge Request",

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

      bytesWritten:
        bytes,

      requestId:
        request.payload.requestId,

      paymentReference:
        request.payload.paymentReference,
    };

  } catch (error) {

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to export the FINORA Wallet Recharge Request.",
    );
  }
}

/* ============================================================
   END
============================================================ */