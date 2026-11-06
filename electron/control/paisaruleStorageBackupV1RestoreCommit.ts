import path from "node:path";

import {
  commitPaisaruleV1ToNewEmptyUsb,
} from "./paisaruleStorageBackupV1RestoreUsbTransaction.js";

// PAISARULE_R175_C67_R2
import {
  verifyPaisaruleNewRemovableUsbRoot,
} from "./paisaruleStorageBackupV1RestoreUsbAuthority.js";

import {
  capturePaisaruleUsbIdentityV1,
  assertPaisaruleUsbIdentityUnchangedV1,
} from "./paisaruleStorageBackupV1UsbIdentity.js";

import type {
  PaisaruleVerifiedRestoreFilesV1,
} from "./paisaruleStorageBackupV1RestorePayload.js";

// ============================================================
// PAISARULE_R175_C45
// WINDOWS V1 RESTORE - GUARDED NATIVE COMMIT ADAPTER
//
// Electron Main only.
//
// The caller MUST authenticate the Owner and branch,
// obtain the native active business USB root, and provide
// verified decrypted V1 storage files.
//
// Neither the active root nor file bytes may be authorized
// using renderer-controlled identity claims.
// ============================================================

export interface PaisaruleRestoreCommitContextV1 {
  getActiveBusinessUsbRoot(): Promise<string | null>;
}

function fail(code: string): never {
  throw new Error(code);
}

function driveRootOf(value: string): string {
  if (
    typeof value !== "string" ||
    value.length === 0
  ) {
    fail("RESTORE_ACTIVE_USB_ROOT_INVALID");
  }

  const root = path.win32.parse(value).root;

  if (!/^[A-Za-z]:\\$/.test(root)) {
    fail("RESTORE_ACTIVE_USB_ROOT_UNSUPPORTED");
  }

  return root.toUpperCase();
}

export async function commitPaisaruleVerifiedV1ToNewUsb(
  selectedNewUsbRoot: string,
  verifiedFiles: PaisaruleVerifiedRestoreFilesV1,
  context: PaisaruleRestoreCommitContextV1,
): Promise<void> {
  if (
    process.platform !== "win32" ||
    typeof selectedNewUsbRoot !== "string" ||
    !/^[A-Za-z]:\\$/.test(selectedNewUsbRoot) ||
    !context ||
    typeof context.getActiveBusinessUsbRoot !== "function"
  ) {
    fail("RESTORE_COMMIT_CONTEXT_INVALID");
  }

  // A target must be a drive root, never a business folder.
  const targetRoot = selectedNewUsbRoot.toUpperCase();

  // Resolve active business storage from native authority,
  // never from a renderer-provided account or path.
  const activeRoot =
    await context.getActiveBusinessUsbRoot();

  if (activeRoot !== null) {
    if (
      typeof activeRoot !== "string" ||
      driveRootOf(activeRoot) === targetRoot
    ) {
      fail("RESTORE_TARGET_IS_ACTIVE_BUSINESS_USB");
    }
  }

  // Independently verify removable USB disk via Windows
  // disk/partition information. No cached-drive acceptance.
  // Capture the selected removable USB identity.
  // The identity module also verifies USB BusType.
  const targetIdentity =
    await capturePaisaruleUsbIdentityV1(
      selectedNewUsbRoot,
    );

  // Recheck native active business USB immediately before
  // delegating to the exclusive-write transaction.
  const latestActiveRoot =
    await context.getActiveBusinessUsbRoot();

  if (latestActiveRoot !== null) {
    if (
      typeof latestActiveRoot !== "string" ||
      driveRootOf(latestActiveRoot) === targetRoot
    ) {
      fail("RESTORE_TARGET_BECAME_ACTIVE_BUSINESS_USB");
    }
  }

  // Fail if the disk, partition or volume identity
  // changed after the initial capture.
  await assertPaisaruleUsbIdentityUnchangedV1(
    selectedNewUsbRoot,
    targetIdentity,
  );

  await commitPaisaruleV1ToNewEmptyUsb(
    selectedNewUsbRoot,
    verifiedFiles,
    {
      verifyRemovableDriveRoot:
        verifyPaisaruleNewRemovableUsbRoot,

      // PAISARULE_R175_C68
      assertTargetIdentity: () =>
        assertPaisaruleUsbIdentityUnchangedV1(
          selectedNewUsbRoot,
          targetIdentity,
        ),
    },
  );
}