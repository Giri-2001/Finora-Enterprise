/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER CLOCK HIGH-WATER STORE

   MODULE  : Control Center
   LAYER   : Privileged Main-Process Persistence
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Persist issuer-local wall-clock high-water state
   - Bind persisted state to the stable Control Center issuerId
   - Protect the complete record with Electron safeStorage
   - Validate a strict versioned persistence schema
   - Persist the highest accepted Control Center wall-clock time
   - Replace encrypted state through a unique temp-file rename

   IMPORTANT:

   - This module does not read the current wall clock.
   - This module does not decide whether rollback occurred.
   - This module does not resolve Control Center issuer identity.
   - This module does not depend on recipient installationId.
   - This module does not depend on signingKeyId.
   - This module exposes no renderer or IPC surface.
   - Higher-level authority must enforce monotonic clock policy.
   - safeStorage protects confidentiality at rest; this store alone
     does not resist replacement with an older valid encrypted file.
   - No cross-process CAS guarantee.
   - No fsync / power-loss durability claim.
=========================================================== */

import {
  randomUUID,
} from "node:crypto";

import {
  constants as fsConstants,
} from "node:fs";

import {
  access,
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

// ============================================================
// CONSTANTS
// ============================================================

const DIRECTORY_FINORA =
  "FINORA";

const DIRECTORY_CONTROL_CENTER =
  "control-center";

const CONTROL_CENTER_CLOCK_HIGH_WATER_FILE_NAME =
  "finora-control-center-clock-high-water.bin";

const CONTROL_CENTER_CLOCK_HIGH_WATER_SCHEMA_VERSION =
  1 as const;

// ============================================================
// STATE
// ============================================================

export interface FinoraControlCenterClockHighWaterState {
  schemaVersion:
    typeof CONTROL_CENTER_CLOCK_HIGH_WATER_SCHEMA_VERSION;

  issuerId:
    string;

  highWaterAt:
    string;
}

// ============================================================
// RECORD HELPERS
// ============================================================

function isRecord(
  value:
    unknown,
): value is Record<
  string,
  unknown
> {
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

function hasOnlyKeys(
  value:
    Record<
      string,
      unknown
    >,

  expectedKeys:
    readonly string[],
): boolean {

  const actualKeys =
    Object.keys(
      value,
    );

  if (
    actualKeys.length !==
    expectedKeys.length
  ) {
    return false;
  }

  const expected =
    new Set(
      expectedKeys,
    );

  return actualKeys.every(
    (
      key,
    ) =>
      expected.has(
        key,
      ),
  );
}

function isNonEmptyString(
  value:
    unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function isCanonicalIsoTimestamp(
  value:
    unknown,
): value is string {

  if (
    typeof value !==
    "string"
  ) {
    return false;
  }

  const timestamp =
    Date.parse(
      value,
    );

  if (
    !Number.isFinite(
      timestamp,
    )
  ) {
    return false;
  }

  return (
    new Date(
      timestamp,
    ).toISOString() ===
      value
  );
}

// ============================================================
// VALIDATION
// ============================================================

export function validateFinoraControlCenterClockHighWaterState(
  value:
    unknown,
): asserts value is
  FinoraControlCenterClockHighWaterState {

  if (
    !isRecord(
      value,
    )
  ) {
    throw new Error(
      "FINORA Control Center clock high-water state must be an object.",
    );
  }

  if (
    !hasOnlyKeys(
      value,
      [
        "schemaVersion",
        "issuerId",
        "highWaterAt",
      ],
    )
  ) {
    throw new Error(
      "FINORA Control Center clock high-water state contains an invalid persistence schema.",
    );
  }

  if (
    value.schemaVersion !==
      CONTROL_CENTER_CLOCK_HIGH_WATER_SCHEMA_VERSION
  ) {
    throw new Error(
      "FINORA Control Center clock high-water schemaVersion is unsupported.",
    );
  }

  if (
    !isNonEmptyString(
      value.issuerId,
    )
  ) {
    throw new Error(
      "FINORA Control Center clock high-water issuerId is invalid.",
    );
  }

  if (
    !isCanonicalIsoTimestamp(
      value.highWaterAt,
    )
  ) {
    throw new Error(
      "FINORA Control Center clock high-water timestamp is invalid.",
    );
  }
}

// ============================================================
// PATH
// ============================================================

function getFinoraControlCenterClockHighWaterStorePath():
  string {

  return join(
    app.getPath(
      "userData",
    ),
    DIRECTORY_FINORA,
    DIRECTORY_CONTROL_CENTER,
    CONTROL_CENTER_CLOCK_HIGH_WATER_FILE_NAME,
  );
}

// ============================================================
// FILE EXISTS
// ============================================================

async function fileExists(
  path:
    string,
): Promise<boolean> {

  try {
    await access(
      path,
      fsConstants.F_OK,
    );

    return true;
  } catch {
    return false;
  }
}

// ============================================================
// SAFE STORAGE
// ============================================================

function assertSafeStorageAvailable():
  void {

  if (
    !app.isReady()
  ) {
    throw new Error(
      "FINORA Control Center clock high-water storage is unavailable before Electron app readiness.",
    );
  }

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure Control Center clock high-water storage is unavailable.",
    );
  }
}

// ============================================================
// LOAD
// ============================================================

export async function loadFinoraControlCenterClockHighWaterState():
  Promise<
    FinoraControlCenterClockHighWaterState |
    undefined
  > {

  const storePath =
    getFinoraControlCenterClockHighWaterStorePath();

  if (
    !await fileExists(
      storePath,
    )
  ) {
    return undefined;
  }

  assertSafeStorageAvailable();

  const encrypted =
    await readFile(
      storePath,
    );

  if (
    encrypted.length ===
    0
  ) {
    throw new Error(
      "FINORA Control Center clock high-water store is empty.",
    );
  }

  let decrypted:
    string;

  try {
    decrypted =
      safeStorage.decryptString(
        encrypted,
      );
  } catch {
    throw new Error(
      "FINORA Control Center clock high-water store could not be decrypted.",
    );
  }

  if (
    decrypted.length ===
    0
  ) {
    throw new Error(
      "FINORA Control Center clock high-water store decrypted to an empty payload.",
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
      "FINORA Control Center clock high-water store contains invalid JSON.",
    );
  }

  validateFinoraControlCenterClockHighWaterState(
    parsed,
  );

  return parsed;
}

// ============================================================
// PERSIST
// ============================================================

export async function persistFinoraControlCenterClockHighWaterState(
  state:
    FinoraControlCenterClockHighWaterState,
): Promise<void> {

  validateFinoraControlCenterClockHighWaterState(
    state,
  );

  assertSafeStorageAvailable();

  const storePath =
    getFinoraControlCenterClockHighWaterStorePath();

  const parentDirectory =
    dirname(
      storePath,
    );

  await mkdir(
    parentDirectory,
    {
      recursive:
        true,

      mode:
        0o700,
    },
  );

  const encrypted =
    safeStorage.encryptString(
      JSON.stringify(
        state,
      ),
    );

  if (
    encrypted.length ===
    0
  ) {
    throw new Error(
      "FINORA Control Center clock high-water encryption returned an empty payload.",
    );
  }

  const temporaryPath =
    `${storePath}.${randomUUID()}.tmp`;

  try {
    await writeFile(
      temporaryPath,
      encrypted,
      {
        flag:
          "wx",

        mode:
          0o600,
      },
    );

    await rename(
      temporaryPath,
      storePath,
    );
  } catch (
    error
  ) {
    await rm(
      temporaryPath,
      {
        force:
          true,
      },
    );

    throw error;
  }
}

// ============================================================
// END
// ============================================================