/* ===========================================================
   FINORA ENTERPRISE OS™

   CLOCK HIGH-WATER STORE

   MODULE  : Control Plane
   LAYER   : Main-Process Persistence
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Persist installation-local wall-clock high-water state
   - Protect the complete record with Electron safeStorage
   - Validate a strict versioned persistence schema
   - Preserve the installationId carried by the authority layer
   - Persist the highest accepted wall-clock timestamp
   - Replace the encrypted record through temp-file rename

   IMPORTANT:

   - This module does not read the current wall clock.
   - This module does not decide whether clock rollback occurred.
   - This module does not resolve authoritative installation identity.
   - This module exposes no renderer or IPC surface.
   - Higher-level authority must enforce monotonic clock policy.
   - safeStorage protects confidentiality at rest; this store alone
     does not provide arbitrary historical-file rollback resistance.
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
  "finora";

const DIRECTORY_CONTROL =
  "control";

const CLOCK_HIGH_WATER_FILE_NAME =
  "finora-clock-high-water.bin";

const CLOCK_HIGH_WATER_SCHEMA_VERSION =
  1 as const;

// ============================================================
// STATE
// ============================================================

export interface FinoraClockHighWaterState {
  schemaVersion:
    typeof CLOCK_HIGH_WATER_SCHEMA_VERSION;

  installationId:
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

export function validateFinoraClockHighWaterState(
  value:
    unknown,
): asserts value is FinoraClockHighWaterState {
  if (
    !isRecord(
      value,
    )
  ) {
    throw new Error(
      "FINORA clock high-water state must be an object.",
    );
  }

  if (
    !hasOnlyKeys(
      value,
      [
        "schemaVersion",
        "installationId",
        "highWaterAt",
      ],
    )
  ) {
    throw new Error(
      "FINORA clock high-water state contains an invalid persistence schema.",
    );
  }

  if (
    value.schemaVersion !==
      CLOCK_HIGH_WATER_SCHEMA_VERSION
  ) {
    throw new Error(
      "FINORA clock high-water state schemaVersion is unsupported.",
    );
  }

  if (
    !isNonEmptyString(
      value.installationId,
    )
  ) {
    throw new Error(
      "FINORA clock high-water installationId is invalid.",
    );
  }

  if (
    !isCanonicalIsoTimestamp(
      value.highWaterAt,
    )
  ) {
    throw new Error(
      "FINORA clock high-water timestamp is invalid.",
    );
  }
}

// ============================================================
// PATH
// ============================================================

function getFinoraClockHighWaterStorePath():
  string {
  return join(
    app.getPath(
      "userData",
    ),
    DIRECTORY_FINORA,
    DIRECTORY_CONTROL,
    CLOCK_HIGH_WATER_FILE_NAME,
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
      "FINORA clock high-water storage is unavailable before Electron app readiness.",
    );
  }

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure clock high-water storage is unavailable on this installation.",
    );
  }
}

// ============================================================
// LOAD
// ============================================================

export async function loadFinoraClockHighWaterState():
  Promise<
    FinoraClockHighWaterState |
    undefined
  > {
  const storePath =
    getFinoraClockHighWaterStorePath();

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
      "FINORA clock high-water store is empty.",
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
      "FINORA clock high-water store could not be decrypted.",
    );
  }

  if (
    decrypted.length ===
      0
  ) {
    throw new Error(
      "FINORA clock high-water store decrypted to an empty payload.",
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
      "FINORA clock high-water store contains invalid JSON.",
    );
  }

  validateFinoraClockHighWaterState(
    parsed,
  );

  return parsed;
}

// ============================================================
// PERSIST
// ============================================================

export async function persistFinoraClockHighWaterState(
  state:
    FinoraClockHighWaterState,
): Promise<void> {
  validateFinoraClockHighWaterState(
    state,
  );

  assertSafeStorageAvailable();

  const storePath =
    getFinoraClockHighWaterStorePath();

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
      "FINORA clock high-water encryption returned an empty payload.",
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