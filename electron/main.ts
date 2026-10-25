import { createFinoraServerWalletHistoryClient } from "./control/finoraServerWalletHistoryClient.js";
import { getFinoraAccountWalletAuthorization } from "./control/finoraAccountWalletSession.js";
import {
  establishFinoraSenderWallet,
  getFinoraSenderWalletAuthorization,
  clearFinoraSenderWallet,
  getFinoraSenderWalletPrincipal,
} from "./control/finoraSenderWalletSession.js";
import { establishFinoraAccountWalletSession } from "./control/finoraAccountWalletSession.js";
import { clearFinoraAccountWalletSession } from "./control/finoraAccountWalletSession.js";
import { createFinoraAuthenticatedRechargeIntentCoordinator } from "./control/finoraAuthenticatedRechargeIntentCoordinator.js";
import { createFinoraServerRechargeIntentStore } from "./control/finoraServerRechargeIntentStore.js";
import {
  createFinoraServerSubscriptionPurchaseIntentStore,
} from "./control/finoraServerSubscriptionPurchaseIntentStore.js";
import {
  createFinoraAuthenticatedSubscriptionPurchaseCoordinator,
} from "./control/finoraAuthenticatedSubscriptionPurchaseCoordinator.js";
import { createFinoraVerifiedRechargeScopeCoordinator } from "./control/finoraVerifiedRechargeScopeCoordinator.js";
// ============================================================
// FINORA ENTERPRISE OS
// ELECTRON MAIN PROCESS
// V2 USB / PENDRIVE STORAGE IPC
//
// RESPONSIBILITY:
//
// - Create the FINORA desktop window
// - Maintain Electron security boundaries
// - Detect FINORA-compatible removable storage
// - Provide narrow V2 USB storage IPC
// - Keep filesystem access inside Electron main process
// - Persist the FINORA USB storage package safely
// - Reset FINORA-owned USB data without touching unrelated
//   files on the user's removable storage
//
// IMPORTANT:
//
// - Renderer NEVER receives arbitrary filesystem access.
// - Renderer NEVER receives Node.js APIs.
// - Renderer NEVER chooses arbitrary filesystem paths.
// - USB operations are limited to detected removable storage.
// - Only the FINORA storage directory is accessed.
// - V1 storage is never touched.
// - RESET FINORA DATA never formats the USB drive.
// - RESET FINORA DATA never deletes unrelated USB files.
//
// VERSION : 2.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { config as loadDotEnv } from "dotenv";

loadDotEnv();

import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";

// FINORA_P549E_SERVER_WALLET_IMPORTS
import {
  createFinoraServerWalletKeyVault,
} from "./control/finoraServerWalletKeyVault.js";
import {
  createFinoraServerWalletOnlineAccess,
} from "./control/finoraServerWalletOnlineAccess.js";
import {
  registerFinoraServerWalletIpc,
} from "./control/finoraServerWalletIpcRegistration.js";
import {
  bindFinoraServerWalletBusinessLifecycle,
} from "./control/finoraServerWalletBusinessLifecycle.js";

const FINORA_SINGLE_INSTANCE_LOCK_V1 =
  app.requestSingleInstanceLock();

if (
  !FINORA_SINGLE_INSTANCE_LOCK_V1
) {
  app.exit(0);
}


// ============================================================
// DEVELOPMENT-ONLY ISOLATED USERDATA OVERRIDE
//
// Used only for fresh-device portability verification without
// touching the operator's existing FINORA Control Store.
//
// - ignored in packaged production builds
// - ignored unless explicitly supplied
// - must be configured before Electron app readiness
// ============================================================

const finoraDevUserDataOverride =
  process.env.FINORA_DEV_USERDATA_OVERRIDE
    ?.trim();

if (
  !app.isPackaged &&
  finoraDevUserDataOverride
) {
  app.setPath(
    "userData",
    finoraDevUserDataOverride,
  );

  console.log(
    "[FINORA DEV USERDATA]",
    app.getPath(
      "userData",
    ),
  );
}

import path from "node:path";

import fs from "node:fs/promises";

import { execFile } from "node:child_process";

import { promisify } from "node:util";

import { randomUUID } from "node:crypto";

import {
  registerFinoraControlHandlers,
  registerFinoraServerProfileScopeResolver,
} from "./control/finoraControlIpc.js";

import {
  createUnavailableFinoraCanonicalWalletAuthorityProvider,
  registerFinoraCanonicalWalletAuthorityHandlers,
} from "./control/finoraCanonicalWalletAuthorityIpc.js";

import {
  createFinoraPersistentCanonicalWalletAuthorityProvider,
} from "./control/finoraCanonicalWalletAuthorityProvider.js";
import {
  registerFinoraBranchCredentialHandlers,
} from "./control/finoraBranchCredentialIpc.js";

import {
  registerFinoraPortableBranchAuthUsbReplacementHandlers,
} from "./control/finoraPortableBranchAuthUsbReplacementIpc.js";

import {
  registerFinoraPortableBranchAuthBackupHandlers,
} from "./control/finoraPortableBranchAuthBackupIpc.js";
import {
  exportFinoraFullBranchBackupFromNativeDialog,
} from "./control/finoraFullBranchBackupFileTransport.js";
import {
  registerFinoraPortableBranchAuthRestoreHandlers,
} from "./control/finoraPortableBranchAuthRestoreIpc.js";
import {
  restoreFinoraFullBranchFromNativeBackup,
} from "./control/finoraFullBranchRestoreFileTransport.js";

import {
  FinoraPortableBranchAuthStore,
} from "./control/finoraPortableBranchAuthStore.js";

import {
  FinoraPortableBranchAuthV2Store,
} from "./control/finoraPortableBranchAuthV2Store.js";

import {
  recoverFinoraPortableBranchAuthCredentialRotations,
} from "./control/finoraPortableBranchAuthCredentialRotationRecoveryService.js";
import {
  registerFinoraBranchLoginSessionHandlers,
} from "./control/finoraBranchLoginSessionIpc.js";

import {
  createFinoraUnifiedWalletSession,
  validateFinoraUnifiedWalletMainSession,
} from "./control/finoraUnifiedWalletSession.js";

import {
  createFinoraVerifiedWalletProofGateway,
} from "./control/finoraVerifiedWalletProofGateway.js";

import {
  createFinoraWalletChallengeScopeResolver,
} from "./control/finoraWalletChallengeScopeResolver.js";

// FINORA_P572Y_LIFECYCLE
// One Owner window is registered by the current Electron runtime.
// This reference is never exposed to renderer IPC.
let finoraUnifiedWalletForLifecycle:
  ReturnType<typeof createFinoraUnifiedWalletSession> | null = null;

// FINORA_P573X_PROOF_WIRING
// Main-process memory only; never exposed through preload.
// FINORA_P1_579GJ_WALLET_PROOF_ENROLLMENT
// Main-process-only OnlineAccess reference for explicit one-time enrollment.
// Never exposed through preload/renderer IPC.
let finoraServerWalletOnlineAccessForLifecycle:
  ReturnType<typeof createFinoraServerWalletOnlineAccess> | null = null;

let finoraProofWalletForLifecycle:
  ReturnType<typeof createFinoraVerifiedWalletProofGateway> | null = null;

import {
  createFinoraPortableFreshDeviceLoginRecovery,
} from "./control/finoraPortableFreshDeviceLoginRecoveryService.js";
import {
  FinoraPortableFreshDeviceRuntimeAuthorityStore,
} from "./control/finoraPortableFreshDeviceRuntimeAuthorityStore.js";

import {
  registerFinoraPortableFreshDeviceRuntimeAuthoritySeedHandlers,
} from "./control/finoraPortableFreshDeviceRuntimeAuthoritySeedIpc.js";

import {
  registerFinoraRecipientTrustMaintenanceHandlers,
} from "./control/finoraRecipientTrustMaintenanceIpc.js";

import {
  openFinoraRecipientTrustMaintenanceWindow,
} from "./control/finoraRecipientTrustMaintenanceWindow.js";

import {
  registerFinoraRecipientTrustRecoveryHandlers,
} from "./control/finoraRecipientTrustRecoveryIpc.js";

import {
  openFinoraRecipientTrustRecoveryWindow,
} from "./control/finoraRecipientTrustRecoveryWindow.js";


import {
  runFinoraDevelopmentProvisioning,
} from "./control/finoraDevProvisioning.js";

import {
  ensureFinoraWindowsInstallationBinding,
} from "./control/finoraInstallationBindingService.js";

import {
  registerFinoraNotificationProviderHandlers,
} from "./notifications/finoraNotificationProviderIpc.js";

import {
  getFinoraNotificationProviderRegistry,
} from "./notifications/finoraNotificationProviderRegistry.js";

import {
  registerFinoraNotificationProviders,
} from "./notifications/finoraNotificationProviderBootstrap.js";

import {
  runFinoraNotificationProviderDevelopmentProvisioning,
} from "./notifications/finoraNotificationProviderDevProvisioning.js";

import {
  registerFinoraNotificationArtifactHandlers,
} from "./notifications/finoraNotificationArtifactIpc.js";

import {
  FinoraNotificationArtifactStore,
} from "./notifications/finoraNotificationArtifactStore.js";

import {
  recordMatchesFinoraUsbResetScope,
  validateFinoraUsbResetScope,
} from "./finoraUsbResetScopePolicy.js";

import type {
  FinoraUsbResetScope,
} from "./finoraUsbResetScopePolicy.js";

import {
  resolveFinoraBranchOperationalSessionContext,
} from "./control/finoraBranchLoginSessionAuthority.js";

// ============================================================
// PROMISIFIED SYSTEM COMMAND
// ============================================================

const execFileAsync = promisify(execFile);

// ============================================================
// TYPES
// ============================================================

interface StorageQuery {
  entity: string;
  id?: string;

  sessionId?: string;
  ownerId?: string;

  businessId?: string;

  branchId?: string;

  demoId?: string;
  limit?: number;
  offset?: number;
}

interface StorageWriteOptions {
  sessionId?: string;

  ownerId?: string;

  businessId?: string;

  branchId?: string;

  demoId?: string;
}


interface PersistedStorageRecord {
  id: string;
  entity: string;
  data: unknown;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;

  businessId?: string;

  branchId?: string;

  demoId?: string;
}

interface UsbStoragePackage {
  version: "2.0";
  records: PersistedStorageRecord[];
  updatedAt: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const FINORA_DIRECTORY = "FINORA";

const FINORA_STORAGE_DIRECTORY = "storage";

const FINORA_STORAGE_FILE = "finora-storage.json";

const FINORA_STORAGE_TEMP_FILE =
  "finora-storage.tmp.json";

const FINORA_STORAGE_BACKUP_FILE =
  "finora-storage.backup.json";

const FINORA_STORAGE_INVALID_MESSAGE =
  "FINORA USB storage package is invalid or unreadable.";

const IPC_CHANNELS = {
  IS_AVAILABLE: "finora:usb:is-available",

  GET_STATUS: "finora:usb:get-status",

  GET: "finora:usb:get",

  GET_ALL: "finora:usb:get-all",

  SAVE: "finora:usb:save",

  UPDATE: "finora:usb:update",

  DELETE: "finora:usb:delete",

  REPLACE_ALL: "finora:usb:replace-all",

  CLEAR: "finora:usb:clear",

  MIGRATE_LEGACY_TENANT_SCOPE:
    "finora:usb:migrate-legacy-tenant-scope",

  RESET_FINORA_DATA: "finora:usb:reset-finora-data",
} as const;

// ============================================================
// APPLICATION STATE
// ============================================================

let mainWindow: BrowserWindow | null = null;

let handlersRegistered = false;

// ============================================================
// NOTIFICATION ARTIFACT STORE
//
// LOCAL:
//   Electron userData root.
//
// USB:
//   Existing trusted FINORA removable-drive resolver.
//
// The renderer never supplies either filesystem root.
// ============================================================

const notificationArtifactStore =
  new FinoraNotificationArtifactStore({
    resolveLocalRoot:
      () =>
        app.getPath("userData"),

    resolveUsbRoot:
      () =>
        findFinoraUsbRoot(),
  });

// ============================================================
// IPC SENDER VALIDATION
// ============================================================

function isTrustedRenderer(senderFrame: Electron.WebFrameMain | null): boolean {
  // ----------------------------------------------------------
  // Electron can provide null when the sender frame no longer
  // exists. Treat that as untrusted.
  // ----------------------------------------------------------

  if (!senderFrame) {
    return false;
  }

  const frameUrl = senderFrame.url;

  if (!frameUrl) {
    return false;
  }

  // ----------------------------------------------------------
  // DEVELOPMENT
  // ----------------------------------------------------------

  if (!app.isPackaged) {
    try {
      const url = new URL(frameUrl);

      return (
        url.protocol === "http:" &&
        url.hostname === "localhost" &&
        url.port === "5173"
      );
    } catch {
      return false;
    }
  }

  // ----------------------------------------------------------
  // PRODUCTION
  // ----------------------------------------------------------

  return frameUrl.startsWith("file://");
}

// ============================================================
// RESULT HELPERS
// ============================================================

function success<T>(data?: T): {
  success: true;
  data?: T;
} {
  return {
    success: true,
    data,
  };
}

function failure(error: string): {
  success: false;
  error: string;
} {
  return {
    success: false,
    error,
  };
}

// ============================================================
// USB DRIVE DETECTION
// ============================================================

/**
 * Detect Windows removable drives.
 *
 * IMPORTANT PERFORMANCE RULE:
 *
 * PowerShell process startup is relatively expensive.
 * Therefore this function is called only when the in-memory
 * USB root cache has expired or been invalidated.
 *
 * The renderer never provides a drive path.
 */
async function detectWindowsUsbRoots(): Promise<string[]> {
  if (process.platform !== "win32") {
    return [];
  }

  try {
    const { stdout } = await execFileAsync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        [
          "Get-Volume",
          "| Where-Object { $_.DriveType -eq 'Removable' -and $_.DriveLetter }",
          "| Select-Object -ExpandProperty DriveLetter",
        ].join(" "),
      ],
      {
        windowsHide: true,
        timeout: 5000,
      },
    );

    const driveLetters = stdout
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter((value) => /^[A-Za-z]$/.test(value));

    return driveLetters.map((letter) => `${letter.toUpperCase()}:\\`);
  } catch {
    return [];
  }
}

// ============================================================
// USB REPLACEMENT ROOT VALIDATION
// ============================================================
//
// OLD and NEW USB drives may be attached simultaneously.
//
// Replacement therefore validates every native-selected drive
// against a fresh Windows removable-drive enumeration.
//
// Renderer never supplies this filesystem path.
// ============================================================

async function validateFinoraReplacementUsbRoot(
  candidateRoot:
    string,
): Promise<boolean> {
  if (
    process.platform !==
      "win32"
  ) {
    return false;
  }

  const normalizedCandidate =
    path.resolve(
      candidateRoot,
    );

  const candidateDriveRoot =
    path.resolve(
      path.parse(
        normalizedCandidate,
      ).root,
    ).toLowerCase();

  const removableRoots =
    await detectWindowsUsbRoots();

  return removableRoots.some(
    (root) =>
      path.resolve(root).toLowerCase() ===
      candidateDriveRoot,
  );
}

// ============================================================
// USB ROOT CACHE
// ============================================================
//
// The old implementation executed PowerShell for every:
// - status check
// - availability check
// - GET
// - GET_ALL
// - SAVE
// - UPDATE
// - DELETE
// - REPLACE_ALL
// - CLEAR
// - RESET
//
// That created the visible USB loading delay.
//
// The cache below keeps the already-detected removable root
// in memory and shares an in-flight detection request.
//
// SECURITY:
// - We still detect only Windows removable drives.
// - Renderer still cannot provide a path.
// - Cache is invalidated when USB filesystem access fails.
// - There is NO USB -> LOCAL fallback.
// ============================================================

const USB_ROOT_CACHE_TTL_MS = 30_000;

let cachedUsbRoot: string | null = null;

let cachedUsbRootAt = 0;

let manuallySelectedUsbRoot: string | null = null;

let usbRootDetectionPromise: Promise<string | null> | null = null;

function invalidateUsbRootCache(): void {
  cachedUsbRoot = null;

  manuallySelectedUsbRoot = null;

  cachedUsbRootAt = 0;
}

async function detectAndCacheUsbRoot(): Promise<string | null> {
  if (usbRootDetectionPromise) {
    return usbRootDetectionPromise;
  }

  usbRootDetectionPromise = (async () => {
    try {
      const roots = await detectWindowsUsbRoots();

      if (roots.length === 0) {
        cachedUsbRoot = null;

        cachedUsbRootAt = Date.now();

        return null;
      }

      // ----------------------------------------------------
      // PREFER ONE EXACT FINORA BRANCH FOLDER
      //
      // New owner layout:
      //   <REMOVABLE_ROOT>\<username>\FINORA\auth\finora-branch-auth.bin
      //
      // When exactly one branch folder exists, use that folder
      // as the complete FINORA USB root automatically.
      //
      // Legacy <REMOVABLE_ROOT>\FINORA is intentionally NOT
      // treated as a username / branch folder.
      // ----------------------------------------------------

      const discoveredBranchRoots: string[] =
        [];

      for (const removableRoot of roots) {
        let entries;

        try {
          entries =
            await fs.readdir(
              removableRoot,
              {
                withFileTypes:
                  true,
              },
            );
        }
        catch {
          continue;
        }

        for (const entry of entries) {
          if (!entry.isDirectory()) {
            continue;
          }

          if (
            entry.name.toLowerCase() ===
              FINORA_DIRECTORY.toLowerCase()
          ) {
            continue;
          }

          const branchRoot =
            path.join(
              removableRoot,
              entry.name,
            );

          const branchAuthFile =
            path.join(
              branchRoot,
              FINORA_DIRECTORY,
              "auth",
              "finora-branch-auth.bin",
            );

          try {
            await fs.access(
              branchAuthFile,
            );

            discoveredBranchRoots.push(
              branchRoot,
            );
          }
          catch {
            // Not an exact FINORA branch folder.
          }
        }
      }

      if (
        discoveredBranchRoots.length ===
          1
      ) {
        const branchRoot =
          discoveredBranchRoots[0];

        cachedUsbRoot =
          branchRoot;

        cachedUsbRootAt =
          Date.now();

        return branchRoot;
      }

      // ----------------------------------------------------
      // PREFER A DRIVE THAT ALREADY CONTAINS FINORA STORAGE
      // ----------------------------------------------------

      for (const root of roots) {
        const storageDirectory = path.join(
          root,
          FINORA_DIRECTORY,
          FINORA_STORAGE_DIRECTORY,
        );

        try {
          await fs.access(storageDirectory);

          cachedUsbRoot = root;

          cachedUsbRootAt = Date.now();

          return root;
        } catch {
          // Continue searching.
        }
      }

      // ----------------------------------------------------
      // OTHERWISE USE FIRST REMOVABLE DRIVE
      // ----------------------------------------------------

      const root = roots[0] ?? null;

      cachedUsbRoot = root;

      cachedUsbRootAt = Date.now();

      return root;
    } catch {
      cachedUsbRoot = null;

      cachedUsbRootAt = Date.now();

      return null;
    } finally {
      usbRootDetectionPromise = null;
    }
  })();

  return usbRootDetectionPromise;
}

async function selectFinoraUsbRootFromNativeDialog(): Promise<string | null> {
  if (
    !mainWindow ||
    mainWindow.isDestroyed()
  ) {
    throw new Error(
      "FINORA window is unavailable for USB selection.",
    );
  }

  const selection =
    await dialog.showOpenDialog(
      mainWindow,
      {
        title:
          "Select FINORA USB Storage",

        buttonLabel:
          "Use This USB",

        properties: [
          "openDirectory",
        ],
      },
    );

  if (
    selection.canceled ||
    selection.filePaths.length === 0
  ) {
    return null;
  }

  const candidateRoot =
    selection.filePaths[0];

  if (!candidateRoot) {
    throw new Error(
      "Please select a FINORA USB branch folder.",
    );
  }

  const resolvedCandidate =
    path.resolve(
      candidateRoot,
    );

  const removableRoots =
    await detectWindowsUsbRoots();

  const directRemovableRoot =
    removableRoots.some(
      (root) =>
        path.resolve(root).toLowerCase() ===
          resolvedCandidate.toLowerCase(),
    );

  const candidateDriveRoot =
    path.parse(
      resolvedCandidate,
    ).root;

  const candidateParent =
    path.dirname(
      resolvedCandidate,
    );

  const candidateIsDirectChildOfRemovable =
    removableRoots.some(
      (root) =>
        path.resolve(root).toLowerCase() ===
          path.resolve(candidateDriveRoot).toLowerCase() &&
        path.resolve(root).toLowerCase() ===
          path.resolve(candidateParent).toLowerCase(),
    );

  const candidateAuthFile =
    path.join(
      resolvedCandidate,
      FINORA_DIRECTORY,
      "auth",
      "finora-branch-auth.bin",
    );

  let isExactFinoraBranchFolder =
    false;

  if (candidateIsDirectChildOfRemovable) {
    try {
      await fs.access(
        candidateAuthFile,
      );

      isExactFinoraBranchFolder =
        true;
    }
    catch {
      isExactFinoraBranchFolder =
        false;
    }
  }

  if (
    !directRemovableRoot &&
    !isExactFinoraBranchFolder
  ) {
    throw new Error(
      "Select the connected removable USB root or an exact FINORA branch folder.",
    );
  }

  cachedUsbRoot =
    path.resolve(candidateRoot);

  manuallySelectedUsbRoot =
    cachedUsbRoot;

  cachedUsbRootAt =
    Date.now();

  return cachedUsbRoot;
}

async function findFinoraUsbRoot(forceRefresh = false): Promise<string | null> {
  const now = Date.now();

  if (!forceRefresh && manuallySelectedUsbRoot) {
    try {
      await fs.access(manuallySelectedUsbRoot);

      cachedUsbRoot = manuallySelectedUsbRoot;
      cachedUsbRootAt = now;

      return manuallySelectedUsbRoot;
    } catch {
      invalidateUsbRootCache();
      return null;
    }
  }

  // ----------------------------------------------------------
  // FAST PATH
  //
  // No PowerShell process is created while the cached root is
  // still inside the normal revalidation window.
  // ----------------------------------------------------------

  if (
    !forceRefresh &&
    cachedUsbRoot &&
    now - cachedUsbRootAt < USB_ROOT_CACHE_TTL_MS
  ) {
    return cachedUsbRoot;
  }

  // ----------------------------------------------------------
  // PERIODIC RE-DETECTION
  //
  // Preserve the last known removable root before invoking
  // PowerShell. Get-Volume is an external system dependency and
  // a transient timeout / empty result must not turn an already
  // accessible FINORA Pendrive into a false DISCONNECTED state.
  // ----------------------------------------------------------

  const previousCachedRoot =
    !forceRefresh
      ? cachedUsbRoot
      : null;

  const detectedRoot =
    await detectAndCacheUsbRoot();

  if (
    detectedRoot ||
    forceRefresh ||
    !previousCachedRoot
  ) {
    return detectedRoot;
  }

  // ----------------------------------------------------------
  // TRANSIENT DETECTION FALLBACK
  //
  // Re-detection returned no removable root, but a previously
  // trusted root existed. Verify that exact filesystem root is
  // still accessible before retaining it.
  //
  // Actual device removal still fails closed:
  // filesystem access fails -> cache invalidated -> null.
  //
  // No renderer path is accepted and there is no LOCAL fallback.
  // ----------------------------------------------------------

  try {
    await fs.access(previousCachedRoot);

    cachedUsbRoot =
      previousCachedRoot;

    cachedUsbRootAt =
      Date.now();

    return previousCachedRoot;
  } catch {
    invalidateUsbRootCache();

    return null;
  }
}

// ============================================================
// USB ROOT CACHE WARM-UP
// ============================================================
//
// Runs in the Electron main process without blocking window
// creation. By the time the renderer requests Customer data,
// the removable-drive detection is normally already complete.
//
// ============================================================

function warmUsbRootCache(): void {
  void detectAndCacheUsbRoot();
}

// ============================================================
// FINORA USB PATHS
// ============================================================

function getFinoraStorageDirectory(usbRoot: string): string {
  return path.join(usbRoot, FINORA_DIRECTORY, FINORA_STORAGE_DIRECTORY);
}

function getFinoraStorageFile(usbRoot: string): string {
  return path.join(getFinoraStorageDirectory(usbRoot), FINORA_STORAGE_FILE);
}

// ============================================================
// STORAGE PACKAGE
// ============================================================

function createEmptyStoragePackage(): UsbStoragePackage {
  return {
    version: "2.0",

    records: [],

    updatedAt: new Date().toISOString(),
  };
}

// ============================================================
// READ STORAGE PACKAGE
// ============================================================

function normalizeUsbStoragePackage(
  value: unknown,
): UsbStoragePackage {
  if (
    !value ||
    typeof value !== "object"
  ) {
    throw new Error(
      FINORA_STORAGE_INVALID_MESSAGE,
    );
  }

  const candidate =
    value as Partial<UsbStoragePackage>;

  if (
    candidate.version !== "2.0" ||
    !Array.isArray(
      candidate.records,
    )
  ) {
    throw new Error(
      FINORA_STORAGE_INVALID_MESSAGE,
    );
  }

  for (
    const record
    of candidate.records
  ) {
    if (
      !record ||
      typeof record !== "object" ||
      Array.isArray(
        record,
      )
    ) {
      throw new Error(
        FINORA_STORAGE_INVALID_MESSAGE,
      );
    }
  }

  return {
    version:
      "2.0",

    records:
      candidate.records as
        PersistedStorageRecord[],

    updatedAt:
      typeof candidate.updatedAt ===
        "string"
        ? candidate.updatedAt
        : new Date().toISOString(),
  };
}

async function tryReadValidStoragePackage(
  filePath: string,
): Promise<
  UsbStoragePackage |
  undefined
> {
  try {
    const raw =
      await fs.readFile(
        filePath,
        "utf8",
      );

    const parsed: unknown =
      JSON.parse(
        raw,
      );

    return normalizeUsbStoragePackage(
      parsed,
    );
  } catch {
    return undefined;
  }
}

async function usbStorageFileExists(
  filePath: string,
): Promise<boolean> {
  try {
    await fs.access(
      filePath,
    );

    return true;
  } catch {
    return false;
  }
}

async function readStoragePackage(
  usbRoot: string,
): Promise<UsbStoragePackage> {
  const storageDirectory =
    getFinoraStorageDirectory(
      usbRoot,
    );

  const storageFile =
    getFinoraStorageFile(
      usbRoot,
    );

  const temporaryFile =
    path.join(
      storageDirectory,
      FINORA_STORAGE_TEMP_FILE,
    );

  const backupFile =
    path.join(
      storageDirectory,
      FINORA_STORAGE_BACKUP_FILE,
    );

  await fs.mkdir(
    storageDirectory,
    {
      recursive:
        true,
    },
  );

  const mainExists =
    await usbStorageFileExists(
      storageFile,
    );

  if (mainExists) {
    const mainPackage =
      await tryReadValidStoragePackage(
        storageFile,
      );

    if (mainPackage) {
      return mainPackage;
    }
  }

  const backupExists =
    await usbStorageFileExists(
      backupFile,
    );

  if (backupExists) {
    const backupPackage =
      await tryReadValidStoragePackage(
        backupFile,
      );

    if (backupPackage) {
      return backupPackage;
    }
  }

  const temporaryExists =
    await usbStorageFileExists(
      temporaryFile,
    );

  if (temporaryExists) {
    const temporaryPackage =
      await tryReadValidStoragePackage(
        temporaryFile,
      );

    if (temporaryPackage) {
      return temporaryPackage;
    }
  }

  if (
    mainExists ||
    backupExists ||
    temporaryExists
  ) {
    throw new Error(
      FINORA_STORAGE_INVALID_MESSAGE,
    );
  }

  const emptyPackage =
    createEmptyStoragePackage();

  await writeStoragePackage(
    usbRoot,
    emptyPackage,
  );

  const initialized =
    await tryReadValidStoragePackage(
      storageFile,
    );

  if (!initialized) {
    throw new Error(
      FINORA_STORAGE_INVALID_MESSAGE,
    );
  }

  return initialized;
}

// ============================================================
// WRITE STORAGE PACKAGE
// ============================================================

async function writeStoragePackage(
  usbRoot: string,
  storagePackage: UsbStoragePackage,
): Promise<void> {
  const storageDirectory =
    getFinoraStorageDirectory(
      usbRoot,
    );

  const storageFile =
    getFinoraStorageFile(
      usbRoot,
    );

  const temporaryFile =
    path.join(
      storageDirectory,
      FINORA_STORAGE_TEMP_FILE,
    );

  const backupFile =
    path.join(
      storageDirectory,
      FINORA_STORAGE_BACKUP_FILE,
    );

  await fs.mkdir(
    storageDirectory,
    {
      recursive:
        true,
    },
  );

  /*
   * Normalize in-memory state before any filesystem mutation.
   */
  const normalized =
    normalizeUsbStoragePackage(
      storagePackage,
    );

  const mainExists =
    await usbStorageFileExists(
      storageFile,
    );

  if (mainExists) {
    const existingMain =
      await tryReadValidStoragePackage(
        storageFile,
      );

    if (!existingMain) {
      /*
       * Never replace a malformed main automatically.
       * A backup/temp candidate may be the only recoverable state.
       */
      throw new Error(
        FINORA_STORAGE_INVALID_MESSAGE,
      );
    }
  }

  const content =
    JSON.stringify(
      {
        ...normalized,

        updatedAt:
          new Date().toISOString(),
      },
      null,
      2,
    );

  /*
   * Remove only an old transaction temp artifact.
   * Main/backup remain untouched until the new temp package
   * has been completely written and read back successfully.
   */
  await fs.rm(
    temporaryFile,
    {
      force:
        true,
    },
  );

  // FINORA_P1_587G_USB_TEMP_FILE_FLUSH
  // Flush the temporary package before validation/publication.
  // Failure blocks rename, preserving the previous main file.
  const temporaryHandle =
    await fs.open(temporaryFile, "w");

  try {
    await temporaryHandle.writeFile(
      content,
      "utf8",
    );

    await temporaryHandle.sync();
  } finally {
    await temporaryHandle.close();
  }

  const verifiedTemporary =
    await tryReadValidStoragePackage(
      temporaryFile,
    );

  if (!verifiedTemporary) {
    throw new Error(
      "Unable to verify FINORA USB temporary storage file.",
    );
  }

  if (!mainExists) {
    await fs.rename(
      temporaryFile,
      storageFile,
    );

    const verifiedMain =
      await tryReadValidStoragePackage(
        storageFile,
      );

    if (!verifiedMain) {
      throw new Error(
        "Unable to verify FINORA USB storage file after writing.",
      );
    }

    return;
  }

  /*
   * Preserve one previous known-good main package.
   *
   * This filename intentionally matches the Android recovery
   * contract so either runtime can recognize the same artifact.
   */
  await fs.rm(
    backupFile,
    {
      force:
        true,
    },
  );

  await fs.rename(
    storageFile,
    backupFile,
  );

  try {
    await fs.rename(
      temporaryFile,
      storageFile,
    );

    const verifiedMain =
      await tryReadValidStoragePackage(
        storageFile,
      );

    if (!verifiedMain) {
      throw new Error(
        "Unable to verify FINORA USB storage file after writing.",
      );
    }
  } catch (error) {
    /*
     * Restore the previous known-good package when publication
     * fails. Do not expose parser/provider internals to renderer.
     */
    await fs.rm(
      storageFile,
      {
        force:
          true,
      },
    );

    if (
      await usbStorageFileExists(
        backupFile,
      )
    ) {
      await fs.rename(
        backupFile,
        storageFile,
      );
    }

    throw new Error(
      error instanceof Error &&
      error.message ===
        "Unable to verify FINORA USB storage file after writing."
        ? error.message
        : "Unable to replace FINORA USB storage file.",
    );
  }
}
// ============================================================
// LEGACY TENANT OUTER-ENVELOPE MIGRATION
//
// SECURITY / PORTABILITY RULES:
//
// - Renderer supplies ONLY opaque sessionId.
// - ownerId / businessId / branchId come only from the
//   authoritative in-memory FINORA login session resolver.
// - REAL + USB only.
// - Existing records must already belong to the authenticated
//   Owner.
// - Existing non-empty businessId / branchId must either match
//   the authenticated tenant exactly or migration fails closed.
// - Demo records are never adopted by a REAL branch.
// - record.data is preserved without mutation.
// - Operation is idempotent.
// ============================================================

function readTrimmedStorageAuthorityString(
  record: Record<string, unknown>,
  key: string,
): string {
  const value = record[key];

  return typeof value === "string"
    ? value.trim()
    : "";
}

async function handleUsbMigrateLegacyTenantScope(input: unknown, sender?: object) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    return failure(
      "A valid authenticated FINORA migration request is required.",
    );
  }

  const request =
    input as Record<string, unknown>;

  const sessionId =
    readTrimmedStorageAuthorityString(
      request,
      "sessionId",
    );

  if (!sessionId) {
    return failure(
      "A valid authenticated FINORA session is required.",
    );
  }

      // FINORA_P1_711K_SERVER_MIGRATION
    // Resolve the server session independently in Electron Main.
    // No renderer-provided tenant IDs and no legacy fallback.
    const resolutionUnknown: unknown =
      /^[a-f0-9]{64}$/.test(sessionId)
        ? await (async () => {
            if (!sender || !finoraServerUsbScopeResolver) {
              return failure("SERVER_MIGRATION_AUTHORITY_UNAVAILABLE");
            }

            const verified =
              await finoraServerUsbScopeResolver(sender, sessionId);

            if (!verified.success) {
              return failure(verified.error);
            }

            const scope = verified.scope;

            if (
              scope.sessionId !== sessionId ||
              scope.dataContext !== "REAL" ||
              !scope.ownerId ||
              !scope.businessId ||
              !scope.branchId
            ) {
              return failure("SERVER_MIGRATION_SCOPE_DENIED");
            }

            // The existing migration routine independently compares
            // session and principal scopes before touching records.
            const authoritativeContext = {
              ownerId: scope.ownerId,
              businessId: scope.businessId,
              branchId: scope.branchId,
              dataContext: "REAL" as const,
              storageMode: "USB" as const,
            };

            return {
              success: true as const,
              data: {
                session: {
                  ...authoritativeContext,
                  sessionId,
                },
                principal: {
                  ...authoritativeContext,
                },
              },
            };
          })()
        : await resolveFinoraBranchOperationalSessionContext({
            sessionId,
          });

  if (
    !resolutionUnknown ||
    typeof resolutionUnknown !== "object" ||
    Array.isArray(resolutionUnknown)
  ) {
    return failure(
      "Unable to resolve the authenticated FINORA branch session.",
    );
  }

  const resolution =
    resolutionUnknown as Record<string, unknown>;

  if (resolution.success !== true) {
    const error =
      readTrimmedStorageAuthorityString(
        resolution,
        "error",
      );

    return failure(
      error ||
        "The authenticated FINORA branch session is unavailable.",
    );
  }

  const contextUnknown =
    resolution.data;

  if (
    !contextUnknown ||
    typeof contextUnknown !== "object" ||
    Array.isArray(contextUnknown)
  ) {
    return failure(
      "The authenticated FINORA operational session context is unavailable.",
    );
  }

  const context =
    contextUnknown as Record<string, unknown>;

  const sessionUnknown =
    context.session;

  if (
    !sessionUnknown ||
    typeof sessionUnknown !== "object" ||
    Array.isArray(sessionUnknown)
  ) {
    return failure(
      "The authenticated FINORA login-session view is unavailable.",
    );
  }

  const authoritativeSession =
    sessionUnknown as Record<string, unknown>;

  const principalUnknown =
    context.principal;

  if (
    !principalUnknown ||
    typeof principalUnknown !== "object" ||
    Array.isArray(principalUnknown)
  ) {
    return failure(
      "The authenticated FINORA operational principal is unavailable.",
    );
  }

  const authoritativePrincipal =
    principalUnknown as Record<string, unknown>;

  const ownerId =
    readTrimmedStorageAuthorityString(
      authoritativeSession,
      "ownerId",
    );

  const businessId =
    readTrimmedStorageAuthorityString(
      authoritativeSession,
      "businessId",
    );

  const branchId =
    readTrimmedStorageAuthorityString(
      authoritativeSession,
      "branchId",
    );

  const dataContext =
    readTrimmedStorageAuthorityString(
      authoritativeSession,
      "dataContext",
    );

  const sessionStorageMode =
    readTrimmedStorageAuthorityString(
      authoritativeSession,
      "storageMode",
    );

  const principalOwnerId =
    readTrimmedStorageAuthorityString(
      authoritativePrincipal,
      "ownerId",
    );

  const principalBusinessId =
    readTrimmedStorageAuthorityString(
      authoritativePrincipal,
      "businessId",
    );

  const principalBranchId =
    readTrimmedStorageAuthorityString(
      authoritativePrincipal,
      "branchId",
    );

  const principalDataContext =
    readTrimmedStorageAuthorityString(
      authoritativePrincipal,
      "dataContext",
    );

  const principalStorageMode =
    readTrimmedStorageAuthorityString(
      authoritativePrincipal,
      "storageMode",
    );

  if (
    !ownerId ||
    !businessId ||
    !branchId ||
    !principalOwnerId ||
    !principalBusinessId ||
    !principalBranchId
  ) {
    return failure(
      "The authenticated FINORA tenant scope is incomplete.",
    );
  }

  if (
    ownerId !== principalOwnerId ||
    businessId !== principalBusinessId ||
    branchId !== principalBranchId
  ) {
    return failure(
      "The authenticated FINORA session and operational principal tenant scopes do not match.",
    );
  }

  if (
    dataContext !== "REAL" ||
    principalDataContext !== "REAL" ||
    dataContext !== principalDataContext
  ) {
    return failure(
      "Legacy commercial storage migration requires one authoritative REAL branch context.",
    );
  }

  if (
    sessionStorageMode !== "USB" ||
    principalStorageMode !== "USB" ||
    sessionStorageMode !== principalStorageMode
  ) {
    return failure(
      "Legacy USB storage migration requires one authoritative USB branch context.",
    );
  }

  const usbRoot =
    await findFinoraUsbRoot();

  if (!usbRoot) {
    return failure(
      "FINORA Pendrive is disconnected.",
    );
  }

  try {
    const storagePackage =
      await readStoragePackage(
        usbRoot,
      );

    let migrationCount =
      0;

    let fullyScopedRecordCount =
      0;

    let legacyRecordCount =
      0;

    let conflictingScopedTenantForLegacy =
      false;

    /*
     * MIGRATION QUALIFICATION
     *
     * The physical USB package is a multi-tenant container.
     *
     * Fully-scoped records already carry explicit
     * Owner + Business + Branch authority. They may belong
     * to the active branch or to sibling tenants and must not
     * be rejected or rewritten by legacy migration.
     *
     * Only a package consisting entirely of legacy Owner-only
     * records for the authenticated Owner may be stamped.
     */
    for (const record of storagePackage.records) {
      const recordOwnerId =
        typeof record.ownerId === "string"
          ? record.ownerId.trim()
          : "";

      const recordBusinessId =
        typeof record.businessId === "string"
          ? record.businessId.trim()
          : "";

      const recordBranchId =
        typeof record.branchId === "string"
          ? record.branchId.trim()
          : "";

      const recordDemoId =
        typeof record.demoId === "string"
          ? record.demoId.trim()
          : "";

      const hasOwnerId =
        recordOwnerId.length > 0;

      const hasBusinessId =
        recordBusinessId.length > 0;

      const hasBranchId =
        recordBranchId.length > 0;

      /*
       * Business and Branch must either both exist or both
       * be absent.
       */
      if (
        hasBusinessId !==
          hasBranchId
      ) {
        return failure(
          "FINORA USB storage contains a partially-scoped tenant record.",
        );
      }

      /*
       * Fully-scoped records are authoritative in themselves.
       * Sibling tenant scope is legitimate inside one USB
       * physical container.
       */
      if (
        hasBusinessId &&
        hasBranchId
      ) {
        if (!hasOwnerId) {
          return failure(
            "FINORA USB storage contains a scoped record without Owner authority.",
          );
        }

        fullyScopedRecordCount +=
          1;

        if (
          recordOwnerId === ownerId &&
          (
            recordBusinessId !== businessId ||
            recordBranchId !== branchId
          )
        ) {
          conflictingScopedTenantForLegacy =
            true;
        }

        continue;
      }

      /*
       * Business + Branch both absent:
       * legacy Owner-only candidate.
       */
      legacyRecordCount +=
        1;

      if (recordDemoId) {
        return failure(
          "FINORA USB legacy migration cannot include Demo-scoped records.",
        );
      }

      if (
        !hasOwnerId ||
        recordOwnerId !== ownerId
      ) {
        return failure(
          "FINORA USB legacy migration Owner scope does not match the authenticated branch.",
        );
      }
    }

    /*
     * Mixing already-scoped and legacy records is ambiguous.
     * Never guess which scoped tenant owns the legacy records.
     */
    if (
      legacyRecordCount > 0 &&
      conflictingScopedTenantForLegacy
    ) {
      return failure(
        "FINORA USB legacy tenant records are ambiguous across multiple scoped branches for the authenticated Owner.",
      );
    }

    migrationCount =
      legacyRecordCount;
    if (migrationCount === 0) {
      return success({
        migratedRecordCount:
          0,

        totalRecordCount:
          storagePackage.records.length,

        alreadyScoped:
          true,
      });
    }

    const originalRecords =
      storagePackage.records;

    const originalDataSnapshots =
      originalRecords.map(
        (record) =>
          JSON.stringify(
            record.data,
          ),
      );

    const migratedRecords =
      originalRecords.map(
        (record) => {
          const recordBusinessId =
            typeof record.businessId === "string"
              ? record.businessId.trim()
              : "";

          const recordBranchId =
            typeof record.branchId === "string"
              ? record.branchId.trim()
              : "";

          const isLegacy =
            recordBusinessId.length === 0 &&
            recordBranchId.length === 0;

          if (!isLegacy) {
            return record;
          }

          return {
            ...record,

            ownerId,

            businessId,

            branchId,
          };
        },
      );

    for (
      let index = 0;
      index < migratedRecords.length;
      index += 1
    ) {
      const original =
        originalRecords[index];

      const migrated =
        migratedRecords[index];

      if (
        !original ||
        !migrated
      ) {
        throw new Error(
          "FINORA migration record cardinality changed unexpectedly.",
        );
      }

      if (
        migrated.data !==
        original.data
      ) {
        throw new Error(
          "FINORA migration attempted to replace inner business data.",
        );
      }
    }

    storagePackage.records =
      migratedRecords;

    await writeStoragePackage(
      usbRoot,
      storagePackage,
    );

    const verifiedPackage =
      await readStoragePackage(
        usbRoot,
      );

    if (
      verifiedPackage.records.length !==
      originalRecords.length
    ) {
      throw new Error(
        "FINORA migration read-back record count does not match.",
      );
    }

    for (
      let index = 0;
      index < verifiedPackage.records.length;
      index += 1
    ) {
      const original =
        originalRecords[index];

      const verified =
        verifiedPackage.records[index];

      if (
        !original ||
        !verified
      ) {
        throw new Error(
          "FINORA migration read-back record is unavailable.",
        );
      }

      const expected =
        migratedRecords[index];

      if (!expected) {
        throw new Error(
          "FINORA migration expected record is unavailable.",
        );
      }

      if (
        verified.id !== expected.id ||
        verified.entity !== expected.entity ||
        verified.createdAt !== expected.createdAt ||
        verified.updatedAt !== expected.updatedAt ||
        verified.ownerId !== expected.ownerId ||
        verified.businessId !== expected.businessId ||
        verified.branchId !== expected.branchId ||
        verified.demoId !== expected.demoId
      ) {
        throw new Error(
          "FINORA migration read-back tenant envelope verification failed.",
        );
      }

      if (
        JSON.stringify(
          verified.data,
        ) !==
        originalDataSnapshots[index]
      ) {
        throw new Error(
          "FINORA migration changed inner business data.",
        );
      }
    }

    return success({
      migratedRecordCount:
        migrationCount,

      totalRecordCount:
        verifiedPackage.records.length,

      alreadyScoped:
        false,
    });
  } catch (error) {
    invalidateUsbRootCache();

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to migrate legacy FINORA tenant storage scope.",
    );
  }
}

// ============================================================
// RECORD VALIDATION
// ============================================================

function validateQuery(query: StorageQuery): string | null {
  if (!query || typeof query !== "object") {
    return "Storage query is required.";
  }

  if (typeof query.entity !== "string" || query.entity.trim().length === 0) {
    return "Storage entity is required.";
  }

  return null;
}


function validateRecord(record: unknown): record is Record<string, unknown> {
  return (
    typeof record === "object" && record !== null && !Array.isArray(record)
  );
}

// ============================================================
// RECORD MATCHING
// ============================================================

function recordMatchesQuery(
  record: PersistedStorageRecord,

  query: StorageQuery,
): boolean {
  if (record.entity !== query.entity) {
    return false;
  }

  if (query.id !== undefined && record.id !== query.id) {
    return false;
  }

  if (query.ownerId !== undefined && record.ownerId !== query.ownerId) {
    return false;
  }

  if (
    query.businessId !== undefined &&
    record.businessId !== query.businessId
  ) {
    return false;
  }

  if (
    query.branchId !== undefined &&
    record.branchId !== query.branchId
  ) {
    return false;
  }

  if (query.demoId !== undefined && record.demoId !== query.demoId) {
    return false;
  }

  return true;
}


// ============================================================
// RECORD OUTPUT
// ============================================================

function getRecordData(record: PersistedStorageRecord): unknown {
  return record.data;
}

// ============================================================
// USB STATUS
// ============================================================

async function getUsbStatus() {
  const usbRoot = await findFinoraUsbRoot();

  if (!usbRoot) {
    return {
      availability: "DISCONNECTED",

      message: "FINORA Pendrive is not connected.",
    };
  }

  try {
    const storageDirectory = getFinoraStorageDirectory(usbRoot);

    await fs.mkdir(storageDirectory, {
      recursive: true,
    });

    return {
      availability: "READY",

      storageId: path.parse(usbRoot).root,

      storagePath: usbRoot,

      message: `FINORA Branch Storage Ready: ${usbRoot}`,
    };
  } catch (error) {
    // A failed filesystem access can mean the removable drive
    // was removed or became unavailable.
    invalidateUsbRootCache();

    return {
      availability: "ERROR",

      message:
        error instanceof Error
          ? error.message
          : "Unable to access FINORA Pendrive.",
    };
  }
}

// ============================================================
// USB AVAILABILITY
// ============================================================

async function isUsbAvailable(): Promise<boolean> {
  const status = await getUsbStatus();

  return status.availability === "READY";
}

// ============================================================
// IPC: GET
// ============================================================

async function handleUsbGet(query: StorageQuery) {
  const queryError = validateQuery(query);

  if (queryError) {
    return failure(queryError);
  }

  const usbRoot = await findFinoraUsbRoot();

  if (!usbRoot) {
    return failure("FINORA Pendrive is disconnected.");
  }

  try {
    const storagePackage = await readStoragePackage(usbRoot);

    const record = storagePackage.records.find((item) =>
      recordMatchesQuery(item, query),
    );

    return success(record ? getRecordData(record) : undefined);
  } catch (error) {
    // USB may have been removed between detection and access.
    // Invalidate the cached root so the next operation re-detects it.
    invalidateUsbRootCache();

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to read FINORA USB storage.",
    );
  }
}

// ============================================================
// IPC: GET ALL
// ============================================================

async function handleUsbGetAll(query: StorageQuery) {
  const queryError = validateQuery(query);

  if (queryError) {
    return failure(queryError);
  }

  const usbRoot = await findFinoraUsbRoot();

  if (!usbRoot) {
    return failure("FINORA Pendrive is disconnected.");
  }

  try {
    const storagePackage = await readStoragePackage(usbRoot);

    let records = storagePackage.records.filter((item) =>
      recordMatchesQuery(item, query),
    );

    const offset = Math.max(query.offset ?? 0, 0);

    const limit =
      query.limit !== undefined ? Math.max(query.limit, 0) : undefined;

    records =
      limit === undefined
        ? records.slice(offset)
        : records.slice(offset, offset + limit);

    return success(records.map(getRecordData));
  } catch (error) {
    // USB may have been removed between detection and access.
    // Invalidate the cached root so the next operation re-detects it.
    invalidateUsbRootCache();

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to read FINORA USB records.",
    );
  }
}

// ============================================================
// IPC: SAVE
// ============================================================

async function handleUsbSave(
  record: unknown,

  options?: StorageWriteOptions,
) {
  if (!validateRecord(record)) {
    return failure("A valid storage record is required.");
  }

  const entity = typeof record.entity === "string" ? record.entity : undefined;

  if (!entity) {
    return failure("Storage record entity is required.");
  }

  const usbRoot = await findFinoraUsbRoot();

  if (!usbRoot) {
    return failure("FINORA Pendrive is disconnected.");
  }

  try {
    const storagePackage = await readStoragePackage(usbRoot);

    const now = new Date().toISOString();

    const id =
      typeof record.id === "string" && record.id.length > 0
        ? record.id
        : randomUUID();

    const persistedRecord: PersistedStorageRecord = {
      id,

      entity,

      data: record.data ?? record,

      createdAt: typeof record.createdAt === "string" ? record.createdAt : now,

      updatedAt: now,

      ownerId: options?.ownerId,

      businessId: options?.businessId,

      branchId: options?.branchId,

      demoId: options?.demoId,
    };

    const duplicateIndex = storagePackage.records.findIndex(
      (item) =>
        item.id === id &&
        item.entity === entity &&
        item.ownerId === options?.ownerId &&
        item.businessId === options?.businessId &&
        item.branchId === options?.branchId &&
        item.demoId === options?.demoId,
    );

    if (duplicateIndex >= 0) {
      return failure("A storage record with the same ID already exists.");
    }

    storagePackage.records.push(persistedRecord);

    await writeStoragePackage(usbRoot, storagePackage);

    return success(persistedRecord.data);
  } catch (error) {
    // USB may have been removed between detection and access.
    // Invalidate the cached root so the next operation re-detects it.
    invalidateUsbRootCache();

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to save FINORA USB record.",
    );
  }
}

// ============================================================
// IPC: UPDATE
// ============================================================

async function handleUsbUpdate(
  record: unknown,

  options?: StorageWriteOptions,
) {
  if (!validateRecord(record)) {
    return failure("A valid storage record is required.");
  }

  const entity = typeof record.entity === "string" ? record.entity : undefined;

  const id = typeof record.id === "string" ? record.id : undefined;

  if (!entity) {
    return failure("Storage record entity is required.");
  }

  if (!id) {
    return failure("Storage record ID is required for update.");
  }

  const usbRoot = await findFinoraUsbRoot();

  if (!usbRoot) {
    return failure("FINORA Pendrive is disconnected.");
  }

  try {
    const storagePackage = await readStoragePackage(usbRoot);

    const index = storagePackage.records.findIndex(
      (item) =>
        item.id === id &&
        item.entity === entity &&
        item.ownerId === options?.ownerId &&
        item.businessId === options?.businessId &&
        item.branchId === options?.branchId &&
        item.demoId === options?.demoId,
    );

    if (index < 0) {
      return failure("FINORA storage record was not found.");
    }

    const existing = storagePackage.records[index];

    if (!existing) {
      return failure("FINORA storage record was not found.");
    }

    const updatedRecord: PersistedStorageRecord = {
      ...existing,

      data: record.data ?? record,

      updatedAt: new Date().toISOString(),
    };

    storagePackage.records[index] = updatedRecord;

    await writeStoragePackage(usbRoot, storagePackage);

    return success(updatedRecord.data);
  } catch (error) {
    // USB may have been removed between detection and access.
    // Invalidate the cached root so the next operation re-detects it.
    invalidateUsbRootCache();

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to update FINORA USB record.",
    );
  }
}

// ============================================================
// IPC: DELETE
// ============================================================

async function handleUsbDelete(query: StorageQuery) {
  const queryError = validateQuery(query);

  if (queryError) {
    return failure(queryError);
  }

  const usbRoot = await findFinoraUsbRoot();

  if (!usbRoot) {
    return failure("FINORA Pendrive is disconnected.");
  }

  try {
    const storagePackage = await readStoragePackage(usbRoot);

    const originalLength = storagePackage.records.length;

    storagePackage.records = storagePackage.records.filter(
      (item) => !recordMatchesQuery(item, query),
    );

    const deleted = storagePackage.records.length !== originalLength;

    if (deleted) {
      await writeStoragePackage(usbRoot, storagePackage);
    }

    return success();
  } catch (error) {
    // USB may have been removed between detection and access.
    // Invalidate the cached root so the next operation re-detects it.
    invalidateUsbRootCache();

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to delete FINORA USB record.",
    );
  }
}

// ============================================================
// IPC: REPLACE ALL
// ============================================================

async function handleUsbReplaceAll(
  records: unknown[],

  options?: StorageWriteOptions,
) {
  if (!Array.isArray(records)) {
    return failure("Storage records must be an array.");
  }

  const usbRoot = await findFinoraUsbRoot();

  if (!usbRoot) {
    return failure("FINORA Pendrive is disconnected.");
  }

  try {
    const invalidRecord = records.find(
      (record) => !validateRecord(record) || typeof record.entity !== "string",
    );

    if (invalidRecord) {
      return failure("Every storage record must contain an entity.");
    }

    const storagePackage = await readStoragePackage(usbRoot);

    const now = new Date().toISOString();

    const preparedRecords: PersistedStorageRecord[] = records.map((record) => {
      const source = record as Record<string, unknown>;

      return {
        id:
          typeof source.id === "string" && source.id.length > 0
            ? source.id
            : randomUUID(),

        entity: source.entity as string,

        data: source.data ?? source,

        createdAt:
          typeof source.createdAt === "string" ? source.createdAt : now,

        updatedAt: now,

        ownerId: options?.ownerId,

        businessId: options?.businessId,

        branchId: options?.branchId,

        demoId: options?.demoId,
      };
    });

    const preservedRecords = storagePackage.records.filter((existing) => {
      return !preparedRecords.some(
        (replacement) =>
          replacement.entity === existing.entity &&
          replacement.ownerId === existing.ownerId &&
          replacement.businessId === existing.businessId &&
          replacement.branchId === existing.branchId &&
          replacement.demoId === existing.demoId,
      );
    });

    storagePackage.records = [...preservedRecords, ...preparedRecords];

    await writeStoragePackage(usbRoot, storagePackage);

    return success();
  } catch (error) {
    // USB may have been removed between detection and access.
    // Invalidate the cached root so the next operation re-detects it.
    invalidateUsbRootCache();

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to replace FINORA USB records.",
    );
  }
}

// ============================================================
// IPC: CLEAR
// ============================================================

async function handleUsbClear(query: StorageQuery) {
  const queryError = validateQuery(query);

  if (queryError) {
    return failure(queryError);
  }

  const usbRoot = await findFinoraUsbRoot();

  if (!usbRoot) {
    return failure("FINORA Pendrive is disconnected.");
  }

  try {
    const storagePackage = await readStoragePackage(usbRoot);

    storagePackage.records = storagePackage.records.filter(
      (item) => !recordMatchesQuery(item, query),
    );

    await writeStoragePackage(usbRoot, storagePackage);

    return success();
  } catch (error) {
    // USB may have been removed between detection and access.
    // Invalidate the cached root so the next operation re-detects it.
    invalidateUsbRootCache();

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to clear FINORA USB records.",
    );
  }
}

// ============================================================
// IPC: RESET FINORA DATA
//
// IMPORTANT:
//
// - Clears ONLY FINORA-owned persisted records.
// - Does NOT format the USB drive.
// - Does NOT delete unrelated USB files.
// - Does NOT delete unrelated USB folders.
// - Does NOT touch the user's other USB data.
//
// Only this FINORA file is rewritten:
//
// FINORA\storage\finora-storage.json
//
// Result:
//
// Only records inside the validated active REAL / DEMO
// logical scope are removed. Other owners and Demo
// environments remain intact.
//
// ============================================================

async function handleUsbResetFinoraData(
  scope: FinoraUsbResetScope,
) {
  const scopeError = validateFinoraUsbResetScope(scope);

  if (scopeError) {
    return failure(scopeError);
  }

  const usbRoot = await findFinoraUsbRoot();

  if (!usbRoot) {
    return failure("FINORA Pendrive is disconnected.");
  }

  try {
    const storagePackage = await readStoragePackage(usbRoot);

    storagePackage.records = storagePackage.records.filter(
      (record) => !recordMatchesFinoraUsbResetScope(record, scope),
    );

    await writeStoragePackage(usbRoot, storagePackage);

    return success();
  } catch (error) {
    // USB may have been removed between detection and access.
    // Invalidate the cached root so the next operation re-detects it.
    invalidateUsbRootCache();

    return failure(
      error instanceof Error
        ? error.message
        : "Unable to reset FINORA USB data.",
    );
  }
}

// ============================================================

// ============================================================
// AUTHENTICATED USB STORAGE SCOPE
//
// SECURITY:
//
// Renderer scope is never authoritative.
//
// Every ordinary USB CRUD request must carry only an active
// opaque FINORA sessionId. Electron main resolves that session
// again and derives the exact Owner / Business / Branch scope.
//
// Renderer-provided tenant IDs may only agree with authority;
// conflicting values fail closed.
// ============================================================

interface FinoraAuthenticatedUsbStorageScope {
  sessionId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  dataContext:
    | "REAL"
    | "DEMO";

  demoId?: string;
}


type FinoraAuthenticatedUsbStorageScopeResult =
  | {
      success: true;

      scope:
        FinoraAuthenticatedUsbStorageScope;
    }
  | {
      success: false;

      error: string;
    };


type FinoraAuthenticatedUsbQueryResult =
  | {
      success: true;

      query:
        StorageQuery;
    }
  | {
      success: false;

      error: string;
    };


type FinoraAuthenticatedUsbWriteResult =
  | {
      success: true;

      options:
        StorageWriteOptions;
    }
  | {
      success: false;

      error: string;
    };


function normalizeFinoraUsbAuthorityValue(
  value:
    unknown,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}


// FINORA_P1_706M_SERVER_USB_DEPENDENCY_BRIDGE
// Only the Main Login scope can register this resolver.
// No global exposure or renderer-controlled scope.
type FinoraServerUsbScopeResolver = (
  sender: object,
  sessionId: string,
) => Promise<FinoraAuthenticatedUsbStorageScopeResult>;

let finoraServerUsbScopeResolver:
  | FinoraServerUsbScopeResolver
  | undefined;

function registerFinoraServerUsbScopeResolver(
  resolver: FinoraServerUsbScopeResolver,
): void {
  if (finoraServerUsbScopeResolver) {
    throw new Error("SERVER_USB_SCOPE_RESOLVER_ALREADY_REGISTERED");
  }
  finoraServerUsbScopeResolver = resolver;
}

async function resolveFinoraAuthenticatedUsbStorageScope(
  sessionIdValue:
    unknown,
): Promise<
  FinoraAuthenticatedUsbStorageScopeResult
> {
  const sessionId =
    normalizeFinoraUsbAuthorityValue(
      sessionIdValue,
    );

  if (!sessionId) {
    return {
      success:
        false,

      error:
        "An authenticated FINORA session is required for USB storage access.",
    };
  }

  const resolution =
    await resolveFinoraBranchOperationalSessionContext({
      sessionId,
    });

  if (!resolution.success) {
    return {
      success:
        false,

      error:
        resolution.error,
    };
  }

  const session =
    resolution.data.session;

  const principal =
    resolution.data.principal;

  const sessionOwnerId =
    normalizeFinoraUsbAuthorityValue(
      session.ownerId,
    );

  const sessionBusinessId =
    normalizeFinoraUsbAuthorityValue(
      session.businessId,
    );

  const sessionBranchId =
    normalizeFinoraUsbAuthorityValue(
      session.branchId,
    );

  const principalOwnerId =
    normalizeFinoraUsbAuthorityValue(
      principal.ownerId,
    );

  const principalBusinessId =
    normalizeFinoraUsbAuthorityValue(
      principal.businessId,
    );

  const principalBranchId =
    normalizeFinoraUsbAuthorityValue(
      principal.branchId,
    );

  if (
    normalizeFinoraUsbAuthorityValue(
      session.sessionId,
    ) !==
      sessionId
  ) {
    return {
      success:
        false,

      error:
        "FINORA USB storage session identity mismatch.",
    };
  }

  if (
    !sessionOwnerId ||
    !sessionBusinessId ||
    !sessionBranchId ||
    sessionOwnerId !==
      principalOwnerId ||
    sessionBusinessId !==
      principalBusinessId ||
    sessionBranchId !==
      principalBranchId
  ) {
    return {
      success:
        false,

      error:
        "FINORA USB tenant scope does not match the authenticated branch authority.",
    };
  }

  if (
    session.storageMode !==
      "USB" ||
    principal.storageMode !==
      "USB"
  ) {
    return {
      success:
        false,

      error:
        "The authenticated FINORA session is not authorized for USB storage.",
    };
  }

  if (
    session.dataContext !==
      principal.dataContext
  ) {
    return {
      success:
        false,

      error:
        "FINORA USB data context does not match the authenticated branch authority.",
    };
  }

  const sessionDemoId =
    normalizeFinoraUsbAuthorityValue(
      session.demoId,
    );

  const principalDemoId =
    normalizeFinoraUsbAuthorityValue(
      principal.demoId,
    );

  if (
    session.dataContext ===
      "REAL"
  ) {
    if (
      sessionDemoId ||
      principalDemoId
    ) {
      return {
        success:
          false,

        error:
          "A REAL FINORA session cannot select Demo USB storage.",
      };
    }

    return {
      success:
        true,

      scope: {
        sessionId,

        ownerId:
          sessionOwnerId,

        businessId:
          sessionBusinessId,

        branchId:
          sessionBranchId,

        dataContext:
          "REAL",
      },
    };
  }

  if (
    session.dataContext !==
      "DEMO" ||
    !sessionDemoId ||
    sessionDemoId !==
      principalDemoId
  ) {
    return {
      success:
        false,

      error:
        "FINORA Demo USB scope does not match the authenticated branch authority.",
    };
  }

  return {
    success:
      true,

    scope: {
      sessionId,

      ownerId:
        sessionOwnerId,

      businessId:
        sessionBusinessId,

      branchId:
        sessionBranchId,

      dataContext:
        "DEMO",

      demoId:
        sessionDemoId,
    },
  };
}


function bindFinoraUsbQueryToAuthenticatedScope(
  query:
    StorageQuery,

  scope:
    FinoraAuthenticatedUsbStorageScope,
): FinoraAuthenticatedUsbQueryResult {
  const suppliedOwnerId =
    normalizeFinoraUsbAuthorityValue(
      query.ownerId,
    );

  const suppliedBusinessId =
    normalizeFinoraUsbAuthorityValue(
      query.businessId,
    );

  const suppliedBranchId =
    normalizeFinoraUsbAuthorityValue(
      query.branchId,
    );

  const suppliedDemoId =
    normalizeFinoraUsbAuthorityValue(
      query.demoId,
    );

  if (
    suppliedOwnerId &&
    suppliedOwnerId !==
      scope.ownerId
  ) {
    return {
      success:
        false,

      error:
        "USB Owner scope does not match the authenticated FINORA session.",
    };
  }

  if (
    suppliedBusinessId &&
    suppliedBusinessId !==
      scope.businessId
  ) {
    return {
      success:
        false,

      error:
        "USB Business scope does not match the authenticated FINORA session.",
    };
  }

  if (
    suppliedBranchId &&
    suppliedBranchId !==
      scope.branchId
  ) {
    return {
      success:
        false,

      error:
        "USB Branch scope does not match the authenticated FINORA session.",
    };
  }

  if (
    scope.dataContext ===
      "REAL"
  ) {
    if (suppliedDemoId) {
      return {
        success:
          false,

        error:
          "A REAL FINORA USB request cannot select Demo scope.",
      };
    }
  }
  else if (
    suppliedDemoId &&
    suppliedDemoId !==
      scope.demoId
  ) {
    return {
      success:
        false,

      error:
        "USB Demo scope does not match the authenticated FINORA session.",
    };
  }

  return {
    success:
      true,

    query: {
      ...query,

      sessionId:
        scope.sessionId,

      ownerId:
        scope.ownerId,

      businessId:
        scope.businessId,

      branchId:
        scope.branchId,

      demoId:
        scope.dataContext ===
          "DEMO"
          ? scope.demoId
          : undefined,
    },
  };
}


function bindFinoraUsbWriteToAuthenticatedScope(
  options:
    StorageWriteOptions | undefined,

  scope:
    FinoraAuthenticatedUsbStorageScope,
): FinoraAuthenticatedUsbWriteResult {
  const suppliedOwnerId =
    normalizeFinoraUsbAuthorityValue(
      options?.ownerId,
    );

  const suppliedBusinessId =
    normalizeFinoraUsbAuthorityValue(
      options?.businessId,
    );

  const suppliedBranchId =
    normalizeFinoraUsbAuthorityValue(
      options?.branchId,
    );

  const suppliedDemoId =
    normalizeFinoraUsbAuthorityValue(
      options?.demoId,
    );

  if (
    suppliedOwnerId &&
    suppliedOwnerId !==
      scope.ownerId
  ) {
    return {
      success:
        false,

      error:
        "USB write Owner scope does not match the authenticated FINORA session.",
    };
  }

  if (
    suppliedBusinessId &&
    suppliedBusinessId !==
      scope.businessId
  ) {
    return {
      success:
        false,

      error:
        "USB write Business scope does not match the authenticated FINORA session.",
    };
  }

  if (
    suppliedBranchId &&
    suppliedBranchId !==
      scope.branchId
  ) {
    return {
      success:
        false,

      error:
        "USB write Branch scope does not match the authenticated FINORA session.",
    };
  }

  if (
    scope.dataContext ===
      "REAL"
  ) {
    if (suppliedDemoId) {
      return {
        success:
          false,

        error:
          "A REAL FINORA USB write cannot select Demo scope.",
      };
    }
  }
  else if (
    suppliedDemoId &&
    suppliedDemoId !==
      scope.demoId
  ) {
    return {
      success:
        false,

      error:
        "USB write Demo scope does not match the authenticated FINORA session.",
    };
  }

  return {
    success:
      true,

    options: {
      ...options,

      sessionId:
        scope.sessionId,

      ownerId:
        scope.ownerId,

      businessId:
        scope.businessId,

      branchId:
        scope.branchId,

      demoId:
        scope.dataContext ===
          "DEMO"
          ? scope.demoId
          : undefined,
    },
  };
}


// FINORA_P1_706N_USB_HANDLER_CONNECTION
// Both paths must independently authenticate the supplied session.
// A renderer-supplied tenant scope is never trusted.
async function resolveFinoraUsbScopeForSender(
  sender: object,
  sessionIdValue: unknown,
): Promise<FinoraAuthenticatedUsbStorageScopeResult> {
  const sessionId = normalizeFinoraUsbAuthorityValue(sessionIdValue);
  if (!sessionId) {
    return { success: false, error: "USB_SESSION_REQUIRED" };
  }

  if (finoraServerUsbScopeResolver && /^[a-f0-9]{64}$/.test(sessionId)) {
    try {
      const serverResult = await finoraServerUsbScopeResolver(
        sender, sessionId,
      );
      if (serverResult.success) return serverResult;
    } catch {
      // Never grant access because server validation threw.
    }
  }

  // Preserve legacy only when its own independent operational
  // session resolver positively authenticates this exact ID.
  return resolveFinoraAuthenticatedUsbStorageScope(sessionId);
}

async function authorizeFinoraUsbQuery(
  query:
    StorageQuery,
sender: object,
): Promise<
  FinoraAuthenticatedUsbQueryResult
> {
  const scopeResult =
    await resolveFinoraUsbScopeForSender(sender, query?.sessionId);

  if (!scopeResult.success) {
    return scopeResult;
  }

  return bindFinoraUsbQueryToAuthenticatedScope(
    query,
    scopeResult.scope,
  );
}


async function authorizeFinoraUsbWrite(
  options:
    StorageWriteOptions | undefined,
sender: object,
): Promise<
  FinoraAuthenticatedUsbWriteResult
> {
  const scopeResult =
    await resolveFinoraUsbScopeForSender(sender, options?.sessionId);

  if (!scopeResult.success) {
    return scopeResult;
  }

  return bindFinoraUsbWriteToAuthenticatedScope(
    options,
    scopeResult.scope,
  );
}

// REGISTER USB IPC HANDLERS
// ============================================================

function registerUsbStorageHandlers(): void {
  if (handlersRegistered) {
    return;
  }

  handlersRegistered = true;

  // ----------------------------------------------------------
  // AVAILABILITY
  // ----------------------------------------------------------

  ipcMain.handle(IPC_CHANNELS.IS_AVAILABLE, async (event) => {
    if (!isTrustedRenderer(event.senderFrame)) {
      return false;
    }

    return isUsbAvailable();
  });

  // ----------------------------------------------------------
  // STATUS
  // ----------------------------------------------------------

  ipcMain.handle(IPC_CHANNELS.GET_STATUS, async (event) => {
    if (!isTrustedRenderer(event.senderFrame)) {
      return {
        availability: "ERROR",

        message: "Untrusted renderer.",
      };
    }

    return getUsbStatus();
  });

  // ----------------------------------------------------------
  // GET
  // ----------------------------------------------------------

  ipcMain.handle(IPC_CHANNELS.GET, async (event, query: StorageQuery) => {
    if (!isTrustedRenderer(event.senderFrame)) {
      return failure("Untrusted renderer.");
    }

    const authorization =
      await authorizeFinoraUsbQuery(query, event.sender);

    if (!authorization.success) {
      return failure(
        authorization.error,
      );
    }

    return handleUsbGet(
      authorization.query,
    );
  });

  // ----------------------------------------------------------
  // GET ALL
  // ----------------------------------------------------------

  ipcMain.handle(IPC_CHANNELS.GET_ALL, async (event, query: StorageQuery) => {
    if (!isTrustedRenderer(event.senderFrame)) {
      return failure("Untrusted renderer.");
    }

    const authorization =
      await authorizeFinoraUsbQuery(query, event.sender);

    if (!authorization.success) {
      return failure(
        authorization.error,
      );
    }

    return handleUsbGetAll(
      authorization.query,
    );
  });

  // ----------------------------------------------------------
  // SAVE
  // ----------------------------------------------------------

  ipcMain.handle(
    IPC_CHANNELS.SAVE,
    async (event, record: unknown, options?: StorageWriteOptions) => {
      if (!isTrustedRenderer(event.senderFrame)) {
        return failure("Untrusted renderer.");
      }

      const authorization =
        await authorizeFinoraUsbWrite(options, event.sender);

      if (!authorization.success) {
        return failure(
          authorization.error,
        );
      }

      return handleUsbSave(
        record,
        authorization.options,
      );
    },
  );

  // ----------------------------------------------------------
  // UPDATE
  // ----------------------------------------------------------

  ipcMain.handle(
    IPC_CHANNELS.UPDATE,
    async (event, record: unknown, options?: StorageWriteOptions) => {
      if (!isTrustedRenderer(event.senderFrame)) {
        return failure("Untrusted renderer.");
      }

      const authorization =
        await authorizeFinoraUsbWrite(options, event.sender);

      if (!authorization.success) {
        return failure(
          authorization.error,
        );
      }

      return handleUsbUpdate(
        record,
        authorization.options,
      );
    },
  );

  // ----------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------

  ipcMain.handle(IPC_CHANNELS.DELETE, async (event, query: StorageQuery) => {
    if (!isTrustedRenderer(event.senderFrame)) {
      return failure("Untrusted renderer.");
    }

    const authorization =
      await authorizeFinoraUsbQuery(query, event.sender);

    if (!authorization.success) {
      return failure(
        authorization.error,
      );
    }

    return handleUsbDelete(
      authorization.query,
    );
  });

  // ----------------------------------------------------------
  // REPLACE ALL
  // ----------------------------------------------------------

  ipcMain.handle(
    IPC_CHANNELS.REPLACE_ALL,
    async (event, records: unknown[], options?: StorageWriteOptions) => {
      if (!isTrustedRenderer(event.senderFrame)) {
        return failure("Untrusted renderer.");
      }

      const authorization =
        await authorizeFinoraUsbWrite(options, event.sender);

      if (!authorization.success) {
        return failure(
          authorization.error,
        );
      }

      return handleUsbReplaceAll(
        records,
        authorization.options,
      );
    },
  );

  // ----------------------------------------------------------
  // CLEAR
  // ----------------------------------------------------------

  ipcMain.handle(IPC_CHANNELS.CLEAR, async (event, query: StorageQuery) => {
    if (!isTrustedRenderer(event.senderFrame)) {
      return failure("Untrusted renderer.");
    }

    const authorization =
      await authorizeFinoraUsbQuery(query, event.sender);

    if (!authorization.success) {
      return failure(
        authorization.error,
      );
    }

    return handleUsbClear(
      authorization.query,
    );
  });

  // ----------------------------------------------------------
  // LEGACY TENANT SCOPE MIGRATION
  //
  // Renderer may provide only the opaque sessionId.
  // Tenant scope is re-resolved in Electron main.
  // ----------------------------------------------------------

  ipcMain.handle(
    IPC_CHANNELS.MIGRATE_LEGACY_TENANT_SCOPE,
    async (
      event,
      request: unknown,
    ) => {
      if (!isTrustedRenderer(event.senderFrame)) {
        return failure("Untrusted renderer.");
      }

      return handleUsbMigrateLegacyTenantScope(request, event.sender);
    },
  );

  // ----------------------------------------------------------
  // RESET FINORA DATA
  // ----------------------------------------------------------

  ipcMain.handle(
    IPC_CHANNELS.RESET_FINORA_DATA,
    async (
      event,
      scope: FinoraUsbResetScope,
    ) => {
      if (!isTrustedRenderer(event.senderFrame)) {
        return failure("Untrusted renderer.");
      }

      return handleUsbResetFinoraData(scope);
    },
  );
}

// ============================================================
// MAIN WINDOW CREATION
// ============================================================

const FINORA_WINDOW_TOGGLE_FULLSCREEN_CHANNEL =
  "finora:window:toggle-fullscreen";

ipcMain.handle(
  FINORA_WINDOW_TOGGLE_FULLSCREEN_CHANNEL,
  (event): boolean => {
    const targetWindow =
      BrowserWindow.fromWebContents(event.sender);

    if (!targetWindow || targetWindow.isDestroyed()) {
      return false;
    }

    const nextFullScreen =
      !targetWindow.isFullScreen();

    targetWindow.setFullScreen(nextFullScreen);

    return nextFullScreen;
  },
);

function createMainWindow(): void {
  const createdWindow = new BrowserWindow({
    width: 1400,

    height: 900,

    minWidth: 1200,

    minHeight: 700,

    title: "FINORA Enterprise",

    backgroundColor: "#0f172a",

    autoHideMenuBar: true,

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),

      contextIsolation: true,

      nodeIntegration: false,

      sandbox: true,
    },
  });

  mainWindow = createdWindow;

  // FINORA_P549E_SERVER_WALLET_WINDOW
  // Windows OS-encrypted key storage. Other platforms need their own adapter.
  // Construction performs no login, enrollment or wallet API request.
  // Registration is bound to this exact main WebContents.
  if (process.platform === "win32") {
    const serverWalletAccess = createFinoraServerWalletOnlineAccess({
      vault: createFinoraServerWalletKeyVault(),
    });

    // FINORA_P1_579GJ_WALLET_PROOF_ENROLLMENT
    // Retained only inside Electron main memory.
    finoraServerWalletOnlineAccessForLifecycle = serverWalletAccess;

    // FINORA_P573A_UNIFIED_WALLET_IPC
    // Read-only Wallet access uses the server-verified Main Login
    // handoff. No renderer-selected Wallet token or branch ID.
    // Legacy second-login access is disabled in this gateway.
    //
    // Recharge remains blocked until SSO runtime/security tests pass.
    const unifiedWalletReadOnlyService = {
      enroll: async () => ({
        success: false as const,
        errorCode: "UNAUTHORIZED",
      }),

      signIn: async () => ({
        success: false as const,
        errorCode: "UNAUTHORIZED",
      }),

      // FINORA_P1_579GR_PROOF_AWARE_READ
      // Unified session remains first authority. Proof is fallback only
      // when the unified session has no authenticated Wallet lease.
      balance: async () => {
        const unifiedResult = finoraUnifiedWalletForLifecycle
          ? await finoraUnifiedWalletForLifecycle.balance()
          : {
              success: false as const,
              errorCode: "UNAUTHORIZED",
            };

        // FINORA_P1_579JS_BALANCE_TRACE
        console.info("[FINORA WALLET BALANCE]", {
          path: "UNIFIED",
          success: unifiedResult.success,
          errorCode: unifiedResult.success === false
            ? unifiedResult.errorCode
            : undefined,
          source: unifiedResult.success === true
            ? unifiedResult.data.source
            : undefined,
          hasWalletId: unifiedResult.success === true
            ? typeof unifiedResult.data.walletId === "string"
            : undefined,
        });

        if (
          unifiedResult.success === true ||
          unifiedResult.errorCode !== "UNAUTHORIZED"
        ) {
          return unifiedResult;
        }

        // FINORA_P1_579JV_PROOF_BALANCE_TRACE
        const proofResult = finoraProofWalletForLifecycle
          ? await finoraProofWalletForLifecycle.balance()
          : {
              success: false as const,
              errorCode: "UNAUTHORIZED",
            };

        console.info("[FINORA WALLET BALANCE PROOF]", {
          success: proofResult.success,
          errorCode: proofResult.success === false
            ? proofResult.errorCode
            : undefined,
          source: proofResult.success === true
            ? proofResult.data.source
            : undefined,
          hasWalletId: proofResult.success === true
            ? typeof proofResult.data.walletId === "string"
            : undefined,
        });

        return proofResult;
      },

      pricing: async () => {
        const unifiedResult = finoraUnifiedWalletForLifecycle
          ? await finoraUnifiedWalletForLifecycle.pricing()
          : {
              success: false as const,
              errorCode: "UNAUTHORIZED",
            };
        // FINORA_P1_579JM_PRICING_TRACE
        console.info("[FINORA WALLET PRICING]", {
          path: "UNIFIED",
          success: unifiedResult.success,
          errorCode: unifiedResult.success === false
            ? unifiedResult.errorCode
            : undefined,
          source: unifiedResult.success === true
            ? unifiedResult.data.source
            : undefined,
          planCount:
            unifiedResult.success === true &&
            Array.isArray(unifiedResult.data.plans)
              ? unifiedResult.data.plans.length
              : undefined,
        });

        if (
          unifiedResult.success === true ||
          unifiedResult.errorCode !== "UNAUTHORIZED"
        ) {
          return unifiedResult;
        }

        return finoraProofWalletForLifecycle
          ? finoraProofWalletForLifecycle.pricing()
          : {
              success: false as const,
              errorCode: "UNAUTHORIZED",
            };
      },

      // FINORA_P1_614P_DURABLE_RECHARGE
      // Verified proof authority, encrypted immutable retry, then server POST.
      recharge: async (input: unknown) => {
        const fail = (errorCode: string) => ({
          success: false as const,
          errorCode,
        });

        if (
          !finoraProofWalletForLifecycle ||
          !input ||
          typeof input !== "object" ||
          Array.isArray(input)
        ) return fail("UNAUTHORIZED");

        const value = input as Record<string, unknown>;

        if (
          Object.keys(value).length !== 3 ||
          !Number.isSafeInteger(value.amountInr) ||
          (value.amountInr as number) < 50 ||
          (value.amountInr as number) > 2000 ||
          (value.paymentMethod !== "PHONEPE" &&
            value.paymentMethod !== "GOOGLE_PAY") ||
          typeof value.idempotencyKey !== "string" ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.idempotencyKey)
        ) return fail("INVALID_REQUEST");

        const requested = {
          amountInr: value.amountInr as number,
          paymentMethod: value.paymentMethod as "PHONEPE" | "GOOGLE_PAY",
          idempotencyKey: (value.idempotencyKey as string).toLowerCase(),
        };

        // Loading happens before any POST, including after an app restart.
        const previous =
          await authenticatedRechargeIntentCoordinator.verifiedLoad();

        if (!previous.success) return fail(previous.errorCode);

        let intent = previous.data.intent;

        if (intent) {
          // Never replace a pending server request with different details.
          if (
            intent.amountInr !== requested.amountInr ||
            intent.paymentMethod !== requested.paymentMethod
          ) return fail("IDEMPOTENCY_CONFLICT");
        } else {
          const saved =
            await authenticatedRechargeIntentCoordinator.verifiedSave(requested);

          if (!saved.success) return fail(saved.errorCode);

          const confirmed =
            await authenticatedRechargeIntentCoordinator.verifiedLoad();

          if (!confirmed.success) return fail(confirmed.errorCode);
          if (!confirmed.data.intent) {
            return fail("RECHARGE_INTENT_LOAD_FAILED");
          }
          intent = confirmed.data.intent;
        }

        // The stored UUID always wins. Never generate a new retry UUID.
        const result = await finoraProofWalletForLifecycle.recharge({
          amountInr: intent.amountInr,
          paymentMethod: intent.paymentMethod,
          idempotencyKey: intent.idempotencyKey,
        });

        // No local wallet credit. Server approval is separate.
        // Keep encrypted intent for uncertain transport/restart outcomes.
        return result;
      },

      logout: async () => {
        finoraUnifiedWalletForLifecycle?.clearLocal();
        finoraProofWalletForLifecycle?.clearLocal();
        return serverWalletAccess.logout();
      },

      clearLocal: () => {
        // FINORA_P1_579RH_CLEAR_CALLER
        if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
          console.warn("[FINORA WALLET CLEAR ORIGIN]", JSON.stringify({
            origin: "IPC_SERVICE_CLEAR_LOCAL",
          }));
        }
        finoraUnifiedWalletForLifecycle?.clearLocal();
        finoraProofWalletForLifecycle?.clearLocal();
        serverWalletAccess.clearLocal();
      },
    };

    // FINORA_P1_611Y_VERIFIED_RECHARGE_SCOPE
    // Main-process-only authority resolver.
    // Prepared for encrypted retry integration; not exposed to IPC.
    // No recharge POST, payment approval or Wallet credit here.
    const verifiedRechargeScopeCoordinator =
      createFinoraVerifiedRechargeScopeCoordinator({
        verifiedScope: () =>
          finoraProofWalletForLifecycle
            ? finoraProofWalletForLifecycle.verifiedScope()
            : Promise.resolve({
                success: false as const,
                errorCode: "UNAUTHORIZED",
              }),

        // FINORA_P1_612M_PROOF_BOUND_BALANCE
        // Resolve identity and Wallet through the same verified
        // Proof Gateway, never through a different session fallback.
        serverBalance: () =>
          finoraProofWalletForLifecycle
            ? finoraProofWalletForLifecycle.balance()
            : Promise.resolve({
                success: false as const,
                errorCode: "UNAUTHORIZED",
              }),
      });

    // FINORA_P1_611Z_DURABLE_RECHARGE_STORE
    // Main-process-only encrypted retry store.
    // Construction does not read, write or submit a recharge.
    const durableRechargeIntentStore =
      createFinoraServerRechargeIntentStore();

    // FINORA_P1_612E_AUTHENTICATED_DURABLE_RETRY
    // Main-process-only encrypted retry coordinator.
    // No IPC exposure, no recharge POST, no payment or credit operation.
    const authenticatedRechargeIntentCoordinator =
      createFinoraAuthenticatedRechargeIntentCoordinator({
        scopeResolver: verifiedRechargeScopeCoordinator,
        store: durableRechargeIntentStore,
      });

    // All three dependencies remain dormant until the
    // authenticated persistence lifecycle is verified.
    void authenticatedRechargeIntentCoordinator;
    // FINORA_P1_634D_PURCHASE_WIRING
    // Separate encrypted intent from Recharge. The existing verified
    // Wallet scope is the only authority for Owner/Branch/Wallet identity.
    const subscriptionPurchaseIntentStore =
      createFinoraServerSubscriptionPurchaseIntentStore();

    const authenticatedSubscriptionPurchaseCoordinator =
      createFinoraAuthenticatedSubscriptionPurchaseCoordinator({
        scopeResolver: verifiedRechargeScopeCoordinator,
        store: subscriptionPurchaseIntentStore,
      });

    // Serialize purchase attempts within this Electron Main instance.
    // The PostgreSQL wallet row lock remains the cross-device authority.
    let subscriptionPurchaseBusy = false;

    const verifiedSubscriptionPurchase = async (input: unknown) => {
      const fail = (errorCode: string) => ({
        success: false as const,
        errorCode,
      });

      if (subscriptionPurchaseBusy) {
        return fail("PURCHASE_IN_PROGRESS");
      }

      if (
        !finoraProofWalletForLifecycle ||
        input === null ||
        typeof input !== "object" ||
        Array.isArray(input) ||
        Object.getPrototypeOf(input) !== Object.prototype
      ) {
        return fail("UNAUTHORIZED");
      }

      const requested = input as Record<string, unknown>;

      if (
        Object.keys(requested).length !== 2 ||
        ![1, 3, 6, 12].includes(requested.planMonths as number) ||
        typeof requested.idempotencyKey !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          requested.idempotencyKey,
        )
      ) {
        return fail("INVALID_REQUEST");
      }

      const planMonths = requested.planMonths as 1 | 3 | 6 | 12;
      const idempotencyKey =
        requested.idempotencyKey.toLowerCase();

      subscriptionPurchaseBusy = true;

      try {
        const previous =
          await authenticatedSubscriptionPurchaseCoordinator.verifiedLoad();

        if (!previous.success) return fail(previous.errorCode);

        let intent = previous.data.intent;

        if (intent) {
          if (
            intent.planMonths !== planMonths ||
            intent.idempotencyKey !== idempotencyKey
          ) {
            return fail("IDEMPOTENCY_CONFLICT");
          }
        } else {
          const saved =
            await authenticatedSubscriptionPurchaseCoordinator.verifiedSave({
              planMonths,
              idempotencyKey,
            });

          if (!saved.success) return fail(saved.errorCode);

          const confirmed =
            await authenticatedSubscriptionPurchaseCoordinator.verifiedLoad();

          if (!confirmed.success) return fail(confirmed.errorCode);

          if (
            !confirmed.data.intent ||
            confirmed.data.walletId !== saved.data.walletId
          ) {
            return fail("PURCHASE_INTENT_LOAD_FAILED");
          }

          intent = confirmed.data.intent;
        }

        // Never send a purchase before its encrypted intent is readable.
        const result =
          await finoraProofWalletForLifecycle.subscriptionPurchase({
            planMonths: intent.planMonths,
            idempotencyKey: intent.idempotencyKey,
          });

        if (result.success === true) {
          // Only a validated, server-confirmed purchase can clear intent.
          // On clearing failure the encrypted record remains recoverable.
          await authenticatedSubscriptionPurchaseCoordinator
            .verifiedClearAfterSuccess(intent, true);
        }

        // On timeouts/unknown outcomes, retain the same encrypted key.
        return result;
      } catch {
        return fail("PURCHASE_RECONCILIATION_REQUIRED");
      } finally {
        subscriptionPurchaseBusy = false;
      }
    };

    const serverWalletRegistration = registerFinoraServerWalletIpc({
      ipc: ipcMain,
      owner: createdWindow.webContents,
      packaged: app.isPackaged,
      ownerEntryPath: path.join(__dirname, "../dist/index.html"),
      service: unifiedWalletReadOnlyService,
      purchaseService: verifiedSubscriptionPurchase,
      // FINORA_P1_648E_RESUME
      // Explicit user action only. Reuse encrypted Main-owned UUID.
      purchaseResumeService: async () => {
        if (subscriptionPurchaseBusy) {
          return { success: false as const, errorCode: "PURCHASE_IN_PROGRESS" };
        }
        const loaded =
          await authenticatedSubscriptionPurchaseCoordinator.verifiedLoad();
        if (!loaded.success) {
          return { success: false as const, errorCode: loaded.errorCode };
        }
        if (!loaded.data.intent) {
          return { success: false as const, errorCode: "NO_PENDING_PURCHASE" };
        }
        return verifiedSubscriptionPurchase({
          planMonths: loaded.data.intent.planMonths,
          idempotencyKey: loaded.data.intent.idempotencyKey,
        });
      },
      // FINORA_P1_648B_PENDING_STATUS
      // Read-only. Never expose pending UUID or trusted wallet identity.
      purchaseStatusService: async () => {
        const result =
          await authenticatedSubscriptionPurchaseCoordinator.verifiedLoad();
        if (!result.success) {
          return { success: false as const, errorCode: result.errorCode };
        }
        return {
          success: true as const,
          data: {
            pending: result.data.intent !== null,
            planMonths: result.data.intent?.planMonths ?? null,
          },
        };
      },
      // FINORA_P1_580O_SECURE_HISTORY_IPC
      historyService: {
        transactions: () => finoraProofWalletForLifecycle
          ? finoraProofWalletForLifecycle.transactions()
          : Promise.resolve({
              success: false as const,
              errorCode: "UNAUTHORIZED",
            }),
        recharges: () => finoraProofWalletForLifecycle
          ? finoraProofWalletForLifecycle.recharges()
          : Promise.resolve({
              success: false as const,
              errorCode: "UNAUTHORIZED",
            }),
      },
      // FINORA_P1_588G_RECOVERY_MAIN
      // Proof Gateway owns the authenticated session and branch scope.
      recoveryService: (operationId: string) =>
        finoraProofWalletForLifecycle
          ? finoraProofWalletForLifecycle.recovery(operationId)
          : Promise.resolve({
              success: false as const,
              errorCode: "UNAUTHORIZED",
            }),
    });

    // FINORA_P550C_BUSINESS_WALLET_LIFECYCLE
    const releaseWalletBusinessLifecycle =
      bindFinoraServerWalletBusinessLifecycle(
        createdWindow.webContents,
        () => {
          // FINORA_P1_579RH_CLEAR_CALLER
          if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
            console.warn("[FINORA WALLET CLEAR ORIGIN]", JSON.stringify({
              origin: "BUSINESS_TRANSITION",
            }));
          }
          serverWalletRegistration.invalidate();
          finoraUnifiedWalletForLifecycle?.clearLocal();
          finoraProofWalletForLifecycle?.clearLocal();
          // FINORA_P1_579NI_LIFECYCLE_CLEAR
          serverWalletAccess.clearLocal();
        },
      );

    createdWindow.webContents.once(
      "destroyed",
      releaseWalletBusinessLifecycle,
    );
  }


  // ----------------------------------------------------------
  // EXTERNAL LINKS
  //
  // Renderer links such as WhatsApp Web must open in the
  // user's real default browser instead of a second Electron
  // BrowserWindow.
  // ----------------------------------------------------------
  createdWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const targetUrl = new URL(url);

      /*
       * FINORA collection receipt print window.
       *
       * Only this exact internal about: URL is allowed.
       * All other about: URLs remain blocked.
       */
      if (
        targetUrl.protocol === "about:" &&
        targetUrl.pathname === "blank" &&
        targetUrl.hash === "#finora-collection-receipt"
      ) {
        return {
          action: "allow",
        };
      }

      /*
       * FINORA PDF print preview.
       * blob: URLs must open inside Electron.
       */
      if (targetUrl.protocol === "blob:") {
        return {
          action: "allow",
        };
      }

      /*
       * Normal external web links.
       * Open in real default browser.
       */
      if (targetUrl.protocol === "https:" || targetUrl.protocol === "http:") {
        void shell.openExternal(targetUrl.toString());

        return {
          action: "deny",
        };
      }
    } catch (error) {
      console.error("FINORA EXTERNAL LINK ERROR:", error);
    }

    /*
     * Block unknown protocols.
     */
    return {
      action: "deny",
    };
  });
  // ----------------------------------------------------------
  // DEVELOPMENT
  // ----------------------------------------------------------

  if (!app.isPackaged) {
    void createdWindow.loadURL("http://localhost:5173");

    createdWindow.webContents.openDevTools();
  }

  // ----------------------------------------------------------
  // PRODUCTION
  // ----------------------------------------------------------
  else {
    void createdWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // ----------------------------------------------------------
  // F11 FULLSCREEN
  // ----------------------------------------------------------

  createdWindow.webContents.on("before-input-event", (_event, input) => {
    if (input.type === "keyDown" && input.key === "F11") {
      createdWindow.setFullScreen(!createdWindow.isFullScreen());
    }
  });

  // ----------------------------------------------------------
  // WINDOW CLOSED
  // ----------------------------------------------------------

  createdWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ============================================================
// APPLICATION STARTUP
// ============================================================

app.whenReady().then(async () => {
  // ----------------------------------------------------------
  // PRIVILEGED RECIPIENT TRUST RECOVERY / MAINTENANCE MODES
  //
  // These command-line switches select dedicated privileged
  // shells. They are launch selectors, not authentication.
  //
  // Recovery is evaluated before Maintenance if both selectors
  // are present.
  //
  // Emergency Recovery still requires:
  // - the exact dedicated Recovery main frame,
  // - a valid signed Recipient Trust Recovery package,
  // - the independently provisioned Recovery public root,
  // - authoritative target / sequence / replay validation,
  // - successful cryptographic verification.
  //
  // Normal Maintenance still requires:
  // - the exact dedicated Maintenance main frame,
  // - a valid signed Recipient Trust Transition,
  // - authoritative target / sequence / replay validation,
  // - successful cryptographic verification.
  //
  // Both privileged startup modes intentionally exclude the
  // ordinary application IPC surface, Control Center IPC,
  // notification providers, DEV provisioning and USB warm-up.
  //
  // Native installation binding remains authoritative for both.
  // ----------------------------------------------------------
  const openRecipientTrustMaintenance =
    process.argv.includes(
      "--finora-recipient-trust-maintenance",
    );

  const openRecipientTrustRecovery =
    process.argv.includes(
      "--finora-recipient-trust-recovery",
    );

  if (
    openRecipientTrustRecovery
  ) {
    registerFinoraRecipientTrustRecoveryHandlers();

    await ensureFinoraWindowsInstallationBinding();

    await openFinoraRecipientTrustRecoveryWindow();
  }
  else if (
    openRecipientTrustMaintenance
  ) {
    registerFinoraRecipientTrustMaintenanceHandlers();

    await ensureFinoraWindowsInstallationBinding();

    await openFinoraRecipientTrustMaintenanceWindow();
  }
  else {
    registerUsbStorageHandlers();

    const portableBranchAuthStore =
      new FinoraPortableBranchAuthStore({
        resolveLocalRoot:
          () =>
            app.getPath(
              "userData",
            ),

        resolveUsbRoot:
          () =>
            findFinoraUsbRoot(),
      });
    const portableBranchAuthV2Store =
      new FinoraPortableBranchAuthV2Store({
        resolveLocalRoot:
          () =>
            app.getPath(
              "userData",
            ),

        resolveUsbRoot:
          () =>
            findFinoraUsbRoot(),
      });

    const portableFreshDeviceRuntimeAuthorityStore =
      new FinoraPortableFreshDeviceRuntimeAuthorityStore({
        resolveLocalRoot:
          () =>
            app.getPath(
              "userData",
            ),

        resolveUsbRoot:
          () =>
            findFinoraUsbRoot(),
      });

    // --------------------------------------------------------
    // PORTABLE CREDENTIAL ROTATION CRASH RECOVERY
    //
    // Pending credential rotation is reconciled before the
    // ordinary credential/login IPC surface becomes available.
    //
    // Recovery replays only durable transaction artifacts and
    // remains entirely inside the privileged main process.
    //
    // Failure is startup-fatal for the normal recipient shell.
    // Authentication must never continue through an unresolved
    // credential-generation transition.
    // --------------------------------------------------------

    const credentialRotationRecoveryResult =
      await recoverFinoraPortableBranchAuthCredentialRotations({
        portableStore:
          portableBranchAuthStore,
      });

    if (
      !credentialRotationRecoveryResult.success
    ) {
      console.error(
        "FINORA pending credential rotation recovery failed.",
        {
          errorCode:
            credentialRotationRecoveryResult.errorCode,

          transactionId:
            credentialRotationRecoveryResult.transactionId,
        },
      );

      throw new Error(
        "FINORA could not safely reconcile a pending credential rotation.",
      );
    }

    ipcMain.removeHandler(
      "finora:usb:request-access",
    );

    ipcMain.handle(
      "finora:usb:request-access",
      async (event) => {
        const senderFrame =
          event.senderFrame;

        if (
          senderFrame === null ||
          senderFrame !==
            event.sender.mainFrame ||
          !isTrustedRenderer(
            senderFrame,
          )
        ) {
          return {
            success: false,
            error:
              "Unauthorized FINORA USB selection request.",
          };
        }

        try {
          const selectedRoot =
            await selectFinoraUsbRootFromNativeDialog();

          if (!selectedRoot) {
            return {
              success: true,
              cancelled: true,
            };
          }

          return {
            success: true,
            cancelled: false,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "FINORA USB selection failed.",
          };
        }
      },
    );

    registerFinoraControlHandlers(
      isTrustedRenderer,
      portableBranchAuthStore,
      async (username) => {
        const canonicalUsername =
          username
            .trim()
            .normalize("NFKC")
            .toLowerCase();

        if (!canonicalUsername) {
          return undefined;
        }

        const detectedUsbRoot =
          await findFinoraUsbRoot();

        if (!detectedUsbRoot) {
          return undefined;
        }

        const detectedFolder =
          path.basename(detectedUsbRoot)
            .normalize("NFKC")
            .toLowerCase();

        const controlScopedUsbRoot =
          detectedFolder === canonicalUsername
            ? detectedUsbRoot
            : path.join(
                path.parse(detectedUsbRoot).root,
                canonicalUsername,
              );

        return new FinoraPortableBranchAuthV2Store({
          resolveLocalRoot:
            () =>
              app.getPath("userData"),

          resolveUsbRoot:
            async () =>
              controlScopedUsbRoot,
        });
      },
    );

    registerFinoraCanonicalWalletAuthorityHandlers(
      isTrustedRenderer,
      createFinoraPersistentCanonicalWalletAuthorityProvider(),
    );

    registerFinoraPortableBranchAuthUsbReplacementHandlers({
      isTrustedRenderer,

      getParentWindow:
        () =>
          mainWindow,

      validateUsbRoot:
        validateFinoraReplacementUsbRoot,
    });

    registerFinoraPortableFreshDeviceRuntimeAuthoritySeedHandlers(
      isTrustedRenderer,
      portableBranchAuthStore,
      portableFreshDeviceRuntimeAuthorityStore,
    );
    registerFinoraPortableBranchAuthBackupHandlers({
      isTrustedRenderer,

      getParentWindow:
        () =>
          mainWindow,

      portableStore:
        portableBranchAuthStore,

      exportBackup:
        (
          parentWindow,
          input,
          portableStore,
        ) =>
          exportFinoraFullBranchBackupFromNativeDialog(
            parentWindow,
            input,
            portableStore,
            {
              resolveUsbRoot:
                () =>
                  findFinoraUsbRoot(),

              readRuntimeAuthority:
                (
                  storageMode,
                ) =>
                  portableFreshDeviceRuntimeAuthorityStore.read(
                    storageMode,
                  ),
            },
          ),
    });
    registerFinoraPortableBranchAuthRestoreHandlers({
      isTrustedRenderer,

      getParentWindow:
        () =>
          mainWindow,

      resolveLocalRoot:
        () =>
          app.getPath(
            "userData",
          ),

      validateUsbRoot:
        validateFinoraReplacementUsbRoot,

      restoreFromNativeBackup:
        restoreFinoraFullBranchFromNativeBackup,
    });

    registerFinoraBranchCredentialHandlers(
      isTrustedRenderer,
      portableBranchAuthV2Store,
    );
    const portableFreshDeviceLoginRecovery =
      createFinoraPortableFreshDeviceLoginRecovery(
        portableFreshDeviceRuntimeAuthorityStore,
        portableBranchAuthV2Store,
      );

    // FINORA_P572X_HANDOFF
    // Server Wallet authorization remains independent of Main Login.
    // The token is kept only inside Electron main-process memory.
    const unifiedWalletSession =
      createFinoraUnifiedWalletSession({
        validateMainSession:
          validateFinoraUnifiedWalletMainSession,
      });

    finoraUnifiedWalletForLifecycle = unifiedWalletSession;

    // Only an already-enrolled Wallet proof key may be read.
    // Never call getOrCreate() from an automatic login.
    const walletProofVault = createFinoraServerWalletKeyVault();

    const proofWalletSession =
      createFinoraVerifiedWalletProofGateway({
        resolveServerVerifiedScope:
          createFinoraWalletChallengeScopeResolver(),

        readEnrolledProofKey: (scope) =>
          walletProofVault.read(scope),

        validateMainSession:
          validateFinoraUnifiedWalletMainSession,

        // FINORA_P577P_ASSOCIATION_GATE
        // Temporary fail-closed association verification.
        // Replace only with independently verified server authority.
        verifyAssociatedScope: async () => false,
      });

    finoraProofWalletForLifecycle = proofWalletSession;

        // FINORA_P1_686T_LIVE_HEALTH
    // Read-only checks. No credentials or business records.
    ipcMain.handle(
      "finora:login:live-health",
      async (event) => {
        if (
          !event.senderFrame ||
          !isTrustedRenderer(event.senderFrame)
        ) {
          return { live: false, errorCode: "UNAUTHORIZED_RENDERER" };
        }

        try {
          const results = await Promise.all(
            ["/health", "/db-health"].map((endpoint) =>
              fetch(
                `https://api.finoraenterprise.com${endpoint}`,
                {
                  method: "GET",
                  cache: "no-store",
                  signal: AbortSignal.timeout(7000),
                },
              ),
            ),
          );

          return {
            live: results.every((response) => response.ok),
          };
        } catch {
          return { live: false, errorCode: "SERVER_UNREACHABLE" };
        }
      },
    );
    // FINORA_P1_712O_ACCOUNT_HISTORY_SSO
    // Sender-bound server authentication. Read-only.
    // No renderer-selected wallet, scope, token, or URL.
    const accountWalletHistoryClient =
      createFinoraServerWalletHistoryClient();

    for (const kind of ["transactions", "recharges"] as const) {
      const channel =
        kind === "transactions"
          ? "finora:account:wallet-transactions"
          : "finora:account:wallet-recharges";

      ipcMain.handle(channel, async (event) => {
        if (
          !event.senderFrame ||
          !isTrustedRenderer(event.senderFrame)
        ) {
          return {
            success: false as const,
            errorCode: "UNAUTHORIZED_RENDERER",
          };
        }

        const authorization =
          getFinoraSenderWalletAuthorization(event.sender);

        const principal =
          getFinoraSenderWalletPrincipal(event.sender);

        if (!authorization || !principal) {
          return {
            success: false as const,
            errorCode: "ACCOUNT_SESSION_REQUIRED",
          };
        }

        // Authorization is never supplied by the renderer.
        // The existing history client independently validates the token.
        const matched =
          /^Bearer ([a-f0-9]{64})$/.exec(authorization);

        if (!matched) {
          return {
            success: false as const,
            errorCode: "INVALID_ACCOUNT_WALLET_AUTHORITY",
          };
        }

        try {
          return kind === "transactions"
            ? await accountWalletHistoryClient.transactions(matched[1])
            : await accountWalletHistoryClient.recharges(matched[1]);
        } catch {
          return {
            success: false as const,
            errorCode: "SERVER_UNAVAILABLE",
          };
        }
      });
    }
    // FINORA_P1_679I_ACCOUNT_PRICING
    // Read-only pricing from PostgreSQL-backed server authority.
    ipcMain.handle(
      "finora:account:subscription-pricing",
      async (event) => {
        if (
          !event.senderFrame ||
          !isTrustedRenderer(event.senderFrame)
        ) {
          return {
            success: false,
            errorCode: "UNAUTHORIZED_RENDERER",
          };
        }

        const authorization =
          getFinoraSenderWalletAuthorization(event.sender);

        if (!authorization) {
          return {
            success: false,
            errorCode: "ACCOUNT_SESSION_REQUIRED",
          };
        }

        try {
          const response = await fetch(
            "https://api.finoraenterprise.com/owner/wallet/pricing",
            {
              method: "GET",
              headers: {
                Authorization: authorization,
              },
              cache: "no-store",
              signal: AbortSignal.timeout(15000),
            },
          );

          if (!response.ok) {
            return {
              success: false,
              errorCode: response.status === 401
                ? "UNAUTHORIZED"
                : "PRICING_UNAVAILABLE",
            };
          }

          const payload: unknown = await response.json();

          if (
            !payload ||
            typeof payload !== "object" ||
            Array.isArray(payload)
          ) {
            return {
              success: false,
              errorCode: "INVALID_PRICING_RESPONSE",
            };
          }

          const data = payload as Record<string, unknown>;

          if (data.ok !== true) {
            return {
              success: false,
              errorCode: "PRICING_UNAVAILABLE",
            };
          }

          // Do not expose the bearer token or raw authorization.
          // Explicitly retain the read-only pricing response.
          return {
            success: true,
            pricing: data,
          };
        } catch {
          return {
            success: false,
            errorCode: "SERVER_UNAVAILABLE",
          };
        }
      },
    );
    // FINORA_P1_678W_ACCOUNT_WALLET_BALANCE
    // Bearer token stays inside Electron Main Process.
    ipcMain.handle(
      "finora:account:wallet-balance",
      async (event) => {
        if (
          !event.senderFrame ||
          !isTrustedRenderer(event.senderFrame)
        ) {
          return {
            success: false,
            errorCode: "UNAUTHORIZED_RENDERER",
          };
        }

        const authorization =
          getFinoraSenderWalletAuthorization(event.sender);

        if (!authorization) {
          return {
            success: false,
            errorCode: "ACCOUNT_SESSION_REQUIRED",
          };
        }

        try {
          const response = await fetch(
            "https://api.finoraenterprise.com/owner/wallet/balance",
            {
              method: "GET",
              headers: {
                Authorization: authorization,
              },
              cache: "no-store",
              signal: AbortSignal.timeout(15000),
            },
          );

          if (!response.ok) {
            return {
              success: false,
              errorCode: response.status === 401
                ? "UNAUTHORIZED"
                : "WALLET_BALANCE_UNAVAILABLE",
            };
          }

          const payload: unknown = await response.json();

          if (
            !payload ||
            typeof payload !== "object" ||
            Array.isArray(payload)
          ) {
            return {
              success: false,
              errorCode: "INVALID_WALLET_RESPONSE",
            };
          }

          // Return only the approved Wallet read response.
          // Never return any authorization credential.
          const wallet =
            payload as Record<string, unknown>;

          if (wallet.ok !== true) {
            return {
              success: false,
              errorCode: "WALLET_BALANCE_UNAVAILABLE",
            };
          }

          return {
            success: true,
            wallet,
          };
        } catch {
          return {
            success: false,
            errorCode: "SERVER_UNAVAILABLE",
          };
        }
      },
    );
    const finoraBusinessSessionsBySender =
      new WeakMap<object, {
        sessionId: string;
        expiresAt: string;
      }>();    // FINORA_P1_696W_LOGIN_GENERATION
    // Isolate concurrent Account/Business login attempts per sender.
    const finoraAccountBusinessLoginGeneration =
      new WeakMap<object, number>();

    // FINORA_P1_706M_SERVER_USB_DEPENDENCY_BRIDGE
    // Scope-local session maps remain private.
    // FINORA_P1_711A_SERVER_PROFILE_WIRING
    registerFinoraServerProfileScopeResolver(
      async (sender, sessionId) => {
        // This resolver independently validates the Server Reception
        // Session, live Business Session, Wallet and branch scope.
        const checked =
          await resolveFinoraUsbScopeForSender(sender, sessionId);

        if (!checked.success) {
          return { success: false, error: checked.error };
        }

        // FINORA_P1_711E_VERIFIED_SERVER_PRINCIPAL
        const currentBusiness =
          finoraBusinessSessionsBySender.get(sender);
        const currentGeneration =
          finoraAccountBusinessLoginGeneration.get(sender);

        const stillCurrent = () =>
          finoraBusinessSessionsBySender.get(sender) === currentBusiness &&
          finoraAccountBusinessLoginGeneration.get(sender) === currentGeneration;

        if (!currentBusiness || !stillCurrent()) {
          return { success: false, error: "SERVER_BUSINESS_SESSION_REQUIRED" };
        }

        const [
          { verifyFinoraServerBusinessSession },
          { validateFinoraServerReceptionSession },
        ] = await Promise.all([
          import("./control/finoraServerBusinessSessionVerifier.js"),
          import("./control/finoraServerReceptionSessionAuthority.js"),
        ]);

        const verifiedReception =
          await validateFinoraServerReceptionSession(
            sender,
            sessionId,
            verifyFinoraServerBusinessSession,
            currentBusiness.sessionId,
          );

        if (!verifiedReception.success || !stillCurrent()) {
          return { success: false, error: "SERVER_PROFILE_SESSION_DENIED" };
        }

        const scope = checked.scope;
        const wallet = getFinoraSenderWalletPrincipal(sender);
        const principal = verifiedReception.principal;

        if (
          !wallet ||
          !principal.username.trim() ||
          principal.storageMode !== "USB" ||
          scope.sessionId !== sessionId ||
          scope.dataContext !== "REAL" ||
          scope.ownerId !== principal.ownerId ||
          scope.businessId !== principal.businessId ||
          scope.branchId !== principal.branchId ||
          wallet.userId !== principal.userId ||
          wallet.ownerId !== principal.ownerId ||
          wallet.businessId !== principal.businessId ||
          wallet.branchId !== principal.branchId ||
          !stillCurrent()
        ) {
          return {
            success: false,
            error: "SERVER_PROFILE_SCOPE_MISMATCH",
          };
        }

        return {
          success: true,
          principal: {
            username: principal.username,
            ownerId: principal.ownerId,
            businessId: principal.businessId,
            branchId: principal.branchId,
          },
        };
      }
    );
    registerFinoraServerUsbScopeResolver(
      async (sender, sessionId) => {
        const currentBusiness =
          finoraBusinessSessionsBySender.get(sender);
        const currentGeneration =
          finoraAccountBusinessLoginGeneration.get(sender);

        const stillCurrent = () =>
          finoraBusinessSessionsBySender.get(sender) === currentBusiness &&
          finoraAccountBusinessLoginGeneration.get(sender) === currentGeneration;

        if (!currentBusiness || !stillCurrent()) {
          return { success: false, error: "SERVER_BUSINESS_SESSION_REQUIRED" };
        }

        try {
          const [{ verifyFinoraServerBusinessSession },
            { validateFinoraServerReceptionSession }] = await Promise.all([
              import("./control/finoraServerBusinessSessionVerifier.js"),
              import("./control/finoraServerReceptionSessionAuthority.js"),
            ]);

          const result = await validateFinoraServerReceptionSession(
            sender,
            sessionId,
            verifyFinoraServerBusinessSession,
            currentBusiness.sessionId,
          );

          if (!result.success || !stillCurrent()) {
            return { success: false, error: "SERVER_RECEPTION_SESSION_DENIED" };
          }

          const wallet = getFinoraSenderWalletPrincipal(sender);
          const principal = result.principal;

          if (!wallet || principal.storageMode !== "USB" ||
            principal.role !== "OWNER" ||
            !(["userId", "ownerId", "businessId", "branchId"] as const)
              .every(key => wallet[key] === principal[key])) {
            return { success: false, error: "SERVER_USB_SCOPE_MISMATCH" };
          }

          const verified = await verifyFinoraServerBusinessSession(
            currentBusiness.sessionId,
          );

          if (!verified.success || !stillCurrent() ||
            !(["userId", "ownerId", "businessId", "branchId"] as const)
              .every(key => verified.principal[key] === principal[key]) ||
            verified.principal.storageMode !== "USB") {
            return { success: false, error: "SERVER_USB_REVALIDATION_FAILED" };
          }

          return {
            success: true,
            scope: {
              sessionId,
              ownerId: principal.ownerId,
              businessId: principal.businessId,
              branchId: principal.branchId,
              dataContext: "REAL",
            },
          };
        } catch {
          return { success: false, error: "SERVER_USB_AUTHORITY_UNAVAILABLE" };
        }
      },
    );

    // FINORA_P1_678N_ACCOUNT_LOGIN_IPC
    // Password-only Account/Wallet session.
    // Never grants Reception or USB business-data access.
    ipcMain.handle(
      "finora:account:password-login",
      async (event, input: unknown) => {
        // FINORA_P1_696V_SESSION_ISOLATION
        // FINORA_P1_696W: invalidate in-flight Business Login too.
        const accountGeneration =
          (finoraAccountBusinessLoginGeneration.get(event.sender) ?? 0) + 1;
        finoraAccountBusinessLoginGeneration.set(
          event.sender, accountGeneration
        );
        finoraBusinessSessionsBySender.delete(event.sender);
        // FINORA_P1_697L_ACCOUNT_WALLET_RESET
        // Clear this sender's prior Wallet immediately.
        // Invalid credentials must not retain earlier access.
        clearFinoraSenderWallet(event.sender);
        if (
          !event.senderFrame ||
          !isTrustedRenderer(event.senderFrame)
        ) {
          return {
            success: false,
            errorCode: "UNAUTHORIZED_RENDERER",
          };
        }

        if (
          !input ||
          typeof input !== "object" ||
          Array.isArray(input)
        ) {
          return {
            success: false,
            errorCode: "INVALID_REQUEST",
          };
        }

        const candidate = input as Record<string, unknown>;

        if (
          typeof candidate.username !== "string" ||
          typeof candidate.password !== "string" ||
          !candidate.username.trim() ||
          !candidate.password
        ) {
          return {
            success: false,
            errorCode: "INVALID_REQUEST",
          };
        }

        const result =
          await establishFinoraSenderWallet(
            event.sender,
            candidate.username,
            candidate.password,
          );

        return {
          success: result.success,
          errorCode: result.success
            ? undefined
            : result.errorCode,
          sessionType: result.success
            ? "ACCOUNT_WALLET_ONLY"
            : undefined,
          businessDataAccess: false,
        };
      },
    );
    // FINORA_P1_687X_SERVER_BUSINESS_LOGIN
    // Main process only. Never expose the Business bearer to renderer.


    ipcMain.handle(
      "finora:business:password-login",
      async (event, input: unknown) => {
        if (
          !event.senderFrame ||
          !isTrustedRenderer(event.senderFrame)
        ) {
          return {
            success: false,
            errorCode: "UNAUTHORIZED_RENDERER",
          };
        }

        finoraBusinessSessionsBySender.delete(event.sender);
        // Each Business Login invalidates previous in-flight attempts.
        const businessGeneration =
          (finoraAccountBusinessLoginGeneration.get(event.sender) ?? 0) + 1;
        finoraAccountBusinessLoginGeneration.set(
          event.sender, businessGeneration
        );

        if (
          !input ||
          typeof input !== "object" ||
          Array.isArray(input)
        ) {
          return {
            success: false,
            errorCode: "INVALID_REQUEST",
          };
        }

        const candidate = input as Record<string, unknown>;

        if (
          typeof candidate.username !== "string" ||
          typeof candidate.password !== "string"
        ) {
          return {
            success: false,
            errorCode: "INVALID_REQUEST",
          };
        }

        try {
          const { loginFinoraBusinessWithPassword } =
            await import(
              "./control/finoraBusinessPasswordLoginClient.js"
            );

          const result =
            await loginFinoraBusinessWithPassword(
              candidate.username,
              candidate.password,
            );

          if (!result.success || !result.session) {
            return {
              success: false,
              errorCode: result.errorCode ?? "LOGIN_DENIED",
            };
          }

          // P1-696W: reject Business Login if any newer login
          // began while the network request was in flight.
          if (
            event.sender.isDestroyed() ||
            finoraAccountBusinessLoginGeneration.get(event.sender) !==
              businessGeneration
          ) {
            return {
              success: false,
              businessDataAccess: false,
              errorCode: "LOGIN_SUPERSEDED",
            };
          }

          finoraBusinessSessionsBySender.set(event.sender, {
            sessionId: result.session.sessionId,
            expiresAt: result.session.expiresAt,
          });

          return {
            success: true,
            sessionType: "BUSINESS_RECEPTION",
            businessDataAccess: false,
            errorCode: "RECEPTION_HANDOFF_PENDING",
          };
        } catch {
          return {
            success: false,
            errorCode: "SERVER_UNAVAILABLE",
          };
        }
      },
    );
    // FINORA_P1_697H_ACCOUNT_LOGOUT
    // Main-process authority; do not expose any bearer to renderer.
    ipcMain.handle(
      "finora:account:logout",
      async (event) => {
        if (
          !event.senderFrame ||
          !isTrustedRenderer(event.senderFrame)
        ) {
          return {
            success: false,
            errorCode: "UNAUTHORIZED_RENDERER",
          };
        }

        // Invalidate pending Account/Business login results too.
        const nextGeneration =
          (finoraAccountBusinessLoginGeneration.get(event.sender) ?? 0) + 1;

        finoraAccountBusinessLoginGeneration.set(
          event.sender,
          nextGeneration,
        );

        // FINORA_P1_697K_SERVER_WALLET_REVOCATION
        // Capture privately before clearing. Never send to renderer.
        const walletAuthorization =
          getFinoraSenderWalletAuthorization(event.sender);

        clearFinoraSenderWallet(event.sender);
        finoraBusinessSessionsBySender.delete(event.sender);

        if (!walletAuthorization) {
          return {
            success: true,
            localCleared: true,
            serverRevoked: false,
            errorCode: "NO_ACTIVE_SERVER_WALLET_SESSION",
          };
        }

        let serverRevoked = false;

        try {
          const response = await fetch(
            "https://api.finoraenterprise.com/owner/wallet/logout",
            {
              method: "POST",
              headers: {
                Authorization: walletAuthorization,
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
              },
              body: "{}",
              cache: "no-store",
              redirect: "error",
              signal: AbortSignal.timeout(10000),
            },
          );

          if (response.ok) {
            const payload: unknown = await response.json();

            serverRevoked =
              !!payload &&
              typeof payload === "object" &&
              !Array.isArray(payload) &&
              (payload as Record<string, unknown>).ok === true;
          }
        } catch {
          // Local logout remains effective. Server revoke unconfirmed.
        }

        return {
          success: true,
          localCleared: true,
          serverRevoked,
          ...(serverRevoked
            ? {}
            : { errorCode: "SERVER_REVOCATION_UNCONFIRMED" }),
        };
      },
    );
    // FINORA_P1_688E_SERVER_BUSINESS_VALIDATION
    ipcMain.handle(
      "finora:business:session-validate",
      async (event) => {
        if (
          !event.senderFrame ||
          !isTrustedRenderer(event.senderFrame)
        ) {
          return {
            success: false,
            errorCode: "UNAUTHORIZED_RENDERER",
          };
        }

        const session =
          finoraBusinessSessionsBySender.get(event.sender);

        if (!session) {
          return {
            success: false,
            errorCode: "BUSINESS_SESSION_NOT_FOUND",
          };
        }

        // FINORA_P1_697P_ACCOUNT_GENERATION_CHECK
        // Capture the Account generation before server verification.
        const verificationGeneration =
          finoraAccountBusinessLoginGeneration.get(event.sender);

        try {
          const { verifyFinoraServerBusinessSession } =
            await import(
              "./control/finoraServerBusinessSessionVerifier.js"
            );

          const result =
            await verifyFinoraServerBusinessSession(
              session.sessionId,
            );

          if (!result.success) {
            finoraBusinessSessionsBySender.delete(event.sender);
            return {
              success: false,
              errorCode: result.errorCode,
            };
          }

          // FINORA_P1_697O_EXACT_PRINCIPAL
          // Both identities must independently come from server auth.
          const accountPrincipal =
            getFinoraSenderWalletPrincipal(event.sender);

          if (
            finoraAccountBusinessLoginGeneration.get(event.sender) !==
              verificationGeneration
          ) {
            return {
              success: false,
              businessDataAccess: false,
              errorCode: "LOGIN_SUPERSEDED",
            };
          }

          const samePrincipal =
            accountPrincipal !== null &&
            (["userId", "ownerId", "businessId", "branchId"] as const)
              .every(
                (field) =>
                  accountPrincipal[field] === result.principal[field],
              );

          if (
            !samePrincipal ||
            event.sender.isDestroyed() ||
            finoraBusinessSessionsBySender.get(event.sender) !== session
          ) {
            finoraBusinessSessionsBySender.delete(event.sender);
            return {
              success: false,
              businessDataAccess: false,
              errorCode: "ACCOUNT_BUSINESS_SCOPE_MISMATCH",
            };
          }
          return {
            success: true,
            sessionType: "BUSINESS_RECEPTION",
            businessDataAccess: false,
            errorCode: "OPERATIONAL_HANDOFF_PENDING",
          };
        } catch {
          return {
            success: false,
            errorCode: "SERVER_UNAVAILABLE",
          };
        }
      },
    );
    // FINORA_P1_704W_RECEPTION_SESSION_IPC
    // Device-independent admission. No local credential or device trust.
    const finoraReceptionIssueGeneration = new WeakMap<object, number>();

    ipcMain.handle(
      "finora:reception:server-issue",
      async (event) => {
        const deny = (errorCode: string) => ({
          success: false as const,
          errorCode,
        });

        if (
          !event.senderFrame ||
          event.senderFrame !== event.sender.mainFrame ||
          !isTrustedRenderer(event.senderFrame) ||
          event.sender.isDestroyed()
        ) {
          return deny("UNAUTHORIZED_RENDERER");
        }

        const sender = event.sender;
        const previous =
          finoraReceptionIssueGeneration.get(sender) ?? 0;
        const attempt = previous + 1;
        finoraReceptionIssueGeneration.set(sender, attempt);

        const businessSession =
          finoraBusinessSessionsBySender.get(sender);
        const loginGeneration =
          finoraAccountBusinessLoginGeneration.get(sender);

        if (!businessSession) {
          return deny("BUSINESS_SESSION_REQUIRED");
        }

        const current = () =>
          !sender.isDestroyed() &&
          finoraReceptionIssueGeneration.get(sender) === attempt &&
          finoraBusinessSessionsBySender.get(sender) === businessSession &&
          finoraAccountBusinessLoginGeneration.get(sender) === loginGeneration;

        try {
          const [
            { verifyFinoraServerBusinessSession },
            {
              issueFinoraServerReceptionSession,
              invalidateFinoraServerReceptionSession,
            },
          ] = await Promise.all([
            import("./control/finoraServerBusinessSessionVerifier.js"),
            import("./control/finoraServerReceptionSessionAuthority.js"),
          ]);

          if (!current()) {
            return deny("LOGIN_CHANGED");
          }

          const verified =
            await verifyFinoraServerBusinessSession(
              businessSession.sessionId,
            );

          if (!verified.success || !current()) {
            return deny("SERVER_AUTHORIZATION_DENIED");
          }

          const walletPrincipal =
            getFinoraSenderWalletPrincipal(sender);

          if (
            !walletPrincipal ||
            !(["userId", "ownerId", "businessId", "branchId"] as const)
              .every(
                key =>
                  walletPrincipal[key] === verified.principal[key],
              )
          ) {
            return deny("ACCOUNT_BUSINESS_SCOPE_MISMATCH");
          }

          const issued =
            await issueFinoraServerReceptionSession(
              sender,
              businessSession.sessionId,
              verified.principal,
              verifyFinoraServerBusinessSession,
            );

          if (!issued.success) {
            return deny(issued.errorCode);
          }

          if (!current()) {
            invalidateFinoraServerReceptionSession(
              sender,
              issued.sessionId,
            );
            return deny("LOGIN_CHANGED");
          }

          const currentWallet =
            getFinoraSenderWalletPrincipal(sender);

          if (
            !currentWallet ||
            !(["userId", "ownerId", "businessId", "branchId"] as const)
              .every(key => currentWallet[key] === issued.principal[key])
          ) {
            invalidateFinoraServerReceptionSession(
              sender,
              issued.sessionId,
            );
            return deny("ACCOUNT_SCOPE_CHANGED");
          }

          return {
            success: true as const,
            sessionId: issued.sessionId,
            principal: issued.principal,
            businessDataAccess: false as const,
            receptionCommitRequired: true as const,
          };
        } catch {
          return deny("SERVER_RECEPTION_UNAVAILABLE");
        }
      },
    );
    // FINORA_P1_704Z_RECEPTION_LIFECYCLE
    for (const operation of ["validate", "touch"] as const) {
      ipcMain.handle(
        `finora:reception:server-${operation}`,
        async (event, request: unknown) => {
          const deny = (errorCode: string) => ({
            success: false as const,
            errorCode,
          });

          if (
            !event.senderFrame ||
            event.senderFrame !== event.sender.mainFrame ||
            !isTrustedRenderer(event.senderFrame) ||
            event.sender.isDestroyed()
          ) return deny("UNAUTHORIZED_RENDERER");

          if (
            !request ||
            typeof request !== "object" ||
            Array.isArray(request) ||
            typeof (request as { sessionId?: unknown }).sessionId !== "string"
          ) return deny("INVALID_REQUEST");

          const sessionId =
            (request as { sessionId: string }).sessionId;

          if (!/^[a-f0-9]{64}$/.test(sessionId)) {
            return deny("INVALID_SESSION");
          }

          const sender = event.sender;
          const businessSession =
            finoraBusinessSessionsBySender.get(sender);
          const loginGeneration =
            finoraAccountBusinessLoginGeneration.get(sender);

          if (!businessSession) {
            return deny("SERVER_SESSION_REQUIRED");
          }

          try {
            const [
              { verifyFinoraServerBusinessSession },
              {
                validateFinoraServerReceptionSession,
                touchFinoraServerReceptionSession,
                invalidateFinoraServerReceptionSession,
              },
            ] = await Promise.all([
              import("./control/finoraServerBusinessSessionVerifier.js"),
              import("./control/finoraServerReceptionSessionAuthority.js"),
            ]);

            const current = () =>
              !sender.isDestroyed() &&
              finoraBusinessSessionsBySender.get(sender) === businessSession &&
              finoraAccountBusinessLoginGeneration.get(sender) === loginGeneration;

            if (!current()) return deny("LOGIN_CHANGED");

            const result =
              operation === "validate"
                ? await validateFinoraServerReceptionSession(
                    sender,
                    sessionId,
                    verifyFinoraServerBusinessSession,
                    businessSession.sessionId,
                  )
                : await touchFinoraServerReceptionSession(
                    sender,
                    sessionId,
                    verifyFinoraServerBusinessSession,
                    businessSession.sessionId,
                  );

            if (!result.success || !current()) {
              invalidateFinoraServerReceptionSession(sender, sessionId);
              return deny("SESSION_REVALIDATION_DENIED");
            }

            const account =
              getFinoraSenderWalletPrincipal(sender);

            const verified =
              await verifyFinoraServerBusinessSession(
                businessSession.sessionId,
              );

            if (
              !verified.success ||
              !account ||
              !current() ||
              !(["userId", "ownerId", "businessId", "branchId"] as const)
                .every(key =>
                  account[key] === verified.principal[key] &&
                  result.principal[key] === verified.principal[key]
                ) ||
              result.principal.storageMode !== verified.principal.storageMode
            ) {
              invalidateFinoraServerReceptionSession(sender, sessionId);
              return deny("SESSION_SCOPE_CHANGED");
            }

            return {
              success: true as const,
              sessionId,
              principal: verified.principal,
              createdAt: result.createdAt,
              lastActivity: result.lastActivity,
              // FINORA_P1_705S_SERVER_RECEPTION_VIEW
              // Server-authorized identity only; operational access remains closed.
              sessionView: {
                sessionId,
                userId: verified.principal.userId,
                username: verified.principal.username,
                fullName: verified.principal.fullName,
                role: verified.principal.role,
                ownerId: verified.principal.ownerId,
                businessId: verified.principal.businessId,
                branchId: verified.principal.branchId,
                storageMode: verified.principal.storageMode,
                dataContext: "REAL" as const,
                loginTime: new Date(result.createdAt).toISOString(),
                lastActivity: new Date(result.lastActivity).toISOString(),
                validatedAt: new Date().toISOString(),
              },
              businessDataAccess: false as const,
              receptionCommitRequired: true as const,
            };
          } catch {
            return deny("SERVER_RECEPTION_UNAVAILABLE");
          }
        },
      );
    }

    ipcMain.handle(
      "finora:reception:server-invalidate",
      async (event, request: unknown) => {
        if (
          !event.senderFrame ||
          event.senderFrame !== event.sender.mainFrame ||
          !isTrustedRenderer(event.senderFrame) ||
          !request ||
          typeof request !== "object" ||
          Array.isArray(request) ||
          typeof (request as { sessionId?: unknown }).sessionId !== "string"
        ) {
          return {
            success: false as const,
            errorCode: "INVALID_REQUEST",
          };
        }

        const { invalidateFinoraServerReceptionSession } =
          await import("./control/finoraServerReceptionSessionAuthority.js");

        return {
          success: true as const,
          invalidated: invalidateFinoraServerReceptionSession(
            event.sender,
            (request as { sessionId: string }).sessionId,
          ),
        };
      },
    );
    // FINORA_P1_708R_RECEPTION_COMMIT_IPC
    // No second username/password challenge.
    // Operational approval remains fail-closed until profile and
    // storage authorization are implemented in trusted Main code.
    ipcMain.handle(
      "finora:reception:server-commit",
      async (event, input: unknown) => {
        const deny = (errorCode: string) => ({
          success: false as const,
          businessDataAccess: false as const,
          errorCode,
        });

        if (
          !event.senderFrame ||
          event.senderFrame !== event.sender.mainFrame ||
          !isTrustedRenderer(event.senderFrame) ||
          event.sender.isDestroyed()
        ) return deny("UNAUTHORIZED_RENDERER");

        if (
          !input ||
          typeof input !== "object" ||
          Array.isArray(input) ||
          Object.keys(input).length !== 1 ||
          typeof (input as { sessionId?: unknown }).sessionId !== "string"
        ) return deny("INVALID_REQUEST");

        const sessionId =
          (input as { sessionId: string }).sessionId;

        if (!/^[a-f0-9]{64}$/.test(sessionId)) {
          return deny("INVALID_SESSION");
        }

        const sender = event.sender;
        const businessSession =
          finoraBusinessSessionsBySender.get(sender);
        const generation =
          finoraAccountBusinessLoginGeneration.get(sender);

        if (!businessSession) {
          return deny("SERVER_SESSION_REQUIRED");
        }

        const current = () =>
          !sender.isDestroyed() &&
          finoraBusinessSessionsBySender.get(sender) === businessSession &&
          finoraAccountBusinessLoginGeneration.get(sender) === generation;

        try {
          const [
            { verifyFinoraServerBusinessSession },
            {
              commitFinoraServerReceptionSession,
              invalidateFinoraServerReceptionSession,
            },
          ] = await Promise.all([
            import("./control/finoraServerBusinessSessionVerifier.js"),
            import("./control/finoraServerReceptionSessionAuthority.js"),
          ]);

          if (!current()) return deny("LOGIN_CHANGED");

          const result = await commitFinoraServerReceptionSession(
            sender,
            sessionId,
            verifyFinoraServerBusinessSession,
            businessSession.sessionId,
            async principal => {
              // FINORA_P1_708Z_USB_ONLY_COMMIT
              // Never authorize LOCAL or CLOUD for Phase-1 Reception.
              if (!current() || principal.storageMode !== "USB") {
                return false;
              }

              const wallet =
                getFinoraSenderWalletPrincipal(sender);

              if (
                !wallet ||
                !(["userId", "ownerId", "businessId", "branchId"] as const)
                  .every(key => wallet[key] === principal[key])
              ) return false;

              // FINORA_P1_717G_SERVER_AUTHORIZED_RECEPTION
              // Device-local provisioned profiles are not a login
              // prerequisite. PostgreSQL business session, Wallet scope,
              // and the independent Server USB resolver remain mandatory.
              // FINORA_P1_709C_VERIFIED_USB_COMMIT
              // Reuse the same authoritative USB scope resolver used
              // by Electron's guarded native business-data operations.
              // Never accept renderer-supplied scope.
              if (!finoraServerUsbScopeResolver) return false;

              const usbScope = await finoraServerUsbScopeResolver(
                sender,
                sessionId,
              );

              if (
                !usbScope.success ||
                !usbScope.scope ||
                usbScope.scope.sessionId !== sessionId ||
                usbScope.scope.ownerId !== principal.ownerId ||
                usbScope.scope.businessId !== principal.businessId ||
                usbScope.scope.branchId !== principal.branchId ||
                usbScope.scope.dataContext !== "REAL" ||
                !current()
              ) return false;

              // Profile exists in native Control Store and matches
              // the independently verified PostgreSQL principal.
              // Signature provenance remains a separate audit gate.
              return true;
            }
          );

          if (!result.success || !current()) {
            invalidateFinoraServerReceptionSession(sender, sessionId);
            return deny(
              !result.success
                ? result.errorCode
                : "LOGIN_CHANGED"
            );
          }

          return {
            success: true as const,
            sessionId: result.sessionId,
            principal: result.principal,
            businessDataAccess: true as const,
            operationalCommitted: true as const,
          };
        } catch {
          return deny("RECEPTION_COMMIT_UNAVAILABLE");
        }
      },
    );
    // FINORA_P1_700Y_SERVER_FIRST_LOCAL_AUTH
    // Server identity is revalidated before and after local authorization.
    // Existing Wallet Login/Logout handlers remain untouched.
    ipcMain.handle(
      "finora:business:local-authorize",
      async (event, input: unknown) => {
        const deny = (errorCode: string) => ({
          success: false,
          businessDataAccess: false,
          errorCode,
        });

        if (
          !event.senderFrame ||
          event.senderFrame !== event.sender.mainFrame ||
          !isTrustedRenderer(event.senderFrame)
        ) return deny("UNAUTHORIZED_RENDERER");

        if (
          !input ||
          typeof input !== "object" ||
          Array.isArray(input)
        ) return deny("INVALID_REQUEST");

        const candidate = input as Record<string, unknown>;

        if (
          Object.keys(candidate).length !== 3 ||
          !["username", "password", "storageMode"].every(
            key => Object.prototype.hasOwnProperty.call(candidate, key)
          ) ||
          typeof candidate.username !== "string" ||
          !candidate.username.trim() ||
          candidate.username.length > 128 ||
          typeof candidate.password !== "string" ||
          !candidate.password ||
          candidate.password.length > 128 ||
          (
            candidate.storageMode !== "LOCAL" &&
            candidate.storageMode !== "USB"
          )
        ) return deny("INVALID_REQUEST");

        const serverSession =
          finoraBusinessSessionsBySender.get(event.sender);

        if (!serverSession) return deny("SERVER_SESSION_NOT_FOUND");

        const generation =
          finoraAccountBusinessLoginGeneration.get(event.sender);

        let issuedLocalSessionId: string | undefined;

        try {
          const [
            { verifyFinoraServerBusinessSession },
            {
              createFinoraBranchLoginSession,
              invalidateFinoraBranchLoginSession,
            },
            { authorizeFinoraServerFirstLocalSession },
          ] = await Promise.all([
            import("./control/finoraServerBusinessSessionVerifier.js"),
            import("./control/finoraBranchLoginSessionAuthority.js"),
            import("./control/finoraServerLocalReceptionHandoff.js"),
          ]);

          const current = () =>
            !event.sender.isDestroyed() &&
            finoraBusinessSessionsBySender.get(event.sender) === serverSession &&
            finoraAccountBusinessLoginGeneration.get(event.sender) === generation;

          const server = await verifyFinoraServerBusinessSession(
            serverSession.sessionId
          );

          if (!server.success || !current()) {
            return deny("SERVER_SESSION_REJECTED");
          }

          const account =
            getFinoraSenderWalletPrincipal(event.sender);

          const matches = account !== null &&
            (["userId", "ownerId", "businessId", "branchId"] as const)
              .every(key => account[key] === server.principal[key]);

          if (!matches) return deny("ACCOUNT_BUSINESS_SCOPE_MISMATCH");

          // FINORA_P1_704H_STORAGE_BINDING
          if (candidate.storageMode !== server.principal.storageMode) {
            return deny("SERVER_STORAGE_SCOPE_MISMATCH");
          }

          const result = await authorizeFinoraServerFirstLocalSession(
            {
              username: candidate.username,
              password: candidate.password,
              storageMode: candidate.storageMode,
            },
            server.principal,
            {
              createLocalSession: request =>
                createFinoraBranchLoginSession(request),
              invalidateLocalSession: sessionId => {
                invalidateFinoraBranchLoginSession({ sessionId });
              },
            }
          );

          if (!result.success) return deny(result.errorCode);

          issuedLocalSessionId = result.localSessionId;

          const freshServer = await verifyFinoraServerBusinessSession(
            serverSession.sessionId
          );
          const freshAccount =
            getFinoraSenderWalletPrincipal(event.sender);

          const freshMatches =
            freshServer.success &&
            freshAccount !== null &&
            (["userId", "ownerId", "businessId", "branchId"] as const)
              .every(key =>
                freshAccount[key] === server.principal[key] &&
                freshServer.principal[key] === server.principal[key]
              );

          if (
            !current() ||
            !freshMatches ||
            !freshServer.success ||
            freshServer.principal.storageMode !== server.principal.storageMode ||
            candidate.storageMode !== freshServer.principal.storageMode
          ) {
            invalidateFinoraBranchLoginSession({
              sessionId: issuedLocalSessionId,
            });
            issuedLocalSessionId = undefined;
            return deny("REVALIDATION_DENIED");
          }

          return {
            success: true,
            eligible: true,
            localSessionId: issuedLocalSessionId,
            operationalMode: result.operationalMode,
            businessDataAccess: false,
            errorCode: "RECEPTION_COMMIT_NOT_IMPLEMENTED",
          };
        } catch {
          if (issuedLocalSessionId) {
            const { invalidateFinoraBranchLoginSession } =
              await import("./control/finoraBranchLoginSessionAuthority.js");
            invalidateFinoraBranchLoginSession({
              sessionId: issuedLocalSessionId,
            });
          }
          return deny("LOCAL_AUTHORIZATION_UNAVAILABLE");
        }
      },
    );
    // FINORA_P1_693H_HANDOFF
    // Read-only eligibility check. Does NOT grant Reception.
    ipcMain.handle(
      "finora:business:operational-handoff-check",
      async (event, input: unknown) => {
        const deny = (errorCode: string) => ({
          success: false,
          eligible: false,
          businessDataAccess: false,
          errorCode,
        });

        if (
          !event.senderFrame ||
          !isTrustedRenderer(event.senderFrame)
        ) {
          return deny("UNAUTHORIZED_RENDERER");
        }

        if (
          !input ||
          typeof input !== "object" ||
          Array.isArray(input)
        ) {
          return deny("INVALID_REQUEST");
        }

        const candidate = input as Record<string, unknown>;

        if (
          typeof candidate.localSessionId !== "string" ||
          !/^[a-fA-F0-9]{64}$/.test(candidate.localSessionId)
        ) {
          return deny("INVALID_LOCAL_SESSION");
        }

        const serverSession =
          finoraBusinessSessionsBySender.get(event.sender);

        if (!serverSession) {
          return deny("SERVER_SESSION_NOT_FOUND");
        }

        try {
          const [
            { verifyFinoraServerBusinessSession },
            { validateFinoraBranchLoginSession },
            { evaluateFinoraReceptionHandoff },
          ] = await Promise.all([
            import("./control/finoraServerBusinessSessionVerifier.js"),
            import("./control/finoraBranchLoginSessionAuthority.js"),
            import("./control/finoraServerLocalReceptionHandoff.js"),
          ]);

          const server =
            await verifyFinoraServerBusinessSession(
              serverSession.sessionId,
            );

          if (!server.success) {
            finoraBusinessSessionsBySender.delete(event.sender);
            return deny(server.errorCode);
          }

          const local =
            await validateFinoraBranchLoginSession({
              sessionId: candidate.localSessionId,
            });

          if (!local.success) {
            return deny("LOCAL_OPERATIONAL_AUTHORIZATION_DENIED");
          }

          if (
            event.sender.isDestroyed() ||
            finoraBusinessSessionsBySender.get(event.sender) !==
              serverSession
          ) {
            return deny("SESSION_CHANGED_DURING_VERIFICATION");
          }

          // Validation returns the session view directly in local.data.
          const operational = local.data;

          if (operational.storageMode !== server.principal.storageMode) {
            return deny("SERVER_STORAGE_SCOPE_MISMATCH");
          }

          const decision =
            evaluateFinoraReceptionHandoff(
               server.principal,
              {
                userId: operational.userId,
                ownerId: operational.ownerId,
                businessId: operational.businessId,
                branchId: operational.branchId,
                role: operational.role,
                dataContext: operational.dataContext,
                storageMode: operational.storageMode,
                accessMode: operational.accessMode,
              },
            );

          if (!decision.success) {
            return deny(decision.errorCode);
          }

          // FINORA_P1_697O_EXACT_PRINCIPAL
          // Recheck after async local authorization to prevent races.
          const accountPrincipal =
            getFinoraSenderWalletPrincipal(event.sender);

          const samePrincipal =
            accountPrincipal !== null &&
            (["userId", "ownerId", "businessId", "branchId"] as const)
              .every(
                (field) =>
                  accountPrincipal[field] === server.principal[field],
              );

          if (
            !samePrincipal ||
            event.sender.isDestroyed() ||
            finoraBusinessSessionsBySender.get(event.sender) !== serverSession
          ) {
            return deny("ACCOUNT_BUSINESS_SCOPE_MISMATCH");
          }
          return {
            success: true,
            eligible: true,
            operationalMode: decision.operationalMode,
            businessDataAccess: false,
            errorCode: "RECEPTION_COMMIT_NOT_IMPLEMENTED",
          };
        } catch {
          return deny("HANDOFF_VERIFICATION_UNAVAILABLE");
        }
      },
    );
    registerFinoraBranchLoginSessionHandlers(
      isTrustedRenderer,
      portableBranchAuthStore,
      async (
        input,
        portableStore,
      ) => {
        // ========================================================
        // SERVER-FIRST PRECEDENCE
        //
        // New production Owner provisioning MUST verify the
        // server/database before any legacy portable recovery
        // is allowed to mutate local Control Store state.
        // ========================================================

        if (
          input &&
          typeof input === "object" &&
          !Array.isArray(input)
        ) {
          const serverCandidate =
            input as Record<string, unknown>;

          const serverUsername =
            typeof serverCandidate.username === "string"
              ? serverCandidate.username.trim()
              : "";

          const serverPassword =
            typeof serverCandidate.password === "string"
              ? serverCandidate.password
              : "";

          const serverSecurityCode =
            typeof serverCandidate.securityCode === "string"
              ? serverCandidate.securityCode
              : "";

          if (
            serverUsername.length > 0 &&
            serverPassword.length > 0 &&
            serverSecurityCode.length > 0
          ) {
            // FINORA_P1_578FV_FIRST_DEVICE_SECURITY_CODE_ONLY
            // Server-first enrollment is entered only when a Security Code
            // was actually supplied. Existing trusted/portable login remains
            // eligible to authenticate without repeating enrollment.

            const detectedUsbRoot =
              await findFinoraUsbRoot();

            if (detectedUsbRoot) {
              const {
                basename,
                join,
                parse,
              } =
                await import("node:path");

              const canonicalUsername =
                serverUsername
                  .normalize("NFKC")
                  .toLowerCase();

              const detectedFolder =
                basename(detectedUsbRoot)
                  .normalize("NFKC")
                  .toLowerCase();

              const selectedUsbRoot =
                detectedFolder === canonicalUsername
                  ? detectedUsbRoot
                  : join(
                      parse(detectedUsbRoot).root,
                      canonicalUsername,
                    );

              if (
                basename(selectedUsbRoot)
                  .normalize("NFKC")
                  .toLowerCase() ===
                canonicalUsername
              ) {
                const {
                  FinoraPortableBranchAuthV2Store,
                } =
                  await import(
                    "./control/finoraPortableBranchAuthV2Store.js"
                  );

                const {
                  FinoraPortableFreshDeviceRuntimeAuthorityStore,
                } =
                  await import(
                    "./control/finoraPortableFreshDeviceRuntimeAuthorityStore.js"
                  );

                const {
                  enrollFinoraServerFirstLogin,
                } =
                  await import(
                    "./control/finoraServerFirstLoginEnrollmentService.js"
                  );

                const serverPortableStore =
                  new FinoraPortableBranchAuthV2Store({
                    resolveLocalRoot:
                      () => app.getPath(
                        "userData",
                      ),

                    resolveUsbRoot:
                      async () =>
                        selectedUsbRoot,
                  });

                const serverRuntimeStore =
                  new FinoraPortableFreshDeviceRuntimeAuthorityStore({
                    resolveLocalRoot:
                      () => app.getPath(
                        "userData",
                      ),

                    resolveUsbRoot:
                      async () =>
                        selectedUsbRoot,
                  });

                const serverFirstResult =
                  await enrollFinoraServerFirstLogin(
                    {
                      username: serverUsername,
                      password: serverPassword,
                      securityCode:
                        serverSecurityCode,
                      selectedUsbRoot,
                    },
                    serverPortableStore,
                    serverRuntimeStore,
                  );

                if (serverFirstResult.success) {
                  console.log(
                    "[FINORA SERVER-FIRST PRECEDENCE] ENROLLED_AND_HYDRATED",
                  );

                  return {
                    success: true,
                  };
                }

                console.error(
                  "[FINORA SERVER-FIRST PRECEDENCE]",
                  serverFirstResult.errorCode,
                  serverFirstResult.error,
                );

                /*
                 * SERVER-FIRST IS AUTHORITATIVE FOR NEW OWNER LOGIN.
                 *
                 * After the server-first path has actually run,
                 * do not fall through into legacy/offline recovery.
                 */
                if (
                  serverFirstResult.errorCode ===
                    "SERVER_VERIFICATION_FAILED" ||
                  serverFirstResult.errorCode ===
                    "INVALID_REQUEST"
                ) {
                  return {
                    success: false,
                    errorCode: "INVALID_CREDENTIALS",
                    error:
                      "Invalid username or password.",
                  };
                }

                return {
                  success: false,
                  errorCode: "CONTROL_STATE_FAILED",
                  error:
                    serverFirstResult.error,
                };
              }
            }
          }
        }

        const portableRecoveryResult =
          await portableFreshDeviceLoginRecovery(
            input,
            portableStore,
          );

        if (
          portableRecoveryResult.success
        ) {
          /*
           * A successful portable recovery is not sufficient to
           * stop the server-first chain when the exact authenticated
           * Business Profile is still absent.
           *
           * This matters for server-provisioned owners because the
           * runtime/portable authority can restore credentials before
           * the signed server Business Profile has been hydrated.
           */
          const recoveryCandidate =
            input &&
            typeof input === "object" &&
            !Array.isArray(input)
              ? input as Record<string, unknown>
              : undefined;

          const recoveryUsername =
            typeof recoveryCandidate?.username === "string"
              ? recoveryCandidate.username
                  .trim()
                  .normalize("NFKC")
                  .toLowerCase()
              : "";

          let recoveredProfileExists =
            false;

          if (recoveryUsername.length > 0) {
            try {
              const {
                readFinoraControlStore,
              } =
                await import(
                  "./control/finoraControlStore.js"
                );

              const controlResult =
                await readFinoraControlStore();

              if (
                controlResult.success &&
                controlResult.data
              ) {
                const recoveredCredential =
                  (
                    controlResult.data.branchCredentials ??
                    []
                  ).find(
                    (credential) =>
                      credential.canonicalUsername ===
                        recoveryUsername,
                  );

                recoveredProfileExists =
                  recoveredCredential !==
                    undefined &&
                  (
                    controlResult.data.businessProfiles ??
                    []
                  ).some(
                    (profile) =>
                      profile.ownerId ===
                        recoveredCredential.ownerId &&
                      profile.businessId ===
                        recoveredCredential.businessId &&
                      profile.branchId ===
                        recoveredCredential.branchId,
                  );
              }
            }
            catch {
              recoveredProfileExists =
                false;
            }
          }

          if (recoveredProfileExists) {
            /*
             * FINORA_P1_578GT_LOCAL_RECOVERY_NOT_SERVER_IDENTITY
             *
             * Local/portable recovery proves local login authority only.
             * It is not production-server wallet identity verification.
             * Normal trusted login remains username + password.
             * Security Code remains limited to explicit first-device/recovery flow.
             */
            console.log(
              "[FINORA LOCAL RECOVERY] LOCAL_AUTHORITY_ONLY_SERVER_IDENTITY_UNVERIFIED",
            );

            return portableRecoveryResult;
          }

          // Missing profile: continue below into the already
          // pinned/signature-verified server-first enrollment path.
        }
        else if (
          portableRecoveryResult.errorCode !==
            "INVALID_CREDENTIALS" &&
          portableRecoveryResult.errorCode !==
            "RUNTIME_AUTHORITY_MISSING"
        ) {
          return portableRecoveryResult;
        }

        if (
          !input ||
          typeof input !==
            "object" ||
          Array.isArray(input)
        ) {
          return portableRecoveryResult;
        }

        const candidate =
          input as Record<
            string,
            unknown
          >;

        const username =
          typeof candidate.username ===
            "string"
            ? candidate.username.trim()
            : "";

        const password =
          typeof candidate.password ===
            "string"
            ? candidate.password
            : "";

        const securityCode =
          typeof candidate.securityCode ===
            "string"
            ? candidate.securityCode
            : "";

        if (
          username.length ===
            0 ||
          password.length ===
            0
        ) {
          return portableRecoveryResult;
        }

                // FINORA_P1_677P_PASSWORD_FIRST
        // Do not require Security Code before invoking authenticated
        // server-first enrollment. Existing credential verification,
        // USB ownership checks and fail-closed recovery remain active.

        const detectedUsbRoot =
          await findFinoraUsbRoot();

        if (!detectedUsbRoot) {
          return portableRecoveryResult;
        }

        const {
          basename,
          join,
          parse,
        } =
          await import(
            "node:path"
          );

        const canonicalUsername =
          username
            .normalize(
              "NFKC",
            )
            .toLowerCase();

        const detectedFolder =
          basename(
            detectedUsbRoot,
          )
            .normalize(
              "NFKC",
            )
            .toLowerCase();

        const selectedUsbRoot =
          detectedFolder ===
            canonicalUsername
            ? detectedUsbRoot
            : join(
                parse(
                  detectedUsbRoot,
                ).root,
                canonicalUsername,
              );

        const selectedFolder =
          basename(
            selectedUsbRoot,
          )
            .normalize(
              "NFKC",
            )
            .toLowerCase();

        if (
          selectedFolder !==
            canonicalUsername
        ) {
          return portableRecoveryResult;
        }

        const {
          FinoraPortableBranchAuthV2Store,
        } =
          await import(
            "./control/finoraPortableBranchAuthV2Store.js"
          );

        const {
          FinoraPortableFreshDeviceRuntimeAuthorityStore,
        } =
          await import(
            "./control/finoraPortableFreshDeviceRuntimeAuthorityStore.js"
          );

        const {
          enrollFinoraServerFirstLogin,
        } =
          await import(
            "./control/finoraServerFirstLoginEnrollmentService.js"
          );

        const scopedPortableV2Store =
          new FinoraPortableBranchAuthV2Store({
            resolveLocalRoot:
              () =>
                app.getPath(
                  "userData",
                ),

            resolveUsbRoot:
              async () =>
                selectedUsbRoot,
          });

        const scopedRuntimeAuthorityStore =
          new FinoraPortableFreshDeviceRuntimeAuthorityStore({
            resolveLocalRoot:
              () =>
                app.getPath(
                  "userData",
                ),

            resolveUsbRoot:
              async () =>
                selectedUsbRoot,
          });

        let serverFirstResult:
          Awaited<
            ReturnType<
              typeof enrollFinoraServerFirstLogin
            >
          >;

        try {
          serverFirstResult =
            await enrollFinoraServerFirstLogin(
              {
                username,
                password,
                securityCode,
                selectedUsbRoot,
              },
              scopedPortableV2Store,
              scopedRuntimeAuthorityStore,
            );
        }
        catch (error) {
          const safeName =
            error instanceof Error
              ? error.name
              : "UnknownError";

          const safeMessage =
            error instanceof Error
              ? error.message
              : String(error);

          console.error(
            "[FINORA SERVER-FIRST EXCEPTION]",
            safeName,
            safeMessage,
          );

          try {
            const { appendFile } =
              await import("node:fs/promises");

            const { join } =
              await import("node:path");

            await appendFile(
              join(
                app.getPath("temp"),
                "finora-server-first-login.log",
              ),
              `[FINORA SERVER-FIRST EXCEPTION] ${safeName} ${safeMessage}` + "\n",
              "utf8",
            );
          }
          catch {
            // Diagnostic logging must never alter authentication behavior.
          }

          return {
            success: false,
            errorCode: "INVALID_CREDENTIALS",
            error:
              "FINORA server-first enrollment failed unexpectedly.",
          };
        }

        if (
          !serverFirstResult.success
        ) {
          console.error(
            "[FINORA SERVER-FIRST LOGIN]",
            serverFirstResult.errorCode,
            serverFirstResult.error,
          );

          try {
            const {
              appendFile,
            } =
              await import(
                "node:fs/promises"
              );

            const {
              join,
            } =
              await import(
                "node:path"
              );

            await appendFile(
              join(
                app.getPath("temp"),
                "finora-server-first-login.log",
              ),
              `[FINORA SERVER-FIRST LOGIN] ${serverFirstResult.errorCode} ${serverFirstResult.error}` +
                "\n",
              "utf8",
            );
          }
          catch {
            // Diagnostic logging must never alter authentication behavior.
          }

          return {
            success:
              false,
            errorCode:
              serverFirstResult.errorCode === "INVALID_REQUEST"
                ? "INVALID_CREDENTIALS"
                : "CONTROL_STATE_FAILED",
            error:
              serverFirstResult.errorCode === "SERVER_VERIFICATION_FAILED"
                ? "Server-first verification was unsuccessful. Check account authorization or server response."
                : `Server-first authorization failed [${serverFirstResult.errorCode}].`,
          };
        }

        return {
          success:
            true,
        };
      },
      async (request) => {
        if (
          !request ||
          typeof request !== "object" ||
          Array.isArray(request)
        ) {
          return undefined;
        }

        const candidate =
          request as Record<string, unknown>;

        const username =
          typeof candidate.username === "string"
            ? candidate.username
                .trim()
                .normalize("NFKC")
                .toLowerCase()
            : "";

        if (!username) {
          return undefined;
        }

        const detectedUsbRoot =
          await findFinoraUsbRoot();

        if (!detectedUsbRoot) {
          return undefined;
        }

        const detectedFolder =
          path.basename(detectedUsbRoot)
            .normalize("NFKC")
            .toLowerCase();

        const requestScopedUsbRoot =
          detectedFolder === username
            ? detectedUsbRoot
            : path.join(
                path.parse(detectedUsbRoot).root,
                username,
              );

        return new FinoraPortableBranchAuthV2Store({
          resolveLocalRoot:
            () =>
              app.getPath("userData"),

          resolveUsbRoot:
            async () =>
              requestScopedUsbRoot,
        });
      },
      async (session) => {
        // P1-572X: invoked only after verified OWNER/ACTIVE
        // Main Login. Server independently authenticates again.
        // Never return, expose, persist or log the Wallet token.
        // FINORA_P1_578EG_BRANCH_WALLET_ISOLATION
        // Clear previous branch Wallet state before new authorization.
        // This does not revoke server sessions or alter Wallet balances.
        unifiedWalletSession.clearLocal();
        clearFinoraAccountWalletSession();
        finoraProofWalletForLifecycle?.clearLocal();

        // FINORA_P1_678J_ACCOUNT_WALLET_HANDOFF
        // Independent server-authenticated Account/Wallet session only.
        // Never grants Reception business-record permissions.
        try {
          const accountResult = await establishFinoraAccountWalletSession(
            session.oneTimeCredentials.username,
            session.oneTimeCredentials.password,
          );
          if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
            console.info("[FINORA ACCOUNT WALLET HANDOFF]", JSON.stringify({
              success: accountResult.success,
              errorCode: accountResult.success ? "NONE" : accountResult.errorCode,
            }));
          }
        } catch {
          clearFinoraAccountWalletSession();
        }
        /*
         * FINORA_P1_578HL_NORMAL_LOGIN_PROOF_FIRST
         *
         * The legacy Main-Login Wallet session endpoint requires a
         * Security Code. A normal trusted Main Login intentionally does not.
         *
         * When no one-time Security Code is present, fail locally into the
         * existing proof-gateway fallback. The proof gateway independently
         * verifies server username/password, exact server scope and the
         * previously enrolled proof key.
         *
         * This does NOT bypass server authentication or branch isolation.
         */
        const hasOneTimeSecurityCode =
          typeof session.oneTimeCredentials.securityCode === "string" &&
          session.oneTimeCredentials.securityCode.length > 0;

        // FINORA_P1_579GJ_WALLET_PROOF_ENROLLMENT
        // Explicit proof-key enrollment is permitted only when the
        // already-verified Main Login supplied its one-time Security Code.
        // Ordinary trusted password-only login never enters this block.
        if (
          hasOneTimeSecurityCode &&
          finoraServerWalletOnlineAccessForLifecycle
        ) {
          try {
            const enrollmentResult =
              await finoraServerWalletOnlineAccessForLifecycle.enroll({
                username: session.oneTimeCredentials.username,
                password: session.oneTimeCredentials.password,
                securityCode: session.oneTimeCredentials.securityCode,
              });

            if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
              console.info(
                "[FINORA WALLET PROOF ENROLLMENT]",
                JSON.stringify({
                  success: enrollmentResult.success,
                  errorCode: enrollmentResult.success
                    ? "NONE"
                    : enrollmentResult.errorCode,
                }),
              );
            }
          } catch {
            finoraServerWalletOnlineAccessForLifecycle.clearLocal();

            if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
              console.info(
                "[FINORA WALLET PROOF ENROLLMENT]",
                JSON.stringify({
                  success: false,
                  errorCode: "WALLET_ACCESS_UNAVAILABLE",
                }),
              );
            }
          }
        }

        const result = hasOneTimeSecurityCode
          ? await unifiedWalletSession.establish({
              mainSessionId: session.sessionId,
              credentials: {
                username: session.oneTimeCredentials.username,
                password: session.oneTimeCredentials.password,
                securityCode: session.oneTimeCredentials.securityCode,
              },
              scope: {
                userId: session.userId,
                ownerId: session.ownerId,
                businessId: session.businessId,
                branchId: session.branchId,
              },
            })
          : {
              success: false as const,
              errorCode: "SECURITY_CODE_NOT_PRESENT_FOR_LEGACY_WALLET" as const,
            };
        // Main Login must remain independent of Wallet availability.
        // Failed Wallet authorization never creates local credit.
        // FINORA_P573F3_HANDOFF_RESULT
        if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
          console.info("[FINORA WALLET HANDOFF RESULT]", JSON.stringify({
            success: result.success,
            errorCode: result.success ? "NONE" : result.errorCode,
          }));
        }
        if (!result.success || hasOneTimeSecurityCode) {
          // FINORA_P1_579QO_PROOF_HANDOFF
          // Successful legacy authorization does not replace
          // independent signed Proof authentication.
          if (!result.success) {
            unifiedWalletSession.clearLocal();
        clearFinoraAccountWalletSession();
          }

          // FINORA_P1_578EA_AUTO_PROOF_HANDOFF
          // Reuse an enrolled key. Never bypass verified branch association.
          try {
            const proofResult =
              await finoraProofWalletForLifecycle?.establish({
                mainSessionId: session.sessionId,
                mainScope: {
                  userId: session.userId,
                  ownerId: session.ownerId,
                  businessId: session.businessId,
                  branchId: session.branchId,
                },
                credentials: {
                  username: session.oneTimeCredentials.username,
                  password: session.oneTimeCredentials.password,
                },
              });

            if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
              console.info("[FINORA AUTO PROOF HANDOFF]", JSON.stringify({
                success: proofResult?.success === true,
                errorCode: proofResult?.success
                  ? "NONE"
                  : proofResult?.errorCode ?? "PROOF_GATEWAY_UNAVAILABLE",
              }));
            }
          } catch (error) {
            finoraProofWalletForLifecycle?.clearLocal();
            if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
              console.warn(
                "[FINORA AUTO PROOF HANDOFF]",
                JSON.stringify({
                  success: false,
                  errorCode: "PROOF_HANDOFF_EXCEPTION",
                  errorType: error instanceof Error
                    ? error.name
                    : "UNKNOWN",
                }),
              );
            }
          }
        }
      },
      // FINORA_P1_702Q_MAIN_SERVER_BOUND_GUARD
      // Server authorization is verified for the exact IPC sender.
      // No identity or scope is accepted from renderer input.
      async (sender, session) => {
        try {
          const serverSession =
            finoraBusinessSessionsBySender.get(sender);

          if (!serverSession) return false;

          const generation =
            finoraAccountBusinessLoginGeneration.get(sender);

          const { verifyFinoraServerBusinessSession } =
            await import(
              "./control/finoraServerBusinessSessionVerifier.js"
            );

          const { verifyFinoraServerBoundIdentity } =
            await import(
              "./control/finoraServerBoundSessionGuard.js"
            );

          const verified =
            await verifyFinoraServerBusinessSession(
              serverSession.sessionId
            );

          if (!verified.success) return false;

          // FINORA_P1_704T_SESSION_STORAGE
          if (session.storageMode !== verified.principal.storageMode) {
            return false;
          }

          const account =
            getFinoraSenderWalletPrincipal(
              sender as Parameters<
                typeof getFinoraSenderWalletPrincipal
              >[0]
            );

          if (!account) return false;

          if (
            !verifyFinoraServerBoundIdentity(
              verified.principal,
              session
            ) ||
            !verifyFinoraServerBoundIdentity(
              verified.principal,
              account
            )
          ) {
            return false;
          }

          return (
            finoraBusinessSessionsBySender.get(sender) ===
              serverSession &&
            finoraAccountBusinessLoginGeneration.get(sender) ===
              generation
          );
        } catch {
          return false;
        }
      },
    );

    // --------------------------------------------------------
    // DEVELOPMENT-ONLY CONTROL CENTER AUTHORITY
    //
    // Recipient production packages must not load issuer-side
    // Control Center authority modules.
    // --------------------------------------------------------

    if (!app.isPackaged) {
      const {
        registerFinoraControlCenterHandlers,
      } =
        await import(
          "./control-center/finoraControlCenterIpc.js"
        );

      registerFinoraControlCenterHandlers();
    }

    registerFinoraNotificationArtifactHandlers(
      isTrustedRenderer,
      notificationArtifactStore,
    );

    registerFinoraNotificationProviders();

    await runFinoraNotificationProviderDevelopmentProvisioning();

    registerFinoraNotificationProviderHandlers(
      isTrustedRenderer,
      getFinoraNotificationProviderRegistry(),
    );

    await ensureFinoraWindowsInstallationBinding();

    await runFinoraDevelopmentProvisioning();

    createMainWindow();

    if (
      !app.isPackaged &&
      process.env.FINORA_DEV_OPEN_CONTROL_CENTER ===
        "1"
    ) {
      const {
        openFinoraControlCenterWindow,
      } =
        await import(
          "./control-center/finoraControlCenterWindow.js"
        );

      await openFinoraControlCenterWindow();
    }

    // --------------------------------------------------------
    // WARM USB DETECTION
    //
    // Ordinary application startup only.
    // --------------------------------------------------------

    warmUsbRootCache();
  }

  // ----------------------------------------------------------
  // MACOS WINDOW REACTIVATION
  // ----------------------------------------------------------

  app.on("activate", () => {
    if (
      BrowserWindow.getAllWindows().length !==
        0
    ) {
      return;
    }

    if (
      openRecipientTrustRecovery
    ) {
      void openFinoraRecipientTrustRecoveryWindow();

      return;
    }

    if (
      openRecipientTrustMaintenance
    ) {
      void openFinoraRecipientTrustMaintenanceWindow();

      return;
    }

    createMainWindow();
  });
});

// ============================================================
// APPLICATION SHUTDOWN
// ============================================================

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// ============================================================
// END
// ============================================================
