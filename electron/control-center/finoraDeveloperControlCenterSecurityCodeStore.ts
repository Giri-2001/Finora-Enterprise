/* ============================================================
   FINORA ENTERPRISE OS
   DEVELOPER CONTROL CENTER SECURITY CODE STORE

   RESPONSIBILITY:
   - Persist the Developer Security Code verifier.
   - Bind the verifier to the stable Control Center issuerId.
   - Initialize only when legitimate signing authority already exists.
   - Verify the configured Security Code.
   - Change the configured Security Code after proving the old code.

   SECURITY:
   - MAIN PROCESS ONLY.
   - Plaintext Security Code is never persisted.
   - Complete record is encrypted with Electron safeStorage.
   - Persistence uses temp-file -> rename replacement.
   - Missing signing authority never causes authority creation.
   - signingKeyId is intentionally not the verifier binding identity;
     stable issuerId survives legitimate signing-key rotation.
   ============================================================ */

import {
  app,
  safeStorage,
} from "electron";

import fs from "node:fs/promises";
import path from "node:path";

import {
  createFinoraDeveloperSecurityCodeVerifier,
  validateFinoraDeveloperSecurityCodeVerifierV1,
  verifyFinoraDeveloperSecurityCode,
} from "./finoraDeveloperControlCenterSecurityCodeCrypto.js";

import type {
  FinoraDeveloperSecurityCodeVerifierV1,
} from "./finoraDeveloperControlCenterSecurityCodeCrypto.js";

import {
  readExistingFinoraControlCenterPublicAuthorityIdentity,
} from "./finoraControlCenterKeyVault.js";

export const
  FINORA_DEVELOPER_SECURITY_CODE_STORE_SCHEMA_VERSION =
    1 as const;

const STORE_DIRECTORY =
  "FINORA";

const STORE_SUBDIRECTORY =
  "developer-control-center";

const STORE_FILE =
  "finora-developer-security-code.bin";

interface FinoraDeveloperSecurityCodeStoreRecordV1 {
  schemaVersion:
    typeof FINORA_DEVELOPER_SECURITY_CODE_STORE_SCHEMA_VERSION;

  issuerId:
    string;

  verifier:
    FinoraDeveloperSecurityCodeVerifierV1;

  failedAttempts?:
    number;

  blockedUntil?:
    string;

  createdAt:
    string;

  updatedAt:
    string;
}

export interface FinoraDeveloperSecurityCodeThrottleState {
  failedAttempts:
    number;

  blockedUntilMilliseconds:
    number;
}

export type FinoraDeveloperSecurityCodeConfigurationState =
  | {
      configured:
        false;
    }
  | {
      configured:
        true;

      issuerId:
        string;

      createdAt:
        string;

      updatedAt:
        string;
    };

function getStorePath():
  string {

  if (!app.isReady()) {
    throw new Error(
      "FINORA Developer Security Code store cannot be used before Electron is ready.",
    );
  }

  return path.join(
    app.getPath(
      "userData",
    ),
    STORE_DIRECTORY,
    STORE_SUBDIRECTORY,
    STORE_FILE,
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

  return (
    Number.isFinite(
      parsed,
    ) &&
    new Date(
      parsed,
    ).toISOString() ===
      value
  );
}

function validateStoreRecord(
  value:
    unknown,
): asserts value is FinoraDeveloperSecurityCodeStoreRecordV1 {

  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "FINORA Developer Security Code store record is invalid.",
    );
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  const allowedKeys =
    [
      "blockedUntil",
      "createdAt",
      "failedAttempts",
      "issuerId",
      "schemaVersion",
      "updatedAt",
      "verifier",
    ].sort();

  const requiredKeys =
    [
      "createdAt",
      "issuerId",
      "schemaVersion",
      "updatedAt",
      "verifier",
    ].sort();

  const actualKeys =
    Object.keys(
      record,
    ).sort();

  if (
    actualKeys.some(
      (
        key,
      ) =>
        !allowedKeys.includes(
          key,
        ),
    ) ||
    requiredKeys.some(
      (
        key,
      ) =>
        !actualKeys.includes(
          key,
        ),
    )
  ) {
    throw new Error(
      "FINORA Developer Security Code store contains unsupported fields.",
    );
  }

  if (
    record.schemaVersion !==
      FINORA_DEVELOPER_SECURITY_CODE_STORE_SCHEMA_VERSION ||
    typeof record.issuerId !==
      "string" ||
    record.issuerId.trim().length ===
      0 ||
    !isCanonicalIsoTimestamp(
      record.createdAt,
    ) ||
    !isCanonicalIsoTimestamp(
      record.updatedAt,
    )
  ) {
    throw new Error(
      "FINORA Developer Security Code store metadata is invalid.",
    );
  }

  const hasFailedAttempts =
    Object.prototype.hasOwnProperty.call(
      record,
      "failedAttempts",
    );

  const hasBlockedUntil =
    Object.prototype.hasOwnProperty.call(
      record,
      "blockedUntil",
    );

  if (
    hasFailedAttempts !==
      hasBlockedUntil
  ) {
    throw new Error(
      "FINORA Developer Security Code throttle metadata is incomplete.",
    );
  }

  if (
    hasFailedAttempts &&
    (
      !Number.isSafeInteger(
        record.failedAttempts,
      ) ||
      (
        record.failedAttempts as number
      ) <
        1 ||
      !isCanonicalIsoTimestamp(
        record.blockedUntil,
      )
    )
  ) {
    throw new Error(
      "FINORA Developer Security Code throttle metadata is invalid.",
    );
  }

  validateFinoraDeveloperSecurityCodeVerifierV1(
    record.verifier,
  );
}

async function readStore():
  Promise<
    FinoraDeveloperSecurityCodeStoreRecordV1 |
    undefined
  > {

  const storePath =
    getStorePath();

  let encrypted:
    Buffer;

  try {
    encrypted =
      await fs.readFile(
        storePath,
      );
  } catch (
    error
  ) {
    const code =
      (
        error as NodeJS.ErrnoException
      ).code;

    if (code === "ENOENT") {
      return undefined;
    }

    throw error;
  }

  if (
    encrypted.length ===
    0
  ) {
    throw new Error(
      "FINORA Developer Security Code store is empty.",
    );
  }

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure Developer Security Code storage is unavailable.",
    );
  }

  let plaintext:
    string;

  try {
    plaintext =
      safeStorage.decryptString(
        encrypted,
      );
  } catch {
    throw new Error(
      "FINORA Developer Security Code store cannot be decrypted.",
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
      "FINORA Developer Security Code store contains invalid JSON.",
    );
  }

  validateStoreRecord(
    parsed,
  );

  return parsed;
}

async function writeStore(
  record:
    FinoraDeveloperSecurityCodeStoreRecordV1,
): Promise<void> {

  validateStoreRecord(
    record,
  );

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure Developer Security Code storage is unavailable. Security Code was not persisted.",
    );
  }

  const storePath =
    getStorePath();

  const directory =
    path.dirname(
      storePath,
    );

  await fs.mkdir(
    directory,
    {
      recursive:
        true,
    },
  );

  const encrypted =
    safeStorage.encryptString(
      JSON.stringify(
        record,
      ),
    );

  const temporaryPath =
    `${storePath}.${process.pid}.${Date.now()}.tmp`;

  try {
    await fs.writeFile(
      temporaryPath,
      encrypted,
      {
        mode:
          0o600,
      },
    );

    await fs.rename(
      temporaryPath,
      storePath,
    );
  } catch (
    error
  ) {
    await fs.rm(
      temporaryPath,
      {
        force:
          true,
      },
    )
      .catch(
        () =>
          undefined,
      );

    throw error;
  }
}

async function requireExistingAuthorityIssuerId():
  Promise<string> {

  const authority =
    await readExistingFinoraControlCenterPublicAuthorityIdentity();

  if (!authority) {
    throw new Error(
      "FINORA Developer Security Code requires an existing Control Center signing authority.",
    );
  }

  return authority.issuerId;
}

async function readBoundStore():
  Promise<
    FinoraDeveloperSecurityCodeStoreRecordV1 |
    undefined
  > {

  const issuerId =
    await requireExistingAuthorityIssuerId();

  const record =
    await readStore();

  if (!record) {
    return undefined;
  }

  if (
    record.issuerId !==
      issuerId
  ) {
    throw new Error(
      "FINORA Developer Security Code store does not belong to the current Control Center issuer.",
    );
  }

  return record;
}

export async function
readFinoraDeveloperSecurityCodeConfigurationState():
  Promise<
    FinoraDeveloperSecurityCodeConfigurationState
  > {

  const record =
    await readBoundStore();

  if (!record) {
    return {
      configured:
        false,
    };
  }

  return {
    configured:
      true,

    issuerId:
      record.issuerId,

    createdAt:
      record.createdAt,

    updatedAt:
      record.updatedAt,
  };
}

export async function
readFinoraDeveloperSecurityCodeThrottleState():
  Promise<
    FinoraDeveloperSecurityCodeThrottleState
  > {

  const record =
    await readBoundStore();

  if (
    !record ||
    record.failedAttempts ===
      undefined ||
    record.blockedUntil ===
      undefined
  ) {
    return {
      failedAttempts:
        0,

      blockedUntilMilliseconds:
        0,
    };
  }

  return {
    failedAttempts:
      record.failedAttempts,

    blockedUntilMilliseconds:
      new Date(
        record.blockedUntil,
      ).getTime(),
  };
}

export async function
writeFinoraDeveloperSecurityCodeThrottleState(
  state:
    FinoraDeveloperSecurityCodeThrottleState,
): Promise<void> {

  if (
    !Number.isSafeInteger(
      state.failedAttempts,
    ) ||
    state.failedAttempts <
      1 ||
    !Number.isFinite(
      state.blockedUntilMilliseconds,
    ) ||
    state.blockedUntilMilliseconds <=
      0
  ) {
    throw new Error(
      "FINORA Developer Security Code throttle state is invalid.",
    );
  }

  const record =
    await readBoundStore();

  if (!record) {
    throw new Error(
      "FINORA Developer Security Code is not configured.",
    );
  }

  await writeStore({
    ...record,

    failedAttempts:
      state.failedAttempts,

    blockedUntil:
      new Date(
        state.blockedUntilMilliseconds,
      ).toISOString(),
  });
}

export async function
clearFinoraDeveloperSecurityCodeThrottleState():
  Promise<void> {

  const record =
    await readBoundStore();

  if (!record) {
    return;
  }

  if (
    record.failedAttempts ===
      undefined &&
    record.blockedUntil ===
      undefined
  ) {
    return;
  }

  await writeStore({
    schemaVersion:
      record.schemaVersion,

    issuerId:
      record.issuerId,

    verifier:
      record.verifier,

    createdAt:
      record.createdAt,

    updatedAt:
      record.updatedAt,
  });
}
export async function
initializeFinoraDeveloperSecurityCode(
  securityCode:
    string,
): Promise<void> {

  const issuerId =
    await requireExistingAuthorityIssuerId();

  const existing =
    await readStore();

  if (existing) {
    throw new Error(
      "FINORA Developer Security Code is already configured.",
    );
  }

  const verifier =
    await createFinoraDeveloperSecurityCodeVerifier(
      securityCode,
    );

  const now =
    new Date()
      .toISOString();

  await writeStore({
    schemaVersion:
      FINORA_DEVELOPER_SECURITY_CODE_STORE_SCHEMA_VERSION,

    issuerId,

    verifier,

    createdAt:
      now,

    updatedAt:
      now,
  });
}

export async function
verifyConfiguredFinoraDeveloperSecurityCode(
  securityCode:
    string,
): Promise<boolean> {

  const record =
    await readBoundStore();

  if (!record) {
    return false;
  }

  return verifyFinoraDeveloperSecurityCode(
    securityCode,
    record.verifier,
  );
}

export async function
changeFinoraDeveloperSecurityCode(
  oldSecurityCode:
    string,
  newSecurityCode:
    string,
): Promise<boolean> {

  const record =
    await readBoundStore();

  if (!record) {
    return false;
  }

  const authorized =
    await verifyFinoraDeveloperSecurityCode(
      oldSecurityCode,
      record.verifier,
    );

  if (!authorized) {
    return false;
  }

  const replacementVerifier =
    await createFinoraDeveloperSecurityCodeVerifier(
      newSecurityCode,
    );

  await writeStore({
    schemaVersion:
      record.schemaVersion,

    issuerId:
      record.issuerId,

    verifier:
      replacementVerifier,

    createdAt:
      record.createdAt,

    updatedAt:
      new Date()
        .toISOString(),
  });

  return true;
}
