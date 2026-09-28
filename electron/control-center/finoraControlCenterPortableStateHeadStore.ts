// ============================================================
// FINORA ENTERPRISE
// CONTROL CENTER PORTABLE STATE HEAD STORE
//
// LAYER:
// Privileged Electron main-process persistence.
//
// PURPOSE:
// - Persist the latest successfully committed Portable State head.
// - Bind one state lineage to one immutable Control Center issuer.
// - Enforce parent-payload digest continuity.
// - Reject stale and conflicting same-generation heads.
// - Permit exact idempotent re-commit.
//
// IMPORTANT:
// - This is lineage metadata only.
// - No branch/business operational records are stored here.
// - No signing private key is stored here.
// - No renderer / IPC authority.
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
  "finora-control-center-portable-state-head.bin";


export interface FinoraControlCenterPortableStateHead {
  readonly schemaVersion:
    typeof SCHEMA_VERSION;

  readonly issuerId:
    string;

  readonly headGeneration:
    number;

  readonly headPayloadSha256:
    string;
}


export interface CommitFinoraControlCenterPortableStateHeadInput {
  readonly issuerId:
    string;

  readonly generation:
    number;

  readonly payloadSha256:
    string;

  readonly parentPayloadSha256:
    string | null;
}


export type CommitFinoraControlCenterPortableStateHeadResult =
  | {
      readonly status:
        "COMMITTED";

      readonly head:
        FinoraControlCenterPortableStateHead;
    }
  | {
      readonly status:
        "ALREADY_COMMITTED";

      readonly head:
        FinoraControlCenterPortableStateHead;
    };


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


function normalizeIssuerId(
  value:
    unknown,
): string {

  if (
    typeof value !==
      "string"
  ) {

    throw new Error(
      "FINORA Portable State head issuerId is required.",
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
      "FINORA Portable State head issuerId is invalid.",
    );
  }

  return normalized;
}


function normalizeGeneration(
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
      "FINORA Portable State head generation is invalid.",
    );
  }

  return value;
}


function normalizeSha256(
  value:
    unknown,
  label:
    string,
): string {

  if (
    typeof value !==
      "string" ||
    !/^[0-9a-f]{64}$/.test(
      value,
    )
  ) {

    throw new Error(
      `FINORA Portable State ${label} must be a canonical lowercase SHA-256 digest.`,
    );
  }

  return value;
}


function normalizeNullableSha256(
  value:
    unknown,
  label:
    string,
): string | null {

  if (value === null) {
    return null;
  }

  return normalizeSha256(
    value,
    label,
  );
}


function validateHead(
  value:
    unknown,
): FinoraControlCenterPortableStateHead {

  if (!isRecord(value)) {

    throw new Error(
      "FINORA Portable State head must be an object.",
    );
  }

  const keys =
    Object.keys(
      value,
    ).sort();

  const expectedKeys =
    [
      "headGeneration",
      "headPayloadSha256",
      "issuerId",
      "schemaVersion",
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
      "FINORA Portable State head contains an invalid persistence schema.",
    );
  }

  if (
    value.schemaVersion !==
      SCHEMA_VERSION
  ) {

    throw new Error(
      "FINORA Portable State head schemaVersion is unsupported.",
    );
  }

  return {
    schemaVersion:
      SCHEMA_VERSION,

    issuerId:
      normalizeIssuerId(
        value.issuerId,
      ),

    headGeneration:
      normalizeGeneration(
        value.headGeneration,
      ),

    headPayloadSha256:
      normalizeSha256(
        value.headPayloadSha256,
        "headPayloadSha256",
      ),
  };
}


function normalizeCommitInput(
  input:
    CommitFinoraControlCenterPortableStateHeadInput,
): CommitFinoraControlCenterPortableStateHeadInput {

  if (
    !isRecord(
      input,
    )
  ) {

    throw new Error(
      "FINORA Portable State head commit input is invalid.",
    );
  }

  return {
    issuerId:
      normalizeIssuerId(
        input.issuerId,
      ),

    generation:
      normalizeGeneration(
        input.generation,
      ),

    payloadSha256:
      normalizeSha256(
        input.payloadSha256,
        "payloadSha256",
      ),

    parentPayloadSha256:
      normalizeNullableSha256(
        input.parentPayloadSha256,
        "parentPayloadSha256",
      ),
  };
}


function assertAppReady():
  void {

  if (!app.isReady()) {

    throw new Error(
      "FINORA Portable State head authority cannot be used before Electron is ready.",
    );
  }
}


function assertSafeStorageAvailable():
  void {

  if (
    !safeStorage.isEncryptionAvailable()
  ) {

    throw new Error(
      "FINORA Portable State head authority requires Electron safeStorage.",
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


async function readHead():
  Promise<
    FinoraControlCenterPortableStateHead |
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
  } catch (
    error
  ) {

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
      "FINORA Portable State head store is empty.",
    );
  }

  assertSafeStorageAvailable();

  let plaintext:
    string;

  try {

    plaintext =
      safeStorage.decryptString(
        encrypted,
      );
  } catch {

    throw new Error(
      "FINORA Portable State head store could not be decrypted.",
    );
  }

  let parsed:
    unknown;

  try {

    parsed =
      JSON.parse(
        plaintext,
      );
  } catch {

    throw new Error(
      "FINORA Portable State head store contains invalid JSON.",
    );
  }

  return validateHead(
    parsed,
  );
}


async function writeHead(
  head:
    FinoraControlCenterPortableStateHead,
): Promise<void> {

  const validated =
    validateHead(
      head,
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
      "FINORA Portable State head encryption returned an empty payload.",
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


function cloneHead(
  head:
    FinoraControlCenterPortableStateHead,
): FinoraControlCenterPortableStateHead {

  return {
    schemaVersion:
      head.schemaVersion,

    issuerId:
      head.issuerId,

    headGeneration:
      head.headGeneration,

    headPayloadSha256:
      head.headPayloadSha256,
  };
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


export async function loadFinoraControlCenterPortableStateHead():
  Promise<
    FinoraControlCenterPortableStateHead |
    undefined
  > {

  const head =
    await readHead();

  return head
    ? cloneHead(
        head,
      )
    : undefined;
}


export function commitFinoraControlCenterPortableStateHead(
  input:
    CommitFinoraControlCenterPortableStateHeadInput,
): Promise<
  CommitFinoraControlCenterPortableStateHeadResult
> {

  return runSerialized(
    async () => {

      const normalized =
        normalizeCommitInput(
          input,
        );

      const current =
        await readHead();


      // ------------------------------------------------------
      // FIRST LOCAL HEAD
      // ------------------------------------------------------

      if (!current) {

        if (
          normalized.parentPayloadSha256 !==
            null
        ) {

          throw new Error(
            "FINORA Portable State first local head must not declare a parent digest.",
          );
        }

        const firstHead:
          FinoraControlCenterPortableStateHead = {
            schemaVersion:
              SCHEMA_VERSION,

            issuerId:
              normalized.issuerId,

            headGeneration:
              normalized.generation,

            headPayloadSha256:
              normalized.payloadSha256,
          };

        await writeHead(
          firstHead,
        );

        return {
          status:
            "COMMITTED",

          head:
            cloneHead(
              firstHead,
            ),
        };
      }


      // ------------------------------------------------------
      // ISSUER BINDING
      // ------------------------------------------------------

      if (
        current.issuerId !==
          normalized.issuerId
      ) {

        throw new Error(
          "FINORA Portable State head authority is bound to another issuer.",
        );
      }


      // ------------------------------------------------------
      // EXACT IDEMPOTENT RE-COMMIT
      // ------------------------------------------------------

      if (
        normalized.generation ===
          current.headGeneration
      ) {

        if (
          normalized.payloadSha256 ===
            current.headPayloadSha256
        ) {

          return {
            status:
              "ALREADY_COMMITTED",

            head:
              cloneHead(
                current,
              ),
          };
        }

        throw new Error(
          "FINORA Portable State conflicting payload exists at the current generation.",
        );
      }


      // ------------------------------------------------------
      // STALE GENERATION
      // ------------------------------------------------------

      if (
        normalized.generation <
          current.headGeneration
      ) {

        throw new Error(
          "FINORA Portable State head generation is stale.",
        );
      }


      // ------------------------------------------------------
      // EXACT PARENT CONTINUITY
      // ------------------------------------------------------

      if (
        normalized.parentPayloadSha256 !==
          current.headPayloadSha256
      ) {

        throw new Error(
          "FINORA Portable State parent payload digest does not match the current local head.",
        );
      }


      const nextHead:
        FinoraControlCenterPortableStateHead = {
          schemaVersion:
            SCHEMA_VERSION,

          issuerId:
            current.issuerId,

          headGeneration:
            normalized.generation,

          headPayloadSha256:
            normalized.payloadSha256,
        };

      await writeHead(
        nextHead,
      );

      return {
        status:
          "COMMITTED",

        head:
          cloneHead(
            nextHead,
          ),
      };
    },
  );
}

// ============================================================
// VERIFIED IMPORTED PORTABLE STATE HEAD ADOPTION
//
// IMPORTANT:
// This is intentionally separate from normal local Head commit.
//
// Normal local commit retains its strict rule:
//   first local head => parentPayloadSha256 must be null.
//
// A fresh receiving device may legitimately import generation N
// from an already-existing signed chain, so its imported envelope
// may contain a non-null parent digest even though this device has
// no earlier local Head.
//
// CRYPTOGRAPHIC VERIFICATION IS NOT OWNED HERE.
// The caller must verify the signed Portable State envelope before
// invoking this authority.
//
// Existing local Head semantics remain strict:
// - issuer binding
// - same generation + same payload => idempotent
// - same generation + different payload => conflict
// - stale generation => reject
// - newer generation => exact current parent required
// ============================================================

export interface AdoptFinoraControlCenterPortableStateImportedHeadInput {
  readonly issuerId:
    string;

  readonly generation:
    number;

  readonly payloadSha256:
    string;

  readonly parentPayloadSha256:
    string | null;
}


export type AdoptFinoraControlCenterPortableStateImportedHeadResult =
  | {
      readonly status:
        "ADOPTED";

      readonly head:
        FinoraControlCenterPortableStateHead;
    }
  | {
      readonly status:
        "ALREADY_ADOPTED";

      readonly head:
        FinoraControlCenterPortableStateHead;
    };


export function adoptFinoraControlCenterPortableStateImportedHead(
  input:
    AdoptFinoraControlCenterPortableStateImportedHeadInput,
): Promise<
  AdoptFinoraControlCenterPortableStateImportedHeadResult
> {

  return runSerialized(
    async () => {

      const normalized =
        normalizeCommitInput(
          input,
        );

      const current =
        await readHead();


      // --------------------------------------------------------
      // FRESH RECEIVER IMPORT BOOTSTRAP
      //
      // Unlike normal local commit, a verified imported chain may
      // begin locally at generation N with a non-null parent.
      // --------------------------------------------------------

      if (!current) {

        const importedHead:
          FinoraControlCenterPortableStateHead = {
            schemaVersion:
              SCHEMA_VERSION,

            issuerId:
              normalized.issuerId,

            headGeneration:
              normalized.generation,

            headPayloadSha256:
              normalized.payloadSha256,
          };

        await writeHead(
          importedHead,
        );

        const persisted =
          await readHead();

        if (
          !persisted ||
          persisted.issuerId !==
            importedHead.issuerId ||
          persisted.headGeneration !==
            importedHead.headGeneration ||
          persisted.headPayloadSha256 !==
            importedHead.headPayloadSha256
        ) {

          throw new Error(
            "FINORA imported Portable State Head did not persist exactly.",
          );
        }

        return {
          status:
            "ADOPTED",

          head:
            cloneHead(
              persisted,
            ),
        };
      }


      // --------------------------------------------------------
      // ISSUER BINDING
      // --------------------------------------------------------

      if (
        current.issuerId !==
          normalized.issuerId
      ) {

        throw new Error(
          "FINORA Portable State head authority is bound to another issuer.",
        );
      }


      // --------------------------------------------------------
      // EXACT IDEMPOTENT RE-IMPORT / SAME-GENERATION CONFLICT
      // --------------------------------------------------------

      if (
        normalized.generation ===
          current.headGeneration
      ) {

        if (
          normalized.payloadSha256 ===
            current.headPayloadSha256
        ) {

          return {
            status:
              "ALREADY_ADOPTED",

            head:
              cloneHead(
                current,
              ),
          };
        }

        throw new Error(
          "FINORA Portable State conflicting payload exists at the current generation.",
        );
      }


      // --------------------------------------------------------
      // STALE IMPORT
      // --------------------------------------------------------

      if (
        normalized.generation <
          current.headGeneration
      ) {

        throw new Error(
          "FINORA Portable State head generation is stale.",
        );
      }


      // --------------------------------------------------------
      // EXACT PARENT CONTINUITY AFTER LOCAL HEAD EXISTS
      // --------------------------------------------------------

      if (
        normalized.parentPayloadSha256 !==
          current.headPayloadSha256
      ) {

        throw new Error(
          "FINORA Portable State parent payload digest does not match the current local head.",
        );
      }


      const nextHead:
        FinoraControlCenterPortableStateHead = {
          schemaVersion:
            SCHEMA_VERSION,

          issuerId:
            normalized.issuerId,

          headGeneration:
            normalized.generation,

          headPayloadSha256:
            normalized.payloadSha256,
        };


      await writeHead(
        nextHead,
      );


      const persisted =
        await readHead();

      if (
        !persisted ||
        persisted.issuerId !==
          nextHead.issuerId ||
        persisted.headGeneration !==
          nextHead.headGeneration ||
        persisted.headPayloadSha256 !==
          nextHead.headPayloadSha256
      ) {

        throw new Error(
          "FINORA imported Portable State Head advance did not persist exactly.",
        );
      }


      return {
        status:
          "ADOPTED",

        head:
          cloneHead(
            persisted,
          ),
      };
    },
  );
}
