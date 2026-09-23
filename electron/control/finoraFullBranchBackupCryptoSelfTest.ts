// ============================================================
// FINORA ENTERPRISE OS
// FULL BRANCH BACKUP V2 CRYPTO SELF-TEST
// ============================================================

import assert from "node:assert/strict";

import {
  Buffer,
} from "node:buffer";


import {
  createFinoraFullBranchRealSnapshotV1,
  parseFinoraFullBranchRealSnapshotV1,
  serializeFinoraFullBranchRealSnapshotV1,
} from "./finoraFullBranchBackupContract.js";

import type {
  FinoraFullBranchBackupBindingV2,
} from "./finoraFullBranchBackupContract.js";

import {
  decryptFinoraFullBranchRealSnapshotV2,
  encryptFinoraFullBranchRealSnapshotV2,
} from "./finoraFullBranchBackupCrypto.js";

async function expectFailure(
  action:
    () => Promise<unknown>,
): Promise<void> {
  let failed =
    false;

  try {
    await action();
  }
  catch {
    failed =
      true;
  }

  assert.equal(
    failed,
    true,
  );
}

export async function runFinoraFullBranchBackupCryptoSelfTest():
  Promise<void> {
  const binding:
    FinoraFullBranchBackupBindingV2 =
    {
      backupId:
        "FINORA-BACKUP-SELFTEST-001",

      createdAt:
        "2026-09-23T12:00:00.000Z",

      branchScope: {
        ownerId:
          "OWNER-SELFTEST",

        businessId:
          "BUSINESS-SELFTEST",

        branchId:
          "BRANCH-SELFTEST",
      },

      sourceStorageMode:
        "USB",

      authGeneration:
        7,
    };

  const snapshot =
    createFinoraFullBranchRealSnapshotV1({
      exportedAt:
        "2026-09-23T12:00:01.000Z",

      branchScope:
        binding.branchScope,

      records: [
        {
          id:
            "CUSTOMER-001",

          entity:
            "CUSTOMER",

          data: {
            safe:
              "SELFTEST",
          },

          createdAt:
            "2026-09-23T11:00:00.000Z",

          updatedAt:
            "2026-09-23T11:30:00.000Z",

          ownerId:
            binding.branchScope.ownerId,

          businessId:
            binding.branchScope.businessId,

          branchId:
            binding.branchScope.branchId,
        },
      ],
    });

  const serialized =
    serializeFinoraFullBranchRealSnapshotV1(
      snapshot,
    );

  const encrypted =
    await encryptFinoraFullBranchRealSnapshotV2({
      serializedSnapshot:
        serialized,

      password:
        "BackupPassword-123",

      securityCode:
        "BackupSecurity-456",

      binding,
    });

  const decrypted =
    await decryptFinoraFullBranchRealSnapshotV2({
      encryptedSnapshot:
        encrypted,

      password:
        "BackupPassword-123",

      securityCode:
        "BackupSecurity-456",

      binding,
    });

  const restored =
    parseFinoraFullBranchRealSnapshotV1(
      decrypted,
    );

  assert.deepEqual(
    restored,
    snapshot,
  );

  console.log(
    "PASS: correct Password + Security Code decrypt exact REAL snapshot",
  );

  await expectFailure(
    () =>
      decryptFinoraFullBranchRealSnapshotV2({
        encryptedSnapshot:
          encrypted,

        password:
          "WrongPassword-123",

        securityCode:
          "BackupSecurity-456",

        binding,
      }),
  );

  console.log(
    "PASS: wrong Password fails closed",
  );

  await expectFailure(
    () =>
      decryptFinoraFullBranchRealSnapshotV2({
        encryptedSnapshot:
          encrypted,

        password:
          "BackupPassword-123",

        securityCode:
          "WrongSecurity-456",

        binding,
      }),
  );

  console.log(
    "PASS: wrong Security Code fails closed",
  );

  const ciphertext =
    Buffer.from(
      encrypted.ciphertext,
      "base64",
    );

  ciphertext[0] =
    ciphertext[0] ^
    1;

  await expectFailure(
    () =>
      decryptFinoraFullBranchRealSnapshotV2({
        encryptedSnapshot: {
          ...encrypted,

          ciphertext:
            ciphertext.toString(
              "base64",
            ),
        },

        password:
          "BackupPassword-123",

        securityCode:
          "BackupSecurity-456",

        binding,
      }),
  );

  console.log(
    "PASS: ciphertext tamper fails closed",
  );

  await expectFailure(
    () =>
      decryptFinoraFullBranchRealSnapshotV2({
        encryptedSnapshot:
          encrypted,

        password:
          "BackupPassword-123",

        securityCode:
          "BackupSecurity-456",

        binding: {
          ...binding,

          branchScope: {
            ...binding.branchScope,

            branchId:
              "WRONG-BRANCH",
          },
        },
      }),
  );

  console.log(
    "PASS: authenticated branch-scope mismatch fails closed",
  );

  console.log(
    "PASS: Full Branch Backup V2 crypto self-test complete",
  );
}

if (
  require.main ===
    module
) {
  runFinoraFullBranchBackupCryptoSelfTest()
    .catch(
      (
        error:
          unknown,
      ) => {
        console.error(
          error,
        );

        process.exitCode =
          1;
      },
    );
}