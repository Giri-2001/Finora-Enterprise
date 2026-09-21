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
  stat,
  writeFile,
} from "node:fs/promises";

import {
  join,
  resolve,
} from "node:path";

import {
  validateFinoraPortableFreshDeviceRuntimeAuthorityPackageV1,
} from "./finoraPortableFreshDeviceRuntimeAuthorityContract.js";

import type {
  FinoraPortableFreshDeviceRuntimeAuthorityPackageV1,
} from "./finoraPortableFreshDeviceRuntimeAuthorityContract.js";

// ============================================================
// CONSTANTS
// ============================================================

export const FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_FILENAME =
  "finora-fresh-device-runtime-authority.json" as const;

export const FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_MAX_BYTES =
  256 * 1024;

// ============================================================
// CONTRACTS
// ============================================================

export type FinoraPortableFreshDeviceRuntimeAuthorityStorageMode =
  | "LOCAL"
  | "USB";

export interface FinoraPortableFreshDeviceRuntimeAuthorityStoreDependencies {
  resolveLocalRoot:
    () =>
      string |
      Promise<string>;

  resolveUsbRoot:
    () =>
      string |
      null |
      undefined |
      Promise<
        string |
        null |
        undefined
      >;
}

export type FinoraPortableFreshDeviceRuntimeAuthorityStoreErrorCode =
  | "INVALID_STORAGE"
  | "STORAGE_UNAVAILABLE"
  | "IO_FAILURE";

export class FinoraPortableFreshDeviceRuntimeAuthorityStoreError
  extends Error {

  readonly code:
    FinoraPortableFreshDeviceRuntimeAuthorityStoreErrorCode;

  constructor(
    code:
      FinoraPortableFreshDeviceRuntimeAuthorityStoreErrorCode,
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      "FinoraPortableFreshDeviceRuntimeAuthorityStoreError";

    this.code =
      code;
  }
}

// ============================================================
// PATH
// ============================================================

function normalizeRoot(
  value:
    string |
    null |
    undefined,
): string | null {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return null;
  }

  return resolve(
    value,
  );
}

export function getFinoraPortableFreshDeviceRuntimeAuthorityFilePath(
  root:
    string,
): string {
  const normalized =
    normalizeRoot(
      root,
    );

  if (!normalized) {
    throw new FinoraPortableFreshDeviceRuntimeAuthorityStoreError(
      "STORAGE_UNAVAILABLE",
      "FINORA portable runtime-authority root is unavailable.",
    );
  }

  return join(
    normalized,
    "FINORA",
    "auth",
    FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_FILENAME,
  );
}

// ============================================================
// STORE
// ============================================================

export class FinoraPortableFreshDeviceRuntimeAuthorityStore {
  private readonly dependencies:
    FinoraPortableFreshDeviceRuntimeAuthorityStoreDependencies;

  private writeBarrier:
    Promise<void> =
      Promise.resolve();

  constructor(
    dependencies:
      FinoraPortableFreshDeviceRuntimeAuthorityStoreDependencies,
  ) {
    this.dependencies =
      dependencies;
  }

  private async resolveRoot(
    storageMode:
      FinoraPortableFreshDeviceRuntimeAuthorityStorageMode,
  ): Promise<string> {
    if (
      storageMode ===
        "LOCAL"
    ) {
      const localRoot =
        normalizeRoot(
          await this.dependencies
            .resolveLocalRoot(),
        );

      if (!localRoot) {
        throw new FinoraPortableFreshDeviceRuntimeAuthorityStoreError(
          "STORAGE_UNAVAILABLE",
          "FINORA LOCAL runtime-authority root is unavailable.",
        );
      }

      return localRoot;
    }

    if (
      storageMode !==
        "USB"
    ) {
      throw new FinoraPortableFreshDeviceRuntimeAuthorityStoreError(
        "INVALID_STORAGE",
        "FINORA runtime-authority storage mode is invalid.",
      );
    }

    const usbRoot =
      normalizeRoot(
        await this.dependencies
          .resolveUsbRoot(),
      );

    if (!usbRoot) {
      throw new FinoraPortableFreshDeviceRuntimeAuthorityStoreError(
        "STORAGE_UNAVAILABLE",
        "FINORA Pendrive is disconnected.",
      );
    }

    return usbRoot;
  }

  async read(
    storageMode:
      FinoraPortableFreshDeviceRuntimeAuthorityStorageMode,
  ): Promise<
    FinoraPortableFreshDeviceRuntimeAuthorityPackageV1 |
    null
  > {
    await this.writeBarrier;

    const root =
      await this.resolveRoot(
        storageMode,
      );

    const filePath =
      getFinoraPortableFreshDeviceRuntimeAuthorityFilePath(
        root,
      );

    let fileStat;

    try {
      fileStat =
        await stat(
          filePath,
        );
    }
    catch (
      error
    ) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return null;
      }

      throw new FinoraPortableFreshDeviceRuntimeAuthorityStoreError(
        "IO_FAILURE",
        "Unable to inspect FINORA portable runtime authority.",
      );
    }

    if (
      !fileStat.isFile() ||
      fileStat.size <= 0 ||
      fileStat.size >
        FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_MAX_BYTES
    ) {
      throw new FinoraPortableFreshDeviceRuntimeAuthorityStoreError(
        "INVALID_STORAGE",
        "FINORA portable runtime-authority file is invalid.",
      );
    }

    let serialized:
      string;

    try {
      serialized =
        await readFile(
          filePath,
          "utf8",
        );
    }
    catch {
      throw new FinoraPortableFreshDeviceRuntimeAuthorityStoreError(
        "IO_FAILURE",
        "Unable to read FINORA portable runtime authority.",
      );
    }

    const actualBytes =
      Buffer.byteLength(
        serialized,
        "utf8",
      );

    if (
      actualBytes <= 0 ||
      actualBytes >
        FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_MAX_BYTES
    ) {
      throw new FinoraPortableFreshDeviceRuntimeAuthorityStoreError(
        "INVALID_STORAGE",
        "FINORA portable runtime-authority serialized size is invalid.",
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
      throw new FinoraPortableFreshDeviceRuntimeAuthorityStoreError(
        "INVALID_STORAGE",
        "FINORA portable runtime-authority file is malformed.",
      );
    }

    try {
      validateFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
        parsed,
      );
    }
    catch {
      throw new FinoraPortableFreshDeviceRuntimeAuthorityStoreError(
        "INVALID_STORAGE",
        "FINORA portable runtime-authority package is invalid.",
      );
    }

    return structuredClone(
      parsed,
    );
  }

  async write(
    storageMode:
      FinoraPortableFreshDeviceRuntimeAuthorityStorageMode,

    packageValue:
      FinoraPortableFreshDeviceRuntimeAuthorityPackageV1,
  ): Promise<void> {
    const operation =
      this.writeBarrier.then(
        () =>
          this.writeInternal(
            storageMode,
            packageValue,
          ),
        () =>
          this.writeInternal(
            storageMode,
            packageValue,
          ),
      );

    this.writeBarrier =
      operation.then(
        () =>
          undefined,
        () =>
          undefined,
      );

    return operation;
  }

  private async writeInternal(
    storageMode:
      FinoraPortableFreshDeviceRuntimeAuthorityStorageMode,

    packageValue:
      FinoraPortableFreshDeviceRuntimeAuthorityPackageV1,
  ): Promise<void> {
    try {
      validateFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
        packageValue,
      );
    }
    catch {
      throw new FinoraPortableFreshDeviceRuntimeAuthorityStoreError(
        "INVALID_STORAGE",
        "Refusing to persist an invalid FINORA portable runtime authority.",
      );
    }

    const serialized =
      JSON.stringify(
        packageValue,
      );

    const bytes =
      Buffer.byteLength(
        serialized,
        "utf8",
      );

    if (
      bytes <= 0 ||
      bytes >
        FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_MAX_BYTES
    ) {
      throw new FinoraPortableFreshDeviceRuntimeAuthorityStoreError(
        "INVALID_STORAGE",
        "FINORA portable runtime-authority serialized size is invalid.",
      );
    }

    const root =
      await this.resolveRoot(
        storageMode,
      );

    const directory =
      join(
        root,
        "FINORA",
        "auth",
      );

    const filePath =
      getFinoraPortableFreshDeviceRuntimeAuthorityFilePath(
        root,
      );

    const temporaryPath =
      `${filePath}.tmp-${process.pid}-${randomUUID()}`;

    try {
      await mkdir(
        directory,
        {
          recursive:
            true,

          mode:
            0o700,
        },
      );

      await writeFile(
        temporaryPath,
        serialized,
        {
          encoding:
            "utf8",

          mode:
            0o600,

          flag:
            "wx",
        },
      );

      try {
        await rename(
          temporaryPath,
          filePath,
        );
      }
      catch {
        await rm(
          filePath,
          {
            force:
              true,
          },
        );

        await rename(
          temporaryPath,
          filePath,
        );
      }
    }
    catch (
      error
    ) {
      throw new FinoraPortableFreshDeviceRuntimeAuthorityStoreError(
        "IO_FAILURE",
        error instanceof Error
          ? error.message
          : "Unable to persist FINORA portable runtime authority.",
      );
    }
    finally {
      await rm(
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
}