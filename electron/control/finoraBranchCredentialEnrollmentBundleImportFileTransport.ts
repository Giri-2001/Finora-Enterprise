import {
  dialog,
} from "electron";

import type {
  BrowserWindow,
} from "electron";

import {
  open,
} from "node:fs/promises";

import {
  basename,
  extname,
} from "node:path";

import {
  TextDecoder,
} from "node:util";

import {
  FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE_FILE_EXTENSION,
  FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE_MAX_FILE_BYTES,
} from "./finoraBranchCredentialEnrollmentBundleFileContract.js";

import {
  validateFinoraBranchCredentialEnrollmentBundle,
} from "./finoraBranchCredentialEnrollmentBundle.js";

import type {
  FinoraBranchCredentialEnrollmentBundleV1,
} from "./finoraBranchCredentialEnrollmentBundle.js";

export type FinoraBranchCredentialEnrollmentBundleImportResult =
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

      bundle:
        FinoraBranchCredentialEnrollmentBundleV1;
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
):
  FinoraBranchCredentialEnrollmentBundleImportResult {

  return {
    success:
      false,

    error,
  };
}

export function parseFinoraBranchCredentialEnrollmentBundleFileBytes(
  bytes:
    Uint8Array,
):
  FinoraBranchCredentialEnrollmentBundleV1 {

  if (
    bytes.byteLength <=
      0
  ) {
    throw new Error(
      "FINORA Branch Credential Enrollment Bundle file is empty.",
    );
  }

  if (
    bytes.byteLength >
      FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE_MAX_FILE_BYTES
  ) {
    throw new Error(
      "FINORA Branch Credential Enrollment Bundle exceeds the 4 MiB import limit.",
    );
  }

  let serialized:
    string;

  try {
    const decoder =
      new TextDecoder(
        "utf-8",
        {
          fatal:
            true,
        },
      );

    serialized =
      decoder.decode(
        bytes,
      );

  } catch {
    throw new Error(
      "FINORA Branch Credential Enrollment Bundle must contain valid UTF-8 JSON.",
    );
  }

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        serialized,
      );

  } catch {
    throw new Error(
      "FINORA Branch Credential Enrollment Bundle contains invalid JSON.",
    );
  }

  const validation =
    validateFinoraBranchCredentialEnrollmentBundle(
      parsed,
    );

  if (!validation.valid) {
    throw new Error(
      validation.error,
    );
  }

  return validation.bundle;
}

export async function openFinoraBranchCredentialEnrollmentBundleFile(
  parentWindow:
    BrowserWindow,
): Promise<
  FinoraBranchCredentialEnrollmentBundleImportResult
> {

  if (
    !parentWindow ||
    parentWindow.isDestroyed()
  ) {
    return failure(
      "FINORA parent window is unavailable for Credential Enrollment import.",
    );
  }

  const selection =
    await dialog.showOpenDialog(
      parentWindow,
      {
        title:
          "Import FINORA Branch Credential Enrollment",

        buttonLabel:
          "Import Enrollment",

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
      "Exactly one FINORA Branch Credential Enrollment file must be selected.",
    );
  }

  const selectedFilePath =
    selection.filePaths[0];

  if (!selectedFilePath) {
    return failure(
      "FINORA Branch Credential Enrollment import returned no selected file.",
    );
  }

  /*
   * Extension is only an early transport sanity check.
   * It is not a trust decision.
   */
  if (
    extname(
      selectedFilePath,
    ).toLowerCase() !==
      FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE_FILE_EXTENSION
  ) {
    return failure(
      "FINORA Branch Credential Enrollment must use the .finora file extension.",
    );
  }

  let handle:
    Awaited<
      ReturnType<
        typeof open
      >
    > |
    undefined;

  try {
    /*
     * Stat and read use the same open handle so pathname
     * replacement cannot switch the file between those steps.
     */
    handle =
      await open(
        selectedFilePath,
        "r",
      );

    const statistics =
      await handle.stat();

    if (!statistics.isFile()) {
      return failure(
        "Selected FINORA Branch Credential Enrollment artifact is not a regular file.",
      );
    }

    if (
      statistics.size <=
        0
    ) {
      return failure(
        "Selected FINORA Branch Credential Enrollment artifact is empty.",
      );
    }

    if (
      statistics.size >
        FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE_MAX_FILE_BYTES
    ) {
      return failure(
        "Selected FINORA Branch Credential Enrollment artifact exceeds the 4 MiB import limit.",
      );
    }

    const bytes =
      await handle.readFile();

    if (
      bytes.byteLength >
        FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE_MAX_FILE_BYTES
    ) {
      return failure(
        "Selected FINORA Branch Credential Enrollment artifact exceeds the 4 MiB import limit.",
      );
    }

    let bundle:
      FinoraBranchCredentialEnrollmentBundleV1;

    try {
      bundle =
        parseFinoraBranchCredentialEnrollmentBundleFileBytes(
          bytes,
        );

    } catch (error) {
      return failure(
        error instanceof Error
          ? error.message
          : "Unable to parse the FINORA Branch Credential Enrollment Bundle.",
      );
    }

    return {
      success:
        true,

      cancelled:
        false,

      fileName:
        basename(
          selectedFilePath,
        ),

      bytesRead:
        bytes.byteLength,

      bundle,
    };

  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to open the FINORA Branch Credential Enrollment Bundle.",
    );

  } finally {
    if (handle) {
      await handle.close().catch(
        () =>
          undefined,
      );
    }
  }
}