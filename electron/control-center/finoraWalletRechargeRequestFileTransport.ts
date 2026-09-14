/* ============================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER — WALLET RECHARGE REQUEST FILE TRANSPORT

   RESPONSIBILITY:

   - Let Control Center main process own native file selection.
   - Accept exactly one .finora Wallet Recharge Request.
   - Enforce a strict bounded file size before parsing.
   - Decode strict UTF-8.
   - Parse untrusted JSON.
   - Verify against the authoritative Branch Registry.
   - Return only verified request data plus safe file metadata.

   SECURITY:

   - CONTROL CENTER MAIN PROCESS ONLY.
   - No renderer-provided filepath.
   - No filename-derived trust.
   - No private-key access.
   - No Wallet mutation.
   - No approval / decline authority.
   - File selection does not imply approval.
============================================================ */

import {
  readFile,
} from "node:fs/promises";

import {
  basename,
  extname,
} from "node:path";

import {
  TextDecoder,
} from "node:util";

import {
  dialog,
} from "electron";

import type {
  BrowserWindow,
} from "electron";

import {
  verifyFinoraWalletRechargeRequest,
} from "./finoraWalletRechargeRequestVerifier.js";

import type {
  FinoraVerifiedWalletRechargeRequest,
} from "./finoraWalletRechargeRequestVerifier.js";

export const FINORA_WALLET_RECHARGE_REQUEST_FILE_EXTENSION =
  ".finora" as const;

export const FINORA_WALLET_RECHARGE_REQUEST_MAX_FILE_BYTES =
  64 * 1024;

export type FinoraWalletRechargeRequestOpenResult =
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

      request:
        FinoraVerifiedWalletRechargeRequest;
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
): FinoraWalletRechargeRequestOpenResult {

  return {
    success:
      false,

    error,
  };
}

export async function openVerifiedFinoraWalletRechargeRequest(
  parentWindow:
    BrowserWindow,
): Promise<
  FinoraWalletRechargeRequestOpenResult
> {

  try {

    const selection =
      await dialog.showOpenDialog(
        parentWindow,
        {
          title:
            "Open FINORA Wallet Recharge Request",

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
        "Exactly one FINORA Wallet Recharge Request file must be selected.",
      );
    }

    const filePath =
      selection.filePaths[0];

    if (
      extname(
        filePath,
      ).toLowerCase() !==
        FINORA_WALLET_RECHARGE_REQUEST_FILE_EXTENSION
    ) {
      return failure(
        "FINORA Wallet Recharge Request must use the .finora file extension.",
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
        "FINORA Wallet Recharge Request file is empty.",
      );
    }

    if (
      bytes.byteLength >
        FINORA_WALLET_RECHARGE_REQUEST_MAX_FILE_BYTES
    ) {
      return failure(
        "FINORA Wallet Recharge Request exceeds the supported file size limit.",
      );
    }

    let serialized:
      string;

    try {
      serialized =
        new TextDecoder(
          "utf-8",
          {
            fatal:
              true,
          },
        ).decode(
          bytes,
        );
    } catch {
      return failure(
        "FINORA Wallet Recharge Request is not valid UTF-8.",
      );
    }

    let parsed:
      unknown;

    try {
      parsed =
        JSON.parse(
          serialized,
        ) as unknown;
    } catch {
      return failure(
        "FINORA Wallet Recharge Request does not contain valid JSON.",
      );
    }

    const verification =
      await verifyFinoraWalletRechargeRequest(
        parsed,
      );

    if (
      !verification.success
    ) {
      return failure(
        verification.error,
      );
    }

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

      request:
        verification.data,
    };

  } catch (error) {

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to open the FINORA Wallet Recharge Request.",
    );
  }
}

/* ============================================================
   END
============================================================ */