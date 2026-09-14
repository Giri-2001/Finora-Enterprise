// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH NATIVE STORE
// VERSION : 1.0
// STATUS  : Native Storage Foundation
// ============================================================

import {
  Buffer,
} from "node:buffer";

import {
  mkdir,
  open,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  randomUUID,
} from "node:crypto";

import {
  join,
} from "node:path";

import {
  parseFinoraPortableBranchAuthEnvelopeV1,
  serializeFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthContract.js";

// ============================================================
// PHYSICAL CONTRACT
// ============================================================

export const FINORA_PORTABLE_BRANCH_AUTH_DIRECTORY =
  "FINORA";

export const FINORA_PORTABLE_BRANCH_AUTH_SUBDIRECTORY =
  "auth";

export const FINORA_PORTABLE_BRANCH_AUTH_FILE_NAME =
  "finora-branch-auth.bin";

export const FINORA_PORTABLE_BRANCH_AUTH_MAX_SERIALIZED_BYTES =
  128 * 1024;

// ============================================================
// TYPES
// ============================================================

export type FinoraPortableBranchAuthStorageMode =
  | "LOCAL"
  | "USB";

export type FinoraPortableBranchAuthEnsureResult =
  | "WRITTEN"
  | "ALREADY_MATCHED";

export type FinoraPortableBranchAuthReplaceResult =
  | "REPLACED"
  | "ALREADY_MATCHED";

export interface FinoraPortableBranchAuthStoreDependencies {
  resolveLocalRoot:
    () => string | null | undefined;

  resolveUsbRoot:
    () => Promise<string | null | undefined>;
}

export type FinoraPortableBranchAuthStoreErrorCode =
  | "STORAGE_UNAVAILABLE"
  | "INVALID_STORAGE"
  | "IO_FAILURE";

export class FinoraPortableBranchAuthStoreError
  extends Error {
  readonly code:
    FinoraPortableBranchAuthStoreErrorCode;

  constructor(
    code:
      FinoraPortableBranchAuthStoreErrorCode,
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      "FinoraPortableBranchAuthStoreError";

    this.code =
      code;
  }
}

// ============================================================
// INTERNAL HELPERS
// ============================================================

function normalizeRoot(
  value:
    string | null | undefined,
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length === 0
    ? null
    : normalized;
}

function getErrorCode(
  error:
    unknown,
): string | null {
  if (
    !error ||
    typeof error !== "object" ||
    !("code" in error)
  ) {
    return null;
  }

  const code =
    (error as {
      code?: unknown;
    }).code;

  return typeof code === "string"
    ? code
    : null;
}

function buildPortableAuthDirectory(
  root:
    string,
): string {
  return join(
    root,
    FINORA_PORTABLE_BRANCH_AUTH_DIRECTORY,
    FINORA_PORTABLE_BRANCH_AUTH_SUBDIRECTORY,
  );
}

function buildPortableAuthFilePath(
  root:
    string,
): string {
  return join(
    buildPortableAuthDirectory(
      root,
    ),
    FINORA_PORTABLE_BRANCH_AUTH_FILE_NAME,
  );
}

async function readBoundedPortableAuthFile(
  filePath:
    string,
): Promise<Buffer | null> {
  let handle:
    Awaited<ReturnType<typeof open>>;

  try {
    handle =
      await open(
        filePath,
        "r",
      );
  }
  catch (
    error
  ) {
    if (
      getErrorCode(
        error,
      ) === "ENOENT"
    ) {
      return null;
    }

    throw error;
  }

  try {
    const fileStat =
      await handle.stat();

    if (
      !fileStat.isFile()
    ) {
      throw new FinoraPortableBranchAuthStoreError(
        "INVALID_STORAGE",
        "Portable Branch Auth path is not a regular file.",
      );
    }

    if (
      !Number.isSafeInteger(
        fileStat.size,
      ) ||
      fileStat.size <= 0 ||
      fileStat.size >
        FINORA_PORTABLE_BRANCH_AUTH_MAX_SERIALIZED_BYTES
    ) {
      throw new FinoraPortableBranchAuthStoreError(
        "INVALID_STORAGE",
        "Portable Branch Auth file size is invalid.",
      );
    }

    const buffer =
      Buffer.alloc(
        fileStat.size,
      );

    let offset =
      0;

    while (
      offset <
        buffer.length
    ) {
      const result =
        await handle.read(
          buffer,
          offset,
          buffer.length -
            offset,
          offset,
        );

      if (
        result.bytesRead <=
          0
      ) {
        throw new FinoraPortableBranchAuthStoreError(
          "INVALID_STORAGE",
          "Portable Branch Auth file ended unexpectedly.",
        );
      }

      offset +=
        result.bytesRead;
    }

    const growthProbe =
      Buffer.alloc(
        1,
      );

    const growthResult =
      await handle.read(
        growthProbe,
        0,
        1,
        buffer.length,
      );

    if (
      growthResult.bytesRead !==
        0
    ) {
      throw new FinoraPortableBranchAuthStoreError(
        "INVALID_STORAGE",
        "Portable Branch Auth file changed while being read.",
      );
    }

    return buffer;
  }
  finally {
    await handle.close();
  }
}

function decodePortableAuthUtf8(
  buffer:
    Buffer,
): string {
  const serialized =
    buffer.toString(
      "utf8",
    );

  const canonicalBytes =
    Buffer.from(
      serialized,
      "utf8",
    );

  if (
    !canonicalBytes.equals(
      buffer,
    )
  ) {
    throw new FinoraPortableBranchAuthStoreError(
      "INVALID_STORAGE",
      "Portable Branch Auth file contains invalid UTF-8.",
    );
  }

  return serialized;
}

// ============================================================
// STORE
// ============================================================

export class FinoraPortableBranchAuthStore {
  private readonly dependencies:
    FinoraPortableBranchAuthStoreDependencies;

  private writeBarrier:
    Promise<void> =
      Promise.resolve();

  constructor(
    dependencies:
      FinoraPortableBranchAuthStoreDependencies,
  ) {
    this.dependencies =
      dependencies;
  }

  // ==========================================================
  // ROOT AUTHORITY
  // ==========================================================

  private async resolveRoot(
    storageMode:
      FinoraPortableBranchAuthStorageMode,
  ): Promise<string> {
    if (
      storageMode ===
        "LOCAL"
    ) {
      const localRoot =
        normalizeRoot(
          this.dependencies
            .resolveLocalRoot(),
        );

      if (
        !localRoot
      ) {
        throw new FinoraPortableBranchAuthStoreError(
          "STORAGE_UNAVAILABLE",
          "FINORA LOCAL Portable Branch Auth root is unavailable.",
        );
      }

      return localRoot;
    }

    if (
      storageMode !==
        "USB"
    ) {
      throw new FinoraPortableBranchAuthStoreError(
        "INVALID_STORAGE",
        "Portable Branch Auth storage mode is invalid.",
      );
    }

    const usbRoot =
      normalizeRoot(
        await this.dependencies
          .resolveUsbRoot(),
      );

    if (
      !usbRoot
    ) {
      throw new FinoraPortableBranchAuthStoreError(
        "STORAGE_UNAVAILABLE",
        "FINORA Pendrive is disconnected.",
      );
    }

    return usbRoot;
  }

  // ==========================================================
  // READ
  // ==========================================================

  async read(
    storageMode:
      FinoraPortableBranchAuthStorageMode,
  ): Promise<
    FinoraPortableBranchAuthEnvelopeV1 | null
  > {
    await this.writeBarrier;

    const root =
      await this.resolveRoot(
        storageMode,
      );

    const filePath =
      buildPortableAuthFilePath(
        root,
      );

    let raw:
      Buffer | null;

    try {
      raw =
        await readBoundedPortableAuthFile(
          filePath,
        );
    }
    catch (
      error
    ) {
      if (
        error instanceof
          FinoraPortableBranchAuthStoreError
      ) {
        throw error;
      }

      throw new FinoraPortableBranchAuthStoreError(
        "IO_FAILURE",
        "Unable to read Portable Branch Auth state.",
      );
    }

    if (
      raw === null
    ) {
      return null;
    }

    const serialized =
      decodePortableAuthUtf8(
        raw,
      );

    try {
      return parseFinoraPortableBranchAuthEnvelopeV1(
        serialized,
      );
    }
    catch {
      throw new FinoraPortableBranchAuthStoreError(
        "INVALID_STORAGE",
        "Portable Branch Auth state failed strict validation.",
      );
    }
  }

  // ==========================================================
  // ENSURE EXACT
  //
  // Crash-recovery enrollment semantics:
  //
  // - missing file      => persist prepared envelope
  // - same envelope     => idempotent success
  // - different envelope=> fail closed, never overwrite here
  //
  // The read/decision/write sequence is serialized through the
  // same store write barrier. Production enrollment must use
  // this method instead of write().
  // ==========================================================

  async ensureExact(
    storageMode:
      FinoraPortableBranchAuthStorageMode,
    envelope:
      FinoraPortableBranchAuthEnvelopeV1,
  ): Promise<
    FinoraPortableBranchAuthEnsureResult
  > {
    const operation =
      this.writeBarrier.then(
        () =>
          this.ensureExactInternal(
            storageMode,
            envelope,
          ),
        () =>
          this.ensureExactInternal(
            storageMode,
            envelope,
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

  private async ensureExactInternal(
    storageMode:
      FinoraPortableBranchAuthStorageMode,
    envelope:
      FinoraPortableBranchAuthEnvelopeV1,
  ): Promise<
    FinoraPortableBranchAuthEnsureResult
  > {
    const expectedSerialized =
      serializeFinoraPortableBranchAuthEnvelopeV1(
        envelope,
      );

    const root =
      await this.resolveRoot(
        storageMode,
      );

    const filePath =
      buildPortableAuthFilePath(
        root,
      );

    let raw:
      Buffer | null;

    try {
      raw =
        await readBoundedPortableAuthFile(
          filePath,
        );
    }
    catch (
      error
    ) {
      if (
        error instanceof
          FinoraPortableBranchAuthStoreError
      ) {
        throw error;
      }

      throw new FinoraPortableBranchAuthStoreError(
        "IO_FAILURE",
        "Unable to inspect existing Portable Branch Auth state.",
      );
    }

    if (
      raw !==
        null
    ) {
      let existingEnvelope:
        FinoraPortableBranchAuthEnvelopeV1;

      try {
        existingEnvelope =
          parseFinoraPortableBranchAuthEnvelopeV1(
            decodePortableAuthUtf8(
              raw,
            ),
          );
      }
      catch {
        throw new FinoraPortableBranchAuthStoreError(
          "INVALID_STORAGE",
          "Existing Portable Branch Auth state failed strict validation.",
        );
      }

      const existingSerialized =
        serializeFinoraPortableBranchAuthEnvelopeV1(
          existingEnvelope,
        );

      if (
        existingSerialized ===
          expectedSerialized
      ) {
        return "ALREADY_MATCHED";
      }

      throw new FinoraPortableBranchAuthStoreError(
        "INVALID_STORAGE",
        "Existing Portable Branch Auth state conflicts with the prepared enrollment transaction.",
      );
    }

    await this.writeInternal(
      storageMode,
      envelope,
    );

    return "WRITTEN";
  }
  // ==========================================================
  // REPLACE EXACT
  //
  // Rotation compare-and-replace semantics:
  //
  // - current == replacement -> idempotent ALREADY_MATCHED
  // - current == expected    -> atomically persist replacement
  // - missing / malformed / unexpected current -> fail closed
  //
  // The full read / compare / write sequence executes inside
  // the same in-process Portable Auth Store write barrier.
  // ==========================================================

  async replaceExact(
    storageMode:
      FinoraPortableBranchAuthStorageMode,
    expectedCurrentEnvelope:
      FinoraPortableBranchAuthEnvelopeV1,
    replacementEnvelope:
      FinoraPortableBranchAuthEnvelopeV1,
  ): Promise<
    FinoraPortableBranchAuthReplaceResult
  > {
    const operation =
      this.writeBarrier.then(
        () =>
          this.replaceExactInternal(
            storageMode,
            expectedCurrentEnvelope,
            replacementEnvelope,
          ),
        () =>
          this.replaceExactInternal(
            storageMode,
            expectedCurrentEnvelope,
            replacementEnvelope,
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

  private async replaceExactInternal(
    storageMode:
      FinoraPortableBranchAuthStorageMode,
    expectedCurrentEnvelope:
      FinoraPortableBranchAuthEnvelopeV1,
    replacementEnvelope:
      FinoraPortableBranchAuthEnvelopeV1,
  ): Promise<
    FinoraPortableBranchAuthReplaceResult
  > {
    const expectedCurrentSerialized =
      serializeFinoraPortableBranchAuthEnvelopeV1(
        expectedCurrentEnvelope,
      );

    const replacementSerialized =
      serializeFinoraPortableBranchAuthEnvelopeV1(
        replacementEnvelope,
      );

    const root =
      await this.resolveRoot(
        storageMode,
      );

    const filePath =
      buildPortableAuthFilePath(
        root,
      );

    let raw:
      Buffer | null;

    try {
      raw =
        await readBoundedPortableAuthFile(
          filePath,
        );
    }
    catch (
      error
    ) {
      if (
        error instanceof
          FinoraPortableBranchAuthStoreError
      ) {
        throw error;
      }

      throw new FinoraPortableBranchAuthStoreError(
        "IO_FAILURE",
        "Unable to inspect current Portable Branch Auth state for replacement.",
      );
    }

    if (raw === null) {
      throw new FinoraPortableBranchAuthStoreError(
        "INVALID_STORAGE",
        "Portable Branch Auth replacement requires an existing current state.",
      );
    }

    let currentEnvelope:
      FinoraPortableBranchAuthEnvelopeV1;

    try {
      currentEnvelope =
        parseFinoraPortableBranchAuthEnvelopeV1(
          decodePortableAuthUtf8(
            raw,
          ),
        );
    }
    catch {
      throw new FinoraPortableBranchAuthStoreError(
        "INVALID_STORAGE",
        "Current Portable Branch Auth state failed strict validation during replacement.",
      );
    }

    const currentSerialized =
      serializeFinoraPortableBranchAuthEnvelopeV1(
        currentEnvelope,
      );

    if (
      currentSerialized ===
        replacementSerialized
    ) {
      return "ALREADY_MATCHED";
    }

    if (
      currentSerialized !==
        expectedCurrentSerialized
    ) {
      throw new FinoraPortableBranchAuthStoreError(
        "INVALID_STORAGE",
        "Current Portable Branch Auth state does not match the expected rotation predecessor.",
      );
    }

    await this.writeInternal(
      storageMode,
      replacementEnvelope,
    );

    return "REPLACED";
  }

  // ==========================================================
  // WRITE
  // ==========================================================

  async write(
    storageMode:
      FinoraPortableBranchAuthStorageMode,
    envelope:
      FinoraPortableBranchAuthEnvelopeV1,
  ): Promise<void> {
    const operation =
      this.writeBarrier.then(
        () =>
          this.writeInternal(
            storageMode,
            envelope,
          ),
        () =>
          this.writeInternal(
            storageMode,
            envelope,
          ),
      );

    this.writeBarrier =
      operation.catch(
        () =>
          undefined,
      );

    return operation;
  }

  private async writeInternal(
    storageMode:
      FinoraPortableBranchAuthStorageMode,
    envelope:
      FinoraPortableBranchAuthEnvelopeV1,
  ): Promise<void> {
    const serialized =
      serializeFinoraPortableBranchAuthEnvelopeV1(
        envelope,
      );

    const serializedBytes =
      Buffer.byteLength(
        serialized,
        "utf8",
      );

    if (
      serializedBytes <=
        0 ||
      serializedBytes >
        FINORA_PORTABLE_BRANCH_AUTH_MAX_SERIALIZED_BYTES
    ) {
      throw new FinoraPortableBranchAuthStoreError(
        "INVALID_STORAGE",
        "Portable Branch Auth serialized size is invalid.",
      );
    }

    const root =
      await this.resolveRoot(
        storageMode,
      );

    const authDirectory =
      buildPortableAuthDirectory(
        root,
      );

    const filePath =
      buildPortableAuthFilePath(
        root,
      );

    try {
      await mkdir(
        authDirectory,
        {
          recursive:
            true,

          mode:
            0o700,
        },
      );
    }
    catch {
      throw new FinoraPortableBranchAuthStoreError(
        "IO_FAILURE",
        "Unable to prepare Portable Branch Auth directory.",
      );
    }

    const temporaryPath =
      `${filePath}.${randomUUID()}.tmp`;

    try {
      await writeFile(
        temporaryPath,
        serialized,
        {
          encoding:
            "utf8",

          flag:
            "wx",

          mode:
            0o600,
        },
      );

      await rename(
        temporaryPath,
        filePath,
      );
    }
    catch {
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
        // Preserve the original storage failure.
      }

      throw new FinoraPortableBranchAuthStoreError(
        "IO_FAILURE",
        "Unable to persist Portable Branch Auth state.",
      );
    }
  }
}

// ============================================================
// END
// ============================================================