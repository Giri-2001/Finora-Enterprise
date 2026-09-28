// ============================================================
// FINORA ENTERPRISE
// CONTROL CENTER PORTABLE STATE GENERATION STORE
//
// LAYER:
// Privileged Electron main-process persistence.
//
// PURPOSE:
// - Reserve monotonic Portable State generations.
// - Bind generation authority to one immutable issuerId.
// - Prevent stale generation reuse.
// - Protect persisted state with Electron safeStorage.
//
// IMPORTANT:
// - A crash after reservation may leave a generation gap.
// - Generation gaps are acceptable.
// - Reusing a previously reserved generation is not.
// - This module contains no renderer-controlled generation input.
// ============================================================

import {
  app,
  safeStorage,
} from "electron";

import {
  randomUUID,
} from "node:crypto";

import {
  dirname,
  join,
} from "node:path";

import {
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";


const SCHEMA_VERSION =
  1 as const;

const DIRECTORY =
  "FINORA";

const SUBDIRECTORY =
  "control-center";

const FILE_NAME =
  "finora-control-center-portable-state-generation.bin";


export interface FinoraControlCenterPortableStateGenerationState {
  readonly schemaVersion:
    typeof SCHEMA_VERSION;

  readonly issuerId:
    string;

  readonly lastReservedGeneration:
    number;

  readonly createdAt:
    string;

  readonly updatedAt:
    string;
}


export interface FinoraControlCenterPortableStateGenerationReservation {
  readonly issuerId:
    string;

  readonly generation:
    number;

  readonly reservedAt:
    string;
}


let mutationQueue:
  Promise<void> =
    Promise.resolve();


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


function isCanonicalIsoTimestamp(
  value:
    unknown,
): value is string {

  if (
    typeof value !==
      "string" ||
    value.length ===
      0
  ) {
    return false;
  }

  const parsed =
    Date.parse(
      value,
    );

  if (!Number.isFinite(parsed)) {
    return false;
  }

  return (
    new Date(
      parsed,
    ).toISOString() ===
      value
  );
}


function normalizeIssuerId(
  value:
    unknown,
): string {

  if (
    typeof value !==
      "string"
  ) {

    throw new Error(
      "FINORA Portable State generation issuerId is required.",
    );
  }

  const normalized =
    value.trim();

  if (
    normalized.length ===
      0 ||
    normalized !==
      value
  ) {

    throw new Error(
      "FINORA Portable State generation issuerId is invalid.",
    );
  }

  return normalized;
}


function validateState(
  value:
    unknown,
): FinoraControlCenterPortableStateGenerationState {

  if (!isRecord(value)) {

    throw new Error(
      "FINORA Portable State generation state must be an object.",
    );
  }

  const keys =
    Object.keys(
      value,
    ).sort();

  const expectedKeys =
    [
      "createdAt",
      "issuerId",
      "lastReservedGeneration",
      "schemaVersion",
      "updatedAt",
    ].sort();

  if (
    keys.length !==
      expectedKeys.length ||
    keys.some(
      (
        key,
        index,
      ) =>
        key !==
          expectedKeys[index],
    )
  ) {

    throw new Error(
      "FINORA Portable State generation state contains an invalid persistence schema.",
    );
  }

  if (
    value.schemaVersion !==
      SCHEMA_VERSION
  ) {

    throw new Error(
      "FINORA Portable State generation schemaVersion is unsupported.",
    );
  }

  const issuerId =
    normalizeIssuerId(
      value.issuerId,
    );

  if (
    typeof value.lastReservedGeneration !==
      "number" ||
    !Number.isSafeInteger(
      value.lastReservedGeneration,
    ) ||
    value.lastReservedGeneration <
      1
  ) {

    throw new Error(
      "FINORA Portable State lastReservedGeneration is invalid.",
    );
  }

  if (
    !isCanonicalIsoTimestamp(
      value.createdAt,
    ) ||
    !isCanonicalIsoTimestamp(
      value.updatedAt,
    )
  ) {

    throw new Error(
      "FINORA Portable State generation timestamps are invalid.",
    );
  }

  if (
    Date.parse(
      value.updatedAt,
    ) <
    Date.parse(
      value.createdAt,
    )
  ) {

    throw new Error(
      "FINORA Portable State generation updatedAt precedes createdAt.",
    );
  }

  return {
    schemaVersion:
      SCHEMA_VERSION,

    issuerId,

    lastReservedGeneration:
      value.lastReservedGeneration,

    createdAt:
      value.createdAt,

    updatedAt:
      value.updatedAt,
  };
}


function assertAppReady():
  void {

  if (!app.isReady()) {

    throw new Error(
      "FINORA Portable State generation authority cannot be used before Electron is ready.",
    );
  }
}


function assertSafeStorageAvailable():
  void {

  if (
    !safeStorage.isEncryptionAvailable()
  ) {

    throw new Error(
      "FINORA Portable State generation authority requires Electron safeStorage.",
    );
  }
}


function getStorePath():
  string {

  assertAppReady();

  return join(
    app.getPath(
      "userData",
    ),
    DIRECTORY,
    SUBDIRECTORY,
    FILE_NAME,
  );
}


async function readState():
  Promise<
    FinoraControlCenterPortableStateGenerationState |
    undefined
  > {

  const storePath =
    getStorePath();

  let encrypted:
    Buffer;

  try {

    encrypted =
      await readFile(
        storePath,
      );
  } catch (error) {

    const code =
      (
        error as
          NodeJS.ErrnoException
      ).code;

    if (code === "ENOENT") {
      return undefined;
    }

    throw error;
  }

  if (
    encrypted.byteLength <=
      0
  ) {

    throw new Error(
      "FINORA Portable State generation store is empty.",
    );
  }

  assertSafeStorageAvailable();

  let decrypted:
    string;

  try {

    decrypted =
      safeStorage.decryptString(
        encrypted,
      );
  } catch {

    throw new Error(
      "FINORA Portable State generation store could not be decrypted.",
    );
  }

  let parsed:
    unknown;

  try {

    parsed =
      JSON.parse(
        decrypted,
      );
  } catch {

    throw new Error(
      "FINORA Portable State generation store contains invalid JSON.",
    );
  }

  return validateState(
    parsed,
  );
}


async function writeState(
  state:
    FinoraControlCenterPortableStateGenerationState,
): Promise<void> {

  const validated =
    validateState(
      state,
    );

  assertSafeStorageAvailable();

  const storePath =
    getStorePath();

  const parentDirectory =
    dirname(
      storePath,
    );

  await mkdir(
    parentDirectory,
    {
      recursive:
        true,
    },
  );

  const encrypted =
    safeStorage.encryptString(
      JSON.stringify(
        validated,
      ),
    );

  if (
    encrypted.byteLength <=
      0
  ) {

    throw new Error(
      "FINORA Portable State generation encryption returned an empty payload.",
    );
  }

  const temporaryPath =
    `${storePath}.${randomUUID()}.tmp`;

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


function runSerialized<T>(
  operation:
    () => Promise<T>,
): Promise<T> {

  const result =
    mutationQueue.then(
      operation,
      operation,
    );

  mutationQueue =
    result.then(
      () => undefined,
      () => undefined,
    );

  return result;
}


export async function loadFinoraControlCenterPortableStateGenerationState():
  Promise<
    FinoraControlCenterPortableStateGenerationState |
    undefined
  > {

  return readState();
}


export function reserveFinoraControlCenterPortableStateGeneration(
  issuerIdInput:
    string,
): Promise<
  FinoraControlCenterPortableStateGenerationReservation
> {

  return runSerialized(
    async () => {

      const issuerId =
        normalizeIssuerId(
          issuerIdInput,
        );

      const current =
        await readState();

      if (
        current &&
        current.issuerId !==
          issuerId
      ) {

        throw new Error(
          "FINORA Portable State generation authority is bound to another issuer.",
        );
      }

      const previousGeneration =
        current
          ? current.lastReservedGeneration
          : 0;

      if (
        previousGeneration >=
          Number.MAX_SAFE_INTEGER
      ) {

        throw new Error(
          "FINORA Portable State generation authority is exhausted.",
        );
      }

      const nextGeneration =
        previousGeneration +
        1;

      const now =
        new Date().toISOString();

      const nextState:
        FinoraControlCenterPortableStateGenerationState = {
          schemaVersion:
            SCHEMA_VERSION,

          issuerId,

          lastReservedGeneration:
            nextGeneration,

          createdAt:
            current
              ? current.createdAt
              : now,

          updatedAt:
            now,
        };

      await writeState(
        nextState,
      );

      return {
        issuerId:
          nextState.issuerId,

        generation:
          nextState.lastReservedGeneration,

        reservedAt:
          nextState.updatedAt,
      };
    },
  );
}

// ============================================================
// PORTABLE STATE IMPORT GENERATION FLOOR
//
// A verified imported Portable State generation must become a
// local generation lower-bound before any later export.
//
// Semantics:
// - issuer-bound
// - monotonic only
// - lower/equal floor = exact no-op
// - fresh authority may start directly at imported generation
// - concurrent advances serialize through the existing queue
// - next reservation remains current floor + 1
// ============================================================

export type AdvanceFinoraControlCenterPortableStateGenerationFloorResult =
  | {
      readonly status:
        "ADVANCED";

      readonly state:
        FinoraControlCenterPortableStateGenerationState;
    }
  | {
      readonly status:
        "ALREADY_AT_OR_ABOVE_FLOOR";

      readonly state:
        FinoraControlCenterPortableStateGenerationState;
    };


function normalizeImportedGenerationFloor(
  value:
    unknown,
): number {

  if (
    typeof value !==
      "number" ||
    !Number.isSafeInteger(
      value,
    ) ||
    value <=
      0
  ) {

    throw new Error(
      "FINORA Portable State imported generation floor is invalid.",
    );
  }

  return value;
}


export function advanceFinoraControlCenterPortableStateGenerationFloor(
  issuerIdInput:
    string,
  minimumGenerationInput:
    number,
): Promise<
  AdvanceFinoraControlCenterPortableStateGenerationFloorResult
> {

  return runSerialized(
    async () => {

      const issuerId =
        normalizeIssuerId(
          issuerIdInput,
        );

      const minimumGeneration =
        normalizeImportedGenerationFloor(
          minimumGenerationInput,
        );

      const current =
        await readState();


      if (
        current &&
        current.issuerId !==
          issuerId
      ) {

        throw new Error(
          "FINORA Portable State generation authority is bound to another issuer.",
        );
      }


      /*
       * Imported floors are monotonic.
       *
       * Equal/lower requests MUST NOT rewrite the encrypted
       * authority file. This preserves exact no-op bytes and
       * prevents timestamps from moving on stale re-imports.
       */
      if (
        current &&
        current.lastReservedGeneration >=
          minimumGeneration
      ) {

        return {
          status:
            "ALREADY_AT_OR_ABOVE_FLOOR",

          state: {
            ...current,
          },
        };
      }


      const now =
        new Date()
          .toISOString();

      const nextState:
        FinoraControlCenterPortableStateGenerationState = {
          schemaVersion:
            SCHEMA_VERSION,

          issuerId,

          lastReservedGeneration:
            minimumGeneration,

          createdAt:
            current
              ? current.createdAt
              : now,

          updatedAt:
            now,
        };


      await writeState(
        nextState,
      );


      const persisted =
        await readState();

      if (
        !persisted ||
        persisted.issuerId !==
          issuerId ||
        persisted.lastReservedGeneration !==
          minimumGeneration ||
        persisted.createdAt !==
          nextState.createdAt ||
        persisted.updatedAt !==
          nextState.updatedAt
      ) {

        throw new Error(
          "FINORA Portable State imported generation floor did not persist exactly.",
        );
      }


      return {
        status:
          "ADVANCED",

        state: {
          ...persisted,
        },
      };
    },
  );
}
