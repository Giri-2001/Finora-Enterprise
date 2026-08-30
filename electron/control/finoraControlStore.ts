// ============================================================
// FINORA ENTERPRISE OS™
//
// ELECTRON CONTROL STORE
//
// RESPONSIBILITY:
//
// - Persist FINORA device-level control state
// - Persist branch activation metadata
// - Persist per-login LOCAL / USB storage entitlements
// - Encrypt the complete control payload with Electron safeStorage
// - Keep control state outside operational LOCAL / USB datasets
//
// IMPORTANT:
//
// - MAIN PROCESS ONLY.
// - Renderer receives no filesystem path.
// - Renderer receives no encryption material.
// - No customer data.
// - No loan data.
// - No collection data.
// - No Gold custody data.
// - No wallet balance.
// - No pricing amount.
// - No plaintext persistence fallback.
// - Corrupt control data is NEVER silently reset.
//
// STORAGE:
//
// Electron userData/
//   FINORA/
//     control/
//       finora-control.bin
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import {
  app,
  safeStorage,
} from "electron";

import path from "node:path";

import fs from "node:fs/promises";

// ============================================================
// CONSTANTS
// ============================================================

const CONTROL_STORE_VERSION = "1.0" as const;

const CONTROL_DIRECTORY_NAME = "FINORA";

const CONTROL_SUBDIRECTORY_NAME = "control";

const CONTROL_FILE_NAME = "finora-control.bin";

// ============================================================
// DOMAIN TYPES
// ============================================================

export type FinoraControlActivationStatus =
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "DEACTIVATED";

export type FinoraControlStorageMode =
  | "LOCAL"
  | "USB";

export type FinoraControlEntitlementStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED";

// ============================================================
// BRANCH ACTIVATION DTO
// ============================================================

export interface FinoraControlBranchActivation {
  activationId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  status: FinoraControlActivationStatus;

  activatedAt?: string;

  createdAt: string;

  updatedAt: string;

  schemaVersion: 1;
}

// ============================================================
// INSTALLATION IDENTITY DTO
// ============================================================

export interface FinoraControlInstallationIdentity {
  installationId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  createdAt: string;

  updatedAt: string;

  schemaVersion: 1;
}

// ============================================================
// STORAGE ENTITLEMENT DTO
// ============================================================

export interface FinoraControlStorageEntitlement {
  entitlementId: string;

  userId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  storageMode: FinoraControlStorageMode;

  status: FinoraControlEntitlementStatus;

  activatedAt: string;

  createdAt: string;

  updatedAt: string;

  schemaVersion: 1;
}

// ============================================================
// CONTROL PACKAGE
// ============================================================

export interface FinoraControlStorePackage {
  version: typeof CONTROL_STORE_VERSION;

  installation?: FinoraControlInstallationIdentity;

  activations: FinoraControlBranchActivation[];

  storageEntitlements: FinoraControlStorageEntitlement[];

  updatedAt: string;
}

// ============================================================
// RESULT
// ============================================================

export interface FinoraControlStoreResult<T> {
  success: boolean;

  data?: T;

  error?: string;
}

// ============================================================
// INTERNAL HELPERS
// ============================================================

function success<T>(
  data: T,
): FinoraControlStoreResult<T> {
  return {
    success: true,
    data,
  };
}

function failure<T = never>(
  error: string,
): FinoraControlStoreResult<T> {
  return {
    success: false,
    error,
  };
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isOptionalString(
  value: unknown,
): value is string | undefined {
  return (
    value === undefined ||
    typeof value === "string"
  );
}

function isActivationStatus(
  value: unknown,
): value is FinoraControlActivationStatus {
  return (
    value === "PENDING" ||
    value === "ACTIVE" ||
    value === "SUSPENDED" ||
    value === "DEACTIVATED"
  );
}

function isStorageMode(
  value: unknown,
): value is FinoraControlStorageMode {
  return (
    value === "LOCAL" ||
    value === "USB"
  );
}

function isEntitlementStatus(
  value: unknown,
): value is FinoraControlEntitlementStatus {
  return (
    value === "ACTIVE" ||
    value === "SUSPENDED" ||
    value === "REVOKED"
  );
}

// ============================================================
// DTO VALIDATION
// ============================================================

function isBranchActivation(
  value: unknown,
): value is FinoraControlBranchActivation {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.activationId) &&
    isNonEmptyString(value.ownerId) &&
    isNonEmptyString(value.businessId) &&
    isNonEmptyString(value.branchId) &&
    isActivationStatus(value.status) &&
    isOptionalString(value.activatedAt) &&
    isNonEmptyString(value.createdAt) &&
    isNonEmptyString(value.updatedAt) &&
    value.schemaVersion === 1
  );
}

function isInstallationIdentity(
  value: unknown,
): value is FinoraControlInstallationIdentity {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.installationId) &&
    isNonEmptyString(value.ownerId) &&
    isNonEmptyString(value.businessId) &&
    isNonEmptyString(value.branchId) &&
    isNonEmptyString(value.createdAt) &&
    isNonEmptyString(value.updatedAt) &&
    value.schemaVersion === 1
  );
}

function isStorageEntitlement(
  value: unknown,
): value is FinoraControlStorageEntitlement {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.entitlementId) &&
    isNonEmptyString(value.userId) &&
    isNonEmptyString(value.ownerId) &&
    isNonEmptyString(value.businessId) &&
    isNonEmptyString(value.branchId) &&
    isStorageMode(value.storageMode) &&
    isEntitlementStatus(value.status) &&
    isNonEmptyString(value.activatedAt) &&
    isNonEmptyString(value.createdAt) &&
    isNonEmptyString(value.updatedAt) &&
    value.schemaVersion === 1
  );
}

function hasDuplicateActivationKeys(
  activations: FinoraControlBranchActivation[],
): boolean {
  const keys = new Set<string>();

  for (const activation of activations) {
    const key = [
      activation.ownerId,
      activation.businessId,
      activation.branchId,
    ].join("::");

    if (keys.has(key)) {
      return true;
    }

    keys.add(key);
  }

  return false;
}

function hasDuplicateEntitlementKeys(
  entitlements: FinoraControlStorageEntitlement[],
): boolean {
  const keys = new Set<string>();

  for (const entitlement of entitlements) {
    const key = [
      entitlement.userId,
      entitlement.ownerId,
      entitlement.businessId,
      entitlement.branchId,
      entitlement.storageMode,
    ].join("::");

    if (keys.has(key)) {
      return true;
    }

    keys.add(key);
  }

  return false;
}

function isControlStorePackage(
  value: unknown,
): value is FinoraControlStorePackage {
  if (!isRecord(value)) {
    return false;
  }

  if (
    value.version !== CONTROL_STORE_VERSION ||
    (
      value.installation !== undefined &&
      !isInstallationIdentity(value.installation)
    ) ||
    !Array.isArray(value.activations) ||
    !Array.isArray(value.storageEntitlements) ||
    !isNonEmptyString(value.updatedAt)
  ) {
    return false;
  }

  if (!value.activations.every(isBranchActivation)) {
    return false;
  }

  if (!value.storageEntitlements.every(isStorageEntitlement)) {
    return false;
  }

  if (hasDuplicateActivationKeys(value.activations)) {
    return false;
  }

  if (hasDuplicateEntitlementKeys(value.storageEntitlements)) {
    return false;
  }

  return true;
}

// ============================================================
// DEFAULT PACKAGE
// ============================================================

function createEmptyControlStore():
  FinoraControlStorePackage {
  return {
    version: CONTROL_STORE_VERSION,

    activations: [],

    storageEntitlements: [],

    updatedAt: new Date().toISOString(),
  };
}

// ============================================================
// FILE PATH
// ============================================================

function getControlDirectory(): string {
  if (!app.isReady()) {
    throw new Error(
      "FINORA Control Store is unavailable before Electron app readiness.",
    );
  }

  return path.join(
    app.getPath("userData"),
    CONTROL_DIRECTORY_NAME,
    CONTROL_SUBDIRECTORY_NAME,
  );
}

function getControlFile(): string {
  return path.join(
    getControlDirectory(),
    CONTROL_FILE_NAME,
  );
}

// ============================================================
// ENCRYPTION
// ============================================================

async function encryptControlPayload(
  plainText: string,
): Promise<Buffer> {
  if (!app.isReady()) {
    throw new Error(
      "FINORA Control Store encryption is unavailable before Electron app readiness.",
    );
  }

  if (await safeStorage.isAsyncEncryptionAvailable()) {
    return safeStorage.encryptStringAsync(
      plainText,
    );
  }

  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(
      plainText,
    );
  }

  throw new Error(
    "Secure operating-system encryption is unavailable for the FINORA Control Store.",
  );
}

interface DecryptedPayload {
  plainText: string;

  shouldReEncrypt: boolean;
}

async function decryptControlPayload(
  encrypted: Buffer,
): Promise<DecryptedPayload> {
  if (!app.isReady()) {
    throw new Error(
      "FINORA Control Store decryption is unavailable before Electron app readiness.",
    );
  }

  if (await safeStorage.isAsyncEncryptionAvailable()) {
    const result =
      await safeStorage.decryptStringAsync(
        encrypted,
      );

    return {
      plainText: result.result,

      shouldReEncrypt:
        result.shouldReEncrypt,
    };
  }

  if (safeStorage.isEncryptionAvailable()) {
    return {
      plainText:
        safeStorage.decryptString(
          encrypted,
        ),

      shouldReEncrypt: false,
    };
  }

  throw new Error(
    "Secure operating-system decryption is unavailable for the FINORA Control Store.",
  );
}

// ============================================================
// LOW-LEVEL PERSISTENCE
// ============================================================

async function persistControlStorePackage(
  controlStore:
    FinoraControlStorePackage,
): Promise<void> {
  if (!isControlStorePackage(controlStore)) {
    throw new Error(
      "Refusing to persist an invalid FINORA Control Store package.",
    );
  }

  const controlDirectory =
    getControlDirectory();

  const controlFile =
    getControlFile();

  const temporaryFile =
    `${controlFile}.tmp`;

  await fs.mkdir(
    controlDirectory,
    {
      recursive: true,
      mode: 0o700,
    },
  );

  const plainText =
    JSON.stringify(controlStore);

  const encrypted =
    await encryptControlPayload(
      plainText,
    );

  await fs.writeFile(
    temporaryFile,
    encrypted,
    {
      mode: 0o600,
    },
  );

  await fs.rename(
    temporaryFile,
    controlFile,
  );
}

async function controlFileExists():
  Promise<boolean> {
  try {
    await fs.access(
      getControlFile(),
    );

    return true;
  } catch {
    return false;
  }
}

// ============================================================
// READ CONTROL STORE
// ============================================================

export async function readFinoraControlStore():
  Promise<
    FinoraControlStoreResult<
      FinoraControlStorePackage
    >
  > {
  try {
    if (!(await controlFileExists())) {
      return success(
        createEmptyControlStore(),
      );
    }

    const encrypted =
      await fs.readFile(
        getControlFile(),
      );

    if (encrypted.length === 0) {
      return failure(
        "FINORA Control Store file is empty.",
      );
    }

    const decrypted =
      await decryptControlPayload(
        encrypted,
      );

    let parsed: unknown;

    try {
      parsed =
        JSON.parse(
          decrypted.plainText,
        );
    } catch {
      return failure(
        "FINORA Control Store contains invalid encrypted data.",
      );
    }

    if (!isControlStorePackage(parsed)) {
      return failure(
        "FINORA Control Store package validation failed.",
      );
    }

    if (decrypted.shouldReEncrypt) {
      await persistControlStorePackage(
        parsed,
      );
    }

    return success(parsed);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to read the FINORA Control Store.",
    );
  }
}

// ============================================================
// GET INSTALLATION IDENTITY
// ============================================================

export async function getFinoraInstallationIdentity():
  Promise<
    FinoraControlStoreResult<
      FinoraControlInstallationIdentity | undefined
    >
  > {
  const currentResult =
    await readFinoraControlStore();

  if (
    !currentResult.success ||
    !currentResult.data
  ) {
    return failure(
      currentResult.error ??
        "Unable to load the FINORA Control Store.",
    );
  }

  return success(
    currentResult.data.installation,
  );
}

// ============================================================
// SAVE INSTALLATION IDENTITY
// ============================================================

export async function saveFinoraInstallationIdentity(
  installation:
    FinoraControlInstallationIdentity,
): Promise<
  FinoraControlStoreResult<
    FinoraControlInstallationIdentity
  >
> {
  if (!isInstallationIdentity(installation)) {
    return failure(
      "A valid FINORA installation identity is required.",
    );
  }

  const currentResult =
    await readFinoraControlStore();

  if (
    !currentResult.success ||
    !currentResult.data
  ) {
    return failure(
      currentResult.error ??
        "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore =
    currentResult.data;

  const existing =
    controlStore.installation;

  if (existing) {
    const identityChanged =
      existing.installationId !==
        installation.installationId ||
      existing.ownerId !==
        installation.ownerId ||
      existing.businessId !==
        installation.businessId ||
      existing.branchId !==
        installation.branchId;

    if (identityChanged) {
      return failure(
        "FINORA installation identity cannot be replaced.",
      );
    }
  }

  controlStore.installation =
    installation;

  controlStore.updatedAt =
    new Date().toISOString();

  try {
    await persistControlStorePackage(
      controlStore,
    );

    return success(
      installation,
    );
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to save FINORA installation identity.",
    );
  }
}

// ============================================================
// SAVE BRANCH ACTIVATION
// ============================================================

export async function saveFinoraBranchActivation(
  activation:
    FinoraControlBranchActivation,
): Promise<
  FinoraControlStoreResult<
    FinoraControlBranchActivation
  >
> {
  if (!isBranchActivation(activation)) {
    return failure(
      "A valid FINORA branch activation is required.",
    );
  }

  const currentResult =
    await readFinoraControlStore();

  if (
    !currentResult.success ||
    !currentResult.data
  ) {
    return failure(
      currentResult.error ??
        "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore =
    currentResult.data;

  const existingIndex =
    controlStore.activations.findIndex(
      (item) =>
        item.ownerId === activation.ownerId &&
        item.businessId === activation.businessId &&
        item.branchId === activation.branchId,
    );

  if (existingIndex >= 0) {
    const existing =
      controlStore.activations[
        existingIndex
      ];

    if (
      existing.activationId !==
      activation.activationId
    ) {
      return failure(
        "FINORA branch activation identity cannot be replaced.",
      );
    }

    controlStore.activations[
      existingIndex
    ] = activation;
  } else {
    controlStore.activations.push(
      activation,
    );
  }

  controlStore.updatedAt =
    new Date().toISOString();

  try {
    await persistControlStorePackage(
      controlStore,
    );

    return success(activation);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to save FINORA branch activation.",
    );
  }
}

// ============================================================
// FIND BRANCH ACTIVATION
// ============================================================

export async function findFinoraBranchActivation(
  ownerId: string,
  businessId: string,
  branchId: string,
): Promise<
  FinoraControlStoreResult<
    FinoraControlBranchActivation | undefined
  >
> {
  const currentResult =
    await readFinoraControlStore();

  if (
    !currentResult.success ||
    !currentResult.data
  ) {
    return failure(
      currentResult.error ??
        "Unable to load the FINORA Control Store.",
    );
  }

  const activation =
    currentResult.data.activations.find(
      (item) =>
        item.ownerId === ownerId &&
        item.businessId === businessId &&
        item.branchId === branchId,
    );

  return success(activation);
}

// ============================================================
// SAVE STORAGE ENTITLEMENT
// ============================================================

export async function saveFinoraStorageEntitlement(
  entitlement:
    FinoraControlStorageEntitlement,
): Promise<
  FinoraControlStoreResult<
    FinoraControlStorageEntitlement
  >
> {
  if (!isStorageEntitlement(entitlement)) {
    return failure(
      "A valid FINORA storage entitlement is required.",
    );
  }

  const currentResult =
    await readFinoraControlStore();

  if (
    !currentResult.success ||
    !currentResult.data
  ) {
    return failure(
      currentResult.error ??
        "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore =
    currentResult.data;

  const existingIndex =
    controlStore.storageEntitlements.findIndex(
      (item) =>
        item.userId === entitlement.userId &&
        item.ownerId === entitlement.ownerId &&
        item.businessId === entitlement.businessId &&
        item.branchId === entitlement.branchId &&
        item.storageMode === entitlement.storageMode,
    );

  if (existingIndex >= 0) {
    const existing =
      controlStore.storageEntitlements[
        existingIndex
      ];

    if (
      existing.entitlementId !==
      entitlement.entitlementId
    ) {
      return failure(
        "FINORA storage entitlement identity cannot be replaced.",
      );
    }

    controlStore.storageEntitlements[
      existingIndex
    ] = entitlement;
  } else {
    controlStore.storageEntitlements.push(
      entitlement,
    );
  }

  controlStore.updatedAt =
    new Date().toISOString();

  try {
    await persistControlStorePackage(
      controlStore,
    );

    return success(entitlement);
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to save FINORA storage entitlement.",
    );
  }
}

// ============================================================
// FIND STORAGE ENTITLEMENT
// ============================================================

export async function findFinoraStorageEntitlement(
  userId: string,
  ownerId: string,
  businessId: string,
  branchId: string,
  storageMode: FinoraControlStorageMode,
): Promise<
  FinoraControlStoreResult<
    FinoraControlStorageEntitlement | undefined
  >
> {
  const currentResult =
    await readFinoraControlStore();

  if (
    !currentResult.success ||
    !currentResult.data
  ) {
    return failure(
      currentResult.error ??
        "Unable to load the FINORA Control Store.",
    );
  }

  const entitlement =
    currentResult.data.storageEntitlements.find(
      (item) =>
        item.userId === userId &&
        item.ownerId === ownerId &&
        item.businessId === businessId &&
        item.branchId === branchId &&
        item.storageMode === storageMode,
    );

  return success(entitlement);
}

// ============================================================
// ACTIVE STORAGE ACCESS CHECK
// ============================================================

export async function hasActiveFinoraStorageEntitlement(
  userId: string,
  ownerId: string,
  businessId: string,
  branchId: string,
  storageMode: FinoraControlStorageMode,
): Promise<
  FinoraControlStoreResult<boolean>
> {
  const entitlementResult =
    await findFinoraStorageEntitlement(
      userId,
      ownerId,
      businessId,
      branchId,
      storageMode,
    );

  if (!entitlementResult.success) {
    return failure(
      entitlementResult.error ??
        "Unable to verify FINORA storage entitlement.",
    );
  }

  return success(
    entitlementResult.data?.status ===
      "ACTIVE",
  );
}

// ============================================================
// END
// ============================================================
