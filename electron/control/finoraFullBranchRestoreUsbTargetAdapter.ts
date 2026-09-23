// ============================================================
// FINORA ENTERPRISE OS
// FULL BRANCH BACKUP V2
// NATIVE USB RESTORE TARGET ADAPTER
// ============================================================
//
// Main-process filesystem authority only.
//
// Target USB root MUST already have been selected and validated
// by native FINORA removable-drive authority.
//
// Provides transaction dependencies for:
//
// - strict target storage capture;
// - exact atomic storage writes;
// - exact raw storage rollback;
// - Portable Auth write/read through native Store;
// - exact raw Portable Auth predecessor rollback;
// - blank replacement USB rollback.
//
// No renderer-supplied filesystem path is accepted here.
// ============================================================

import {
  Buffer,
} from "node:buffer";

import {
  randomUUID,
} from "node:crypto";

import {
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  dirname,
  join,
} from "node:path";

import {
  FINORA_PORTABLE_BRANCH_AUTH_DIRECTORY,
  FINORA_PORTABLE_BRANCH_AUTH_FILE_NAME,
  FINORA_PORTABLE_BRANCH_AUTH_SUBDIRECTORY,
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  validateFinoraPortableFreshDeviceRuntimeAuthorityPackageV1,
} from "./finoraPortableFreshDeviceRuntimeAuthorityContract.js";

import {
  FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_MAX_BYTES,
  getFinoraPortableFreshDeviceRuntimeAuthorityFilePath,
} from "./finoraPortableFreshDeviceRuntimeAuthorityStore.js";

import type {
  FinoraFullBranchRestorePersistedRecord,
} from "./finoraFullBranchRestoreStoragePlan.js";

import type {
  FinoraFullBranchRestoreCapturedStorage,
  FinoraFullBranchRestoreTransactionDependencies,
} from "./finoraFullBranchRestoreTransaction.js";

// ============================================================
// PHYSICAL STORAGE CONTRACT
// ============================================================

const FINORA_STORAGE_DIRECTORY =
  "storage";

const FINORA_STORAGE_FILE =
  "finora-storage.json";

interface FinoraUsbStoragePackageV2 {
  version:
    "2.0";

  records:
    unknown[];

  updatedAt:
    string;
}

interface RawFileState {
  existed:
    boolean;

  bytes:
    Buffer |
    null;
}

export type FinoraFullBranchRestorePortableStore =
  Pick<
    FinoraPortableBranchAuthStore,
    "read" |
    "write"
  >;

export interface FinoraFullBranchRestoreUsbTargetAdapterOptions {
  portableStore?:
    FinoraFullBranchRestorePortableStore;
}

// ============================================================
// ERROR HELPERS
// ============================================================

function getErrorCode(
  error:
    unknown,
): string | null {
  if (
    !error ||
    typeof error !==
      "object" ||
    !(
      "code" in
      error
    )
  ) {
    return null;
  }

  const code =
    (
      error as {
        code?:
          unknown;
      }
    ).code;

  return typeof code ===
    "string"
    ? code
    : null;
}

// ============================================================
// PATHS
// ============================================================

function buildStorageFilePath(
  targetUsbRoot:
    string,
): string {
  return join(
    targetUsbRoot,
    FINORA_PORTABLE_BRANCH_AUTH_DIRECTORY,
    FINORA_STORAGE_DIRECTORY,
    FINORA_STORAGE_FILE,
  );
}

function buildAuthFilePath(
  targetUsbRoot:
    string,
): string {
  return join(
    targetUsbRoot,
    FINORA_PORTABLE_BRANCH_AUTH_DIRECTORY,
    FINORA_PORTABLE_BRANCH_AUTH_SUBDIRECTORY,
    FINORA_PORTABLE_BRANCH_AUTH_FILE_NAME,
  );
}

function validateAndEncodeRuntimeAuthority(
  serialized:
    string,
): Buffer {
  if (
    typeof serialized !==
      "string" ||
    serialized.trim().length ===
      0
  ) {
    throw new Error(
      "FINORA restored Runtime Authority serialization is invalid.",
    );
  }

  const bytes =
    Buffer.from(
      serialized,
      "utf8",
    );

  if (
    bytes.byteLength <=
      0 ||
    bytes.byteLength >
      FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_MAX_BYTES
  ) {
    throw new Error(
      "FINORA restored Runtime Authority serialized size is invalid.",
    );
  }

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
      "FINORA restored Runtime Authority serialization is malformed.",
    );
  }

  try {
    validateFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
      parsed,
    );
  }
  catch {
    throw new Error(
      "FINORA restored Runtime Authority package is invalid.",
    );
  }

  return bytes;
}

// ============================================================
// RAW FILE STATE
// ============================================================

async function readRawFileState(
  filePath:
    string,
): Promise<
  RawFileState
> {
  try {
    const bytes =
      await readFile(
        filePath,
      );

    return {
      existed:
        true,

      bytes:
        Buffer.from(
          bytes,
        ),
    };
  }
  catch (
    error
  ) {
    if (
      getErrorCode(
        error,
      ) ===
        "ENOENT"
    ) {
      return {
        existed:
          false,

        bytes:
          null,
      };
    }

    throw error;
  }
}

function rawFileStatesEqual(
  left:
    RawFileState,
  right:
    RawFileState,
): boolean {
  if (
    left.existed !==
      right.existed
  ) {
    return false;
  }

  if (
    !left.existed
  ) {
    return true;
  }

  return (
    left.bytes !==
      null &&
    right.bytes !==
      null &&
    left.bytes.equals(
      right.bytes,
    )
  );
}

async function writeRawAtomic(
  filePath:
    string,
  bytes:
    Buffer,
  mode:
    number,
): Promise<void> {
  const directory =
    dirname(
      filePath,
    );

  await mkdir(
    directory,
    {
      recursive:
        true,
    },
  );

  const temporaryPath =
    `${filePath}.${randomUUID()}.tmp`;

  try {
    await writeFile(
      temporaryPath,
      bytes,
      {
        flag:
          "wx",

        mode,
      },
    );

    await rename(
      temporaryPath,
      filePath,
    );
  }
  catch (
    error
  ) {
    try {
      await rm(
        temporaryPath,
        {
          force:
            true,
        },
      );
    }
    catch {
      // Preserve original failure.
    }

    throw error;
  }
}

async function restoreRawFileState(
  filePath:
    string,
  predecessor:
    RawFileState,
  mode:
    number,
): Promise<void> {
  if (
    predecessor.existed
  ) {
    if (
      predecessor.bytes ===
        null
    ) {
      throw new Error(
        "FINORA rollback predecessor bytes are unavailable.",
      );
    }

    await writeRawAtomic(
      filePath,
      predecessor.bytes,
      mode,
    );

    const readback =
      await readRawFileState(
        filePath,
      );

    if (
      !rawFileStatesEqual(
        predecessor,
        readback,
      )
    ) {
      throw new Error(
        "FINORA raw predecessor rollback failed readback verification.",
      );
    }

    return;
  }

  await rm(
    filePath,
    {
      force:
        true,
    },
  );

  const readback =
    await readRawFileState(
      filePath,
    );

  if (
    readback.existed
  ) {
    throw new Error(
      "FINORA rollback could not remove newly created target state.",
    );
  }
}

// ============================================================
// USB STORAGE PACKAGE
// ============================================================

function parseStoragePackage(
  raw:
    RawFileState,
): FinoraUsbStoragePackageV2 {
  if (
    !raw.existed
  ) {
    return {
      version:
        "2.0",

      records:
        [],

      updatedAt:
        new Date(
          0,
        ).toISOString(),
    };
  }

  if (
    raw.bytes ===
      null ||
    raw.bytes.length <=
      0
  ) {
    throw new Error(
      "FINORA target USB storage package is empty or invalid.",
    );
  }

  const serialized =
    raw.bytes.toString(
      "utf8",
    );

  const parsed:
    unknown =
    JSON.parse(
      serialized,
    );

  if (
    !parsed ||
    typeof parsed !==
      "object" ||
    Array.isArray(
      parsed,
    )
  ) {
    throw new Error(
      "FINORA target USB storage package is invalid.",
    );
  }

  const candidate =
    parsed as Partial<
      FinoraUsbStoragePackageV2
    >;

  if (
    candidate.version !==
      "2.0" ||
    !Array.isArray(
      candidate.records,
    )
  ) {
    throw new Error(
      "FINORA target USB storage package is unsupported.",
    );
  }

  return {
    version:
      "2.0",

    records:
      candidate.records,

    updatedAt:
      typeof candidate.updatedAt ===
        "string"
        ? candidate.updatedAt
        : new Date(
            0,
          ).toISOString(),
  };
}

async function writeStorageRecords(
  storageFilePath:
    string,
  records:
    readonly FinoraFullBranchRestorePersistedRecord[],
): Promise<void> {
  const serialized =
    JSON.stringify(
      {
        version:
          "2.0",

        records:
          structuredClone(
            [...records],
          ),

        updatedAt:
          new Date().toISOString(),
      },
      null,
      2,
    );

  await writeRawAtomic(
    storageFilePath,
    Buffer.from(
      serialized,
      "utf8",
    ),
    0o600,
  );
}

// ============================================================
// FACTORY
// ============================================================

export function createFinoraFullBranchRestoreUsbTargetTransactionDependencies(
  targetUsbRoot:
    string,
  options:
    FinoraFullBranchRestoreUsbTargetAdapterOptions = {},
): FinoraFullBranchRestoreTransactionDependencies {
  if (
    typeof targetUsbRoot !==
      "string" ||
    targetUsbRoot.trim().length ===
      0
  ) {
    throw new Error(
      "A valid FINORA Restore USB target root is required.",
    );
  }

  const storageFilePath =
    buildStorageFilePath(
      targetUsbRoot,
    );

  const authFilePath =
    buildAuthFilePath(
      targetUsbRoot,
    );

  const runtimeAuthorityFilePath =
    getFinoraPortableFreshDeviceRuntimeAuthorityFilePath(
      targetUsbRoot,
    );

  const portableStore =
    options.portableStore ??
    new FinoraPortableBranchAuthStore({
      resolveLocalRoot:
        () =>
          null,

      resolveUsbRoot:
        async () =>
          targetUsbRoot,
    });

  let authPredecessorCaptured =
    false;

  let authPredecessor:
    RawFileState |
    null =
    null;

  let runtimeAuthorityPredecessorCaptured =
    false;

  let runtimeAuthorityPredecessor:
    RawFileState |
    null =
    null;

  return {
    captureTargetStorage:
      async (): Promise<
        FinoraFullBranchRestoreCapturedStorage
      > => {
        const raw =
          await readRawFileState(
            storageFilePath,
          );

        const storagePackage =
          parseStoragePackage(
            raw,
          );

        return {
          records:
            structuredClone(
              storagePackage.records,
            ),

          rollbackToken:
            raw,
        };
      },

    writeTargetStorageRecords:
      async (
        records,
      ) => {
        await writeStorageRecords(
          storageFilePath,
          records,
        );
      },

    readTargetStorageRecords:
      async () => {
        const raw =
          await readRawFileState(
            storageFilePath,
          );

        if (
          !raw.existed
        ) {
          throw new Error(
            "FINORA restored target storage file is missing.",
          );
        }

        const storagePackage =
          parseStoragePackage(
            raw,
          );

        return structuredClone(
          storagePackage.records,
        );
      },

    rollbackTargetStorage:
      async (
        rollbackToken,
      ) => {
        if (
          !rollbackToken ||
          typeof rollbackToken !==
            "object" ||
          !(
            "existed" in
            rollbackToken
          )
        ) {
          throw new Error(
            "FINORA storage rollback token is invalid.",
          );
        }

        await restoreRawFileState(
          storageFilePath,
          rollbackToken as RawFileState,
          0o600,
        );
      },

    readTargetPortableAuth:
      async (): Promise<
        FinoraPortableBranchAuthEnvelopeV1 |
        null
      > => {
        if (
          authPredecessorCaptured
        ) {
          return portableStore.read(
            "USB",
          );
        }

        const before =
          await readRawFileState(
            authFilePath,
          );

        const envelope =
          await portableStore.read(
            "USB",
          );

        const after =
          await readRawFileState(
            authFilePath,
          );

        if (
          !rawFileStatesEqual(
            before,
            after,
          )
        ) {
          throw new Error(
            "FINORA target Portable Auth changed during predecessor capture.",
          );
        }

        authPredecessor =
          before;

        authPredecessorCaptured =
          true;

        return envelope;
      },

    writeTargetPortableAuth:
      async (
        envelope,
      ) => {
        await portableStore.write(
          "USB",
          envelope,
        );
      },

    rollbackTargetPortableAuth:
      async () => {
        if (
          !authPredecessorCaptured ||
          authPredecessor ===
            null
        ) {
          throw new Error(
            "FINORA Portable Auth predecessor was not captured.",
          );
        }

        await restoreRawFileState(
          authFilePath,
          authPredecessor,
          0o600,
        );
      },

    readTargetRuntimeAuthority:
      async (): Promise<
        string |
        null
      > => {
        const raw =
          await readRawFileState(
            runtimeAuthorityFilePath,
          );

        if (
          !runtimeAuthorityPredecessorCaptured
        ) {
          runtimeAuthorityPredecessor =
            raw;

          runtimeAuthorityPredecessorCaptured =
            true;
        }

        if (
          !raw.existed
        ) {
          return null;
        }

        if (
          raw.bytes ===
            null
        ) {
          throw new Error(
            "FINORA Runtime Authority bytes are unavailable.",
          );
        }

        const serialized =
          raw.bytes.toString(
            "utf8",
          );

        validateAndEncodeRuntimeAuthority(
          serialized,
        );

        return serialized;
      },

    writeTargetRuntimeAuthority:
      async (
        serialized,
      ) => {
        const bytes =
          validateAndEncodeRuntimeAuthority(
            serialized,
          );

        await writeRawAtomic(
          runtimeAuthorityFilePath,
          bytes,
          0o600,
        );
      },

    rollbackTargetRuntimeAuthority:
      async () => {
        if (
          !runtimeAuthorityPredecessorCaptured ||
          runtimeAuthorityPredecessor ===
            null
        ) {
          throw new Error(
            "FINORA Runtime Authority predecessor was not captured.",
          );
        }

        await restoreRawFileState(
          runtimeAuthorityFilePath,
          runtimeAuthorityPredecessor,
          0o600,
        );
      },
  };
}