// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// PRIVILEGED NOTIFICATION PROVIDER CONFIG STORE
//
// RESPONSIBILITY:
//
// - Persist privileged Notification provider configuration.
// - Encrypt provider configuration with Electron safeStorage.
// - Keep provider credentials outside renderer code.
// - Keep Notification provider configuration separate from
//   operational LOCAL / USB Notification data.
// - Provide vendor-neutral configuration persistence.
//
// SECURITY:
//
// - MAIN PROCESS ONLY.
// - Renderer receives no filesystem path.
// - Renderer receives no encryption material.
// - Renderer receives no provider credentials.
// - No plaintext persistence fallback.
// - Corrupt provider configuration is never silently reset.
// - The complete provider package is encrypted at rest.
//
// STORAGE:
//
// Electron userData/
//   FINORA/
//     notifications/
//       finora-notification-providers.bin
//
// IMPORTANT:
//
// - No React.
// - No renderer storage.
// - No Notification Delivery persistence.
// - No provider execution.
// - No retry scheduling.
// - No vendor-specific fields are defined here.
// - One configured provider owns one Notification channel.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  app,
  safeStorage,
} from "electron";

import path from "node:path";

import fs from "node:fs/promises";

import type {
  FinoraNotificationProviderChannel,
} from "./finoraNotificationProvider.types.js";

/* ============================================================
   CONSTANTS
============================================================ */

const PROVIDER_CONFIG_STORE_VERSION =
  "1.0" as const;

const PROVIDER_CONFIG_DIRECTORY_NAME =
  "FINORA";

const PROVIDER_CONFIG_SUBDIRECTORY_NAME =
  "notifications";

const PROVIDER_CONFIG_FILE_NAME =
  "finora-notification-providers.bin";

/* ============================================================
   STORED PROVIDER CONFIGURATION
============================================================ */

export interface FinoraNotificationProviderStoredConfiguration {
  channel:
    FinoraNotificationProviderChannel;

  /*
   * Stable privileged provider implementation identity.
   *
   * Examples are intentionally not defined here because vendor
   * selection belongs to provider integration, not this store.
   */
  providerId:
    string;

  /*
   * Vendor-specific configuration and credential values.
   *
   * The complete object is encrypted at rest.
   *
   * Empty values should be omitted rather than persisted.
   */
  settings:
    Record<string, string>;

  createdAt:
    string;

  updatedAt:
    string;

  schemaVersion:
    1;
}

/* ============================================================
   STORE PACKAGE
============================================================ */

export interface FinoraNotificationProviderConfigStorePackage {
  version:
    typeof PROVIDER_CONFIG_STORE_VERSION;

  providers:
    FinoraNotificationProviderStoredConfiguration[];

  updatedAt:
    string;
}

/* ============================================================
   RESULT
============================================================ */

export interface FinoraNotificationProviderConfigStoreResult<T> {
  success:
    boolean;

  data?:
    T;

  error?:
    string;
}

/* ============================================================
   RESULT HELPERS
============================================================ */

function success<T>(
  data:
    T,
): FinoraNotificationProviderConfigStoreResult<T> {
  return {
    success:
      true,

    data,
  };
}

function failure<T = never>(
  error:
    string,
): FinoraNotificationProviderConfigStoreResult<T> {
  return {
    success:
      false,

    error,
  };
}

/* ============================================================
   BASIC VALIDATION
============================================================ */

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
    value.trim().length >
      0
  );
}

function isValidTimestamp(
  value:
    unknown,
): value is string {
  return (
    isNonEmptyString(
      value,
    ) &&
    Number.isFinite(
      Date.parse(
        value,
      ),
    )
  );
}

function isChannel(
  value:
    unknown,
): value is FinoraNotificationProviderChannel {
  return (
    value ===
      "SMS" ||
    value ===
      "WHATSAPP" ||
    value ===
      "EMAIL"
  );
}

/* ============================================================
   SETTINGS VALIDATION
============================================================ */

function isProviderSettings(
  value:
    unknown,
): value is Record<string, string> {
  if (!isRecord(value)) {
    return false;
  }

  for (
    const [key, settingValue]
    of Object.entries(value)
  ) {
    if (
      !isNonEmptyString(
        key,
      ) ||
      !isNonEmptyString(
        settingValue,
      )
    ) {
      return false;
    }
  }

  return true;
}

/* ============================================================
   PROVIDER CONFIG VALIDATION
============================================================ */

function isStoredProviderConfiguration(
  value:
    unknown,
): value is FinoraNotificationProviderStoredConfiguration {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isChannel(
      value.channel,
    ) &&
    isNonEmptyString(
      value.providerId,
    ) &&
    isProviderSettings(
      value.settings,
    ) &&
    isValidTimestamp(
      value.createdAt,
    ) &&
    isValidTimestamp(
      value.updatedAt,
    ) &&
    value.schemaVersion ===
      1
  );
}

/* ============================================================
   DUPLICATE CHANNEL VALIDATION
============================================================ */

function hasDuplicateChannels(
  providers:
    FinoraNotificationProviderStoredConfiguration[],
): boolean {
  const channels =
    new Set<
      FinoraNotificationProviderChannel
    >();

  for (const provider of providers) {
    if (
      channels.has(
        provider.channel,
      )
    ) {
      return true;
    }

    channels.add(
      provider.channel,
    );
  }

  return false;
}

/* ============================================================
   PACKAGE VALIDATION
============================================================ */

function isProviderConfigStorePackage(
  value:
    unknown,
): value is FinoraNotificationProviderConfigStorePackage {
  if (!isRecord(value)) {
    return false;
  }

  if (
    value.version !==
      PROVIDER_CONFIG_STORE_VERSION ||
    !Array.isArray(
      value.providers,
    ) ||
    !isValidTimestamp(
      value.updatedAt,
    )
  ) {
    return false;
  }

  if (
    !value.providers.every(
      isStoredProviderConfiguration,
    )
  ) {
    return false;
  }

  if (
    hasDuplicateChannels(
      value.providers,
    )
  ) {
    return false;
  }

  return true;
}

/* ============================================================
   DEFAULT PACKAGE
============================================================ */

function createEmptyProviderConfigStore():
  FinoraNotificationProviderConfigStorePackage {
  return {
    version:
      PROVIDER_CONFIG_STORE_VERSION,

    providers:
      [],

    updatedAt:
      new Date().toISOString(),
  };
}

/* ============================================================
   FILE PATH
============================================================ */

function getProviderConfigDirectory():
  string {
  if (!app.isReady()) {
    throw new Error(
      "FINORA Notification Provider Config Store is unavailable before Electron app readiness.",
    );
  }

  return path.join(
    app.getPath(
      "userData",
    ),
    PROVIDER_CONFIG_DIRECTORY_NAME,
    PROVIDER_CONFIG_SUBDIRECTORY_NAME,
  );
}

function getProviderConfigFile():
  string {
  return path.join(
    getProviderConfigDirectory(),
    PROVIDER_CONFIG_FILE_NAME,
  );
}

/* ============================================================
   ENCRYPTION
============================================================ */

async function encryptProviderConfigPayload(
  plainText:
    string,
): Promise<Buffer> {
  if (!app.isReady()) {
    throw new Error(
      "FINORA Notification Provider Config Store encryption is unavailable before Electron app readiness.",
    );
  }

  if (
    await safeStorage.isAsyncEncryptionAvailable()
  ) {
    return safeStorage.encryptStringAsync(
      plainText,
    );
  }

  if (
    safeStorage.isEncryptionAvailable()
  ) {
    return safeStorage.encryptString(
      plainText,
    );
  }

  throw new Error(
    "Secure operating-system encryption is unavailable for the FINORA Notification Provider Config Store.",
  );
}

interface DecryptedProviderConfigPayload {
  plainText:
    string;

  shouldReEncrypt:
    boolean;
}

async function decryptProviderConfigPayload(
  encrypted:
    Buffer,
): Promise<DecryptedProviderConfigPayload> {
  if (!app.isReady()) {
    throw new Error(
      "FINORA Notification Provider Config Store decryption is unavailable before Electron app readiness.",
    );
  }

  if (
    await safeStorage.isAsyncEncryptionAvailable()
  ) {
    const result =
      await safeStorage.decryptStringAsync(
        encrypted,
      );

    return {
      plainText:
        result.result,

      shouldReEncrypt:
        result.shouldReEncrypt,
    };
  }

  if (
    safeStorage.isEncryptionAvailable()
  ) {
    return {
      plainText:
        safeStorage.decryptString(
          encrypted,
        ),

      shouldReEncrypt:
        false,
    };
  }

  throw new Error(
    "Secure operating-system decryption is unavailable for the FINORA Notification Provider Config Store.",
  );
}

/* ============================================================
   LOW-LEVEL PERSISTENCE
============================================================ */

async function persistProviderConfigStorePackage(
  configStore:
    FinoraNotificationProviderConfigStorePackage,
): Promise<void> {
  if (
    !isProviderConfigStorePackage(
      configStore,
    )
  ) {
    throw new Error(
      "Refusing to persist an invalid FINORA Notification Provider Config Store package.",
    );
  }

  const directory =
    getProviderConfigDirectory();

  const file =
    getProviderConfigFile();

  const temporaryFile =
    `${file}.tmp`;

  await fs.mkdir(
    directory,
    {
      recursive:
        true,

      mode:
        0o700,
    },
  );

  const plainText =
    JSON.stringify(
      configStore,
    );

  const encrypted =
    await encryptProviderConfigPayload(
      plainText,
    );

  await fs.writeFile(
    temporaryFile,
    encrypted,
    {
      mode:
        0o600,
    },
  );

  await fs.rename(
    temporaryFile,
    file,
  );
}

async function providerConfigFileExists():
  Promise<boolean> {
  try {
    await fs.access(
      getProviderConfigFile(),
    );

    return true;
  } catch {
    return false;
  }
}

/* ============================================================
   READ CONFIG STORE
============================================================ */

export async function readFinoraNotificationProviderConfigStore():
  Promise<
    FinoraNotificationProviderConfigStoreResult<
      FinoraNotificationProviderConfigStorePackage
    >
  > {
  try {
    if (
      !(
        await providerConfigFileExists()
      )
    ) {
      return success(
        createEmptyProviderConfigStore(),
      );
    }

    const encrypted =
      await fs.readFile(
        getProviderConfigFile(),
      );

    if (
      encrypted.length ===
      0
    ) {
      return failure(
        "FINORA Notification Provider Config Store file is empty.",
      );
    }

    const decrypted =
      await decryptProviderConfigPayload(
        encrypted,
      );

    let parsed:
      unknown;

    try {
      parsed =
        JSON.parse(
          decrypted.plainText,
        );
    } catch {
      return failure(
        "FINORA Notification Provider Config Store contains invalid encrypted data.",
      );
    }

    if (
      !isProviderConfigStorePackage(
        parsed,
      )
    ) {
      return failure(
        "FINORA Notification Provider Config Store package validation failed.",
      );
    }

    if (
      decrypted.shouldReEncrypt
    ) {
      await persistProviderConfigStorePackage(
        parsed,
      );
    }

    return success(
      parsed,
    );
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to read the FINORA Notification Provider Config Store.",
    );
  }
}

/* ============================================================
   FIND CHANNEL CONFIGURATION
============================================================ */

export async function findFinoraNotificationProviderConfiguration(
  channel:
    FinoraNotificationProviderChannel,
): Promise<
  FinoraNotificationProviderConfigStoreResult<
    FinoraNotificationProviderStoredConfiguration | undefined
  >
> {
  if (!isChannel(channel)) {
    return failure(
      "A valid FINORA Notification provider channel is required.",
    );
  }

  const currentResult =
    await readFinoraNotificationProviderConfigStore();

  if (
    !currentResult.success ||
    !currentResult.data
  ) {
    return failure(
      currentResult.error ??
        "Unable to load the FINORA Notification Provider Config Store.",
    );
  }

  return success(
    currentResult.data.providers.find(
      (provider) =>
        provider.channel ===
        channel,
    ),
  );
}

/* ============================================================
   SAVE CHANNEL CONFIGURATION
============================================================ */

export async function saveFinoraNotificationProviderConfiguration(
  configuration:
    FinoraNotificationProviderStoredConfiguration,
): Promise<
  FinoraNotificationProviderConfigStoreResult<
    FinoraNotificationProviderStoredConfiguration
  >
> {
  if (
    !isStoredProviderConfiguration(
      configuration,
    )
  ) {
    return failure(
      "A valid FINORA Notification provider configuration is required.",
    );
  }

  const currentResult =
    await readFinoraNotificationProviderConfigStore();

  if (
    !currentResult.success ||
    !currentResult.data
  ) {
    return failure(
      currentResult.error ??
        "Unable to load the FINORA Notification Provider Config Store.",
    );
  }

  const configStore =
    currentResult.data;

  const existingIndex =
    configStore.providers.findIndex(
      (provider) =>
        provider.channel ===
        configuration.channel,
    );

  if (
    existingIndex >=
    0
  ) {
    const existing =
      configStore.providers[
        existingIndex
      ];

    /*
     * Provider replacement must be an explicit future operation.
     *
     * Silent provider identity replacement could redirect
     * outbound customer communication.
     */

    if (
      existing.providerId !==
      configuration.providerId
    ) {
      return failure(
        `FINORA Notification provider identity for ${configuration.channel} cannot be replaced implicitly.`,
      );
    }

    configStore.providers[
      existingIndex
    ] =
      configuration;
  } else {
    configStore.providers.push(
      configuration,
    );
  }

  configStore.updatedAt =
    new Date().toISOString();

  try {
    await persistProviderConfigStorePackage(
      configStore,
    );

    return success(
      configuration,
    );
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to save FINORA Notification provider configuration.",
    );
  }
}

/* ============================================================
   REMOVE CHANNEL CONFIGURATION
============================================================ */

export async function removeFinoraNotificationProviderConfiguration(
  channel:
    FinoraNotificationProviderChannel,
): Promise<
  FinoraNotificationProviderConfigStoreResult<boolean>
> {
  if (!isChannel(channel)) {
    return failure(
      "A valid FINORA Notification provider channel is required.",
    );
  }

  const currentResult =
    await readFinoraNotificationProviderConfigStore();

  if (
    !currentResult.success ||
    !currentResult.data
  ) {
    return failure(
      currentResult.error ??
        "Unable to load the FINORA Notification Provider Config Store.",
    );
  }

  const configStore =
    currentResult.data;

  const existingIndex =
    configStore.providers.findIndex(
      (provider) =>
        provider.channel ===
        channel,
    );

  /*
   * Removing an already-absent channel is idempotent.
   *
   * No empty/corrupt replacement package is created unless
   * persisted configuration actually exists.
   */

  if (
    existingIndex <
    0
  ) {
    return success(
      false,
    );
  }

  configStore.providers.splice(
    existingIndex,
    1,
  );

  configStore.updatedAt =
    new Date().toISOString();

  try {
    await persistProviderConfigStorePackage(
      configStore,
    );

    return success(
      true,
    );
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to remove FINORA Notification provider configuration.",
    );
  }
}
/* ============================================================
   END
============================================================ */