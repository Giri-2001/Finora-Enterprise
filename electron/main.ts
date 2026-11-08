import {
  clipboard as finoraReceiptClipboard,
  nativeImage as finoraReceiptNativeImage,
} from "electron";
// FINORA_R188_B_CLIPBOARD
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
import { derivePaisaruleStorageBackupV1Key } from "./control/paisaruleStorageBackupV1Crypto.js";
import {
  clearPaisaruleBackupSessionKey,
  isPaisaruleBackupSessionKeyAvailable,
  setPaisaruleBackupSessionKey,
} from "./control/paisaruleStorageBackupV1SessionKeyAuthority.js";
import { verifyFinoraServerBusinessSession as verifyPaisaruleBackupBusinessSession } from "./control/finoraServerBusinessSessionVerifier.js";
import { exportPaisaruleStorageBackupV1FromUsb } from "./control/paisaruleStorageBackupV1FileTransport.js";
import {
  savePaisarulePreparedBackupV1,
} from "./control/paisaruleStorageBackupV1PreparedDownload.js";
// PAISARULE_C117_R176_PREPARE_IPC
import {
  PaisaruleStorageBackupV1PreparedCache,
} from "./control/paisaruleStorageBackupV1PreparedCache.js";
import {
  PaisaruleStorageBackupV1PreparedEvidence,
} from "./control/paisaruleStorageBackupV1PreparedEvidence.js";
import {
  PaisaruleStorageBackupV1PrepareLifecycle,
} from "./control/paisaruleStorageBackupV1PrepareLifecycle.js";
import {
  preparePaisaruleBackupV1FromUsb,
} from "./control/paisaruleStorageBackupV1PrepareFromUsb.js";
import {
  capturePaisaruleV1CombinedUsbEvidence,
  assertPaisaruleV1CombinedUsbEvidence,
} from "./control/paisaruleStorageBackupV1UsbAuthority.js";
import {
  capturePaisaruleV1UsbHardwareIdentity,
} from "./control/paisaruleStorageBackupV1UsbHardwareIdentity.js";
import {
  capturePaisaruleV1SourceFingerprint,
} from "./control/paisaruleStorageBackupV1SourceFingerprint.js";
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
import { mkdirSync } from "node:fs";
import {
  listSavedOwnerLogins,
  saveOwnerLogin,
  updateSavedOwnerLoginLabel,
  getSavedOwnerLogin,
  removeSavedOwnerLogin,
} from "./control/finoraSavedOwnerLoginVault.js";

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

import path from "node:path";
// PAISARULE_C85_I17_OWNER_USERDATA
// Preserve the original Owner local storage across
// the Windows product-name rebrand.
// Scope strictly to the packaged Owner executable.
if (
  app.isPackaged &&
  path.basename(process.execPath).toLowerCase() ===
    "paisarule.exe"
) {
  const legacyOwnerUserData = path.join(
    app.getPath("appData"),
    "finora-enterprise",
  );

  mkdirSync(legacyOwnerUserData, { recursive: true });
  app.setPath("userData", legacyOwnerUserData);
}

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

  // PAISARULE_C125_R253
  ATOMIC_COLLECTION_SETTLEMENT:
    "finora:usb:atomic-collection-settlement",
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

      // PAISARULE C117-R179
      // Prefer the authenticated last-used folder ONLY if the
      // native USB identity and exact branch folder match.
      // No renderer-provided path; no authentication bypass.
      if (discoveredBranchRoots.length > 1) {
        try {
          const { capturePaisaruleUsbIdentityV1 } =
            await import(
              "./control/paisaruleStorageBackupV1UsbIdentity.js"
            );

          const { findPaisaruleLastUsbFolderV1 } =
            await import(
              "./control/paisaruleLastUsbFolderV1.js"
            );

          const validCandidates: string[] = [];

          for (const removableRoot of roots) {
            try {
              const identity =
                await capturePaisaruleUsbIdentityV1(
                  removableRoot,
                );

              const savedCandidate =
                await findPaisaruleLastUsbFolderV1({
                  userData: app.getPath("userData"),
                  removableRoot,
                  identity,
                });

              if (!savedCandidate) continue;

              const matchingBranch =
                discoveredBranchRoots.find(
                  (branch) =>
                    path.win32.resolve(branch).toLowerCase() ===
                    path.win32.resolve(savedCandidate).toLowerCase(),
                );

              if (matchingBranch) {
                validCandidates.push(matchingBranch);
              }
            } catch {
              // Identity or storage unavailable: never trust
              // an unverified saved folder.
            }
          }

          const uniqueCandidates = Array.from(
            new Set(
              validCandidates.map(
                (candidate) =>
                  path.win32.resolve(candidate).toLowerCase(),
              ),
            ),
          );

          if (uniqueCandidates.length === 1) {
            const selected =
              validCandidates.find(
                (candidate) =>
                  path.win32.resolve(candidate).toLowerCase() ===
                  uniqueCandidates[0],
              );

            if (selected) {
              cachedUsbRoot = selected;
              cachedUsbRootAt = Date.now();

              console.info(
                "[PAISARULE LAST USB] VERIFIED_FOLDER_AUTO_SELECTED",
              );

              return selected;
            }
          }
        } catch {
          // Preference is optional. Ordinary USB discovery
          // retains its existing behavior.
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

  // PAISARULE_C117_R204_WINDOWS_FOLDER
  // Select an explicit top-level folder on removable USB.
  // A new folder need not contain an existing auth file.
  // Never interpret the drive root as the Owner folder.
  if (
    directRemovableRoot ||
    (
      !candidateIsDirectChildOfRemovable &&
      !isExactFinoraBranchFolder
    )
  ) {
    throw new Error(
      "Select a folder inside the removable USB drive, not the drive root.",
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

//
// PAISARULE_R175_C48
// Reject storage access when a Restore transaction
// on the same drive has not completed.
//
// ENOENT is the only permitted marker-lookup failure.
// All other filesystem errors fail closed.
//
async function assertPaisaruleUsbRestoreComplete(
  usbRoot: string,
): Promise<void> {
  if (
    typeof usbRoot !== "string" ||
    usbRoot.length === 0
  ) {
    throw new Error("PAISARULE_RESTORE_USB_ROOT_INVALID");
  }

  const driveRoot = path.parse(path.resolve(usbRoot)).root;

  if (
    process.platform !== "win32" ||
    !/^[A-Za-z]:\\$/.test(driveRoot)
  ) {
    throw new Error("PAISARULE_RESTORE_DRIVE_ROOT_INVALID");
  }

  // PAISARULE_C117_R237_BRANCH_MARKER
  // Protect only the authenticated branch folder for
  // folder-scoped Restore transactions.
  //
  // This is an additional read guard. It does not replace
  // the legacy whole-drive incomplete-Restore marker.
  const branchMarkerPath = path.join(
    path.resolve(usbRoot),
    "FINORA",
    "paisarule-restore-incomplete",
  );

  try {
    await fs.lstat(branchMarkerPath);
    throw new Error(
      "PAISARULE_BRANCH_RESTORE_INCOMPLETE_BLOCKED",
    );
  } catch (error) {
    if (
      error !== null &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      // No incomplete branch Restore marker.
    } else if (
      error instanceof Error &&
      error.message ===
        "PAISARULE_BRANCH_RESTORE_INCOMPLETE_BLOCKED"
    ) {
      throw error;
    } else {
      throw new Error(
        "PAISARULE_BRANCH_RESTORE_MARKER_CHECK_FAILED",
      );
    }
  }

  // A present marker always blocks business storage.
  // The matching writer must only remove its own marker
  // after complete verified publication and readback.
  const markerPath = path.join(
    driveRoot,
    "paisarule-restore-incomplete",
  );

  try {
    await fs.lstat(markerPath);
  } catch (error) {
    if (
      error !== null &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return;
    }

    throw new Error(
      "PAISARULE_RESTORE_MARKER_CHECK_FAILED",
    );
  }

  throw new Error(
    "PAISARULE_RESTORE_INCOMPLETE_USB_BLOCKED",
  );
}
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
  await assertPaisaruleUsbRestoreComplete(usbRoot);
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
  await assertPaisaruleUsbRestoreComplete(usbRoot);
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
      "PAISARULE USB is disconnected.",
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

      message: "PAISARULE USB is not connected.",
    };
  }

  try {
    await assertPaisaruleUsbRestoreComplete(usbRoot);
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
    // An interrupted branch Restore is not a disconnected USB.
    // Keep the physical branch selection available for a future
    // authenticated recovery. Business storage stays blocked by
    // assertPaisaruleUsbRestoreComplete().
    if (
      error instanceof Error &&
      error.message ===
        "PAISARULE_BRANCH_RESTORE_INCOMPLETE_BLOCKED"
    ) {
      return {
        availability: "RECOVERY_REQUIRED",
        storageId: path.parse(usbRoot).root,
        storagePath: usbRoot,
        message: "Interrupted Restore requires authenticated recovery.",
      };
    }

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
    return failure("PAISARULE USB is disconnected.");
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
    return failure("PAISARULE USB is disconnected.");
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

async function handleUsbSaveUnlocked(
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
    return failure("PAISARULE USB is disconnected.");
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

    // FINORA HF28-CH45-C45:
    // Read back the published USB package before returning success.
    // A failure is an uncertain save outcome, never an instruction
    // to create the same Customer/Loan/Collection again.
    const readBackPackage = await readStoragePackage(usbRoot);

    const matchingRecords = readBackPackage.records.filter(
      (item) =>
        item.id === persistedRecord.id &&
        item.entity === persistedRecord.entity &&
        item.ownerId === persistedRecord.ownerId &&
        item.businessId === persistedRecord.businessId &&
        item.branchId === persistedRecord.branchId &&
        item.demoId === persistedRecord.demoId,
    );

    if (
      matchingRecords.length !== 1 ||
      matchingRecords[0].createdAt !== persistedRecord.createdAt ||
      matchingRecords[0].updatedAt !== persistedRecord.updatedAt ||
      JSON.stringify(matchingRecords[0].data) !==
        JSON.stringify(persistedRecord.data)
    ) {
      throw new Error(
        "FINORA_USB_SAVE_READBACK_UNCERTAIN: Verify the existing USB record before retrying.",
      );
    }

    // FINORA HF28-CH45-C60-R2
    // Optional digest derived after native USB record read-back.
    // This is NOT signed evidence and cannot authorize billing.
    let usageRecordDigest: string | undefined;

    const digestOwnerId = persistedRecord.ownerId;
    const digestBusinessId = persistedRecord.businessId;
    const digestBranchId = persistedRecord.branchId;

    if (
      ["CUSTOMER", "LOAN", "COLLECTION"].includes(
        persistedRecord.entity,
      ) &&
      typeof digestOwnerId === "string" &&
      digestOwnerId.length > 0 &&
      typeof digestBusinessId === "string" &&
      digestBusinessId.length > 0 &&
      typeof digestBranchId === "string" &&
      digestBranchId.length > 0
    ) {
      try {
        const { createFinoraUsageRecordDigest } =
          await import("./control/finoraUsageRecordDigest.js");

        const verifiedRecord = matchingRecords[0];

        usageRecordDigest = createFinoraUsageRecordDigest({
          id: verifiedRecord.id,
          entity: verifiedRecord.entity,
          ownerId: digestOwnerId,
          businessId: digestBusinessId,
          branchId: digestBranchId,
          demoId: verifiedRecord.demoId,
          data: verifiedRecord.data,
        });
      } catch {
        // Native USB read-back already succeeded.
        // Billing evidence remains unavailable if digest fails.
        // Never repeat or recreate the saved business record.
        usageRecordDigest = undefined;
      }
    }

    return {
      ...success(persistedRecord.data),
      ...(usageRecordDigest
        ? { usageRecordDigest }
        : {}),
      ...(
        ["CUSTOMER", "LOAN", "COLLECTION"].includes(
          persistedRecord.entity,
        )
          ? {
              usageDigestStatus: usageRecordDigest
                ? "LOCAL_USB_READBACK_DIGEST_READY"
                : "BILLING_DIGEST_UNAVAILABLE",
            }
          : {}
      ),
    };
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

/*
 * PAISARULE_C125_R241
 *
 * INTERNAL ONLY. Not registered as IPC.
 *
 * Future authenticated settlement entry point will supply
 * canonical prepared records and the expected original Loan.
 *
 * This function does not independently calculate or validate
 * financial allocation. It MUST NOT be exposed as an IPC
 * operation until native settlement authority is implemented.
 */
async function handleUsbAtomicCollectionSettlementUnlocked(
  expectedLoanData: unknown,
  loanInput: unknown,
  collectionInput: unknown,
  options?: StorageWriteOptions,
) {
  if (
    !validateRecord(loanInput) ||
    !validateRecord(collectionInput)
  ) {
    return failure("Invalid settlement records.");
  }

  const loan = loanInput as Record<string, unknown>;
  const collection = collectionInput as Record<string, unknown>;

  const loanId =
    typeof loan.id === "string" ? loan.id.trim() : "";

  const collectionId =
    typeof collection.id === "string"
      ? collection.id.trim()
      : "";

  if (
    loan.entity !== "LOAN" ||
    collection.entity !== "COLLECTION" ||
    !loanId ||
    !collectionId ||
    !expectedLoanData ||
    typeof expectedLoanData !== "object"
  ) {
    return failure("Invalid atomic settlement identity.");
  }

  // PAISARULE_C125_R242
  // Tenant authority must already have been resolved in native
  // main process. Never accept an absent or DEMO scope.
  const tenantScopeValid =
    typeof options?.ownerId === "string" &&
    options.ownerId.trim().length > 0 &&
    typeof options.businessId === "string" &&
    options.businessId.trim().length > 0 &&
    typeof options.branchId === "string" &&
    options.branchId.trim().length > 0 &&
    (
      options.demoId === undefined ||
      options.demoId === null ||
      options.demoId === ""
    );

  if (!tenantScopeValid) {
    return failure("SETTLEMENT_REAL_TENANT_SCOPE_REQUIRED");
  }

  // Check embedded record identity before any USB access.
  const loanDataUnknown = loan.data ?? loan;
  const collectionDataUnknown = collection.data ?? collection;

  if (
    !loanDataUnknown ||
    typeof loanDataUnknown !== "object" ||
    Array.isArray(loanDataUnknown) ||
    !collectionDataUnknown ||
    typeof collectionDataUnknown !== "object" ||
    Array.isArray(collectionDataUnknown)
  ) {
    return failure("SETTLEMENT_RECORD_DATA_INVALID");
  }

  const loanData =
    loanDataUnknown as Record<string, unknown>;

  const collectionData =
    collectionDataUnknown as Record<string, unknown>;

  if (
    String(loanData.id ?? "").trim() !== loanId ||
    String(collectionData.id ?? "").trim() !== collectionId ||
    String(collectionData.loanId ?? "").trim() !== loanId
  ) {
    return failure("SETTLEMENT_EMBEDDED_IDENTITY_MISMATCH");
  }

  if (
    !expectedLoanData ||
    typeof expectedLoanData !== "object" ||
    Array.isArray(expectedLoanData) ||
    String(
      (expectedLoanData as Record<string, unknown>).id ?? "",
    ).trim() !== loanId
  ) {
    return failure("SETTLEMENT_EXPECTED_LOAN_IDENTITY_MISMATCH");
  }

  const receiptNumber =
    typeof collectionData.receiptNumber === "string"
      ? collectionData.receiptNumber.trim()
      : "";

  if (
    !receiptNumber ||
    String(collectionData.loanId ?? "").trim() !== loanId
  ) {
    return failure("Collection receipt or Loan identity mismatch.");
  }
  // PAISARULE_C125_R243
  // Native pre-publication financial reconciliation.
  // This does not replace authoritative EMI-wise verification.
  const originalLoan =
    expectedLoanData as Record<string, unknown>;

  const asCents = (value: unknown): number | null => {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0
    ) {
      return null;
    }

    const scaled = value * 100;
    const rounded = Math.round(scaled);

    if (
      !Number.isSafeInteger(rounded) ||
      Math.abs(scaled - rounded) > 0.000001
    ) {
      return null;
    }

    return rounded;
  };

  const cash = asCents(collectionData.paymentAmount);
  const penalty = asCents(collectionData.penaltyAmount);
  const discount = asCents(collectionData.discountAmount);
  const principal = asCents(collectionData.advanceAdjustment);
  const previous = asCents(originalLoan.outstanding);
  const remaining = asCents(loanData.outstanding);
  const recordedRemaining =
    asCents(collectionData.outstandingBalance);

  if (
    cash === null ||
    penalty === null ||
    discount === null ||
    principal === null ||
    previous === null ||
    remaining === null ||
    recordedRemaining === null ||
    cash <= 0 ||
    penalty > cash ||
    principal > cash - penalty ||
    previous < remaining ||
    previous - remaining !== cash - penalty + discount ||
    remaining !== recordedRemaining
  ) {
    return failure("SETTLEMENT_FINANCIAL_RECONCILIATION_FAILED");
  }

  const snapshotUnknown = collectionData.receiptSnapshot;

  if (
    !snapshotUnknown ||
    typeof snapshotUnknown !== "object" ||
    Array.isArray(snapshotUnknown)
  ) {
    return failure("SETTLEMENT_RECEIPT_SNAPSHOT_REQUIRED");
  }

  const snapshot =
    snapshotUnknown as Record<string, unknown>;

  if (
    asCents(snapshot.previousOutstanding) !== previous ||
    asCents(snapshot.remainingOutstanding) !== remaining ||
    asCents(snapshot.amountReceived) !== cash ||
    asCents(snapshot.penaltyReceived) !== penalty ||
    asCents(snapshot.discountAmount) !== discount
  ) {
    return failure("SETTLEMENT_RECEIPT_TOTALS_MISMATCH");
  }


  // PAISARULE_C125_R245
  // This endpoint is exclusively for Manual Collection.
  // Selected EMI settlements need their own validated contract.
  const selectedUnknown =
    collectionData.selectedEmiNumbers;

  const snapshotSelectedUnknown =
    snapshot.selectedEmiNumbers;

  if (
    !Array.isArray(selectedUnknown) ||
    selectedUnknown.length !== 0 ||
    !Array.isArray(snapshotSelectedUnknown) ||
    snapshotSelectedUnknown.length !== 0
  ) {
    return failure("SETTLEMENT_MANUAL_MODE_ONLY");
  }

  // Receipt must contain a verified schedule snapshot.
  // Missing or invalid schedule evidence cannot be treated
  // as a successful financial settlement.
  if (
    snapshot.version !== 1 ||
    snapshot.scheduleAvailable !== true ||
    typeof snapshot.totalEmis !== "number" ||
    !Number.isSafeInteger(snapshot.totalEmis) ||
    snapshot.totalEmis <= 0
  ) {
    return failure(
      "SETTLEMENT_AUTHORITATIVE_RECEIPT_SCHEDULE_REQUIRED",
    );
  }
  // PAISARULE_C125_R244
  // Strict, independent EMI-wise Penalty-First reconciliation.
  // No native USB write occurs before these checks pass.
  //
  // Only a single unambiguous schedule representation is allowed.
  // Unsupported legacy/interest-only/discount transformations
  // fail closed until explicitly verified.
  const scheduleKeys = [
    "schedule",
    "emiSchedule",
    "installments",
  ] as const;

  const scheduleMatches = scheduleKeys.filter(
    (key) =>
      Array.isArray(originalLoan[key]) &&
      Array.isArray(loanData[key]),
  );

  if (scheduleMatches.length !== 1) {
    return failure("SETTLEMENT_SCHEDULE_AMBIGUOUS_OR_MISSING");
  }

  const scheduleKey = scheduleMatches[0];

  const previousRows =
    originalLoan[scheduleKey] as unknown[];

  const nextRows =
    loanData[scheduleKey] as unknown[];

  if (
    previousRows.length === 0 ||
    previousRows.length !== nextRows.length
  ) {
    return failure("SETTLEMENT_SCHEDULE_LENGTH_MISMATCH");
  }

  const readRow = (
    value: unknown,
  ): Record<string, unknown> | null => {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      return null;
    }

    return value as Record<string, unknown>;
  };

  const numberOf = (
    row: Record<string, unknown>,
  ): number | null => {
    const value = row.installmentNumber;

    return (
      typeof value === "number" &&
      Number.isSafeInteger(value) &&
      value > 0
    )
      ? value
      : null;
  };

  const previousByNumber =
    new Map<number, Record<string, unknown>>();

  const nextByNumber =
    new Map<number, Record<string, unknown>>();

  for (const rowUnknown of previousRows) {
    const row = readRow(rowUnknown);
    const number = row ? numberOf(row) : null;

    if (
      !row ||
      number === null ||
      previousByNumber.has(number)
    ) {
      return failure("SETTLEMENT_PREVIOUS_EMI_ID_INVALID");
    }

    previousByNumber.set(number, row);
  }

  for (const rowUnknown of nextRows) {
    const row = readRow(rowUnknown);
    const number = row ? numberOf(row) : null;

    if (
      !row ||
      number === null ||
      nextByNumber.has(number)
    ) {
      return failure("SETTLEMENT_NEXT_EMI_ID_INVALID");
    }

    nextByNumber.set(number, row);
  }

  // This strict version excludes discount/waiver reshaping.
  // Do not silently accept an allocation we cannot prove.
  if (discount !== 0) {
    return failure("SETTLEMENT_DISCOUNT_NATIVE_SUPPORT_PENDING");
  }

  let availableEmiCash = cash - principal;
  let verifiedPenalty = 0;
  let verifiedEmi = 0;

  const numbers = [...previousByNumber.keys()].sort(
    (left, right) => left - right,
  );

  for (const number of numbers) {
    const before = previousByNumber.get(number);
    const after = nextByNumber.get(number);

    if (!before || !after) {
      return failure("SETTLEMENT_EMI_ID_CHANGED");
    }

    const requiredAmount =
      asCents(before.installmentAmount);

    const nextRequiredAmount =
      asCents(after.installmentAmount);

    const paidBefore = asCents(before.paidAmount ?? 0);
    const paidAfter = asCents(after.paidAmount ?? 0);

    const waivedBefore = asCents(before.waivedAmount ?? 0);
    const waivedAfter = asCents(after.waivedAmount ?? 0);

    const assessedBefore =
      asCents(before.penaltyAmount ?? 0);

    const assessedAfter =
      asCents(after.penaltyAmount ?? 0);

    // Never assume old assessed penalties were already paid.
    const paidEvidencePresent =
      before.penaltyPaidAmount !== undefined;

    const waivedEvidencePresent =
      before.penaltyWaivedAmount !== undefined;

    if (
      assessedBefore !== null &&
      assessedBefore > 0 &&
      (!paidEvidencePresent || !waivedEvidencePresent)
    ) {
      return failure("SETTLEMENT_LEGACY_PENALTY_EVIDENCE_MISSING");
    }

    const penaltyPaidBefore =
      asCents(before.penaltyPaidAmount ?? 0);

    const penaltyPaidAfter =
      asCents(after.penaltyPaidAmount ?? 0);

    const penaltyWaivedBefore =
      asCents(before.penaltyWaivedAmount ?? 0);

    const penaltyWaivedAfter =
      asCents(after.penaltyWaivedAmount ?? 0);

    const amounts = [
      requiredAmount,
      nextRequiredAmount,
      paidBefore,
      paidAfter,
      waivedBefore,
      waivedAfter,
      assessedBefore,
      assessedAfter,
      penaltyPaidBefore,
      penaltyPaidAfter,
      penaltyWaivedBefore,
      penaltyWaivedAfter,
    ];

    if (amounts.some((value) => value === null)) {
      return failure("SETTLEMENT_EMI_AMOUNT_INVALID");
    }

    // Convert nullable values after explicit validation.
    const required = requiredAmount as number;
    const nextRequired = nextRequiredAmount as number;
    const oldPaid = paidBefore as number;
    const newPaid = paidAfter as number;
    const oldWaived = waivedBefore as number;
    const newWaived = waivedAfter as number;
    const assessed = assessedBefore as number;
    const nextAssessed = assessedAfter as number;
    const oldPenaltyPaid = penaltyPaidBefore as number;
    const newPenaltyPaid = penaltyPaidAfter as number;
    const oldPenaltyWaived = penaltyWaivedBefore as number;
    const newPenaltyWaived = penaltyWaivedAfter as number;

    if (
      required !== nextRequired ||
      assessed !== nextAssessed ||
      oldWaived !== newWaived ||
      oldPenaltyWaived !== newPenaltyWaived ||
      oldPaid + oldWaived > required ||
      oldPenaltyPaid + oldPenaltyWaived > assessed ||
      newPaid < oldPaid ||
      newPenaltyPaid < oldPenaltyPaid
    ) {
      return failure("SETTLEMENT_EMI_BASELINE_CHANGED");
    }

    const penaltyDue =
      assessed - oldPenaltyPaid - oldPenaltyWaived;

    const emiDue =
      required - oldPaid - oldWaived;

    const expectedPenalty =
      Math.min(availableEmiCash, penaltyDue);

    availableEmiCash -= expectedPenalty;

    // EMI becomes payable only after this row's penalty
    // is fully covered.
    const expectedEmi =
      expectedPenalty === penaltyDue
        ? Math.min(availableEmiCash, emiDue)
        : 0;

    availableEmiCash -= expectedEmi;

    if (
      newPenaltyPaid - oldPenaltyPaid !== expectedPenalty ||
      newPaid - oldPaid !== expectedEmi
    ) {
      return failure("SETTLEMENT_PENALTY_FIRST_ORDER_MISMATCH");
    }

    verifiedPenalty += expectedPenalty;
    verifiedEmi += expectedEmi;
  }

  if (
    availableEmiCash !== 0 ||
    verifiedPenalty !== penalty ||
    verifiedPenalty + verifiedEmi + principal !== cash
  ) {
    return failure("SETTLEMENT_EMI_CASH_RECONCILIATION_FAILED");
  }
  // PAISARULE_C125_R247
  // Receipt EMI evidence must exactly match the proposed
  // post-settlement Loan schedule before USB publication.
  const snapshotRowsUnknown = snapshot.installments;

  if (
    !Array.isArray(snapshotRowsUnknown) ||
    snapshotRowsUnknown.length !== nextRows.length ||
    snapshot.totalEmis !== nextRows.length
  ) {
    return failure("SETTLEMENT_RECEIPT_EMI_COUNT_MISMATCH");
  }

  const receiptByNumber =
    new Map<number, Record<string, unknown>>();

  for (const value of snapshotRowsUnknown) {
    const row = readRow(value);

    if (!row) {
      return failure("SETTLEMENT_RECEIPT_EMI_ROW_INVALID");
    }

    const number = row.number;

    if (
      typeof number !== "number" ||
      !Number.isSafeInteger(number) ||
      number <= 0 ||
      receiptByNumber.has(number)
    ) {
      return failure("SETTLEMENT_RECEIPT_EMI_NUMBER_INVALID");
    }

    receiptByNumber.set(number, row);
  }

  const paidReceiptStatuses = new Set([
    "paid",
    "overdue paid",
    "preclosed",
  ]);

  let remainingReceiptEmis = 0;

  for (const [number, loanRow] of nextByNumber) {
    const receiptRow = receiptByNumber.get(number);

    if (!receiptRow) {
      return failure("SETTLEMENT_RECEIPT_EMI_NOT_FOUND");
    }

    const loanStatus =
      typeof loanRow.status === "string"
        ? loanRow.status.trim().toLowerCase()
        : "";

    const receiptStatus =
      typeof receiptRow.status === "string"
        ? receiptRow.status.trim().toLowerCase()
        : "";

    const loanDate =
      typeof loanRow.dueDate === "string"
        ? loanRow.dueDate.trim()
        : "";

    const receiptDate =
      typeof receiptRow.dueDate === "string"
        ? receiptRow.dueDate.trim()
        : "";

    if (
      !loanStatus ||
      !loanDate ||
      receiptStatus !== loanStatus ||
      receiptDate !== loanDate
    ) {
      return failure("SETTLEMENT_RECEIPT_EMI_DETAILS_MISMATCH");
    }

    const amountFields = [
      ["amount", "installmentAmount"],
      ["paidAmount", "paidAmount"],
      ["waivedAmount", "waivedAmount"],
      ["penaltyAmount", "penaltyAmount"],
    ] as const;

    for (const [receiptKey, loanKey] of amountFields) {
      const receiptValue = asCents(
        receiptRow[receiptKey],
      );

      const loanValue = asCents(
        loanRow[loanKey] ?? (
          loanKey === "waivedAmount" ||
          loanKey === "penaltyAmount"
            ? 0
            : undefined
        ),
      );

      if (
        receiptValue === null ||
        loanValue === null ||
        receiptValue !== loanValue
      ) {
        return failure(
          "SETTLEMENT_RECEIPT_EMI_AMOUNT_MISMATCH",
        );
      }
    }

    // Preserve missing historical paid/waived evidence as
    // missing. Never silently convert it into zero evidence.
    const optionalPenaltyFields = [
      "penaltyPaidAmount",
      "penaltyWaivedAmount",
    ] as const;

    for (const key of optionalPenaltyFields) {
      const receiptHas =
        Object.prototype.hasOwnProperty.call(
          receiptRow,
          key,
        );

      const loanHas =
        Object.prototype.hasOwnProperty.call(
          loanRow,
          key,
        );

      if (receiptHas !== loanHas) {
        return failure(
          "SETTLEMENT_RECEIPT_PENALTY_EVIDENCE_MISMATCH",
        );
      }

      if (receiptHas) {
        const receiptValue = asCents(receiptRow[key]);
        const loanValue = asCents(loanRow[key]);

        if (
          receiptValue === null ||
          loanValue === null ||
          receiptValue !== loanValue
        ) {
          return failure(
            "SETTLEMENT_RECEIPT_PENALTY_EVIDENCE_MISMATCH",
          );
        }
      }
    }

    if (!paidReceiptStatuses.has(loanStatus)) {
      remainingReceiptEmis += 1;
    }
  }

  if (
    snapshot.remainingEmis !== remainingReceiptEmis ||
    receiptByNumber.size !== nextByNumber.size
  ) {
    return failure(
      "SETTLEMENT_RECEIPT_REMAINING_EMIS_MISMATCH",
    );
  }
  // PAISARULE_C125_R248
  // Reject contradictory identity and scope metadata before
  // the native USB package is opened for settlement.
  // IMPORTANT: options must still originate from authenticated
  // native session authority when IPC is introduced.
  const scopePairs = [
    ["ownerId", options?.ownerId],
    ["businessId", options?.businessId],
    ["branchId", options?.branchId],
  ] as const;

  const scopeMatches = (
    record: Record<string, unknown>,
  ): boolean =>
    scopePairs.every(([key, expected]) => {
      if (
        !Object.prototype.hasOwnProperty.call(record, key)
      ) {
        return true;
      }

      return (
        typeof record[key] === "string" &&
        record[key] === expected
      );
    });

  if (
    !scopeMatches(loan) ||
    !scopeMatches(loanData) ||
    !scopeMatches(collection) ||
    !scopeMatches(collectionData) ||
    !scopeMatches(originalLoan)
  ) {
    return failure("SETTLEMENT_TENANT_IDENTITY_MISMATCH");
  }

  const embeddedReceipt =
    collectionData.receiptNumber;

  const outerReceipt =
    collection.receiptNumber;

  if (
    typeof embeddedReceipt !== "string" ||
    !embeddedReceipt.trim() ||
    embeddedReceipt.trim() !== receiptNumber ||
    (
      outerReceipt !== undefined &&
      outerReceipt !== embeddedReceipt
    )
  ) {
    return failure("SETTLEMENT_RECEIPT_IDENTITY_MISMATCH");
  }

  if (
    typeof collectionData.receiptDate !== "string" ||
    !collectionData.receiptDate.trim()
  ) {
    return failure("SETTLEMENT_BUSINESS_DATE_REQUIRED");
  }

  if (
    collectionData.status !== "Approved" ||
    collection.entity !== "COLLECTION" ||
    loan.entity !== "LOAN"
  ) {
    return failure("SETTLEMENT_RECORD_STATE_INVALID");
  }
  const usbRoot = await findFinoraUsbRoot();

  if (!usbRoot) {
    return failure("PAISARULE USB is disconnected.");
  }

  try {
    const storagePackage = await readStoragePackage(usbRoot);

    const sameScope = (item: PersistedStorageRecord): boolean =>
      item.ownerId === options?.ownerId &&
      item.businessId === options?.businessId &&
      item.branchId === options?.branchId &&
      item.demoId === options?.demoId;

    const matchingLoans = storagePackage.records.filter(
      (item) =>
        item.entity === "LOAN" &&
        item.id === loanId &&
        sameScope(item),
    );

    if (matchingLoans.length !== 1) {
      return failure("Authoritative Loan must exist exactly once.");
    }

    const existingLoan = matchingLoans[0];

    // PAISARULE_C125_R249
    // Recognize only an EXACT already-committed retry.
    // Never publish the same financial event a second time.
    const priorCollectionIds = storagePackage.records.filter(
      (item) =>
        item.entity === "COLLECTION" &&
        item.id === collectionId,
    );

    if (priorCollectionIds.length > 0) {
      if (
        priorCollectionIds.length !== 1 ||
        !sameScope(priorCollectionIds[0])
      ) {
        return failure(
          "SETTLEMENT_COLLECTION_ID_COLLISION_REVIEW_REQUIRED",
        );
      }

      const priorCollection = priorCollectionIds[0];

      const sameCollection =
        JSON.stringify(priorCollection.data) ===
        JSON.stringify(collection.data ?? collection);

      const sameLoanAfterCommit =
        JSON.stringify(existingLoan.data) ===
        JSON.stringify(loan.data ?? loan);

      const priorData =
        priorCollection.data as Record<string, unknown> | null;

      const sameReceipt =
        priorData !== null &&
        typeof priorData === "object" &&
        !Array.isArray(priorData) &&
        String(priorData.receiptNumber ?? "").trim() ===
          receiptNumber;

      if (
        !sameCollection ||
        !sameLoanAfterCommit ||
        !sameReceipt
      ) {
        return failure(
          "SETTLEMENT_RETRY_STATE_MISMATCH_REVIEW_REQUIRED",
        );
      }

      const matchingReceiptRecords =
        storagePackage.records.filter(
          (item) => {
            if (
              item.entity !== "COLLECTION" ||
              !sameScope(item)
            ) {
              return false;
            }

            const value =
              item.data as Record<string, unknown> | null;

            return (
              value !== null &&
              typeof value === "object" &&
              !Array.isArray(value) &&
              String(value.receiptNumber ?? "").trim() ===
                receiptNumber
            );
          },
        );

      if (
        matchingReceiptRecords.length !== 1 ||
        matchingReceiptRecords[0].id !== collectionId
      ) {
        return failure(
          "SETTLEMENT_RETRY_RECEIPT_COLLISION_REVIEW_REQUIRED",
        );
      }

      // No USB write. Return the already-persisted result.
      return success({
        collectionId,
        receiptNumber,
        loanId,
        committed: true,
        alreadyCommitted: true,
      });
    }

    if (
      JSON.stringify(existingLoan.data) !==
      JSON.stringify(expectedLoanData)
    ) {
      return failure("LOAN_STATE_CHANGED_RETRY_REQUIRES_REVIEW");
    }

    const duplicateId = storagePackage.records.some(
      (item) =>
        item.entity === "COLLECTION" &&
        item.id === collectionId,
    );

    if (duplicateId) {
      return failure("COLLECTION_ID_ALREADY_USED_REVIEW_REQUIRED");
    }

    const duplicateReceipt = storagePackage.records.some(
      (item) => {
        if (item.entity !== "COLLECTION" || !sameScope(item)) {
          return false;
        }

        const data = item.data as Record<string, unknown> | null;

        return (
          data !== null &&
          typeof data === "object" &&
          String(data.receiptNumber ?? "").trim() ===
            receiptNumber
        );
      },
    );

    if (duplicateReceipt) {
      return failure("COLLECTION_RECEIPT_ALREADY_USED");
    }

    const now = new Date().toISOString();

    const loanIndex = storagePackage.records.indexOf(
      existingLoan,
    );

    storagePackage.records[loanIndex] = {
      ...existingLoan,
      data: loan.data ?? loan,
      updatedAt: now,
    };

    const preparedCollection: PersistedStorageRecord = {
      id: collectionId,
      entity: "COLLECTION",
      data: collection.data ?? collection,
      createdAt:
        typeof collection.createdAt === "string"
          ? collection.createdAt
          : now,
      updatedAt: now,
      ownerId: options?.ownerId,
      businessId: options?.businessId,
      branchId: options?.branchId,
      demoId: options?.demoId,
    };

    storagePackage.records.push(preparedCollection);

    // One package publication contains both changes.
    await writeStoragePackage(usbRoot, storagePackage);

    const verified = await readStoragePackage(usbRoot);

    const verifiedLoan = verified.records.filter(
      (item) =>
        item.entity === "LOAN" &&
        item.id === loanId &&
        sameScope(item),
    );

    const verifiedCollection = verified.records.filter(
      (item) =>
        item.entity === "COLLECTION" &&
        item.id === collectionId &&
        sameScope(item),
    );

    // PAISARULE_C125_R250
    // The published package must contain exactly one identity
    // and one receipt for the committed financial event.
    // If verification fails, the outcome remains UNCERTAIN.
    // Never automatically create another transaction.
    const publishedCollectionIds =
      verified.records.filter(
        (item) =>
          item.entity === "COLLECTION" &&
          item.id === collectionId,
      );

    const publishedReceipts =
      verified.records.filter((item) => {
        if (
          item.entity !== "COLLECTION" ||
          !sameScope(item)
        ) {
          return false;
        }

        const value =
          item.data as Record<string, unknown> | null;

        return (
          value !== null &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          String(value.receiptNumber ?? "").trim() ===
            receiptNumber
        );
      });

    const publishedCollection =
      verifiedCollection.length === 1
        ? verifiedCollection[0]
        : undefined;

    if (
      verified.records.length !== storagePackage.records.length ||
      publishedCollectionIds.length !== 1 ||
      publishedReceipts.length !== 1 ||
      !publishedCollection ||
      publishedCollection.id !== collectionId ||
      publishedCollection.entity !== "COLLECTION" ||
      publishedCollection.createdAt !==
        preparedCollection.createdAt ||
      publishedCollection.updatedAt !==
        preparedCollection.updatedAt ||
      publishedCollection.ownerId !== options?.ownerId ||
      publishedCollection.businessId !== options?.businessId ||
      publishedCollection.branchId !== options?.branchId ||
      publishedCollection.demoId !== options?.demoId
    ) {
      return failure(
        "SETTLEMENT_POST_COMMIT_INTEGRITY_UNCERTAIN_REVIEW_REQUIRED",
      );
    }
    if (
      verifiedLoan.length !== 1 ||
      verifiedCollection.length !== 1 ||
      JSON.stringify(verifiedLoan[0].data) !==
        JSON.stringify(loan.data ?? loan) ||
      JSON.stringify(verifiedCollection[0].data) !==
        JSON.stringify(collection.data ?? collection)
    ) {
      return failure("SETTLEMENT_OUTCOME_UNCERTAIN_REVIEW_REQUIRED");
    }

    return success({
      collectionId,
      receiptNumber,
      loanId,
      committed: true,
    });
  } catch {
    invalidateUsbRootCache();

    // A failed response does not prove publication failed.
    // Never automatically retry with a new Collection ID.
    return failure("SETTLEMENT_OUTCOME_UNCERTAIN_REVIEW_REQUIRED");
  }
}

// Internal locked wrapper. No renderer IPC exposure.
export function prepareNativeAtomicCollectionCommit(
  ...args: Parameters<
    typeof handleUsbAtomicCollectionSettlementUnlocked
  >
): ReturnType<
  typeof handleUsbAtomicCollectionSettlementUnlocked
> {
  return serializeFinoraUsbMutation(() =>
    withFinoraUsbExclusiveMutationLock(() =>
      handleUsbAtomicCollectionSettlementUnlocked(...args)
    )
  );
}
async function handleUsbUpdateUnlocked(
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
    return failure("PAISARULE USB is disconnected.");
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

async function handleUsbDeleteUnlocked(query: StorageQuery) {
  const queryError = validateQuery(query);

  if (queryError) {
    return failure(queryError);
  }

  const usbRoot = await findFinoraUsbRoot();

  if (!usbRoot) {
    return failure("PAISARULE USB is disconnected.");
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

async function handleUsbReplaceAllUnlocked(
  records: unknown[],

  options?: StorageWriteOptions,
) {
  if (!Array.isArray(records)) {
    return failure("Storage records must be an array.");
  }

  const usbRoot = await findFinoraUsbRoot();

  if (!usbRoot) {
    return failure("PAISARULE USB is disconnected.");
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

async function handleUsbClearUnlocked(query: StorageQuery) {
  const queryError = validateQuery(query);

  if (queryError) {
    return failure(queryError);
  }

  const usbRoot = await findFinoraUsbRoot();

  if (!usbRoot) {
    return failure("PAISARULE USB is disconnected.");
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
    return failure("PAISARULE USB is disconnected.");
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

// FINORA_P1_731U_USB_EXCLUSIVE_LOCK
// Windows Electron process coordination only.
// Lock file is intentionally never auto-reclaimed after a crash.
// An abandoned lock requires a separate verified recovery procedure.
async function withFinoraUsbExclusiveMutationLock<T>(
  operation: () => Promise<T>,
): Promise<T> {
  const usbRoot = await findFinoraUsbRoot();
  if (!usbRoot) {
    throw new Error("FINORA_USB_NOT_CONNECTED");
  }

  // PAISARULE_C117_R245_DUAL_LOCK
  //
  // Stable lock remains outside the storage folder so a
  // future folder Restore can rename storage safely.
  //
  // Legacy lock remains mandatory for existing writers.
  // Acquire stable first, legacy second, always same order.
  const branchDirectory = path.join(usbRoot, "FINORA");
  const storageDirectory = getFinoraStorageDirectory(usbRoot);

  const stableLockPath = path.join(
    branchDirectory,
    ".paisarule-storage-mutation.lock",
  );

  const legacyLockPath = path.join(
    storageDirectory,
    ".finora-usb-mutation.lock",
  );

  // Do not create missing business storage or authentication
  // directories just to obtain a lock.
  const stableHandle = await fs.open(
    stableLockPath,
    "wx",
  ).catch(() => {
    throw new Error("PAISARULE_STABLE_MUTATION_LOCK_UNAVAILABLE");
  });

  let legacyHandle: Awaited<ReturnType<typeof fs.open>> | null = null;

  try {
    legacyHandle = await fs.open(
      legacyLockPath,
      "wx",
    ).catch(() => {
      throw new Error("FINORA_USB_MUTATION_LOCK_UNAVAILABLE");
    });

    return await operation();
  } finally {
    try {
      if (legacyHandle) {
        try {
          await legacyHandle.close();
        } finally {
          // Never remove a lock that this invocation did not own.
          await fs.unlink(legacyLockPath);
        }
      }
    } finally {
      try {
        await stableHandle.close();
      } finally {
        await fs.unlink(stableLockPath);
      }
    }
  }
}
// FINORA_P1_731C_USB_MUTATION_QUEUE
// Serialize USB CRUD mutations within this Electron process.
// Does not claim a cross-process or cross-device filesystem lock.
let finoraUsbMutationTail: Promise<void> = Promise.resolve();

function serializeFinoraUsbMutation<T>(
  operation: () => Promise<T>,
): Promise<T> {
  const result = finoraUsbMutationTail.then(operation);
  finoraUsbMutationTail = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

/**
 * PAISARULE_C117_R247_RESTORE_LOCK
 *
 * Native-only Restore exclusion adapter.
 * Shares the normal mutation queue and stable lock.
 * Does not acquire a legacy lock inside the folder being renamed.
 *
 * Not connected to any Restore IPC handler yet.
 */
async function withPaisaruleRestoreStorageExclusion<T>(
  expectedBranchRoot: string,
  operation: () => Promise<T>,
): Promise<T> {
  if (
    process.platform !== "win32" ||
    typeof expectedBranchRoot !== "string" ||
    !/^[A-Za-z]:\\/.test(expectedBranchRoot) ||
    typeof operation !== "function"
  ) {
    throw new Error("PAISARULE_RESTORE_LOCK_INPUT_INVALID");
  }

  return serializeFinoraUsbMutation(async () => {
    const activeRoot = await findFinoraUsbRoot();

    if (
      !activeRoot ||
      path.win32.resolve(activeRoot).toLowerCase() !==
        path.win32.resolve(expectedBranchRoot).toLowerCase()
    ) {
      throw new Error("PAISARULE_RESTORE_BRANCH_CHANGED");
    }

    const branchDirectory = path.join(activeRoot, "FINORA");
    const storageDirectory = getFinoraStorageDirectory(activeRoot);

    // Never create directories simply to acquire a Restore lock.
    const branchStat = await fs.lstat(branchDirectory);
    const storageStat = await fs.lstat(storageDirectory);

    if (
      !branchStat.isDirectory() ||
      branchStat.isSymbolicLink() ||
      !storageStat.isDirectory() ||
      storageStat.isSymbolicLink()
    ) {
      throw new Error("PAISARULE_RESTORE_LOCK_FOLDER_INVALID");
    }

    const stablePath = path.join(
      branchDirectory,
      ".paisarule-storage-mutation.lock",
    );
    const legacyPath = path.join(
      storageDirectory,
      ".finora-usb-mutation.lock",
    );

    const handle = await fs.open(stablePath, "wx").catch(() => {
      throw new Error("PAISARULE_RESTORE_STABLE_LOCK_UNAVAILABLE");
    });

    try {
      // Reject an existing legacy writer, including an older
      // Electron instance which does not know the stable lock.
      try {
        await fs.lstat(legacyPath);
      } catch (error) {
        if (
          error !== null &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "ENOENT"
        ) {
          // Legacy lock absent at the time of this check.
        } else {
          throw new Error("PAISARULE_RESTORE_LEGACY_LOCK_CHECK_FAILED");
        }
      }

      // lstat success must be rejected, not treated as safe.
      const legacyExists = await fs.lstat(legacyPath).then(
        () => true,
        (error: unknown) => {
          if (
            error !== null &&
            typeof error === "object" &&
            "code" in error &&
            error.code === "ENOENT"
          ) {
            return false;
          }
          throw new Error("PAISARULE_RESTORE_LEGACY_LOCK_CHECK_FAILED");
        },
      );

      if (legacyExists) {
        throw new Error("PAISARULE_RESTORE_LEGACY_LOCK_ACTIVE");
      }

      const freshRoot = await findFinoraUsbRoot();
      if (
        !freshRoot ||
        path.win32.resolve(freshRoot).toLowerCase() !==
          path.win32.resolve(expectedBranchRoot).toLowerCase()
      ) {
        throw new Error("PAISARULE_RESTORE_BRANCH_CHANGED");
      }

      return await operation();
    } finally {
      try {
        await handle.close();
      } finally {
        await fs.unlink(stablePath);
      }
    }
  });
}

function handleUsbSave(
  ...args: Parameters<typeof handleUsbSaveUnlocked>
): ReturnType<typeof handleUsbSaveUnlocked> {
  return serializeFinoraUsbMutation(() =>
    withFinoraUsbExclusiveMutationLock(() =>
      handleUsbSaveUnlocked(...args)
    )
  );
}

function handleUsbUpdate(
  ...args: Parameters<typeof handleUsbUpdateUnlocked>
): ReturnType<typeof handleUsbUpdateUnlocked> {
  return serializeFinoraUsbMutation(() =>
    withFinoraUsbExclusiveMutationLock(() =>
      handleUsbUpdateUnlocked(...args)
    )
  );
}

function handleUsbDelete(
  ...args: Parameters<typeof handleUsbDeleteUnlocked>
): ReturnType<typeof handleUsbDeleteUnlocked> {
  return serializeFinoraUsbMutation(() =>
    withFinoraUsbExclusiveMutationLock(() =>
      handleUsbDeleteUnlocked(...args)
    )
  );
}

function handleUsbReplaceAll(
  ...args: Parameters<typeof handleUsbReplaceAllUnlocked>
): ReturnType<typeof handleUsbReplaceAllUnlocked> {
  return serializeFinoraUsbMutation(() =>
    withFinoraUsbExclusiveMutationLock(() =>
      handleUsbReplaceAllUnlocked(...args)
    )
  );
}

function handleUsbClear(
  ...args: Parameters<typeof handleUsbClearUnlocked>
): ReturnType<typeof handleUsbClearUnlocked> {
  return serializeFinoraUsbMutation(() =>
    withFinoraUsbExclusiveMutationLock(() =>
      handleUsbClearUnlocked(...args)
    )
  );
}

function registerUsbStorageHandlers(): void {
  if (handlersRegistered) {
    return;
  }

  handlersRegistered = true;

  // FINORA_C80_B5_SAVED_OWNER_LIST
  // Only the exact FINORA Owner main window can list local account labels.
  // No passwords, tokens or session material are returned.
  ipcMain.handle(
    "finora:saved-owner-login:list",
    async (event) => {
      if (
        process.platform !== "win32" ||
        !mainWindow ||
        mainWindow.isDestroyed() ||
        event.sender !== mainWindow.webContents ||
        !event.senderFrame ||
        event.senderFrame !== event.sender.mainFrame ||
        !isTrustedRenderer(event.senderFrame) ||
        event.sender.isDestroyed()
      ) {
        return {
          success: false as const,
          errorCode: "UNAUTHORIZED_RENDERER",
        };
      }

      try {
        const accounts = await listSavedOwnerLogins();

        return {
          success: true as const,
          accounts,
        };
      } catch {
        return {
          success: false as const,
          errorCode: "SAVED_LOGIN_VAULT_UNAVAILABLE",
        };
      }
    },
  );

  // FINORA_C80_B11_REMOVE_OWNER
  // Deletes one device-local saved credential only.
  // Never revokes the authenticated Owner account or business session.
  ipcMain.handle(
    "finora:saved-owner-login:remove",
    async (event, input: unknown) => {
      const deny = (errorCode: string) => ({
        success: false as const,
        errorCode,
      });

      if (
        process.platform !== "win32" ||
        !mainWindow ||
        mainWindow.isDestroyed() ||
        event.sender !== mainWindow.webContents ||
        !event.senderFrame ||
        event.senderFrame !== event.sender.mainFrame ||
        !isTrustedRenderer(event.senderFrame) ||
        event.sender.isDestroyed()
      ) {
        return deny("UNAUTHORIZED_RENDERER");
      }

      if (
        !input ||
        typeof input !== "object" ||
        Array.isArray(input) ||
        Object.keys(input).length !== 1
      ) {
        return deny("INVALID_REQUEST");
      }

      const id = (input as { id?: unknown }).id;

      if (
        typeof id !== "string" ||
        !/^[a-f0-9]{64}$/.test(id)
      ) {
        return deny("INVALID_ACCOUNT_ID");
      }

      try {
        const removed = await removeSavedOwnerLogin(id);

        return {
          success: true as const,
          removed,
        };
      } catch {
        return deny("SAVED_LOGIN_VAULT_UNAVAILABLE");
      }
    },
  );
  // FINORA_C80_B10_SELECT_OWNER
  // Password retrieval is restricted to the trusted Owner main frame.
  // Explicit account selection in the UI is required before invocation.
  // Retrieval does NOT establish any authenticated business session.
  ipcMain.handle(
    "finora:saved-owner-login:select",
    async (event, input: unknown) => {
      const deny = (errorCode: string) => ({
        success: false as const,
        errorCode,
      });

      if (
        process.platform !== "win32" ||
        !mainWindow ||
        mainWindow.isDestroyed() ||
        event.sender !== mainWindow.webContents ||
        !event.senderFrame ||
        event.senderFrame !== event.sender.mainFrame ||
        !isTrustedRenderer(event.senderFrame) ||
        event.sender.isDestroyed()
      ) {
        return deny("UNAUTHORIZED_RENDERER");
      }

      if (
        !input ||
        typeof input !== "object" ||
        Array.isArray(input) ||
        Object.keys(input).length !== 1
      ) {
        return deny("INVALID_REQUEST");
      }

      const id = (input as { id?: unknown }).id;

      if (
        typeof id !== "string" ||
        !/^[a-f0-9]{64}$/.test(id)
      ) {
        return deny("INVALID_ACCOUNT_ID");
      }

      try {
        const record = await getSavedOwnerLogin(id);

        if (!record) {
          return deny("SAVED_ACCOUNT_NOT_FOUND");
        }

        return {
          success: true as const,
          username: record.username,
          password: record.password,
          branchId: record.branchId,
          ownerId: record.ownerId,
        };
      } catch {
        return deny("SAVED_LOGIN_VAULT_UNAVAILABLE");
      }
    },
  );
  // FINORA_C80_B8_SAVE_OWNER_LOGIN
  // Only a committed, freshly verified Owner session may save credentials.
  // Renderer-provided tenant identity and display labels are never trusted.
  ipcMain.handle(
    "finora:saved-owner-login:save",
    async (event, input: unknown) => {
      const deny = (errorCode: string) => ({
        success: false as const,
        errorCode,
      });

      if (
        process.platform !== "win32" ||
        !mainWindow ||
        mainWindow.isDestroyed() ||
        event.sender !== mainWindow.webContents ||
        !event.senderFrame ||
        event.senderFrame !== event.sender.mainFrame ||
        !isTrustedRenderer(event.senderFrame) ||
        event.sender.isDestroyed()
      ) {
        return deny("UNAUTHORIZED_RENDERER");
      }

      if (
        !input ||
        typeof input !== "object" ||
        Array.isArray(input) ||
        Object.keys(input).length !== 4
      ) {
        return deny("INVALID_REQUEST");
      }

      const request = input as Record<string, unknown>;

      if (
        request.consent !== true ||
        typeof request.sessionId !== "string" ||
        !/^[a-f0-9]{64}$/.test(request.sessionId) ||
        typeof request.username !== "string" ||
        request.username.length < 1 ||
        request.username.length > 256 ||
        typeof request.password !== "string" ||
        request.password.length < 1 ||
        request.password.length > 4096
      ) {
        return deny("INVALID_REQUEST_OR_CONSENT");
      }

      const sender = event.sender;
      const sessionId = request.sessionId;
      const businessSession =
        finoraBusinessSessionsBySender.get(sender);
      const generation =
        finoraAccountBusinessLoginGeneration.get(sender);

      if (!businessSession) {
        return deny("AUTHENTICATED_SESSION_REQUIRED");
      }

      const current = () =>
        !sender.isDestroyed() &&
        finoraBusinessSessionsBySender.get(sender) === businessSession &&
        finoraAccountBusinessLoginGeneration.get(sender) === generation;

      try {
        const [
          {
            getFinoraCommittedReceptionPrincipal,
            validateFinoraServerReceptionSession,
          },
          { verifyFinoraServerBusinessSession },
        ] = await Promise.all([
          import("./control/finoraServerReceptionSessionAuthority.js"),
          import("./control/finoraServerBusinessSessionVerifier.js"),
        ]);

        if (!current()) return deny("LOGIN_CHANGED");

        const committed = getFinoraCommittedReceptionPrincipal(
          sender,
          sessionId,
        );

        if (
          !committed ||
          committed.role !== "OWNER" ||
          committed.storageMode !== "USB" ||
          committed.username !== request.username ||
          !committed.ownerId ||
          !committed.businessId ||
          !committed.branchId
        ) {
          return deny("COMMITTED_OWNER_REQUIRED");
        }

        const validation = await validateFinoraServerReceptionSession(
          sender,
          sessionId,
          verifyFinoraServerBusinessSession,
          businessSession.sessionId,
        );

        if (!validation.success || !current()) {
          return deny("SERVER_SESSION_VERIFICATION_FAILED");
        }

        const verified = validation.principal;

        if (
          verified.userId !== committed.userId ||
          verified.username !== committed.username ||
          verified.ownerId !== committed.ownerId ||
          verified.businessId !== committed.businessId ||
          verified.branchId !== committed.branchId ||
          verified.role !== "OWNER" ||
          verified.storageMode !== "USB"
        ) {
          return deny("PRINCIPAL_MISMATCH");
        }

        const wallet = getFinoraSenderWalletPrincipal(sender);

        if (
          !wallet ||
          !(["userId", "ownerId", "businessId", "branchId"] as const)
            .every((key) => wallet[key] === committed[key])
        ) {
          return deny("WALLET_SCOPE_MISMATCH");
        }

        if (!finoraServerUsbScopeResolver) {
          return deny("USB_SCOPE_UNAVAILABLE");
        }

        const usbScope = await finoraServerUsbScopeResolver(
          sender,
          sessionId,
        );

        if (
          !usbScope.success ||
          !usbScope.scope ||
          usbScope.scope.sessionId !== sessionId ||
          usbScope.scope.ownerId !== committed.ownerId ||
          usbScope.scope.businessId !== committed.businessId ||
          usbScope.scope.branchId !== committed.branchId ||
          usbScope.scope.dataContext !== "REAL" ||
          !current()
        ) {
          return deny("USB_SCOPE_MISMATCH");
        }

        // Recheck the committed session immediately before persistence.
        const finalPrincipal = getFinoraCommittedReceptionPrincipal(
          sender,
          sessionId,
        );

        if (
          !finalPrincipal ||
          finalPrincipal.userId !== committed.userId ||
          finalPrincipal.ownerId !== committed.ownerId ||
          finalPrincipal.businessId !== committed.businessId ||
          finalPrincipal.branchId !== committed.branchId ||
          !current()
        ) {
          return deny("COMMITTED_SESSION_CHANGED");
        }

        // FINORA_C81_A8_AUTHENTICATED_BUSINESS_NAME
        // Use the existing authenticated wallet session only.
        // Never substitute a branch ID or a user-controlled label.
        const labelAuthorization =
          getFinoraSenderWalletAuthorization(sender);

        if (!labelAuthorization) {
          return deny("BUSINESS_NAME_AUTHORIZATION_REQUIRED");
        }

        const labelResponse = await fetch(
          "https://api.finoraenterprise.com/owner/wallet/business-identity",
          {
            method: "GET",
            headers: { Authorization: labelAuthorization },
            cache: "no-store",
            signal: AbortSignal.timeout(8000),
          },
        );

        if (!labelResponse.ok) {
          return deny("BUSINESS_NAME_SERVER_UNAVAILABLE");
        }

        const labelPayload: unknown = await labelResponse.json();

        if (
          !labelPayload ||
          typeof labelPayload !== "object" ||
          Array.isArray(labelPayload)
        ) {
          return deny("BUSINESS_NAME_INVALID_RESPONSE");
        }

        const labelBody = labelPayload as Record<string, unknown>;
        const labelIdentity = labelBody.identity;

        if (
          labelBody.ok !== true ||
          labelBody.source !== "FINORA_POSTGRESQL_BUSINESS_IDENTITY" ||
          !labelIdentity ||
          typeof labelIdentity !== "object" ||
          Array.isArray(labelIdentity)
        ) {
          return deny("BUSINESS_NAME_INVALID_RESPONSE");
        }

        const verifiedIdentity =
          labelIdentity as Record<string, unknown>;

        if (
          verifiedIdentity.ownerId !== committed.ownerId ||
          verifiedIdentity.businessId !== committed.businessId ||
          verifiedIdentity.branchId !== committed.branchId ||
          verifiedIdentity.storageMode !== "USB" ||
          typeof verifiedIdentity.businessName !== "string" ||
          !verifiedIdentity.businessName.trim() ||
          verifiedIdentity.businessName.trim().length > 256 ||
          !current()
        ) {
          return deny("BUSINESS_NAME_SCOPE_MISMATCH");
        }

        const account = await saveOwnerLogin({
          branchId: committed.branchId,
          ownerId: committed.ownerId,
          username: committed.username,
          branchLabel: verifiedIdentity.businessName.trim(),
          password: request.password,
        });

        return {
          success: true as const,
          account,
        };
      } catch {
        // Deliberately never log password, account details or ciphertext.
        return deny("SAVED_LOGIN_UNAVAILABLE");
      }
    },
  );
  // ----------------------------------------------------------
  // AVAILABILITY
  // ----------------------------------------------------------

  // FINORA_R188_B_CLIPBOARD
  // Trusted renderer only; no arbitrary file paths.
  // FINORA_AP04_R039_RECEIPT_PICTURES_SAVE
  // Owner-requested receipt images only. No arbitrary filesystem paths.
  ipcMain.handle(
    "finora:receipt:save-pictures-png",
    async (event, input: unknown) => {
      const fail = (errorCode: string) => ({
        success: false as const,
        errorCode,
      });

      if (
        process.platform !== "win32" ||
        !mainWindow ||
        mainWindow.isDestroyed() ||
        event.sender !== mainWindow.webContents ||
        !event.senderFrame ||
        event.senderFrame !== event.sender.mainFrame ||
        !isTrustedRenderer(event.senderFrame)
      ) {
        return fail("UNTRUSTED_RENDERER");
      }

      if (
        !input ||
        typeof input !== "object" ||
        Array.isArray(input)
      ) {
        return fail("INVALID_RECEIPT_REQUEST");
      }

      const request = input as Record<string, unknown>;
      const receiptType = request.receiptType;
      const fileName = request.fileName;
      const dataBase64 = request.dataBase64;

      if (
        receiptType !== "loan" &&
        receiptType !== "collection"
      ) {
        return fail("INVALID_RECEIPT_TYPE");
      }

      if (
        typeof fileName !== "string" ||
        fileName.length < 5 ||
        fileName.length > 120 ||
        !/^[A-Za-z0-9][A-Za-z0-9_.-]*\.png$/.test(fileName) ||
        fileName.includes("..") ||
        typeof dataBase64 !== "string" ||
        dataBase64.length < 32 ||
        dataBase64.length > 33_554_432 ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(dataBase64)
      ) {
        return fail("INVALID_RECEIPT_PNG_PAYLOAD");
      }

      const bytes = Buffer.from(dataBase64, "base64");

      if (
        bytes.length < 24 ||
        bytes.length > 25_165_824 ||
        !bytes.subarray(0, 8).equals(
          Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        ) ||
        bytes.toString("ascii", 12, 16) !== "IHDR"
      ) {
        return fail("INVALID_RECEIPT_PNG_CONTENT");
      }

      // Validate that PNG data decodes successfully.
      const image = finoraReceiptNativeImage.createFromBuffer(
        bytes,
      );

      if (image.isEmpty()) {
        return fail("RECEIPT_PNG_DECODE_FAILED");
      }

      const album =
        receiptType === "loan"
          ? "Finora Loan Receipts"
          : "Finora Collection Receipts";

      try {
        const picturesPath = app.getPath("pictures");
        const directory = path.join(picturesPath, album);

        await fs.mkdir(directory, { recursive: true });

        const directoryInfo = await fs.lstat(directory);

        if (
          !directoryInfo.isDirectory() ||
          directoryInfo.isSymbolicLink()
        ) {
          return fail("UNSAFE_RECEIPT_FOLDER");
        }

        const baseName = fileName.replace(/\.png$/i, "");

        // Exclusive creation: never overwrite an existing image.
        for (let index = 0; index < 1000; index += 1) {
          const candidate =
            index === 0
              ? `${baseName}.png`
              : `${baseName} (${index}).png`;

          const destination = path.join(directory, candidate);

          try {
            await fs.writeFile(destination, bytes, {
              flag: "wx",
            });

            return {
              success: true as const,
              saved: true as const,
              album,
              fileName: candidate,
            };
          } catch (writeError) {
            const code =
              typeof writeError === "object" &&
              writeError !== null &&
              "code" in writeError
                ? String(writeError.code)
                : "UNKNOWN";

            if (code === "EEXIST") {
              continue;
            }

            return fail(`PNG_WRITE_FAILED_${code}`);
          }
        }

        return fail("PNG_FILENAME_COLLISION_LIMIT");
      } catch (error) {
        const reason =
          error instanceof Error
            ? error.message
            : "UNKNOWN";

        console.error(
          "FINORA RECEIPT PICTURES SAVE ERROR:",
          reason,
        );

        return fail("PICTURES_FOLDER_UNAVAILABLE");
      }
    },
  );
  ipcMain.handle(
    "finora:receipt:copy-png",
    async (event, dataUrl: unknown) => {
      if (!isTrustedRenderer(event.senderFrame)) {
        return {
          ok: false,
          error: "Untrusted renderer.",
        };
      }

      try {
        if (
          typeof dataUrl !== "string" ||
          dataUrl.length > 12_000_000 ||
          !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(dataUrl)
        ) {
          return {
            ok: false,
            error: "Invalid or oversized receipt PNG.",
          };
        }

        const image = finoraReceiptNativeImage.createFromDataURL(
          dataUrl,
        );

        if (image.isEmpty()) {
          return {
            ok: false,
            error: "Could not decode PNG image.",
          };
        }

        finoraReceiptClipboard.writeImage(image);

        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error
            ? error.message
            : "Native clipboard failed.",
        };
      }
    },
  );
  // FINORA_C80_B27_E3_B1_SILENT_PDF_SAVE
  // Owner reports: explicit user-requested WhatsApp PDF handoff.
  // No dialog, no arbitrary destination, no overwrite.
  ipcMain.handle(
    "finora:reports:save-whatsapp-pdf",
    async (event, input: unknown) => {
      const fail = (errorCode: string) => ({
        success: false as const,
        errorCode,
      });

      if (
        process.platform !== "win32" ||
        !mainWindow ||
        mainWindow.isDestroyed() ||
        event.sender !== mainWindow.webContents ||
        !event.senderFrame ||
        event.senderFrame !== event.sender.mainFrame ||
        !isTrustedRenderer(event.senderFrame)
      ) {
        return fail("UNTRUSTED_RENDERER");
      }

      if (!input || typeof input !== "object" || Array.isArray(input)) {
        return fail("INVALID_PDF_REQUEST");
      }

      const request = input as Record<string, unknown>;
      const fileName = request.fileName;
      const dataBase64 = request.dataBase64;

      if (
        typeof fileName !== "string" ||
        fileName.length > 180 ||
        !/^[A-Za-z0-9][A-Za-z0-9_.-]*\.pdf$/i.test(fileName) ||
        fileName.includes("..") ||
        typeof dataBase64 !== "string" ||
        dataBase64.length < 16 ||
        dataBase64.length > 20_000_000 ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(dataBase64)
      ) {
        return fail("INVALID_PDF_PAYLOAD");
      }

      const bytes = Buffer.from(dataBase64, "base64");

      if (
        bytes.length < 16 ||
        bytes.length > 15_000_000 ||
        bytes.subarray(0, 5).toString("ascii") !== "%PDF-"
      ) {
        return fail("INVALID_PDF_CONTENT");
      }

      // Basic PDF trailer check. This is not a PDF signature
      // or a substitute for the authoritative report guards.
      if (!bytes.subarray(-4096).toString("latin1").includes("%%EOF")) {
        return fail("INCOMPLETE_PDF_CONTENT");
      }

      try {
        const fs = await import("node:fs/promises");
        const downloadsPath = app.getPath("downloads");

        const baseName = fileName.replace(/\.pdf$/i, "");

        // 'wx' guarantees an existing PDF cannot be overwritten.
        for (let index = 0; index < 1000; index += 1) {
          const candidate =
            index === 0
              ? `${baseName}.pdf`
              : `${baseName} (${index}).pdf`;

          const destination = path.join(downloadsPath, candidate);

          try {
            await fs.writeFile(destination, bytes, { flag: "wx" });

            return {
              success: true as const,
              fileName: candidate,
            };
          } catch (writeError) {
            const code =
              typeof writeError === "object" &&
              writeError !== null &&
              "code" in writeError
                ? String(writeError.code)
                : "";

            if (code === "EEXIST") {
              continue;
            }

            console.error(
              "FINORA SILENT REPORT PDF SAVE ERROR:",
              code || "UNKNOWN",
            );

            return fail("PDF_WRITE_FAILED");
          }
        }

        return fail("PDF_FILENAME_COLLISION_LIMIT");
      } catch (error) {
        console.error(
          "FINORA REPORT DOWNLOADS ACCESS ERROR:",
          error instanceof Error ? error.message : "UNKNOWN",
        );

        return fail("DOWNLOADS_UNAVAILABLE");
      }
    },
  );

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

  // PAISARULE_C125_R253
  // Authenticated settlement endpoint.
  //
  // DELIBERATELY FAIL-CLOSED:
  // The native settlement core is not approved for financial
  // execution until runtime tests and Android parity pass.
  //
  // Do not invoke prepareNativeAtomicCollectionCommit here.
  ipcMain.handle(
    IPC_CHANNELS.ATOMIC_COLLECTION_SETTLEMENT,
    async (
      event,
      _request: unknown,
      options?: StorageWriteOptions,
    ) => {
      if (!isTrustedRenderer(event.senderFrame)) {
        return failure("Untrusted renderer.");
      }

      const authorization =
        await authorizeFinoraUsbWrite(
          options,
          event.sender,
        );

      if (!authorization.success) {
        return failure(authorization.error);
      }

      return failure(
        "PAISARULE_ATOMIC_SETTLEMENT_NOT_ENABLED",
      );
    },
  );
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

// FINORA_P1_752Q_MODULE_PRIVATE_SENDER_AUTHORITY
// These WeakMaps are Electron Main-only. No renderer access.
// Exact WebContents remains the isolation key.
const finoraBusinessSessionsBySender =
  new WeakMap<object, {
    sessionId: string;
    expiresAt: string;
      principal: {
      userId: string;
      ownerId: string;
      businessId: string;
      branchId: string;
      storageMode: "LOCAL" | "USB";
      role: "OWNER";
    };
  }>();

const finoraAccountBusinessLoginGeneration =
  new WeakMap<object, number>();
function createMainWindow(): void {
  const createdWindow = new BrowserWindow({
    width: 1400,

    height: 900,

    minWidth: 1200,

    minHeight: 700,

    title: "PAISARULE",

    backgroundColor: "#0f172a",

    autoHideMenuBar: true,

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),

      contextIsolation: true,

      nodeIntegration: false,

      sandbox: true,
      devTools: !app.isPackaged,
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

    // FINORA_P1_752R_ACCOUNT_SSO_RECHARGE_SCOPE
    // Recharge alone uses sender-bound, server-verified Account authority.
    // Subscription Purchase retains its independent existing scope.
    const accountRechargeScopeCoordinator =
      createFinoraVerifiedRechargeScopeCoordinator({
        verifiedScope: async () => {
          const fail = (errorCode: string) => ({
            success: false as const,
            errorCode,
          });

          const sender = createdWindow.webContents;
          if (sender.isDestroyed()) return fail("UNAUTHORIZED");

          const business =
            finoraBusinessSessionsBySender.get(sender);

          const generation =
            finoraAccountBusinessLoginGeneration.get(sender);

          const account =
            getFinoraSenderWalletPrincipal(sender);

          if (
            !business ||
            !account ||
            generation === undefined ||
            !Number.isSafeInteger(generation) ||
            generation < 0
          ) return fail("UNAUTHORIZED");

          try {
            const { verifyFinoraServerBusinessSession } =
              await import(
                "./control/finoraServerBusinessSessionVerifier.js"
              );

            const verified =
              await verifyFinoraServerBusinessSession(
                business.sessionId
              );

            if (!verified.success) {
              return fail(verified.errorCode);
            }

            const principal = verified.principal;
            const current =
              getFinoraSenderWalletPrincipal(sender);

            if (
              sender.isDestroyed() ||
              finoraBusinessSessionsBySender.get(sender) !== business ||
              finoraAccountBusinessLoginGeneration.get(sender) !== generation ||
              principal.role !== "OWNER" ||
              principal.userId !== account.userId ||
              principal.ownerId !== account.ownerId ||
              principal.businessId !== account.businessId ||
              principal.branchId !== account.branchId ||
              !current ||
              current.userId !== account.userId ||
              current.ownerId !== account.ownerId ||
              current.businessId !== account.businessId ||
              current.branchId !== account.branchId
            ) return fail("STALE_OPERATION");

            return {
              success: true as const,
              data: {
                ownerId: principal.ownerId,
                businessId: principal.businessId,
                branchId: principal.branchId,
                sessionRevision: generation,
              },
            };
          } catch {
            return fail("SERVER_UNAVAILABLE");
          }
        },

        serverBalance: async () => {
          const sender = createdWindow.webContents;

          const authorization = sender.isDestroyed()
            ? null
            : getFinoraSenderWalletAuthorization(sender);

          if (
            !authorization ||
            !/^Bearer [a-f0-9]{64}$/.test(authorization)
          ) {
            return {
              success: false as const,
              errorCode: "UNAUTHORIZED",
            };
          }

          const { createFinoraServerWalletBalanceClient } =
            await import(
              "./control/finoraServerWalletBalanceClient.js"
            );

          return createFinoraServerWalletBalanceClient()(
            authorization.slice(7)
          );
        },
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
        scopeResolver: accountRechargeScopeCoordinator,
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

    // FINORA_P1_752S_ACCOUNT_SSO_RECHARGE
    // Only called through the trusted Owner IPC sender boundary.
    // Server verifies the Business Session, account identity and Wallet.
    // The encrypted pending UUID wins over renderer retry UUID.
    let accountRechargeBusy = false;

    const submitAccountSSORecharge = async (
      input: unknown,
      sender: typeof createdWindow.webContents,
    ) => {
      const fail = (errorCode: string) => ({
        success: false as const,
        errorCode,
      });

      if (
        accountRechargeBusy ||
        sender !== createdWindow.webContents ||
        sender.isDestroyed()
      ) {
        return fail(
          accountRechargeBusy ? "STALE_OPERATION" : "UNAUTHORIZED"
        );
      }

      if (
        !input ||
        typeof input !== "object" ||
        Array.isArray(input)
      ) return fail("INVALID_REQUEST");

      const request = input as Record<string, unknown>;

      if (
        Object.keys(request).length !== 3 ||
        !Number.isSafeInteger(request.amountInr) ||
        (request.amountInr as number) < 50 ||
        (request.amountInr as number) > 2000 ||
        (request.paymentMethod !== "PHONEPE" &&
          request.paymentMethod !== "GOOGLE_PAY") ||
        typeof request.idempotencyKey !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          request.idempotencyKey
        )
      ) return fail("INVALID_REQUEST");

      accountRechargeBusy = true;

      try {
        const authorization =
          getFinoraSenderWalletAuthorization(sender);

        if (
          !authorization ||
          !/^Bearer [a-f0-9]{64}$/.test(authorization)
        ) return fail("UNAUTHORIZED");

        const before = await accountRechargeScopeCoordinator.resolve();

        if (!before.success) return fail(before.errorCode);

        const requested = {
          amountInr: request.amountInr as number,
          paymentMethod:
            request.paymentMethod as "PHONEPE" | "GOOGLE_PAY",
          idempotencyKey:
            (request.idempotencyKey as string).toLowerCase(),
        };

        // Read encrypted pending intent BEFORE any server POST.
        const previous =
          await authenticatedRechargeIntentCoordinator.verifiedLoad();

        if (!previous.success) return fail(previous.errorCode);

        let intent = previous.data.intent;

        if (intent) {
          if (
            intent.amountInr !== requested.amountInr ||
            intent.paymentMethod !== requested.paymentMethod
          ) {
            // FINORA_P1_753D_CONFLICT_ORIGIN
            // Local encrypted intent mismatch. No server POST occurs.
            return fail("LOCAL_RECHARGE_INTENT_CONFLICT");
          }
        } else {
          const saved =
            await authenticatedRechargeIntentCoordinator.verifiedSave(
              requested
            );

          if (!saved.success) return fail(saved.errorCode);

          const confirmed =
            await authenticatedRechargeIntentCoordinator.verifiedLoad();

          if (!confirmed.success) return fail(confirmed.errorCode);

          if (!confirmed.data.intent) {
            return fail("RECHARGE_INTENT_LOAD_FAILED");
          }

          intent = confirmed.data.intent;
        }

        // Revalidate after filesystem and network awaits.
        const after = await accountRechargeScopeCoordinator.resolve();

        if (!after.success) return fail(after.errorCode);

        if (
          sender.isDestroyed() ||
          getFinoraSenderWalletAuthorization(sender) !== authorization ||
          before.data.ownerId !== after.data.ownerId ||
          before.data.businessId !== after.data.businessId ||
          before.data.branchId !== after.data.branchId ||
          before.data.walletId !== after.data.walletId ||
          before.data.sessionRevision !== after.data.sessionRevision
        ) return fail("STALE_OPERATION");

        const { createFinoraServerWalletRechargeClient } =
          await import(
            "./control/finoraServerWalletRechargeClient.js"
          );

        // Always submit the encrypted server-scoped UUID.
        // Never generate a fresh UUID for an existing intent.
        const result =
          await createFinoraServerWalletRechargeClient()(
            authorization.slice(7),
            {
              amountInr: intent.amountInr,
              paymentMethod: intent.paymentMethod,
              idempotencyKey: intent.idempotencyKey,
            }
          );

        // Distinguish server HTTP 409 from a local encrypted conflict.
        if (!result.success && result.errorCode === "IDEMPOTENCY_CONFLICT") {
          return fail("SERVER_RECHARGE_IDEMPOTENCY_CONFLICT");
        }

        // FINORA_P1_753I_SERVER_CONFIRMED_SETTLEMENT
        // Unknown transport/server outcomes retain their encrypted UUID.
        // Only an exact server-confirmed receipt settles the local intent.
        if (result.success === true) {
          const confirmed = result.data.request;

          if (
            confirmed.walletId !== before.data.walletId ||
            confirmed.amountInr !== intent.amountInr.toFixed(2) ||
            confirmed.paymentMethod !== intent.paymentMethod ||
            !["PENDING", "APPROVED", "DECLINED"].includes(confirmed.status)
          ) {
            return fail("INVALID_SERVER_RESPONSE");
          }

          const finalScope = await accountRechargeScopeCoordinator.resolve();
          if (
            !finalScope.success ||
            sender.isDestroyed() ||
            getFinoraSenderWalletAuthorization(sender) !== authorization ||
            finalScope.data.ownerId !== before.data.ownerId ||
            finalScope.data.businessId !== before.data.businessId ||
            finalScope.data.branchId !== before.data.branchId ||
            finalScope.data.walletId !== before.data.walletId ||
            finalScope.data.sessionRevision !== before.data.sessionRevision
          ) {
            return fail("STALE_OPERATION");
          }

          const settled =
            await authenticatedRechargeIntentCoordinator
              .verifiedClearIfMatches(intent.idempotencyKey);

          if (!settled.success || !settled.data.cleared) {
            // Preserve the server-confirmed receipt for the UI.
            // A subsequent request may still need reconciliation.
            console.warn(
              "[FINORA RECHARGE] Confirmed server receipt; encrypted intent settlement incomplete."
            );
          }
        }

        // The API owns PENDING/APPROVED decisions and wallet credits.
        // On unknown outcomes keep the encrypted intent untouched.
        if (
          sender.isDestroyed() ||
          getFinoraSenderWalletAuthorization(sender) !== authorization
        ) return fail("STALE_OPERATION");

        return result;
      } catch {
        return fail("SERVER_UNAVAILABLE");
      } finally {
        accountRechargeBusy = false;
      }
    };
    const serverWalletRegistration = registerFinoraServerWalletIpc({
      ipc: ipcMain,
      owner: createdWindow.webContents,
      packaged: app.isPackaged,
      ownerEntryPath: path.join(__dirname, "../dist/index.html"),
      service: unifiedWalletReadOnlyService,
      rechargeService: submitAccountSSORecharge,
      // FINORA_P1_753Y2_MAIN_RECOVERY
      // Only trusted Main accesses the original encrypted UUID.
      rechargeResumeService: async () => {
        const sender = createdWindow.webContents;

        if (
          sender.isDestroyed() ||
          !getFinoraSenderWalletAuthorization(sender)
        ) return null;

        const loaded =
          await authenticatedRechargeIntentCoordinator.verifiedLoad();

        if (!loaded.success || !loaded.data.intent) return null;

        const intent = loaded.data.intent;

        return {
          amountInr: intent.amountInr,
          paymentMethod: intent.paymentMethod,
          idempotencyKey: intent.idempotencyKey,
        };
      },
      // FINORA_P1_753L_ACCOUNT_PENDING
      // Read-only authenticated local retry metadata. Never return UUID.
      rechargePendingService: async () => {
        const sender = createdWindow.webContents;
        if (sender.isDestroyed() ||
            !getFinoraSenderWalletAuthorization(sender)) {
          return { success: false as const, errorCode: "UNAUTHORIZED" };
        }
        const loaded =
          await authenticatedRechargeIntentCoordinator.verifiedLoad();
        if (!loaded.success) return loaded;
        const intent = loaded.data.intent;
        return {
          success: true as const,
          data: {
            pending: intent !== null,
            amountInr: intent?.amountInr ?? null,
            paymentMethod: intent?.paymentMethod ?? null,
          },
        };
      },
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

      // PAISARULE C85-P0-S41-A18: server-verified backup session.
      exportBackup: async (parentWindow, input, portableStore, event) => {
        const deny = (reason: string) => ({
          success: false as const,
          cancelled: false as const,
          data: null,
          errorCode: "EXPORT_FAILED" as const,
          error: `PAISARULE Branch Backup authorization denied [${reason}].`,
        });

        const sender = event.sender;
        const businessSession = finoraBusinessSessionsBySender.get(sender);
        const loginGeneration =
          finoraAccountBusinessLoginGeneration.get(sender);

        if (
          !businessSession ||
          loginGeneration === undefined ||
          sender.isDestroyed()
        ) {
          return deny("SERVER_SESSION_REQUIRED");
        }

        const current = () =>
          !sender.isDestroyed() &&
          finoraBusinessSessionsBySender.get(sender) === businessSession &&
          finoraAccountBusinessLoginGeneration.get(sender) === loginGeneration;

        try {
          const [reception, verifier, control, backup] =
            await Promise.all([
              import("./control/finoraServerReceptionSessionAuthority.js"),
              import("./control/finoraServerBusinessSessionVerifier.js"),
              import("./control/finoraControlStore.js"),
              import("./control/finoraPortableBranchAuthBackupCoordinator.js"),
            ]);

          if (!current()) return deny("LOGIN_CHANGED");

          const verified =
            await reception.validateFinoraServerReceptionSession(
              sender,
              input.sessionId,
              verifier.verifyFinoraServerBusinessSession,
              businessSession.sessionId,
            );

          if (!verified.success || !current()) {
            return deny(
              !verified.success
                ? verified.errorCode
                : "LOGIN_CHANGED"
            );
          }

          const principal = verified.principal;
          const account = getFinoraSenderWalletPrincipal(sender);

          if (
            principal.role !== "OWNER" ||
            principal.storageMode !== "USB" ||
            !account ||
            !(["userId", "ownerId", "businessId", "branchId"] as const)
              .every(key => account[key] === principal[key])
          ) {
            return deny("BRANCH_SCOPE_MISMATCH");
          }

          const store = await control.readFinoraControlStore();

          if (!store.success || !store.data || !current()) {
            return deny("CONTROL_STATE_UNAVAILABLE");
          }

          const matches =
            (store.data.branchCredentials ?? []).filter(item =>
              item.status === "ACTIVE" &&
              item.userId === principal.userId &&
              item.ownerId === principal.ownerId &&
              item.businessId === principal.businessId &&
              item.branchId === principal.branchId &&
              item.storageMode === principal.storageMode &&
              Number.isSafeInteger(item.authGeneration) &&
              (item.authGeneration as number) > 0
            );

          if (matches.length !== 1) {
            return deny("CREDENTIAL_AUTHORITY_MISMATCH");
          }

          const authGeneration =
            matches[0].authGeneration as number;

          const backupResult =
            await exportFinoraFullBranchBackupFromNativeDialog(
              parentWindow,
              input,
              portableStore,
              {
                resolveUsbRoot: () => findFinoraUsbRoot(),

                readRuntimeAuthority: storageMode =>
                  portableFreshDeviceRuntimeAuthorityStore.read(
                    storageMode
                  ),

                createAuthBackup:
                  async (request, portableAuthStore) =>
                    backup.createFinoraPortableBranchAuthBackup(
                      request,
                      portableAuthStore,
                      {
                        resolveSession: async requestedId => {
                          if (
                            !current() ||
                            requestedId !== input.sessionId
                          ) {
                            return {
                              success: false as const,
                              errorCode: "SESSION_NOT_FOUND" as const,
                              error:
                                "PAISARULE authenticated session changed.",
                            };
                          }

                          const now = new Date().toISOString();

                          return {
                            success: true as const,
                            data: {
                              session: {
                                sessionId: input.sessionId,
                                userId: principal.userId,
                                username: principal.username,
                                fullName: principal.fullName,
                                role: "OWNER" as const,
                                ownerId: principal.ownerId,
                                businessId: principal.businessId,
                                branchId: principal.branchId,
                                storageMode: principal.storageMode,
                                dataContext: "REAL" as const,
                                accessMode: "ACTIVE" as const,
                                loginTime: now,
                                lastActivity: now,
                                validatedAt: now,
                              },
                              principal: {
                                authGeneration,
                                userId: principal.userId,
                                username: principal.username,
                                ownerId: principal.ownerId,
                                businessId: principal.businessId,
                                branchId: principal.branchId,
                                storageMode: principal.storageMode,
                                dataContext: "REAL" as const,
                              },
                            },
                          };
                        },
                      }
                    ),
              }
            );

          return backupResult;
        } catch {
          return deny("BACKUP_AUTHORITY_UNAVAILABLE");
        }
      },
    });
    // ==========================================================
    // PAISARULE C85-P0-S41-A91-R9
    // Storage-only encrypted Business Backup V1.
    // ==========================================================

    // ==========================================================
    // PAISARULE_R175_C53
    // RESTORE V1 - SERVER-AUTHENTICATED VERIFY ONLY
    //
    // Zero renderer arguments.
    // No USB writes or Restore commit.
    // ==========================================================
    // PAISARULE_C117_R260_NATIVE_SELECTION
    // Main-process only. Never expose this map via IPC.
    // No backup plaintext, session key, or USB write authority.
    const paisaruleRestoreVerifyTokenBySender =
      new WeakMap<object, object>();

    const paisarulePendingRestoreSelectionBySender =
      new WeakMap<
        object,
        {
          token: object;
          generation: number;
          sessionId: string;
          branchRoot: string;
          assertPinnedUsbIdentity(): Promise<void>;
          selectedPath: string;
          archiveSha256: string;
          scope: {
            userId: string;
            ownerId: string;
            businessId: string;
            branchId: string;
          };
        }
      >();
    ipcMain.handle(
      "paisarule:storage-backup:restore-verify",
      async (event) => {
        const denyRestore = (errorCode: string) => ({
          success: false as const,
          cancelled: false as const,
          verified: false as const,
          createdAt: null,
          errorCode,
        });

        const sender = event.sender;

        if (
          !event.senderFrame ||
          event.senderFrame !== sender.mainFrame ||
          !isTrustedRenderer(event.senderFrame)
        ) {
          return denyRestore("UNAUTHORIZED_RENDERER");
        }

        // Invalidate any earlier pending selection for this sender.
        // A competing dialog supersedes the preceding verification.
        const restoreVerifyToken = {};
        paisaruleRestoreVerifyTokenBySender.set(
          sender,
          restoreVerifyToken,
        );
        paisarulePendingRestoreSelectionBySender.delete(sender);

        // PAISARULE C117-R194-R1
        // Only completed native milestones are emitted.
        // No timer-based progress, paths, keys or business data.
        const emitRestoreVerifyStage = (
          stage:
            | "FILE_SELECTED"
            | "SERVER_SESSION_VERIFIED"
            | "USB_IDENTITY_VERIFIED"
            | "BACKUP_ARCHIVE_VERIFIED",
        ): void => {
          if (
            sender.isDestroyed() ||
            paisaruleRestoreVerifyTokenBySender.get(sender) !==
              restoreVerifyToken ||
            !isCurrentRestoreSession()
          ) {
            return;
          }

          try {
            sender.send("paisarule:restore:verify-stage", {
              phase: "VERIFY",
              stage,
            });
          } catch {
            // Progress notification cannot affect Restore.
          }
        };

        const businessSession =
          finoraBusinessSessionsBySender.get(sender);

        const generation =
          finoraAccountBusinessLoginGeneration.get(sender);

        const parentWindow = mainWindow;

        if (
          !businessSession ||
          generation === undefined ||
          sender.isDestroyed() ||
          !parentWindow ||
          parentWindow.isDestroyed()
        ) {
          return denyRestore("BUSINESS_SESSION_REQUIRED");
        }

        const isCurrentRestoreSession = () =>
          !sender.isDestroyed() &&
          finoraBusinessSessionsBySender.get(sender) ===
            businessSession &&
          finoraAccountBusinessLoginGeneration.get(sender) ===
            generation;

        try {
          if (!isCurrentRestoreSession()) {
            return denyRestore("LOGIN_CHANGED");
          }

          // PAISARULE C117-R192
          // Display the native file picker BEFORE expensive
          // server and USB identity verification.
          // Nothing is read, decrypted or committed here.
          const restorePreselectedDialog =
            await dialog.showOpenDialog(
              parentWindow,
              {
                title: "Select PAISARULE Business Backup",
                properties: ["openFile"],
                filters: [
                  {
                    name: "PAISARULE Backup",
                    extensions: ["paisarule"],
                  },
                ],
              },
            );

          if (
            paisaruleRestoreVerifyTokenBySender.get(sender) !==
            restoreVerifyToken
          ) {
            return denyRestore("RESTORE_VERIFY_SUPERSEDED");
          }

          if (!isCurrentRestoreSession()) {
            return denyRestore("LOGIN_CHANGED");
          }

          if (restorePreselectedDialog.canceled) {
            return {
              success: true,
              cancelled: true,
              verified: false,
              createdAt: null,
              errorCode: null,
            };
          }

          emitRestoreVerifyStage("FILE_SELECTED");

          const verification =
            await verifyPaisaruleBackupBusinessSession(
              businessSession.sessionId,
            );

          if (
            !verification.success ||
            !isCurrentRestoreSession()
          ) {
            return denyRestore("SERVER_SESSION_INVALID");
          }

          emitRestoreVerifyStage("SERVER_SESSION_VERIFIED");

          const principal = verification.principal;

          const account =
            getFinoraSenderWalletPrincipal(sender);

          if (
            principal.role !== "OWNER" ||
            principal.storageMode !== "USB" ||
            !account ||
            !(
              [
                "userId",
                "ownerId",
                "businessId",
                "branchId",
              ] as const
            ).every(
              key => account[key] === principal[key],
            )
          ) {
            return denyRestore("BRANCH_SCOPE_MISMATCH");
          }

          if (
            !isPaisaruleBackupSessionKeyAvailable(
              sender,
              generation,
            )
          ) {
            return denyRestore(
              "BACKUP_SESSION_KEY_UNAVAILABLE",
            );
          }

          const {
            verifySelectedPaisaruleBackupV1,
          } = await import(
            "./control/paisaruleStorageBackupV1RestoreVerify.js"
          );

          if (!isCurrentRestoreSession()) {
            return denyRestore("LOGIN_CHANGED");
          }

          // PAISARULE_C117_R226_FOLDER_PREFLIGHT
          // Native-selected active folder, never renderer input.
          const restoreFolderBeforeDialog =
            await findFinoraUsbRoot();

          if (!restoreFolderBeforeDialog) {
            return denyRestore("RESTORE_FOLDER_NOT_SELECTED");
          }

          if (
            path.win32.resolve(restoreFolderBeforeDialog)
              .toLowerCase() ===
            path.win32.parse(restoreFolderBeforeDialog)
              .root.toLowerCase()
          ) {
            return denyRestore("RESTORE_FOLDER_REQUIRED");
          }

          // PAISARULE_C117_R261_USB_IDENTITY
          // Capture the physical removable USB BEFORE file selection.
          // The trusted branch root is selected by Electron Main.
          const {
            capturePaisaruleUsbIdentityV1,
            assertPaisaruleUsbIdentityUnchangedV1,
          } = await import(
            "./control/paisaruleStorageBackupV1UsbIdentity.js"
          );

          const restoreUsbDriveRoot =
            path.win32.parse(restoreFolderBeforeDialog).root;

          const restoreIdentityStartedAt = performance.now();

          const restoreUsbIdentity =
            await capturePaisaruleUsbIdentityV1(
              restoreUsbDriveRoot,
            );

          console.info(
            "[PAISARULE RESTORE PERF] USB_IDENTITY_MS",
            Math.round(performance.now() - restoreIdentityStartedAt),
          );

          emitRestoreVerifyStage("USB_IDENTITY_VERIFIED");

          if (!isCurrentRestoreSession()) {
            return denyRestore("LOGIN_CHANGED");
          }

          // Native handoff is provisional until Folder Safety passes.
          const nativeArchiveHandoff: {
            value: {
              selectedPath: string;
              archiveSha256: string;
            } | null;
          } = { value: null };

          const result =
            await verifySelectedPaisaruleBackupV1(
              {
                sender,
                generation,
                scope: {
                  userId: principal.userId,
                  ownerId: principal.ownerId,
                  businessId: principal.businessId,
                  branchId: principal.branchId,
                },
                isCurrent: isCurrentRestoreSession,
              },
              {
                // Consume the native selection exactly once.
                // RestoreVerify still checks extension, file
                // type, size, encryption, scope and session.
                showOpenDialog: async () =>
                  restorePreselectedDialog,
                onVerifiedArchive: selection => {
                  if (
                    !isCurrentRestoreSession() ||
                    paisaruleRestoreVerifyTokenBySender.get(sender) !==
                      restoreVerifyToken
                  ) {
                    throw new Error("RESTORE_VERIFY_SUPERSEDED");
                  }

                  nativeArchiveHandoff.value = {
                    selectedPath: selection.selectedPath,
                    archiveSha256: selection.archiveSha256,
                  };
                },
              },
            );

          if (
            paisaruleRestoreVerifyTokenBySender.get(sender) !==
            restoreVerifyToken
          ) {
            return denyRestore("RESTORE_VERIFY_SUPERSEDED");
          }

          if (!isCurrentRestoreSession()) {
            return denyRestore("LOGIN_CHANGED");
          }

          if (
            result.success &&
            !result.cancelled &&
            result.verified
          ) {
            emitRestoreVerifyStage("BACKUP_ARCHIVE_VERIFIED");
            // Preliminary read-only safety gate.
            // Does not authorize or commit a Restore.
            const restoreFolderAfterDialog =
              await findFinoraUsbRoot();

            if (
              !restoreFolderAfterDialog ||
              path.win32.resolve(restoreFolderAfterDialog)
                .toLowerCase() !==
              path.win32.resolve(restoreFolderBeforeDialog)
                .toLowerCase()
            ) {
              return denyRestore("RESTORE_FOLDER_CHANGED");
            }

            const {
              inspectPaisaruleFolderRestoreSafetyV1,
            } = await import(
              "./control/paisaruleStorageBackupV1FolderSafety.js"
            );

            const folderSafety = await inspectPaisaruleFolderRestoreSafetyV1({
              branchRoot: restoreFolderAfterDialog,
              scope: {
                ownerId: principal.ownerId,
                businessId: principal.businessId,
                branchId: principal.branchId,
              },
              isCurrent: isCurrentRestoreSession,
            });

            // PAISARULE_C117_R269_DESTINATION_RECEIPT
            // The destination contains precisely one existing
            // WALLET record and no business records.
            // This preview receipt never authorizes a commit.
            if (
              folderSafety.preservedWalletRecords !== 1 ||
              folderSafety.businessRecords !== 0 ||
              path.win32.resolve(folderSafety.branchRoot)
                .toLowerCase() !==
                path.win32.resolve(restoreFolderAfterDialog)
                  .toLowerCase()
            ) {
              return denyRestore("RESTORE_DESTINATION_UNSAFE");
            }

            // Verify the exact same physical device after dialog,
            // archive authentication and destination safety.
            await assertPaisaruleUsbIdentityUnchangedV1(
              restoreUsbDriveRoot,
              restoreUsbIdentity,
            );

            if (
              !isCurrentRestoreSession() ||
              paisaruleRestoreVerifyTokenBySender.get(sender) !==
                restoreVerifyToken
            ) {
              return denyRestore("LOGIN_CHANGED");
            }

            const verifiedSelection = nativeArchiveHandoff.value;

            if (
              !verifiedSelection ||
              typeof verifiedSelection.selectedPath !== "string" ||
              !path.isAbsolute(verifiedSelection.selectedPath) ||
              !/^[a-f0-9]{64}$/i.test(
                verifiedSelection.archiveSha256,
              )
            ) {
              return denyRestore("RESTORE_NATIVE_HANDOFF_MISSING");
            }

            // Pending only, not commit authorization.
            // No physical USB identity is pinned in R260.
            paisarulePendingRestoreSelectionBySender.set(sender, {
              token: restoreVerifyToken,
              generation,
              sessionId: businessSession.sessionId,
              branchRoot: restoreFolderAfterDialog,
              assertPinnedUsbIdentity: () =>
                assertPaisaruleUsbIdentityUnchangedV1(
                  restoreUsbDriveRoot,
                  restoreUsbIdentity,
                ),
              selectedPath: verifiedSelection.selectedPath,
              archiveSha256: verifiedSelection.archiveSha256,
              scope: {
                userId: principal.userId,
                ownerId: principal.ownerId,
                businessId: principal.businessId,
                branchId: principal.branchId,
              },
            });
          }

          if (result.success && !result.cancelled && result.verified) {
            // Safe preview only. The commit must revalidate
            // session, scope, USB identity and storage hashes.
            return {
              ...result,
              destinationSafetyVerified: true as const,
              destinationBusinessEmpty: true as const,
              destinationWalletPreserved: true as const,
            };
          }

          return result;
        } catch (error) {
          // PAISARULE_C117_R295_SAFE_DIAGNOSTIC
          // Never log credentials, paths, stacks or raw exceptions.
          const message = error instanceof Error ? error.message : "";
          const diagnosticCode =
            /^(RESTORE|BACKUP|USB|PAISARULE|FINORA)_[A-Z0-9_]{1,100}$/.test(message)
              ? message
              : "UNCLASSIFIED_EXCEPTION";
          const diagnosticType =
            error instanceof Error &&
            /^(Error|TypeError|RangeError|ReferenceError|SyntaxError)$/.test(error.name)
              ? error.name
              : "Unknown";
          console.error(
            "PAISARULE_R295_VERIFY_DIAGNOSTIC",
            diagnosticType,
            diagnosticCode,
          );
          return denyRestore(
            "RESTORE_VERIFICATION_UNAVAILABLE",
          );
        }
      },
    );
    // ==========================================================
    // ==========================================================
    // C117-R335: Native authenticated recovery entry.
    // Disabled until integrated recovery lifecycle tests pass.
    // No preload or renderer route is connected.
    ipcMain.handle(
      "paisarule:storage-backup:recover-interrupted",
      async (event, ...args: unknown[]) => {
        const deny = (errorCode: string) => ({
          success: false as const,
          recovered: false as const,
          errorCode,
        });

        const sender = event.sender;
        if (
          args.length !== 0 ||
          !event.senderFrame ||
          event.senderFrame !== sender.mainFrame ||
          !isTrustedRenderer(event.senderFrame) ||
          sender.isDestroyed()
        ) {
          return deny("RECOVERY_UNAUTHORIZED_RENDERER");
        }

        const recoveryFeatureEnabled: boolean = false;
        if (!recoveryFeatureEnabled) {
          return deny("RECOVERY_DISABLED_PENDING_TESTS");
        }

        const session = finoraBusinessSessionsBySender.get(sender);
        const generation =
          finoraAccountBusinessLoginGeneration.get(sender);

        if (!session || generation === undefined) {
          return deny("RECOVERY_OWNER_SESSION_REQUIRED");
        }

        const isCurrent = () =>
          !sender.isDestroyed() &&
          finoraBusinessSessionsBySender.get(sender) === session &&
          finoraAccountBusinessLoginGeneration.get(sender) ===
            generation;

        let key: Buffer | null = null;

        try {
          const verification =
            await verifyPaisaruleBackupBusinessSession(
              session.sessionId,
            );

          if (!verification.success || !isCurrent()) {
            throw new Error("RECOVERY_SESSION_INVALID");
          }

          const principal = verification.principal;
          const account = getFinoraSenderWalletPrincipal(sender);

          if (
            principal.role !== "OWNER" ||
            principal.storageMode !== "USB" ||
            !account ||
            !(
              ["userId", "ownerId", "businessId", "branchId"] as const
            ).every(field => account[field] === principal[field])
          ) {
            throw new Error("RECOVERY_SCOPE_INVALID");
          }

          const scope = {
            userId: principal.userId,
            ownerId: principal.ownerId,
            businessId: principal.businessId,
            branchId: principal.branchId,
          };

          const branchRoot = await findFinoraUsbRoot();
          if (!branchRoot || !isCurrent()) {
            throw new Error("RECOVERY_BRANCH_UNAVAILABLE");
          }

          const driveRoot = path.win32.parse(branchRoot).root;
          const {
            capturePaisaruleUsbIdentityV1,
            assertPaisaruleUsbIdentityUnchangedV1,
          } = await import(
            "./control/paisaruleStorageBackupV1UsbIdentity.js"
          );

          const identity =
            await capturePaisaruleUsbIdentityV1(driveRoot);

          const assertAuthority = async () => {
            if (!isCurrent()) {
              throw new Error("RECOVERY_LOGIN_CHANGED");
            }

            const current =
              await verifyPaisaruleBackupBusinessSession(
                session.sessionId,
              );
            const currentAccount =
              getFinoraSenderWalletPrincipal(sender);

            if (
              !current.success ||
              current.principal.role !== "OWNER" ||
              current.principal.storageMode !== "USB" ||
              !currentAccount ||
              !(
                ["userId", "ownerId", "businessId", "branchId"] as const
              ).every(
                field =>
                  current.principal[field] === scope[field] &&
                  currentAccount[field] === scope[field],
              )
            ) {
              throw new Error("RECOVERY_AUTHORITY_CHANGED");
            }

            const active = await findFinoraUsbRoot();
            if (
              !active ||
              path.win32.resolve(active).toLowerCase() !==
                path.win32.resolve(branchRoot).toLowerCase()
            ) {
              throw new Error("RECOVERY_BRANCH_CHANGED");
            }

            await assertPaisaruleUsbIdentityUnchangedV1(
              driveRoot,
              identity,
            );

            if (!isCurrent()) {
              throw new Error("RECOVERY_LOGIN_CHANGED");
            }
          };

          const {
            getPaisaruleBackupSessionKey,
          } = await import(
            "./control/paisaruleStorageBackupV1SessionKeyAuthority.js"
          );

          key = getPaisaruleBackupSessionKey(
            sender,
            generation,
            scope,
          );

          if (!key) {
            throw new Error("RECOVERY_KEY_UNAVAILABLE");
          }

          const {
            recoverPaisaruleAuthenticatedStorageV2,
          } = await import(
            "./control/paisaruleStorageBackupV2AuthenticatedRecovery.js"
          );

          await assertAuthority();

          const result =
            await recoverPaisaruleAuthenticatedStorageV2(
              {
                branchRoot,
                scope,
                scopedKey: key,
                isCurrent,
              },
              {
                withExclusiveStorageAccess: operation =>
                  withPaisaruleRestoreStorageExclusion(
                    branchRoot,
                    operation,
                  ),
                assertCurrentAuthority: assertAuthority,
              },
            );

          return {
            success: true as const,
            recovered: result.recovered,
            errorCode: null,
          };
        } catch {
          return deny("RECOVERY_UNAVAILABLE_MANUAL_REVIEW");
        } finally {
          key?.fill(0);
        }
      },
    );
    // PAISARULE_C117_R263_COMMIT_IPC
    //
    // Native-only, zero renderer arguments.
    // No UI/preload route is connected in this step.
    // Calling this handler can mutate selected branch storage.
    // Keep Restore button disabled until regression validation.
    // ==========================================================
    ipcMain.handle(
      "paisarule:storage-backup:restore-commit",
      async (event, ...rendererArguments: unknown[]) => {
        const denyCommit = (errorCode: string) => ({
          success: false as const,
          committed: false as const,
          errorCode,
        });

        const sender = event.sender;

        if (
          rendererArguments.length !== 0 ||
          !event.senderFrame ||
          event.senderFrame !== sender.mainFrame ||
          !isTrustedRenderer(event.senderFrame) ||
          sender.isDestroyed()
        ) {
          return denyCommit("UNAUTHORIZED_RESTORE_REQUEST");
        }

        // PAISARULE_C117_R264_EXECUTION_ORDER
        // Remain fail-closed until integration and recovery
        // tests pass and the UI is deliberately connected.
        const restoreCommitFeatureEnabled: boolean = true;

        if (!restoreCommitFeatureEnabled) {
          return denyCommit(
            "RESTORE_COMMIT_DISABLED_PENDING_TESTS",
          );
        }
        // One-use selection. Consume before the first await
        // so a concurrent request cannot replay this selection.
        const selected =
          paisarulePendingRestoreSelectionBySender.get(sender);

        paisarulePendingRestoreSelectionBySender.delete(sender);

        if (
          !selected ||
          paisaruleRestoreVerifyTokenBySender.get(sender) !==
            selected.token
        ) {
          return denyCommit("RESTORE_VERIFIED_SELECTION_REQUIRED");
        }

        const currentSession =
          finoraBusinessSessionsBySender.get(sender);

        const currentGeneration =
          finoraAccountBusinessLoginGeneration.get(sender);

        const isCurrent = () =>
          !sender.isDestroyed() &&
          finoraBusinessSessionsBySender.get(sender) ===
            currentSession &&
          finoraAccountBusinessLoginGeneration.get(sender) ===
            selected.generation &&
          paisaruleRestoreVerifyTokenBySender.get(sender) ===
            selected.token;

        if (
          !currentSession ||
          currentSession.sessionId !== selected.sessionId ||
          currentGeneration !== selected.generation ||
          !isCurrent()
        ) {
          return denyCommit("RESTORE_LOGIN_CHANGED");
        }

        let archivedBytes: Buffer | null = null;
        let scopedKey: Buffer | null = null;

        try {
          const {
            createHash,
          } = await import("node:crypto");

          const {
            getPaisaruleBackupSessionKey,
          } = await import(
            "./control/paisaruleStorageBackupV1SessionKeyAuthority.js"
          );

          const {
            commitPaisaruleAuthenticatedFolderV1,
          } = await import(
            "./control/paisaruleStorageBackupV1FolderCoordinator.js"
          );

          // Repeat server authorization at commit time
          // and whenever transaction authority is checked.
          const assertAuthority = async () => {
            if (!isCurrent()) {
              throw new Error("RESTORE_LOGIN_CHANGED");
            }

            const verification =
              await verifyPaisaruleBackupBusinessSession(
                selected.sessionId,
              );

            if (!verification.success || !isCurrent()) {
              throw new Error("RESTORE_SERVER_SESSION_INVALID");
            }

            const principal = verification.principal;
            const account =
              getFinoraSenderWalletPrincipal(sender);

            if (
              principal.role !== "OWNER" ||
              principal.storageMode !== "USB" ||
              !account ||
              !(
                [
                  "userId",
                  "ownerId",
                  "businessId",
                  "branchId",
                ] as const
              ).every(
                key =>
                  principal[key] === selected.scope[key] &&
                  account[key] === selected.scope[key],
              )
            ) {
              throw new Error("RESTORE_SCOPE_CHANGED");
            }

            const activeBranch = await findFinoraUsbRoot();

            if (
              !activeBranch ||
              path.win32.resolve(activeBranch).toLowerCase() !==
                path.win32.resolve(selected.branchRoot).toLowerCase()
            ) {
              throw new Error("RESTORE_BRANCH_CHANGED");
            }

            await selected.assertPinnedUsbIdentity();

            if (!isCurrent()) {
              throw new Error("RESTORE_LOGIN_CHANGED");
            }
          };

          // PAISARULE C117-R196
          // Native progress notifications cannot grant authority.
          // No paths, credentials, business records or keys.
          const emitRestoreCommitStage = (
            stage:
              | "COMMIT_STARTED"
              | "DESTINATION_VERIFIED"
              | "STAGING_VERIFIED"
              | "PUBLISHED_READBACK_VERIFIED"
              | "COMMIT_COORDINATOR_SUCCEEDED",
          ): void => {
            if (
              sender.isDestroyed() ||
              !isCurrent()
            ) {
              return;
            }

            try {
              sender.send("paisarule:restore:commit-stage", {
                phase: "COMMIT",
                stage,
              });
            } catch {
              // Notification failure cannot affect Restore.
            }
          };

          // The operation begins before acquiring its lock.
          // This is a stage, not a completed percentage.
          emitRestoreCommitStage("COMMIT_STARTED");

          // Exclusive lock must be acquired BEFORE reading
          // the archive and invoking the coordinator.
          const committed =
            await withPaisaruleRestoreStorageExclusion(
              selected.branchRoot,
              async () => {
                await assertAuthority();

                const metadata = await fs.lstat(
                  selected.selectedPath,
                );

                if (
                  !metadata.isFile() ||
                  metadata.isSymbolicLink() ||
                  metadata.size === 0 ||
                  metadata.size > 96 * 1024 * 1024
                ) {
                  throw new Error(
                    "RESTORE_ARCHIVE_FILE_INVALID",
                  );
                }

                const archiveBytes = await fs.readFile(
                  selected.selectedPath,
                );

                archivedBytes = archiveBytes;

                if (
                  archiveBytes.length !== metadata.size ||
                  createHash("sha256")
                    .update(archiveBytes)
                    .digest("hex")
                    .toLowerCase() !==
                      selected.archiveSha256.toLowerCase()
                ) {
                  throw new Error("RESTORE_ARCHIVE_CHANGED");
                }

                const key = getPaisaruleBackupSessionKey(
                  sender,
                  selected.generation,
                  selected.scope,
                );

                if (!key) {
                  throw new Error(
                    "RESTORE_SESSION_KEY_UNAVAILABLE",
                  );
                }

                scopedKey = key;

                await assertAuthority();

                // Already inside the stable storage lock.
                // Never acquire that same lock recursively.
                return commitPaisaruleAuthenticatedFolderV1(
                  {
                    branchRoot: selected.branchRoot,
                    scope: selected.scope,
                    archiveBytes,
                    archiveSha256: selected.archiveSha256,
                    scopedKey: key,
                    isCurrent,
                  },
                  {
                    withExclusiveStorageAccess:
                      async operation => operation(),
                    assertCurrentAuthority: assertAuthority,
                    // PAISARULE C117-R206
                    // Native-only completed transaction stages.
                    onProgress: stage => {
                      emitRestoreCommitStage(stage);
                    },
                  },
                );
              },
            );
          // The coordinator returned successfully.
          // UI must independently await the success result.
          // Do not claim 100% until read-back contract is checked.
          emitRestoreCommitStage("COMMIT_COORDINATOR_SUCCEEDED");

          return {
            success: true as const,
            committed: true as const,
            archiveSha256: committed.archiveSha256,
            backupRecordCount: committed.backupRecordCount,
            finalRecordCount: committed.finalRecordCount,
            preservedWalletRecords:
              committed.preservedWalletRecords,
            errorCode: null,
          };
        } catch (error: unknown) {
          // Preserve only structured, non-sensitive error codes.
          // Never expose raw exceptions, paths or credentials.
          const message =
            error instanceof Error ? error.message : "";

          const safeCode =
            /^(?:RESTORE|USB|SERVER_SESSION|BUSINESS_SESSION|AUTH|WALLET|BRANCH|STORAGE|BACKUP|PAISARULE)_[A-Z0-9_]{1,100}$/.test(message)
              ? message
              : "RESTORE_COMMIT_UNAVAILABLE";

          console.warn(
            "[PAISARULE RESTORE COMMIT REJECTED]",
            safeCode,
          );

          return denyCommit(safeCode);
        } finally {
          (archivedBytes as Buffer | null)?.fill(0);
          (scopedKey as Buffer | null)?.fill(0);
        }
      },
    );
    // PAISARULE C117-R11-R1
    // Authenticated Owner NEW USB selection.
    //
    // No renderer-provided path.
    // No USB write.
    // No restore commit.
    // ==========================================================

    const paisarulePendingRestoreUsbBySender =
      new WeakMap<
        object,
        {
          generation: number;
          sessionId: string;
          targetRoot: string;
          diskNumber: number;
          assertPinnedTarget(): Promise<void>;
          assertDifferentFromSource(): Promise<void>;
        }
      >();

    ipcMain.handle(
      "paisarule:storage-backup:select-new-usb",
      async (event) => {
        const deny = (errorCode: string) => ({
          success: false as const,
          cancelled: false as const,
          selected: false as const,
          errorCode,
        });

        const sender = event.sender;

        // Invalidate any earlier selection before proceeding.
        paisarulePendingRestoreUsbBySender.delete(sender);

        if (
          !event.senderFrame ||
          event.senderFrame !== sender.mainFrame ||
          !isTrustedRenderer(event.senderFrame)
        ) {
          return deny("UNAUTHORIZED_RENDERER");
        }

        const businessSession =
          finoraBusinessSessionsBySender.get(sender);

        const generation =
          finoraAccountBusinessLoginGeneration.get(sender);

        const parentWindow = mainWindow;

        if (
          !businessSession ||
          generation === undefined ||
          sender.isDestroyed() ||
          !parentWindow ||
          parentWindow.isDestroyed()
        ) {
          return deny("BUSINESS_SESSION_REQUIRED");
        }

        const current = () =>
          !sender.isDestroyed() &&
          finoraBusinessSessionsBySender.get(sender) ===
            businessSession &&
          finoraAccountBusinessLoginGeneration.get(sender) ===
            generation;

        try {
          if (!current()) {
            return deny("LOGIN_CHANGED");
          }

          const verification =
            await verifyPaisaruleBackupBusinessSession(
              businessSession.sessionId,
            );

          if (!verification.success || !current()) {
            return deny("SERVER_SESSION_INVALID");
          }

          const principal = verification.principal;

          const account =
            getFinoraSenderWalletPrincipal(sender);

          if (
            principal.role !== "OWNER" ||
            principal.storageMode !== "USB" ||
            !account ||
            !(
              [
                "userId",
                "ownerId",
                "businessId",
                "branchId",
              ] as const
            ).every(
              key => account[key] === principal[key],
            )
          ) {
            return deny("BRANCH_SCOPE_MISMATCH");
          }

          const sourceRoot = await findFinoraUsbRoot();

          if (!current()) {
            return deny("LOGIN_CHANGED");
          }

          // Lost-source recovery is NOT implemented here.
          // Never guess recovery authority.
          if (!sourceRoot) {
            return deny(
              "SOURCE_ABSENT_RECOVERY_NOT_AUTHORIZED",
            );
          }

          const {
            selectPaisaruleNewUsbV1,
          } = await import(
            "./control/paisaruleStorageBackupV1UsbSelection.js"
          );

          const assertCurrentOwnerSession =
            async (): Promise<void> => {
              if (!current()) {
                throw new Error("LOGIN_CHANGED");
              }

              const refreshed =
                await verifyPaisaruleBackupBusinessSession(
                  businessSession.sessionId,
                );

              if (!refreshed.success || !current()) {
                throw new Error("SERVER_SESSION_INVALID");
              }

              const p = refreshed.principal;

              if (
                p.role !== "OWNER" ||
                p.storageMode !== "USB" ||
                !(
                  [
                    "userId",
                    "ownerId",
                    "businessId",
                    "branchId",
                  ] as const
                ).every(
                  key => p[key] === principal[key],
                )
              ) {
                throw new Error("BRANCH_SCOPE_MISMATCH");
              }
            };

          const selected = await selectPaisaruleNewUsbV1(
            parentWindow,
            {
              sourceUsbRoot: sourceRoot,
              sourceAbsentRecoveryAuthorized: false,
              assertCurrentOwnerSession,
            },
          );

          if (!current()) {
            return deny("LOGIN_CHANGED");
          }

          if (!selected) {
            return {
              success: true as const,
              cancelled: true as const,
              selected: false as const,
              errorCode: null,
            };
          }

          await selected.assertPinnedTarget();
          await selected.assertDifferentFromSource();

          await assertCurrentOwnerSession();

          // Retain only in privileged Electron Main.
          // A future Commit must consume once and recheck.
          paisarulePendingRestoreUsbBySender.set(sender, {
            generation,
            sessionId: businessSession.sessionId,
            targetRoot: selected.targetRoot,
            diskNumber: selected.diskNumber,
            assertPinnedTarget: selected.assertPinnedTarget,
            assertDifferentFromSource:
              selected.assertDifferentFromSource,
          });

          return {
            success: true as const,
            cancelled: false as const,
            selected: true as const,
            errorCode: null,
          };
        } catch {
          paisarulePendingRestoreUsbBySender.delete(sender);

          return deny("RESTORE_USB_SELECTION_FAILED");
        }
      },
    );

    // PAISARULE_C117_R176_PREPARE_IPC
    // Privileged in-memory state, never passed to renderer.
    const paisaruleV1PreparedCache =
      new PaisaruleStorageBackupV1PreparedCache();

    const paisaruleV1PreparedEvidence =
      new PaisaruleStorageBackupV1PreparedEvidence();

    const paisaruleV1PrepareLifecycle =
      new PaisaruleStorageBackupV1PrepareLifecycle();

    // PAISARULE_C117_R177_IPC_BUSY
    const paisaruleV1PrepareIpcBusy = new Set<object>();

    // PAISARULE_C117_R182_B_DOWNLOAD_IPC
    const paisaruleV1DownloadIpcBusy = new Set<object>();

    // PAISARULE_C117_R180_DESTROY_CLEANUP
    // Register once per WebContents without retaining it.
    const paisaruleV1DestroyBound = new WeakSet<object>();

    const paisaruleV1UsbAuthority = {
      resolveUsbRoot: () => findFinoraUsbRoot(),
      captureHardware:
        capturePaisaruleV1UsbHardwareIdentity,
      captureSource:
        capturePaisaruleV1SourceFingerprint,
    };

    ipcMain.handle(
      "paisarule:storage-backup:prepare",
      async (event) => {
        const sender = event.sender;

        const deny = (errorCode: string) => ({
          success: false as const,
          cancelled: false as const,
          data: null,
          errorCode,
        });

        const invalidate = () => {
          paisaruleV1PreparedEvidence.clear(sender);
          paisaruleV1PreparedCache.clear(sender);
        };

        if (
          !event.senderFrame ||
          event.senderFrame !== sender.mainFrame ||
          !isTrustedRenderer(event.senderFrame)
        ) {
          return deny("UNAUTHORIZED_RENDERER");
        }
        // PAISARULE_C117_R180_DESTROY_CLEANUP
        // Bind synchronously before the first await.
        // Sender identity, not branch identity, is the key.
        if (!paisaruleV1DestroyBound.has(sender)) {
          sender.once("destroyed", () => {
            paisaruleV1PreparedEvidence.clear(sender);
            paisaruleV1PreparedCache.clear(sender);
          });
          paisaruleV1DestroyBound.add(sender);
        }

        if (
          paisaruleV1PrepareIpcBusy.has(sender) ||
          paisaruleV1DownloadIpcBusy.has(sender)
        ) {
          return deny("BACKUP_PREPARE_ALREADY_RUNNING");
        }

        paisaruleV1PrepareIpcBusy.add(sender);

        try {

        const businessSession =
          finoraBusinessSessionsBySender.get(sender);

        const generation =
          finoraAccountBusinessLoginGeneration.get(sender);

        if (
          !businessSession ||
          generation === undefined ||
          sender.isDestroyed()
        ) {
          invalidate();
          return deny("BUSINESS_SESSION_REQUIRED");
        }

        const current = () =>
          !sender.isDestroyed() &&
          finoraBusinessSessionsBySender.get(sender) ===
            businessSession &&
          finoraAccountBusinessLoginGeneration.get(sender) ===
            generation;

        try {
          const verification =
            await verifyPaisaruleBackupBusinessSession(
              businessSession.sessionId,
            );

          if (!verification.success || !current()) {
            invalidate();
            return deny("SERVER_SESSION_INVALID");
          }

          const principal = verification.principal;
          const account =
            getFinoraSenderWalletPrincipal(sender);

          if (
            principal.role !== "OWNER" ||
            principal.storageMode !== "USB" ||
            !account ||
            !(
              ["userId", "ownerId", "businessId", "branchId"] as const
            ).every(key => account[key] === principal[key])
          ) {
            invalidate();
            return deny("BRANCH_SCOPE_MISMATCH");
          }

          if (
            !isPaisaruleBackupSessionKeyAvailable(
              sender,
              generation,
            )
          ) {
            invalidate();
            return deny("BACKUP_SESSION_KEY_UNAVAILABLE");
          }

          const scope = {
            userId: principal.userId,
            ownerId: principal.ownerId,
            businessId: principal.businessId,
            branchId: principal.branchId,
          };

          const assertCurrentAuthority = async () => {
            if (!current()) {
              throw new Error("BACKUP_LOGIN_CHANGED");
            }

            const latest =
              await verifyPaisaruleBackupBusinessSession(
                businessSession.sessionId,
              );

            if (!latest.success || !current()) {
              throw new Error("BACKUP_SERVER_SESSION_INVALID");
            }

            const p = latest.principal;
            const activeAccount =
              getFinoraSenderWalletPrincipal(sender);

            if (
              p.role !== "OWNER" ||
              p.storageMode !== "USB" ||
              !activeAccount ||
              !(
                ["userId", "ownerId", "businessId", "branchId"] as const
              ).every(
                key =>
                  p[key] === scope[key] &&
                  activeAccount[key] === scope[key],
              )
            ) {
              throw new Error("BACKUP_BRANCH_SCOPE_MISMATCH");
            }

            if (
              !isPaisaruleBackupSessionKeyAvailable(
                sender,
                generation,
              )
            ) {
              throw new Error("BACKUP_SESSION_KEY_UNAVAILABLE");
            }
          };

          const preview =
            await paisaruleV1PrepareLifecycle.prepare(
              {
                sender,
                generation,
                scope,
                isCurrent: current,
                assertCurrentAuthority,
              },
              {
                cache: paisaruleV1PreparedCache,
                evidenceRegistry: paisaruleV1PreparedEvidence,

                captureEvidence: () =>
                  capturePaisaruleV1CombinedUsbEvidence(
                    paisaruleV1UsbAuthority,
                    current,
                  ),

                assertEvidenceCurrent: evidence =>
                  assertPaisaruleV1CombinedUsbEvidence(
                    evidence,
                    paisaruleV1UsbAuthority,
                    current,
                  ),

                prepareUsb: () =>
                  preparePaisaruleBackupV1FromUsb(
                    {
                      sender,
                      generation,
                      scope,
                      businessName: principal.businessName,
                      branchName: principal.branchName,
                      isCurrent: current,
                      assertCurrentAuthority,
                    },
                    {
                      usbAuthority: paisaruleV1UsbAuthority,
                      realpath: filePath => fs.realpath(filePath),
                      lstat: filePath => fs.lstat(filePath),
                      readFile: filePath => fs.readFile(filePath),
                      prepare: {
                        cache: paisaruleV1PreparedCache,
                      },
                    },
                  ),
              },
            );

          if (!current()) {
            invalidate();
            return deny("LOGIN_CHANGED");
          }

          return {
            success: true as const,
            cancelled: false as const,
            data: preview,
            errorCode: null,
          };
        } catch {
          // Lifecycle itself clears both registries.
          // Also fail closed for errors before lifecycle.
          invalidate();
          return deny("BACKUP_PREPARE_FAILED");
        }
        } finally {
          paisaruleV1PrepareIpcBusy.delete(sender);
        }
      },
    );
    // PAISARULE_C117_R182_B_DOWNLOAD_IPC
    // Renderer supplies token only. All authority is main-owned.
    ipcMain.handle(
      "paisarule:storage-backup:download",
      async (event, token: unknown) => {
        const sender = event.sender;

        const deny = (errorCode: string) => ({
          success: false as const,
          cancelled: false as const,
          data: null,
          errorCode,
        });

        if (
          !event.senderFrame ||
          event.senderFrame !== sender.mainFrame ||
          !isTrustedRenderer(event.senderFrame)
        ) {
          return deny("UNAUTHORIZED_RENDERER");
        }

        if (
          paisaruleV1PrepareIpcBusy.has(sender) ||
          paisaruleV1DownloadIpcBusy.has(sender)
        ) {
          return deny("BACKUP_DOWNLOAD_ALREADY_RUNNING");
        }

        paisaruleV1DownloadIpcBusy.add(sender);

        const invalidate = () => {
          paisaruleV1PreparedEvidence.clear(sender);
          paisaruleV1PreparedCache.clear(sender);
        };

        try {
          if (
            typeof token !== "string" ||
            !/^[a-f0-9]{48}$/.test(token)
          ) {
            return deny("BACKUP_DOWNLOAD_TOKEN_INVALID");
          }

          const businessSession =
            finoraBusinessSessionsBySender.get(sender);

          const generation =
            finoraAccountBusinessLoginGeneration.get(sender);

          const parentWindow = mainWindow;

          // C117-R182-B-R1: explicit TypeScript narrowing.
          // Never cast undefined to number.
          if (
            !businessSession ||
            typeof generation !== "number" ||
            !Number.isSafeInteger(generation) ||
            generation <= 0 ||
            sender.isDestroyed() ||
            !parentWindow ||
            parentWindow.isDestroyed()
          ) {
            return deny("BUSINESS_SESSION_REQUIRED");
          }

          const current = () =>
            !sender.isDestroyed() &&
            finoraBusinessSessionsBySender.get(sender) ===
              businessSession &&
            finoraAccountBusinessLoginGeneration.get(sender) ===
              generation;

          const verifyCurrent = async () => {
            if (!current()) {
              throw new Error("BACKUP_LOGIN_CHANGED");
            }

            const verification =
              await verifyPaisaruleBackupBusinessSession(
                businessSession.sessionId,
              );

            if (!verification.success || !current()) {
              throw new Error("BACKUP_SERVER_SESSION_INVALID");
            }

            const principal = verification.principal;
            const account =
              getFinoraSenderWalletPrincipal(sender);

            if (
              principal.role !== "OWNER" ||
              principal.storageMode !== "USB" ||
              !account ||
              !(
                ["userId", "ownerId", "businessId", "branchId"] as const
              ).every(key => account[key] === principal[key])
            ) {
              throw new Error("BACKUP_BRANCH_SCOPE_MISMATCH");
            }

            if (
              !isPaisaruleBackupSessionKeyAvailable(
                sender,
                generation,
              )
            ) {
              throw new Error("BACKUP_SESSION_KEY_UNAVAILABLE");
            }

            return principal;
          };

          const principal = await verifyCurrent();

          const scope = {
            userId: principal.userId,
            ownerId: principal.ownerId,
            businessId: principal.businessId,
            branchId: principal.branchId,
          };

          // Consume evidence before the native dialog.
          // Its token, generation and scope are single-use.
          const evidence =
            paisaruleV1PreparedEvidence.take(
              sender,
              token,
              generation,
              scope,
              current,
            );

          await assertPaisaruleV1CombinedUsbEvidence(
            evidence,
            paisaruleV1UsbAuthority,
            current,
          );

          const expectedUsbIdentity =
            evidence.hardware.digest +
            ":" +
            evidence.source.digest;

          // Save precisely the already-prepared artifact.
          // No backup regeneration takes place here.
          return await savePaisarulePreparedBackupV1(
            paisaruleV1PreparedCache,
            {
              sender,
              token,
              generation,
              scope,
              expectedUsbIdentity,
              isCurrent: current,

              assertCurrentAuthority: async () => {
                const latest = await verifyCurrent();

                if (
                  !(
                    ["userId", "ownerId", "businessId", "branchId"] as const
                  ).every(key => latest[key] === scope[key])
                ) {
                  throw new Error(
                    "BACKUP_BRANCH_SCOPE_MISMATCH",
                  );
                }
              },

              getCurrentUsbIdentity: async () => {
                await assertPaisaruleV1CombinedUsbEvidence(
                  evidence,
                  paisaruleV1UsbAuthority,
                  current,
                );

                return expectedUsbIdentity;
              },

              showSaveDialog: async proposedFileName => {
                if (
                  !current() ||
                  parentWindow.isDestroyed()
                ) {
                  throw new Error("BACKUP_LOGIN_CHANGED");
                }

                return dialog.showSaveDialog(
                  parentWindow,
                  {
                    title: "Save PAISARULE Encrypted Backup",
                    defaultPath: path.join(
                      app.getPath("downloads"),
                      proposedFileName,
                    ),
                    filters: [
                      {
                        name: "PAISARULE Encrypted Backup",
                        extensions: ["paisarule"],
                      },
                    ],
                  },
                );
              },

              writeFile: (filePath, contents) =>
                fs.writeFile(filePath, contents),
            },
          );
        } catch (error) {
          const code =
            error instanceof Error &&
            /^BACKUP_[A-Z0-9_]+$/.test(error.message)
              ? error.message
              : "BACKUP_DOWNLOAD_FAILED";

          return deny(code);
        } finally {
          // Clear on success, failure, cancellation or replay.
          invalidate();
          paisaruleV1DownloadIpcBusy.delete(sender);
        }
      },
    );
    ipcMain.handle(
      "paisarule:storage-backup:export",
      async (event) => {
        const deny = (errorCode: string) => ({
          success: false as const,
          cancelled: false as const,
          data: null,
          errorCode,
          error:
            "Business backup could not be created. Check the connected USB and try again.",
        });

        const sender = event.sender;

        if (
          !event.senderFrame ||
          event.senderFrame !== sender.mainFrame ||
          !isTrustedRenderer(event.senderFrame)
        ) {
          return deny("UNAUTHORIZED_RENDERER");
        }

        const businessSession =
          finoraBusinessSessionsBySender.get(sender);

        const generation =
          finoraAccountBusinessLoginGeneration.get(sender);

        const parentWindow = mainWindow;

        if (
          !businessSession ||
          generation === undefined ||
          sender.isDestroyed() ||
          !parentWindow ||
          parentWindow.isDestroyed()
        ) {
          return deny("BUSINESS_SESSION_REQUIRED");
        }

        const current = () =>
          !sender.isDestroyed() &&
          finoraBusinessSessionsBySender.get(sender) === businessSession &&
          finoraAccountBusinessLoginGeneration.get(sender) === generation;

        try {
          if (!current()) {
            return deny("LOGIN_CHANGED");
          }

          const verification =
            await verifyPaisaruleBackupBusinessSession(
              businessSession.sessionId,
            );

          if (!verification.success || !current()) {
            return deny("SERVER_SESSION_INVALID");
          }

          const principal = verification.principal;
          const account =
            getFinoraSenderWalletPrincipal(sender);

          if (
            principal.role !== "OWNER" ||
            principal.storageMode !== "USB" ||
            !account ||
            !(
              ["userId", "ownerId", "businessId", "branchId"] as const
            ).every(key => account[key] === principal[key])
          ) {
            return deny("BRANCH_SCOPE_MISMATCH");
          }

          if (!current()) {
            return deny("LOGIN_CHANGED");
          }

          if (
            !isPaisaruleBackupSessionKeyAvailable(
              sender,
              generation,
            )
          ) {
            return deny("BACKUP_SESSION_KEY_UNAVAILABLE");
          }

          const result =
            await exportPaisaruleStorageBackupV1FromUsb(
              {
                parentWindow,
                sender,
                generation,

                scope: {
                  userId: principal.userId,
                  ownerId: principal.ownerId,
                  businessId: principal.businessId,
                  branchId: principal.branchId,
                },

                businessName: principal.businessName,
                branchName: principal.branchName,

                isCurrent: current,
              },
              {
                resolveUsbRoot:
                  () => findFinoraUsbRoot(),

                realpath:
                  filePath => fs.realpath(filePath),

                lstat:
                  filePath => fs.lstat(filePath),

                readFile:
                  filePath => fs.readFile(filePath),

                showSaveDialog:
                  (_window, options) =>
                    dialog.showSaveDialog(parentWindow, options),

                writeFile:
                  (filePath, contents, encoding) =>
                    fs.writeFile(filePath, contents, encoding),

                getDownloadsPath:
                  () => app.getPath("downloads"),
              },
            );

          if (!current()) {
            return deny("LOGIN_CHANGED");
          }

          if (!result.success) {
            return deny(result.errorCode);
          }

          if (result.cancelled) {
            return {
              success: true as const,
              cancelled: true as const,
              data: null,
              errorCode: null,
              error: null,
            };
          }

          return {
            success: true as const,
            cancelled: false as const,
            data: result.data,
            errorCode: null,
            error: null,
          };
        } catch {
          return deny("BACKUP_EXPORT_FAILED");
        }
      },
    );
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

      ipcMain.handle(channel, async (event, pageInput?: unknown) => {
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

        // FINORA_P1_747M_VERIFIED_PAGINATION
        // No renderer-supplied owner, branch, wallet or URL.
        let historyPage: { limit: number; offset: number } | null = null;

        if (pageInput !== undefined) {
          if (
            pageInput === null ||
            typeof pageInput !== "object" ||
            Array.isArray(pageInput)
          ) {
            return { success: false as const, errorCode: "INVALID_REQUEST" };
          }

          const input = pageInput as Record<string, unknown>;

          if (
            Object.keys(input).length !== 2 ||
            !Object.prototype.hasOwnProperty.call(input, "limit") ||
            !Object.prototype.hasOwnProperty.call(input, "offset") ||
            typeof input.limit !== "number" ||
            typeof input.offset !== "number" ||
            !Number.isSafeInteger(input.limit) ||
            !Number.isSafeInteger(input.offset) ||
            input.limit < 1 ||
            input.limit > 100 ||
            input.offset < 0 ||
            input.offset > 10000000
          ) {
            return { success: false as const, errorCode: "INVALID_REQUEST" };
          }

          historyPage = {
            limit: input.limit,
            offset: input.offset,
          };
        }
        try {
          if (historyPage) {
            return kind === "transactions"
              ? await accountWalletHistoryClient.transactionsPage(
                  matched[1], historyPage
                )
              : await accountWalletHistoryClient.rechargesPage(
                  matched[1], historyPage
                );
          }

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
    // FINORA_P1_725R_IDENTITY
    // Read-only, server-scoped identity. Never accept renderer IDs.
        // FINORA_P1_730J_NUMBERING_RESERVATION
    // Only authenticated Electron Main can contact the server.
    // Renderer supplies only a UUID retry key, never scope or URL.
    ipcMain.handle(
      "finora:account:numbering-reserve",
      async (event, requestKey: unknown) => {
        if (!event.senderFrame || !isTrustedRenderer(event.senderFrame)) {
          return { success: false, errorCode: "UNAUTHORIZED_RENDERER" };
        }
        if (typeof requestKey !== "string" ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestKey)) {
          return { success: false, errorCode: "INVALID_RESERVATION_KEY" };
        }
        const authorization =
          getFinoraSenderWalletAuthorization(event.sender);
        if (!authorization) {
          return { success: false, errorCode: "ACCOUNT_SESSION_REQUIRED" };
        }
        try {
          const response = await fetch(
            "https://api.finoraenterprise.com/owner/numbering/v2/customer-reserve",
            {
              method: "POST",
              headers: {
                Authorization: authorization,
                "Idempotency-Key": requestKey,
                "Content-Type": "application/json",
              },
              body: "{}",
              cache: "no-store",
              signal: AbortSignal.timeout(15000),
            },
          );
          if (!response.ok) {
            return {
              success: false,
              errorCode: response.status === 401
                ? "UNAUTHORIZED"
                : response.status === 503
                  ? "NUMBERING_RESERVATION_UNAVAILABLE"
                  : "NUMBERING_RESERVATION_REJECTED",
            };
          }
          const payload: unknown = await response.json();
          if (!payload || typeof payload !== "object" ||
              Array.isArray(payload)) {
            return { success: false, errorCode: "INVALID_RESERVATION_RESPONSE" };
          }
          const data = payload as Record<string, unknown>;
          const reservation = data.reservation;
          if (data.ok !== true ||
              data.source !== "FINORA_POSTGRESQL_NUMBERING" ||
              typeof data.replay !== "boolean" ||
              !reservation || typeof reservation !== "object" ||
              Array.isArray(reservation)) {
            return { success: false, errorCode: "INVALID_RESERVATION_RESPONSE" };
          }
          const row = reservation as Record<string, unknown>;
          if (!Number.isSafeInteger(row.customerNumber) ||
              (row.customerNumber as number) < 1 ||
              (row.customerNumber as number) > 999999 ||
              typeof row.businessCode !== "string" ||
              !row.businessCode.trim() ||
              typeof row.branchCode !== "string" ||
              !row.branchCode.trim()) {
            return { success: false, errorCode: "INVALID_RESERVATION_FIELDS" };
          }
          return { success: true, data };
        } catch {
          return { success: false, errorCode: "NUMBERING_RESERVATION_UNAVAILABLE" };
        }
      },
    );
// FINORA_P1_729W_NUMBERING_READ
    // The authenticated Wallet session and trusted renderer are
    // enforced in Electron Main. No caller-supplied scope or URL.
    ipcMain.handle(
      "finora:account:numbering-read",
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
            "https://api.finoraenterprise.com/owner/numbering/v2/customer-series",
            {
              method: "GET",
              headers: { Authorization: authorization },
              cache: "no-store",
              signal: AbortSignal.timeout(15000),
            },
          );

          if (!response.ok) {
            return {
              success: false,
              errorCode:
                response.status === 401
                  ? "UNAUTHORIZED"
                  : response.status === 409
                    ? "NUMBERING_NOT_MIGRATED"
                    : "SERVER_NUMBERING_UNAVAILABLE",
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
              errorCode: "INVALID_NUMBERING_RESPONSE",
            };
          }

          const data = payload as Record<string, unknown>;

          if (
            data.ok !== true ||
            data.source !== "FINORA_POSTGRESQL_NUMBERING" ||
            !data.numbering ||
            typeof data.numbering !== "object" ||
            Array.isArray(data.numbering)
          ) {
            return {
              success: false,
              errorCode: "INVALID_NUMBERING_RESPONSE",
            };
          }

          return {
            success: true,
            data,
          };
        } catch {
          return {
            success: false,
            errorCode: "SERVER_NUMBERING_UNAVAILABLE",
          };
        }
      },
    );
    ipcMain.handle(
      "finora:account:business-identity",
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
            "https://api.finoraenterprise.com/owner/wallet/business-identity",
            {
              method: "GET",
              headers: { Authorization: authorization },
              cache: "no-store",
              signal: AbortSignal.timeout(15000),
            },
          );

          if (!response.ok) {
            return {
              success: false,
              errorCode: response.status === 401
                ? "UNAUTHORIZED"
                : "IDENTITY_UNAVAILABLE",
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
              errorCode: "INVALID_IDENTITY_RESPONSE",
            };
          }

          const data = payload as Record<string, unknown>;
          const identity = data.identity;

          if (
            data.ok !== true ||
            data.source !== "FINORA_POSTGRESQL_BUSINESS_IDENTITY" ||
            !identity ||
            typeof identity !== "object" ||
            Array.isArray(identity)
          ) {
            return {
              success: false,
              errorCode: "INVALID_IDENTITY_RESPONSE",
            };
          }

          const row = identity as Record<string, unknown>;

          if (
            !["ownerId", "businessId", "branchId",
              "businessName", "branchName"].every(
                key => typeof row[key] === "string" &&
                  (row[key] as string).trim().length > 0
              ) ||
            row.storageMode !== "USB"
          ) {
            return {
              success: false,
              errorCode: "INVALID_IDENTITY_SCOPE",
            };
          }

          // FINORA_C81_A18_WINDOWS_LABEL_REFRESH
          // Refresh only the authenticated Owner's local saved label.
          // Never take account scope or business name from the renderer.
          // The server identity read must succeed independently of
          // this best-effort encrypted-vault metadata operation.
          // FINORA_C81_A39_SCOPE_VERIFIED_LABEL_REFRESH
          // Business Name belongs to the authenticated Owner/Branch.
          // All saved usernames under this exact scope share that name.
          // The encrypted passwords and timestamps are preserved.
          try {
            const sessionPrincipal =
              getFinoraSenderWalletPrincipal(event.sender);

            if (
              sessionPrincipal &&
              sessionPrincipal.ownerId === row.ownerId &&
              sessionPrincipal.businessId === row.businessId &&
              sessionPrincipal.branchId === row.branchId &&
              typeof row.businessName === "string" &&
              row.businessName.trim().length > 0 &&
              row.businessName.trim().length <= 256
            ) {
              const savedAccounts = await listSavedOwnerLogins();

              for (const saved of savedAccounts) {
                if (
                  saved.ownerId === row.ownerId &&
                  saved.branchId === row.branchId
                ) {
                  await updateSavedOwnerLoginLabel(
                    saved.id,
                    saved.branchId,
                    saved.ownerId,
                    saved.username,
                    row.businessName.trim(),
                  );
                }
              }
            }
          } catch {
            // Metadata refresh is best-effort; never deny Login.
            // Never print or return saved credential material.
          }

          return {
            success: true,
            identity: {
              ownerId: row.ownerId,
              businessId: row.businessId,
              branchId: row.branchId,
              businessName: row.businessName,
              branchName: row.branchName,
              storageMode: "USB",
            },
          };
        } catch {
          return {
            success: false,
            errorCode: "IDENTITY_SERVER_UNAVAILABLE",
          };
        }
      },
    );
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
    // FINORA_P1_752Q_SHARED_SENDER_SCOPE
    // Sender-keyed authorities are declared privately at module scope.

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
        // PAISARULE_C117_R179_B_SESSION_CLEAR
        paisaruleV1PreparedEvidence.clear(event.sender);
        paisaruleV1PreparedCache.clear(event.sender);
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
        // PAISARULE_C117_R179_B_SESSION_CLEAR
        paisaruleV1PreparedEvidence.clear(event.sender);
        paisaruleV1PreparedCache.clear(event.sender);

        // PAISARULE C85-P0-S41-A81:
        // Remove the previous sender key before a new login.
        clearPaisaruleBackupSessionKey(event.sender);

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

          // PAISARULE C85-P0-S41-A81:
          // Prepare a local-only Backup key from the verified
          // original Owner password and server-authoritative scope.
          // Backup preparation must never block ordinary login.
          try {
            const verification =
              await verifyPaisaruleBackupBusinessSession(
                result.session.sessionId,
              );

            if (verification.success) {
              const principal = verification.principal;

              if (
                principal.role === "OWNER" &&
                principal.storageMode === "USB" &&
                principal.userId &&
                principal.ownerId &&
                principal.businessId &&
                principal.branchId
              ) {
                const backupScope = {
                  userId: principal.userId,
                  ownerId: principal.ownerId,
                  businessId: principal.businessId,
                  branchId: principal.branchId,
                };

                const derivedKey =
                  await derivePaisaruleStorageBackupV1Key(
                    candidate.password,
                    backupScope,
                  );

                try {
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

                  setPaisaruleBackupSessionKey(
                    event.sender,
                    businessGeneration,
                    derivedKey,
                    backupScope,
                    verification.expiresAt ?? result.session.expiresAt,
                  );
                } finally {
                  derivedKey.fill(0);
                }
              }
            }
          } catch {
            // Backup remains unavailable if verification or key
            // derivation fails. Ordinary Owner login is unaffected.
          }
          // PAISARULE SESSION-S16:
          // Bind the exact server-verified Owner identity to this
          // Electron sender and Business Session at login.
          const {
            verifyFinoraServerBusinessSession: verifyLoginBusinessSession,
          } = await import(
            "./control/finoraServerBusinessSessionVerifier.js"
          );

          const loginVerification =
            await verifyLoginBusinessSession(result.session.sessionId);

          if (
            !loginVerification.success ||
            loginVerification.principal.role !== "OWNER"
          ) {
            return {
              success: false,
              businessDataAccess: false,
              errorCode: loginVerification.success
                ? "SERVER_IDENTITY_MISMATCH"
                : loginVerification.errorCode,
            };
          }

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

          const boundLoginPrincipal = loginVerification.principal;

          finoraBusinessSessionsBySender.set(event.sender, {
            sessionId: result.session.sessionId,
            expiresAt: result.session.expiresAt,
            principal: {
              userId: boundLoginPrincipal.userId,
              ownerId: boundLoginPrincipal.ownerId,
              businessId: boundLoginPrincipal.businessId,
              branchId: boundLoginPrincipal.branchId,
              storageMode: boundLoginPrincipal.storageMode,
              role: boundLoginPrincipal.role,
            },
          });

          // PAISARULE C117-R178
          // Best-effort device-local preference, AFTER server-verified login.
          // Never block authentication or write to USB storage.
          if (
            process.platform === "win32" &&
            boundLoginPrincipal.storageMode === "USB"
          ) {
            const preferenceSender = event.sender;
            const preferenceGeneration = businessGeneration;
            const preferenceSessionId = result.session.sessionId;
            const preferenceScope = {
              ownerId: boundLoginPrincipal.ownerId,
              businessId: boundLoginPrincipal.businessId,
              branchId: boundLoginPrincipal.branchId,
            };

            let preferenceStage = "START";
            void (async () => {
              const sessionStillCurrent = () => {
                const current =
                  finoraBusinessSessionsBySender.get(preferenceSender);

                return (
                  !preferenceSender.isDestroyed() &&
                  finoraAccountBusinessLoginGeneration.get(
                    preferenceSender,
                  ) === preferenceGeneration &&
                  current?.sessionId === preferenceSessionId &&
                  current.principal.ownerId === preferenceScope.ownerId &&
                  current.principal.businessId === preferenceScope.businessId &&
                  current.principal.branchId === preferenceScope.branchId &&
                  current.principal.storageMode === "USB"
                );
              };

              if (!sessionStillCurrent()) return;

              preferenceStage = "INITIAL_FOLDER_LOOKUP";
              const selectedBranch = await findFinoraUsbRoot();
              if (!selectedBranch || !sessionStillCurrent()) return;

              const branch = path.win32.resolve(selectedBranch);
              const removableRoot = path.win32.parse(branch).root;

              if (
                !/^[A-Za-z]:\\$/.test(removableRoot) ||
                path.win32.dirname(branch).toLowerCase() !==
                  removableRoot.toLowerCase()
              ) {
                return;
              }

              preferenceStage = "BRANCH_AUTH_CHECK";
              await fs.access(
                path.win32.join(
                  branch,
                  FINORA_DIRECTORY,
                  "auth",
                  "finora-branch-auth.bin",
                ),
              );

              const { capturePaisaruleUsbIdentityV1 } = await import(
                "./control/paisaruleStorageBackupV1UsbIdentity.js"
              );

              preferenceStage = "USB_IDENTITY_CAPTURE";
              const identity = await capturePaisaruleUsbIdentityV1(
                removableRoot,
              );

              if (!sessionStillCurrent()) return;

              preferenceStage = "FINAL_FOLDER_RECHECK";
              const latestBranch = await findFinoraUsbRoot();
              if (
                !latestBranch ||
                path.win32.resolve(latestBranch).toLowerCase() !==
                  branch.toLowerCase() ||
                !sessionStillCurrent()
              ) {
                return;
              }

              const { savePaisaruleLastUsbFolderV1 } = await import(
                "./control/paisaruleLastUsbFolderV1.js"
              );

              if (!sessionStillCurrent()) return;

              preferenceStage = "PREFERENCE_FILE_WRITE";
              await savePaisaruleLastUsbFolderV1({
                userData: app.getPath("userData"),
                removableRoot,
                branchRoot: branch,
                identity,
                scope: preferenceScope,
              });

              console.info(
                "[PAISARULE LAST USB] AUTHENTICATED_PREFERENCE_SAVED",
              );
            })().catch((error: unknown) => {
  // PAISARULE C117-R246-R1: no sensitive exception text.
  const candidate =
    error && typeof error === "object"
      ? error as { name?: unknown; code?: unknown }
      : null;

  const safeNames = new Set([
    "Error", "TypeError", "RangeError", "SyntaxError"
  ]);
  const safeCodes = new Set([
    "ENOENT", "EACCES", "EPERM", "EEXIST",
    "EINVAL", "ENOTDIR", "EROFS", "EBUSY", "EXDEV"
  ]);

  const errorType =
    typeof candidate?.name === "string" &&
    safeNames.has(candidate.name)
      ? candidate.name
      : "OTHER";

  const errorCode =
    typeof candidate?.code === "string" &&
    safeCodes.has(candidate.code)
      ? candidate.code
      : "OTHER";

  // C117-R249: emit only a recognized internal error code.
  // Never print arbitrary error.message, paths or credentials.
  const knownReasons = new Set([
    "LAST_USB_INPUT_INVALID",
    "LAST_USB_FOLDER_INVALID",
    "LAST_USB_FOLDER_SCOPE_INVALID",
    "LAST_USB_IDENTITY_INSUFFICIENT",
    "LAST_USB_STORE_TOO_LARGE",
    "LAST_USB_STORE_INVALID",
    "RESTORE_IDENTITY_ROOT_INVALID",
    "RESTORE_IDENTITY_FIELD_INVALID",
    "RESTORE_IDENTITY_NUMBER_INVALID",
    "RESTORE_IDENTITY_CAPTURE_FAILED",
    "RESTORE_IDENTITY_JSON_INVALID",
    "RESTORE_IDENTITY_OBJECT_INVALID",
    "RESTORE_IDENTITY_INSUFFICIENT",
    "RESTORE_IDENTITY_EXPECTED_MISSING",
  ]);

  const failureReason =
    error instanceof Error &&
    (knownReasons.has(error.message) ||
      /^(?:RESTORE|LAST_USB|USB|PAISARULE)_[A-Z0-9_]{3,72}$/.test(error.message))
      ? error.message
      : "UNCLASSIFIED_FAILURE";

  console.warn(
    "[PAISARULE LAST USB] PREFERENCE_SAVE_SKIPPED",
    { errorType, errorCode, failureReason, stage: preferenceStage },
  );
});
          }

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

        // PAISARULE C85-P0-S41-A81: clear local Backup key on logout.
        clearPaisaruleBackupSessionKey(event.sender);
        clearFinoraSenderWallet(event.sender);
        finoraBusinessSessionsBySender.delete(event.sender);
        // PAISARULE_C117_R179_B_SESSION_CLEAR
        paisaruleV1PreparedEvidence.clear(event.sender);
        paisaruleV1PreparedCache.clear(event.sender);

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
            // PAISARULE_C117_R179_B_SESSION_CLEAR
            paisaruleV1PreparedEvidence.clear(event.sender);
            paisaruleV1PreparedCache.clear(event.sender);
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
            // PAISARULE_C117_R179_B_SESSION_CLEAR
            paisaruleV1PreparedEvidence.clear(event.sender);
            paisaruleV1PreparedCache.clear(event.sender);
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
              {
                verifyFinoraServerBusinessSession,
                touchFinoraServerBusinessSession, // FINORA_C80_AUTH_R29_R2_TOUCH_WIRING
              },
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
                    touchFinoraServerBusinessSession,
                    businessSession.sessionId,
                  );

            // FINORA_P1_726R_NETWORK_RETRY
            // A temporary server outage must not revoke the local
            // session handle. This request still FAILS CLOSED.
            if (!result.success) {
              if (
                current() &&
                result.errorCode === "SERVER_UNAVAILABLE"
              ) {
                return deny("SERVER_UNAVAILABLE");
              }
              // FINORA_P1_751N2_PRESERVE_GUARD_REASON
              invalidateFinoraServerReceptionSession(sender, sessionId);
              return deny(result.errorCode);
            }
            if (!current()) {
              invalidateFinoraServerReceptionSession(sender, sessionId);
              return deny("SESSION_REVALIDATION_DENIED");
            }

            const account =
              getFinoraSenderWalletPrincipal(sender);

            // PAISARULE SESSION-S16:
            // The server-verified, login-generation-bound identity
            // remains authoritative even after an independent
            // 30-minute Wallet credential expires.
            const boundPrincipal = businessSession.principal;
            const verified = {
              success: true as const,
              principal: result.principal,
            };

            const serverScopeMatches =
              boundPrincipal.role === "OWNER" &&
              verified.principal.role === "OWNER" &&
              boundPrincipal.storageMode === verified.principal.storageMode &&
              (["userId", "ownerId", "businessId", "branchId"] as const)
                .every(key =>
                  boundPrincipal[key] === verified.principal[key]
                );

            const walletScopeMatches =
              !account ||
              (["userId", "ownerId", "businessId", "branchId"] as const)
                .every(key => account[key] === verified.principal[key]);

            if (
              !current() ||
              !serverScopeMatches ||
              !walletScopeMatches
            ) {
              console.warn("[PAISARULE SESSION-S16 SCOPE DIAG]", {
                loginGenerationCurrent: current(),
                serverScopeMatches,
                walletPresent: Boolean(account),
                walletScopeMatches,
              });
              invalidateFinoraServerReceptionSession(sender, sessionId);
              return deny("SESSION_SCOPE_CHANGED");
            }

            // PAISARULE SESSION-S20-R33
            // Wallet rotation is allowed only after a successful,
            // authenticated Reception touch and matching server scope.
            // Server-authorized rotation; emergency opt-out with flag 0.
            if (
              operation === "touch" &&
              account &&
              process.env.PAISARULE_WALLET_ROTATION_ENABLED !== "0"
            ) {
              try {
                const [
                  { rotateFinoraSenderWalletIfDue },
                  { createFinoraWalletRotationClient },
                ] = await Promise.all([
                  import("./control/finoraSenderWalletSession.js"),
                  import("./control/finoraWalletRotationClient.js"),
                ]);

                if (!current()) {
                  return deny("LOGIN_CHANGED");
                }

                const rotation = await rotateFinoraSenderWalletIfDue(
                  sender,
                  businessSession.sessionId,
                  {
                    userId: verified.principal.userId,
                    ownerId: verified.principal.ownerId,
                    businessId: verified.principal.businessId,
                    branchId: verified.principal.branchId,
                  },
                  createFinoraWalletRotationClient(
                    "https://api.finoraenterprise.com",
                  ),
                );

                if (!current()) {
                  return deny("LOGIN_CHANGED");
                }

                if (!rotation.success) {
                  // Do not log tokens, session IDs or identities.
                  // A failed Wallet rotation never grants authorization.
                  console.warn("[PAISARULE WALLET ROTATION]", {
                    success: false,
                    errorCode: rotation.errorCode,
                  });
                }
              } catch {
                if (!current()) {
                  return deny("LOGIN_CHANGED");
                }

                console.warn(
                  "[PAISARULE WALLET ROTATION UNAVAILABLE]",
                );
              }
            }
            return {
              success: true as const,
              sessionId,
              principal: verified.principal,
              expiresAt: result.expiresAt,
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
            // FINORA_P1_752A_FAIL_CLOSED_RECOVERY
            // Unexpected verification failures never grant access.
            // Keep the session handle for a fresh server check rather
            // than converting an unconfirmed failure into a logout.
            return deny("SERVER_UNAVAILABLE");
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
            // PAISARULE_C117_R179_B_SESSION_CLEAR
            paisaruleV1PreparedEvidence.clear(event.sender);
            paisaruleV1PreparedCache.clear(event.sender);
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
        // FINORA_P1_752E_VERIFIED_SENDER_WALLET
        // Password-only server authentication; no Reception grant.
        // Retain only if the exact Main Login scope matches.
        const ownerSender = mainWindow?.webContents;
        if (ownerSender && !ownerSender.isDestroyed()) {
          try {
            const senderResult = await establishFinoraSenderWallet(
              ownerSender,
              session.oneTimeCredentials.username,
              session.oneTimeCredentials.password,
            );

            const senderPrincipal = senderResult.success
              ? getFinoraSenderWalletPrincipal(ownerSender)
              : null;

            const scopeMatches =
              !!senderPrincipal &&
              senderPrincipal.userId === session.userId &&
              senderPrincipal.ownerId === session.ownerId &&
              senderPrincipal.businessId === session.businessId &&
              senderPrincipal.branchId === session.branchId;

            if (!scopeMatches || ownerSender.isDestroyed()) {
              clearFinoraSenderWallet(ownerSender);
            }

            if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
              console.info("[FINORA SENDER WALLET HANDOFF]", {
                success: scopeMatches && !ownerSender.isDestroyed(),
                errorCode: senderResult.success
                  ? scopeMatches ? "NONE" : "SCOPE_MISMATCH"
                  : senderResult.errorCode ?? "AUTHENTICATION_FAILED",
              });
            }
          } catch {
            clearFinoraSenderWallet(ownerSender);
          }
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
            // FINORA_P1_751Z_ACCOUNT_WALLET_PRESERVATION
            // Legacy Wallet failure must not erase a separately
            // server-authenticated Account Wallet session.
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
