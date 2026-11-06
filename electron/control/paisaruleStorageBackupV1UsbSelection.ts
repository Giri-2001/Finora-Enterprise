import path from "node:path";
import { dialog, type BrowserWindow } from "electron";

import {
  inspectPaisarulePhysicalUsbV1,
  assertPaisaruleDistinctUsbDevicesV1,
  assertPaisaruleEmptyTargetUsbV1,
} from "./paisaruleStorageBackupV1UsbDeviceAuthority.js";

export interface PaisaruleUsbSelectionAuthorityV1 {
  // Active source USB, if actually present.
  sourceUsbRoot: string | null;

  // Must originate from independently authenticated
  // server-side Owner recovery, never the renderer.
  sourceAbsentRecoveryAuthorized: boolean;

  // Recheck authenticated Owner session before selection
  // and at every subsequent privileged boundary.
  assertCurrentOwnerSession(): Promise<void>;
}

export interface PaisaruleSelectedUsbV1 {
  targetRoot: string;

  // Disk number is session-local; revalidate frequently.
  diskNumber: number;

  assertPinnedTarget(): Promise<void>;
  assertDifferentFromSource(): Promise<void>;
}

function fail(code: string): never {
  throw new Error(code);
}

function normalizeRoot(value: string): string {
  if (
    process.platform !== "win32" ||
    typeof value !== "string" ||
    !/^[A-Za-z]:\\$/.test(value)
  ) {
    return fail("RESTORE_SELECTED_ROOT_INVALID");
  }

  return value.toUpperCase();
}

/**
 * Main-process native selection of a NEW EMPTY USB.
 *
 * Never accepts the target path from renderer IPC.
 * Does not write to, initialize, format or erase USB.
 *
 * This is a selection authority, not permission
 * to restore. Commit requires separate backup
 * authentication and portable-auth provisioning.
 */
export async function selectPaisaruleNewUsbV1(
  parentWindow: BrowserWindow,
  authority: PaisaruleUsbSelectionAuthorityV1,
): Promise<PaisaruleSelectedUsbV1 | null> {
  if (
    !parentWindow ||
    parentWindow.isDestroyed() ||
    !authority ||
    typeof authority.assertCurrentOwnerSession !== "function" ||
    typeof authority.sourceAbsentRecoveryAuthorized !== "boolean"
  ) {
    return fail("RESTORE_SELECTION_AUTHORITY_INVALID");
  }

  const source = authority.sourceUsbRoot;

  if (
    source !== null &&
    (
      typeof source !== "string" ||
      !path.win32.isAbsolute(source) ||
      source.startsWith("\\\\")
    )
  ) {
    return fail("RESTORE_SOURCE_ROOT_INVALID");
  }

  // For a lost/disconnected OLD USB, a separate privileged
  // server recovery must explicitly authorize that condition.
  if (
    source === null &&
    !authority.sourceAbsentRecoveryAuthorized
  ) {
    return fail("RESTORE_SOURCE_RECOVERY_NOT_AUTHORIZED");
  }

  await authority.assertCurrentOwnerSession();

  const selection = await dialog.showOpenDialog(
    parentWindow,
    {
      title: "PAISARULE - Select NEW EMPTY USB",
      buttonLabel: "Select New USB",
      properties: [
        "openDirectory",
        "dontAddToRecent",
      ],
    },
  );

  await authority.assertCurrentOwnerSession();

  if (selection.canceled) {
    return null;
  }

  if (selection.filePaths.length !== 1) {
    return fail("RESTORE_USB_SELECTION_INVALID");
  }

  const selected = selection.filePaths[0];

  if (!selected) {
    return fail("RESTORE_USB_SELECTION_INVALID");
  }

  // The native picker must select E:\ itself,
  // not an arbitrary subfolder or OS drive.
  const targetRoot = normalizeRoot(selected);

  const target = await assertPaisaruleEmptyTargetUsbV1(
    targetRoot,
  );

  if (source !== null) {
    await assertPaisaruleDistinctUsbDevicesV1(
      source,
      targetRoot,
    );
  }

  await authority.assertCurrentOwnerSession();

  const pinnedDisk = target.diskNumber;
  const pinnedIdentity = target.deviceIdentity;

  const assertPinnedTarget = async (): Promise<void> => {
    await authority.assertCurrentOwnerSession();

    const current = await inspectPaisarulePhysicalUsbV1(
      targetRoot,
    );

    if (
      current.root !== targetRoot ||
      current.diskNumber !== pinnedDisk ||
      current.deviceIdentity !== pinnedIdentity
    ) {
      fail("RESTORE_TARGET_USB_CHANGED");
    }
  };

  const assertDifferentFromSource =
    async (): Promise<void> => {
      await assertPinnedTarget();

      if (source !== null) {
        await assertPaisaruleDistinctUsbDevicesV1(
          source,
          targetRoot,
        );
      } else if (!authority.sourceAbsentRecoveryAuthorized) {
        fail("RESTORE_SOURCE_RECOVERY_NOT_AUTHORIZED");
      }
    };

  await assertDifferentFromSource();

  return {
    targetRoot,
    diskNumber: pinnedDisk,
    assertPinnedTarget,
    assertDifferentFromSource,
  };
}