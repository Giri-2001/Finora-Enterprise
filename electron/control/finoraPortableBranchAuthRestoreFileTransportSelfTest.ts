/* ============================================================
   FINORA ENTERPRISE

   Phase 5.6O-O3A
   Native Restore File Transport SelfTest
   ============================================================ */

import {
  app,
} from "electron";

import type {
  BrowserWindow,
} from "electron";

import {
  mkdtemp,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  join,
} from "node:path";

import {
  tmpdir,
} from "node:os";

import {
  FINORA_PORTABLE_BRANCH_AUTH_BACKUP_MAX_FILE_BYTES,
} from "./finoraPortableBranchAuthBackupContract.js";

import {
  FinoraPortableBranchAuthStoreError,
} from "./finoraPortableBranchAuthStore.js";

import {
  restoreFinoraPortableBranchAuthFromNativeBackup,
} from "./finoraPortableBranchAuthRestoreFileTransport.js";

import type {
  FinoraPortableBranchAuthRestoreFileTransportDependencies,
} from "./finoraPortableBranchAuthRestoreFileTransport.js";

function assert(
  condition:
    unknown,
  message:
    string,
): asserts condition {
  if (!condition) {
    throw new Error(
      message,
    );
  }
}

function pass(
  message:
    string,
): void {
  console.log(
    `PASS: ${message}`,
  );
}

const fakeParentWindow =
  {
    isDestroyed:
      () =>
        false,
  } as unknown as BrowserWindow;

const destroyedParentWindow =
  {
    isDestroyed:
      () =>
        true,
  } as unknown as BrowserWindow;

const credentials = {
  username:
    "owner",

  password:
    "Password-123",

  securityCode:
    "Security-123",
};

async function main():
  Promise<void> {

  await app.whenReady();

  const tempRoot =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-restore-o3a-",
      ),
    );

  try {
    const validBackupPath =
      join(
        tempRoot,
        "branch-backup.finora",
      );

    const wrongExtensionPath =
      join(
        tempRoot,
        "branch-backup.txt",
      );

    const oversizedBackupPath =
      join(
        tempRoot,
        "oversized.finora",
      );

    await writeFile(
      validBackupPath,
      "VALID_PRIVILEGED_BACKUP_BYTES",
      "utf8",
    );

    await writeFile(
      wrongExtensionPath,
      "INVALID_EXTENSION",
      "utf8",
    );

    await writeFile(
      oversizedBackupPath,
      Buffer.alloc(
        FINORA_PORTABLE_BRANCH_AUTH_BACKUP_MAX_FILE_BYTES +
          1,
        0x41,
      ),
    );

    // ========================================================
    // INVALID REQUEST FAILS BEFORE NATIVE SELECTION
    // ========================================================

    {
      let selectionCalls =
        0;

      const dependencies:
        FinoraPortableBranchAuthRestoreFileTransportDependencies =
        {
          parentWindow:
            fakeParentWindow,

          resolveLocalRoot:
            () =>
              tempRoot,

          async validateUsbRoot() {
            return true;
          },

          async selectBackupFile() {
            selectionCalls +=
              1;

            return validBackupPath;
          },
        };

      const result =
        await restoreFinoraPortableBranchAuthFromNativeBackup(
          {
            ...credentials,

            branchId:
              "renderer-injected",
          },
          dependencies,
        );

      assert(
        !result.success &&
        result.errorCode ===
          "INVALID_REQUEST",
        "Injected renderer authority must fail.",
      );

      assert(
        selectionCalls ===
          0,
        "Invalid renderer request must fail before native file selection.",
      );

      pass(
        "renderer Restore request is exact credential-only shape and fails before native selection when polluted",
      );
    }

    // ========================================================
    // DESTROYED PARENT WINDOW
    // ========================================================

    {
      let selectionCalls =
        0;

      const result =
        await restoreFinoraPortableBranchAuthFromNativeBackup(
          credentials,
          {
            parentWindow:
              destroyedParentWindow,

            resolveLocalRoot:
              () =>
                tempRoot,

            async validateUsbRoot() {
              return true;
            },

            async selectBackupFile() {
              selectionCalls +=
                1;

              return validBackupPath;
            },
          },
        );

      assert(
        !result.success &&
        result.errorCode ===
          "PARENT_WINDOW_UNAVAILABLE",
        "Destroyed parent window must fail closed.",
      );

      assert(
        selectionCalls ===
          0,
        "Destroyed window must fail before file picker.",
      );

      pass(
        "missing/destroyed parent window fails before native Restore selection",
      );
    }

    // ========================================================
    // BACKUP FILE CANCELLATION
    // ========================================================

    {
      let coordinatorCalls =
        0;

      const result =
        await restoreFinoraPortableBranchAuthFromNativeBackup(
          credentials,
          {
            parentWindow:
              fakeParentWindow,

            resolveLocalRoot:
              () =>
                tempRoot,

            async validateUsbRoot() {
              return true;
            },

            async selectBackupFile() {
              return null;
            },

            async restoreCoordinator() {
              coordinatorCalls +=
                1;

              throw new Error(
                "Coordinator must not run.",
              );
            },
          },
        );

      assert(
        result.success &&
        result.cancelled,
        "Native Backup cancellation must remain cancellation.",
      );

      assert(
        coordinatorCalls ===
          0,
        "Cancelled file selection must not invoke O2.",
      );

      pass(
        "native Backup file cancellation performs no Restore coordinator call",
      );
    }

    // ========================================================
    // EXTENSION ENFORCEMENT
    // ========================================================

    {
      let coordinatorCalls =
        0;

      const result =
        await restoreFinoraPortableBranchAuthFromNativeBackup(
          credentials,
          {
            parentWindow:
              fakeParentWindow,

            resolveLocalRoot:
              () =>
                tempRoot,

            async validateUsbRoot() {
              return true;
            },

            async selectBackupFile() {
              return wrongExtensionPath;
            },

            async restoreCoordinator() {
              coordinatorCalls +=
                1;

              throw new Error(
                "Coordinator must not run.",
              );
            },
          },
        );

      assert(
        !result.success &&
        result.errorCode ===
          "BACKUP_FILE_INVALID",
        "Wrong extension must reject.",
      );

      assert(
        coordinatorCalls ===
          0,
        "Wrong extension must reject before O2.",
      );

      pass(
        "native Restore enforces exact .finora extension before privileged Backup processing",
      );
    }

    // ========================================================
    // BOUNDED FILE READ
    // ========================================================

    {
      let coordinatorCalls =
        0;

      const result =
        await restoreFinoraPortableBranchAuthFromNativeBackup(
          credentials,
          {
            parentWindow:
              fakeParentWindow,

            resolveLocalRoot:
              () =>
                tempRoot,

            async validateUsbRoot() {
              return true;
            },

            async selectBackupFile() {
              return oversizedBackupPath;
            },

            async restoreCoordinator() {
              coordinatorCalls +=
                1;

              throw new Error(
                "Coordinator must not run.",
              );
            },
          },
        );

      assert(
        !result.success &&
        result.errorCode ===
          "BACKUP_FILE_INVALID",
        "Oversized Backup must reject.",
      );

      assert(
        coordinatorCalls ===
          0,
        "Oversized Backup must fail before O2.",
      );

      pass(
        "native Restore rejects Backup files above the canonical bounded size before coordinator execution",
      );
    }

    // ========================================================
    // LOCAL RESTORE — ZERO USB SELECTION
    // ========================================================

    {
      let usbSelections =
        0;

      let localRootResolutions =
        0;

      let backupBytesObserved =
        "";

      const result =
        await restoreFinoraPortableBranchAuthFromNativeBackup(
          credentials,
          {
            parentWindow:
              fakeParentWindow,

            resolveLocalRoot() {
              localRootResolutions +=
                1;

              return tempRoot;
            },

            async validateUsbRoot() {
              return true;
            },

            async selectBackupFile() {
              return validBackupPath;
            },

            async selectUsbTargetRoot() {
              usbSelections +=
                1;

              return {
                success:
                  true,

                cancelled:
                  false,

                root:
                  "E:\\",
              };
            },

            createPortableStore(
              storeDependencies,
            ) {
              return {
                async write(
                  storageMode,
                ) {
                  assert(
                    storageMode ===
                      "LOCAL",
                    "LOCAL scenario must write LOCAL.",
                  );

                  const root =
                    storeDependencies.resolveLocalRoot();

                  assert(
                    root ===
                      tempRoot,
                    "LOCAL root must come from main-process authority.",
                  );
                },

                async read(
                  storageMode,
                ) {
                  assert(
                    storageMode ===
                      "LOCAL",
                    "LOCAL scenario must read LOCAL.",
                  );

                  const root =
                    storeDependencies.resolveLocalRoot();

                  assert(
                    root ===
                      tempRoot,
                    "LOCAL readback must use authoritative local root.",
                  );

                  return {
                    local:
                      true,
                  } as never;
                },
              };
            },

            async restoreCoordinator(
              input,
              coordinatorDependencies,
            ) {
              const value =
                input as {
                  serializedBackup:
                    string;
                };

              backupBytesObserved =
                value.serializedBackup;

              await coordinatorDependencies.portableStore.write(
                "LOCAL",
                {
                  local:
                    true,
                } as never,
              );

              await coordinatorDependencies.portableStore.read(
                "LOCAL",
              );

              return {
                success:
                  true,

                data: {
                  backupId:
                    "backup-local",

                  storageMode:
                    "LOCAL",

                  authGeneration:
                    5,
                },
              };
            },
          },
        );

      assert(
        result.success &&
        !result.cancelled,
        "LOCAL Restore transport should succeed.",
      );

      assert(
        usbSelections ===
          0,
        "LOCAL Restore must never prompt for USB target.",
      );

      assert(
        localRootResolutions ===
          2,
        "LOCAL write/readback should resolve authoritative local root.",
      );

      assert(
        backupBytesObserved ===
          "VALID_PRIVILEGED_BACKUP_BYTES",
        "O2 must receive native-read privileged Backup bytes.",
      );

      assert(
        result.data.fileName ===
          "branch-backup.finora",
        "Public result may expose basename only.",
      );

      pass(
        "LOCAL Restore uses authoritative LOCAL root and never opens USB target selection",
      );
    }

    // ========================================================
    // USB RESTORE — ONE TARGET SELECTION, CACHED FOR READBACK
    // ========================================================

    {
      let usbSelections =
        0;

      const roots:
        string[] =
        [];

      const result =
        await restoreFinoraPortableBranchAuthFromNativeBackup(
          credentials,
          {
            parentWindow:
              fakeParentWindow,

            resolveLocalRoot:
              () =>
                tempRoot,

            async validateUsbRoot() {
              return true;
            },

            async selectBackupFile() {
              return validBackupPath;
            },

            async selectUsbTargetRoot() {
              usbSelections +=
                1;

              return {
                success:
                  true,

                cancelled:
                  false,

                root:
                  "E:\\",
              };
            },

            createPortableStore(
              storeDependencies,
            ) {
              return {
                async write(
                  storageMode,
                ) {
                  assert(
                    storageMode ===
                      "USB",
                    "USB scenario must write USB.",
                  );

                  const root =
                    await storeDependencies.resolveUsbRoot();

                  roots.push(
                    root ??
                    "",
                  );
                },

                async read(
                  storageMode,
                ) {
                  assert(
                    storageMode ===
                      "USB",
                    "USB scenario must read USB.",
                  );

                  const root =
                    await storeDependencies.resolveUsbRoot();

                  roots.push(
                    root ??
                    "",
                  );

                  return {
                    usb:
                      true,
                  } as never;
                },
              };
            },

            async restoreCoordinator(
              _input,
              coordinatorDependencies,
            ) {
              await coordinatorDependencies.portableStore.write(
                "USB",
                {
                  usb:
                    true,
                } as never,
              );

              await coordinatorDependencies.portableStore.read(
                "USB",
              );

              return {
                success:
                  true,

                data: {
                  backupId:
                    "backup-usb",

                  storageMode:
                    "USB",

                  authGeneration:
                    5,
                },
              };
            },
          },
        );

      assert(
        result.success &&
        !result.cancelled,
        "USB Restore transport should succeed.",
      );

      assert(
        usbSelections ===
          1,
        "USB Restore target must be selected exactly once.",
      );

      assert(
        roots.length ===
          2 &&
        roots[0] ===
          "E:\\" &&
        roots[1] ===
          "E:\\",
        "Write and readback must use the exact same cached USB root.",
      );

      pass(
        "USB Restore selects one approved TARGET root and reuses it for write plus readback",
      );
    }

    // ========================================================
    // USB TARGET CANCELLATION
    // ========================================================

    {
      let usbSelections =
        0;

      const result =
        await restoreFinoraPortableBranchAuthFromNativeBackup(
          credentials,
          {
            parentWindow:
              fakeParentWindow,

            resolveLocalRoot:
              () =>
                tempRoot,

            async validateUsbRoot() {
              return true;
            },

            async selectBackupFile() {
              return validBackupPath;
            },

            async selectUsbTargetRoot() {
              usbSelections +=
                1;

              return {
                success:
                  true,

                cancelled:
                  true,

                root:
                  null,
              };
            },

            createPortableStore(
              storeDependencies,
            ) {
              return {
                async write() {
                  const root =
                    await storeDependencies.resolveUsbRoot();

                  if (!root) {
                    throw new FinoraPortableBranchAuthStoreError(
                      "STORAGE_UNAVAILABLE",
                      "No Restore target.",
                    );
                  }
                },

                async read() {
                  return null;
                },
              };
            },

            async restoreCoordinator(
              _input,
              coordinatorDependencies,
            ) {
              try {
                await coordinatorDependencies.portableStore.write(
                  "USB",
                  {
                    usb:
                      true,
                  } as never,
                );
              }
              catch {
                return {
                  success:
                    false,

                  errorCode:
                    "TARGET_UNAVAILABLE",

                  error:
                    "Target unavailable.",
                };
              }

              throw new Error(
                "Cancellation scenario unexpectedly wrote target.",
              );
            },
          },
        );

      assert(
        result.success &&
        result.cancelled,
        "USB target cancellation must remain native cancellation.",
      );

      assert(
        usbSelections ===
          1,
        "Cancelled USB target picker should run once.",
      );

      pass(
        "USB target cancellation is preserved without fabricated Restore failure or success",
      );
    }

    // ========================================================
    // USB TARGET SELECTION FAILURE
    // ========================================================

    {
      const result =
        await restoreFinoraPortableBranchAuthFromNativeBackup(
          credentials,
          {
            parentWindow:
              fakeParentWindow,

            resolveLocalRoot:
              () =>
                tempRoot,

            async validateUsbRoot() {
              return true;
            },

            async selectBackupFile() {
              return validBackupPath;
            },

            async selectUsbTargetRoot() {
              return {
                success:
                  false,

                cancelled:
                  false,

                root:
                  null,

                error:
                  "Invalid USB root.",
              };
            },

            createPortableStore(
              storeDependencies,
            ) {
              return {
                async write() {
                  const root =
                    await storeDependencies.resolveUsbRoot();

                  if (!root) {
                    throw new Error(
                      "USB selection failed.",
                    );
                  }
                },

                async read() {
                  return null;
                },
              };
            },

            async restoreCoordinator(
              _input,
              coordinatorDependencies,
            ) {
              try {
                await coordinatorDependencies.portableStore.write(
                  "USB",
                  {
                    usb:
                      true,
                  } as never,
                );
              }
              catch {
                return {
                  success:
                    false,

                  errorCode:
                    "TARGET_WRITE_FAILED",

                  error:
                    "Target write failed.",
                };
              }

              throw new Error(
                "Failed USB selection unexpectedly reached success.",
              );
            },
          },
        );

      assert(
        !result.success &&
        result.errorCode ===
          "TARGET_SELECTION_FAILED",
        "USB selection authority failure must be surfaced safely.",
      );

      assert(
        !result.error.includes(
          "Invalid USB root.",
        ),
        "Internal USB selector detail must not leak.",
      );

      pass(
        "USB target-selection failure is sanitized and leaks no selected path or internal detail",
      );
    }

    // ========================================================
    // DOWNSTREAM O2 FAILURE PRESERVED
    // ========================================================

    {
      const result =
        await restoreFinoraPortableBranchAuthFromNativeBackup(
          credentials,
          {
            parentWindow:
              fakeParentWindow,

            resolveLocalRoot:
              () =>
                tempRoot,

            async validateUsbRoot() {
              return true;
            },

            async selectBackupFile() {
              return validBackupPath;
            },

            async restoreCoordinator() {
              return {
                success:
                  false,

                errorCode:
                  "STALE_BACKUP",

                error:
                  "This FINORA backup is older than current authority.",
              };
            },
          },
        );

      assert(
        !result.success &&
        result.errorCode ===
          "STALE_BACKUP",
        "O2 security failure code should be preserved.",
      );

      pass(
        "native transport preserves sanitized O2 Restore security failure codes",
      );
    }

    console.log(
      "PASS: 5.6O-O3A Portable Branch Auth native Restore file transport executable proof",
    );
  }
  finally {
    await rm(
      tempRoot,
      {
        recursive:
          true,

        force:
          true,
      },
    );
  }
}

void main().then(
  () => {
    app.quit();
  },
  (
    error:
      unknown,
  ) => {
    console.error(
      error,
    );

    process.exitCode =
      1;

    app.quit();
  },
);