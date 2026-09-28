// ============================================================
// FINORA ENTERPRISE
// PORTABLE STATE EXPORT TRANSACTION STORE
//
// PURPOSE:
// - Persist one pending Portable State export transaction.
// - Survive a crash between durable transfer-file rename and
//   lineage Head commit.
// - Keep signed envelope + target path encrypted at rest.
// - Never persist the Transfer Code.
//
// AUTHORITY:
// - Main-process only.
// - safeStorage encrypted.
// - One pending transaction at a time.
// - Strict schema.
// - Atomic temp-file -> rename persistence.
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
  app,
  safeStorage,
} from "electron";


const STORE_FORMAT =
  "FINORA_CONTROL_CENTER_PORTABLE_STATE_EXPORT_TRANSACTION" as const;

const STORE_SCHEMA_VERSION =
  1 as const;

const STORE_FILE_NAME =
  "finora-control-center-portable-state-export-transaction.bin";

const MAX_STORE_BYTES =
  48 * 1024 * 1024;

const MAX_SERIALIZED_ENVELOPE_BYTES =
  40 * 1024 * 1024;

const MAX_TARGET_PATH_LENGTH =
  32768;

const CANONICAL_SHA256 =
  /^[0-9a-f]{64}$/;


export interface FinoraControlCenterPortableStateExportTransactionRecord {
  readonly format:
    typeof STORE_FORMAT;

  readonly schemaVersion:
    typeof STORE_SCHEMA_VERSION;

  readonly transactionId:
    string;

  readonly issuerId:
    string;

  readonly signingKeyId:
    string;

  readonly stateGeneration:
    number;

  readonly parentPayloadSha256:
    string | null;

  readonly payloadSha256:
    string;

  readonly targetPath:
    string;

  readonly transferBundleSha256:
    string;

  readonly serializedEnvelope:
    string;

  readonly createdAt:
    string;
}


export interface PrepareFinoraControlCenterPortableStateExportTransactionInput {
  readonly issuerId:
    string;

  readonly signingKeyId:
    string;

  readonly stateGeneration:
    number;

  readonly parentPayloadSha256:
    string | null;

  readonly payloadSha256:
    string;

  readonly targetPath:
    string;

  readonly transferBundleSha256:
    string;

  readonly serializedEnvelope:
    string;
}


export interface ClearFinoraControlCenterPortableStateExportTransactionResult {
  readonly status:
    "CLEARED" | "ALREADY_CLEAR";
}


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


function isNonEmptyString(
  value:
    unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.length >
      0 &&
    value ===
      value.trim()
  );
}


function isCanonicalTimestamp(
  value:
    unknown,
): value is string {

  if (
    typeof value !==
      "string"
  ) {

    return false;
  }

  try {

    return (
      new Date(
        value,
      ).toISOString() ===
        value
    );
  } catch {

    return false;
  }
}


function assertExactKeys(
  value:
    Record<string, unknown>,
  expected:
    readonly string[],
): void {

  const actual =
    Object.keys(
      value,
    ).sort();

  const sortedExpected =
    [
      ...expected,
    ].sort();

  if (
    actual.length !==
      sortedExpected.length ||
    !actual.every(
      (
        key,
        index,
      ) =>
        key ===
          sortedExpected[index],
    )
  ) {

    throw new Error(
      "FINORA Portable State export transaction contains unsupported fields.",
    );
  }
}


function assertRecord(
  value:
    unknown,
): asserts value is FinoraControlCenterPortableStateExportTransactionRecord {

  if (!isRecord(value)) {

    throw new Error(
      "FINORA Portable State export transaction must be an object.",
    );
  }

  assertExactKeys(
    value,
    [
      "createdAt",
      "format",
      "issuerId",
      "parentPayloadSha256",
      "payloadSha256",
      "schemaVersion",
      "serializedEnvelope",
      "signingKeyId",
      "stateGeneration",
      "targetPath",
      "transactionId",
      "transferBundleSha256",
    ],
  );

  if (
    value.format !==
      STORE_FORMAT ||
    value.schemaVersion !==
      STORE_SCHEMA_VERSION ||
    !isNonEmptyString(
      value.transactionId,
    ) ||
    !isNonEmptyString(
      value.issuerId,
    ) ||
    !isNonEmptyString(
      value.signingKeyId,
    ) ||
    !Number.isSafeInteger(
      value.stateGeneration,
    ) ||
    (
      value.stateGeneration as number
    ) <=
      0 ||
    (
      value.parentPayloadSha256 !==
        null &&
      (
        typeof value.parentPayloadSha256 !==
          "string" ||
        !CANONICAL_SHA256.test(
          value.parentPayloadSha256,
        )
      )
    ) ||
    typeof value.payloadSha256 !==
      "string" ||
    !CANONICAL_SHA256.test(
      value.payloadSha256,
    ) ||
    !isNonEmptyString(
      value.targetPath,
    ) ||
    (
      value.targetPath as string
    ).length >
      MAX_TARGET_PATH_LENGTH ||
    typeof value.transferBundleSha256 !==
      "string" ||
    !CANONICAL_SHA256.test(
      value.transferBundleSha256,
    ) ||
    typeof value.serializedEnvelope !==
      "string" ||
    Buffer.byteLength(
      value.serializedEnvelope,
      "utf8",
    ) <=
      0 ||
    Buffer.byteLength(
      value.serializedEnvelope,
      "utf8",
    ) >
      MAX_SERIALIZED_ENVELOPE_BYTES ||
    !isCanonicalTimestamp(
      value.createdAt,
    )
  ) {

    throw new Error(
      "FINORA Portable State export transaction is invalid.",
    );
  }
}


function cloneRecord(
  record:
    FinoraControlCenterPortableStateExportTransactionRecord,
): FinoraControlCenterPortableStateExportTransactionRecord {

  return {
    ...record,
  };
}


function getStorePath():
  string {

  return join(
    app.getPath(
      "userData",
    ),
    "FINORA",
    "control-center",
    STORE_FILE_NAME,
  );
}


function assertSecureStorage():
  void {

  if (
    !safeStorage.isEncryptionAvailable()
  ) {

    throw new Error(
      "FINORA secure Portable State export transaction storage is unavailable.",
    );
  }
}


async function readPendingInternal():
  Promise<
    FinoraControlCenterPortableStateExportTransactionRecord | undefined
  > {

  assertSecureStorage();

  const storePath =
    getStorePath();

  let encrypted:
    Buffer;

  try {

    encrypted =
      await readFile(
        storePath,
      );
  } catch (
    error
  ) {

    const code =
      (
        error as NodeJS.ErrnoException
      ).code;

    if (
      code ===
        "ENOENT"
    ) {

      return undefined;
    }

    throw error;
  }

  if (
    encrypted.length <=
      0 ||
    encrypted.length >
      MAX_STORE_BYTES
  ) {

    throw new Error(
      "FINORA Portable State export transaction store size is invalid.",
    );
  }

  let serialized:
    string;

  try {

    serialized =
      safeStorage.decryptString(
        encrypted,
      );
  } catch {

    throw new Error(
      "FINORA Portable State export transaction store cannot be decrypted.",
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
      "FINORA Portable State export transaction store contains malformed JSON.",
    );
  }

  assertRecord(
    parsed,
  );

  return cloneRecord(
    parsed,
  );
}


async function writePendingInternal(
  record:
    FinoraControlCenterPortableStateExportTransactionRecord,
): Promise<void> {

  assertSecureStorage();

  assertRecord(
    record,
  );

  const storePath =
    getStorePath();

  await mkdir(
    dirname(
      storePath,
    ),
    {
      recursive:
        true,
    },
  );

  const serialized =
    JSON.stringify(
      record,
    );

  const encrypted =
    safeStorage.encryptString(
      serialized,
    );

  if (
    encrypted.length <=
      0 ||
    encrypted.length >
      MAX_STORE_BYTES
  ) {

    throw new Error(
      "FINORA Portable State export transaction encrypted store size is invalid.",
    );
  }

  const temporaryPath =
    `${storePath}.${process.pid}.${randomUUID()}.tmp`;

  let temporaryCreated =
    false;

  try {

    await writeFile(
      temporaryPath,
      encrypted,
      {
        flag:
          "wx",
      },
    );

    temporaryCreated =
      true;

    await rename(
      temporaryPath,
      storePath,
    );

    temporaryCreated =
      false;
  } finally {

    if (temporaryCreated) {

      await rm(
        temporaryPath,
        {
          force:
            true,
        },
      );
    }
  }
}


let mutationQueue:
  Promise<void> =
    Promise.resolve();


function runSerialized<T>(
  operation:
    () => Promise<T>,
): Promise<T> {

  const run =
    mutationQueue.then(
      operation,
      operation,
    );

  mutationQueue =
    run.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return run;
}


export function loadFinoraControlCenterPortableStateExportTransaction():
  Promise<
    FinoraControlCenterPortableStateExportTransactionRecord | undefined
  > {

  return runSerialized(
    async () => {

      const record =
        await readPendingInternal();

      return record
        ? cloneRecord(
            record,
          )
        : undefined;
    },
  );
}


export function prepareFinoraControlCenterPortableStateExportTransaction(
  input:
    PrepareFinoraControlCenterPortableStateExportTransactionInput,
): Promise<
  FinoraControlCenterPortableStateExportTransactionRecord
> {

  return runSerialized(
    async () => {

      const existing =
        await readPendingInternal();

      if (existing) {

        throw new Error(
          "FINORA Portable State pending export transaction already exists.",
        );
      }

      const record:
        FinoraControlCenterPortableStateExportTransactionRecord = {
          format:
            STORE_FORMAT,

          schemaVersion:
            STORE_SCHEMA_VERSION,

          transactionId:
            `FINORA-PS-EXPORT-${randomUUID()}`,

          issuerId:
            input.issuerId,

          signingKeyId:
            input.signingKeyId,

          stateGeneration:
            input.stateGeneration,

          parentPayloadSha256:
            input.parentPayloadSha256,

          payloadSha256:
            input.payloadSha256,

          targetPath:
            input.targetPath,

          transferBundleSha256:
            input.transferBundleSha256,

          serializedEnvelope:
            input.serializedEnvelope,

          createdAt:
            new Date()
              .toISOString(),
        };

      assertRecord(
        record,
      );

      await writePendingInternal(
        record,
      );

      const persisted =
        await readPendingInternal();

      if (
        !persisted ||
        JSON.stringify(
          persisted,
        ) !==
          JSON.stringify(
            record,
          )
      ) {

        throw new Error(
          "FINORA Portable State pending export transaction did not persist exactly.",
        );
      }

      return cloneRecord(
        persisted,
      );
    },
  );
}


export function clearFinoraControlCenterPortableStateExportTransaction(
  expectedTransactionId:
    string,
): Promise<
  ClearFinoraControlCenterPortableStateExportTransactionResult
> {

  return runSerialized(
    async () => {

      if (
        !isNonEmptyString(
          expectedTransactionId,
        )
      ) {

        throw new Error(
          "FINORA Portable State export transaction ID is required.",
        );
      }

      const current =
        await readPendingInternal();

      if (!current) {

        return {
          status:
            "ALREADY_CLEAR",
        };
      }

      if (
        current.transactionId !==
          expectedTransactionId
      ) {

        throw new Error(
          "FINORA Portable State pending export transaction ID does not match.",
        );
      }

      await rm(
        getStorePath(),
        {
          force:
            false,
        },
      );

      const after =
        await readPendingInternal();

      if (after) {

        throw new Error(
          "FINORA Portable State pending export transaction was not cleared.",
        );
      }

      return {
        status:
          "CLEARED",
      };
    },
  );
}