import {
  basename,
  extname,
} from "node:path";

import {
  readFile,
} from "node:fs/promises";

import {
  dialog,
  type BrowserWindow,
} from "electron";

// ============================================================
// CONTRACT
// ============================================================

export const FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_FORMAT =
  "FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_V1" as const;

export const FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_SCHEMA_VERSION =
  1 as const;

export const FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_FILE_EXTENSION =
  ".finora" as const;

export const FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_MAX_FILE_BYTES =
  256 * 1024;

export interface FinoraBranchCertificationRotationAuthorityFileV1 {
  format:
    typeof FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_FORMAT;

  signedPackage:
    unknown;

  schemaVersion:
    typeof FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_SCHEMA_VERSION;
}

export type FinoraBranchCertificationRotationAuthorityOpenResult =
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

      authorityFile:
        FinoraBranchCertificationRotationAuthorityFileV1;
    }
  | {
      success:
        false;

      error:
        string;
    };

// ============================================================
// VALIDATION
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

function hasExactKeys(
  value:
    Record<string, unknown>,

  expected:
    readonly string[],
): boolean {

  const actual =
    Object.keys(
      value,
    ).sort();

  const normalizedExpected =
    [...expected].sort();

  return (
    actual.length ===
      normalizedExpected.length &&
    actual.every(
      (
        key,
        index,
      ) =>
        key ===
          normalizedExpected[index],
    )
  );
}

function containsForbiddenPrivateMaterial(
  value:
    unknown,

  visited =
    new Set<object>(),
): boolean {

  if (
    typeof value !==
      "object" ||
    value ===
      null
  ) {
    return false;
  }

  if (
    visited.has(
      value,
    )
  ) {
    return false;
  }

  visited.add(
    value,
  );

  if (
    Array.isArray(
      value,
    )
  ) {
    return value.some(
      (item) =>
        containsForbiddenPrivateMaterial(
          item,
          visited,
        ),
    );
  }

  const record =
    value as Record<string, unknown>;

  for (
    const [
      key,
      child,
    ] of Object.entries(
      record,
    )
  ) {
    if (
      key ===
        "privateKey" ||
      key ===
        "replacementCertificationKeyMaterial"
    ) {
      return true;
    }

    if (
      containsForbiddenPrivateMaterial(
        child,
        visited,
      )
    ) {
      return true;
    }
  }

  return false;
}

export function parseFinoraBranchCertificationRotationAuthorityFile(
  serialized:
    string,
): FinoraBranchCertificationRotationAuthorityFileV1 {

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        serialized,
      );
  }
  catch {
    throw new Error(
      "FINORA Branch Certification Rotation Authority file is not valid JSON.",
    );
  }

  if (
    !isRecord(
      parsed,
    ) ||
    !hasExactKeys(
      parsed,
      [
        "format",
        "signedPackage",
        "schemaVersion",
      ],
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation Authority wrapper is invalid.",
    );
  }

  if (
    parsed.format !==
      FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_FORMAT
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation Authority format is unsupported.",
    );
  }

  if (
    parsed.schemaVersion !==
      FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_SCHEMA_VERSION
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation Authority schema version is unsupported.",
    );
  }

  if (
    !isRecord(
      parsed.signedPackage,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation Authority signed package is invalid.",
    );
  }

  if (
    containsForbiddenPrivateMaterial(
      parsed,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation Authority must not contain private certification material.",
    );
  }

  return {
    format:
      FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_FORMAT,

    signedPackage:
      parsed.signedPackage,

    schemaVersion:
      FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_SCHEMA_VERSION,
  };
}

function failure(
  error:
    string,
): FinoraBranchCertificationRotationAuthorityOpenResult {

  return {
    success:
      false,

    error,
  };
}

// ============================================================
// OPEN + STRICT READ
// ============================================================

export async function openFinoraBranchCertificationRotationAuthorityFile(
  parentWindow:
    BrowserWindow,
): Promise<
  FinoraBranchCertificationRotationAuthorityOpenResult
> {

  if (
    !parentWindow ||
    parentWindow.isDestroyed()
  ) {
    return failure(
      "The FINORA window is unavailable for Branch Certification Rotation Authority selection.",
    );
  }

  try {
    const selection =
      await dialog.showOpenDialog(
        parentWindow,
        {
          title:
            "Open FINORA Branch Certification Rotation Authority",

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
        "Exactly one FINORA Branch Certification Rotation Authority file must be selected.",
      );
    }

    const filePath =
      selection.filePaths[0];

    if (
      extname(
        filePath,
      ).toLowerCase() !==
        FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_FILE_EXTENSION
    ) {
      return failure(
        "FINORA Branch Certification Rotation Authority must use the .finora file extension.",
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
        "FINORA Branch Certification Rotation Authority file is empty.",
      );
    }

    if (
      bytes.byteLength >
        FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_MAX_FILE_BYTES
    ) {
      return failure(
        "FINORA Branch Certification Rotation Authority exceeds the supported file size limit.",
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
    }
    catch {
      return failure(
        "FINORA Branch Certification Rotation Authority is not valid UTF-8.",
      );
    }

    const authorityFile =
      parseFinoraBranchCertificationRotationAuthorityFile(
        serialized,
      );

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

      authorityFile,
    };
  }
  catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to open the FINORA Branch Certification Rotation Authority.",
    );
  }
}