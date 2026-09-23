// ============================================================
// FINORA ENTERPRISE OS
// FULL BRANCH RESTORE USB TARGET ADAPTER SELF-TEST
// ============================================================
//
// Uses OS temporary directories only.
// Never touches a real removable drive.
// ============================================================

import assert from "node:assert/strict";

import {
  Buffer,
} from "node:buffer";

import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  createFinoraFullBranchRealSnapshotV1,
} from "./finoraFullBranchBackupContract.js";

import {
  FINORA_PORTABLE_BRANCH_AUTH_DIRECTORY,
  FINORA_PORTABLE_BRANCH_AUTH_FILE_NAME,
  FINORA_PORTABLE_BRANCH_AUTH_SUBDIRECTORY,
} from "./finoraPortableBranchAuthStore.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  calculateFinoraFullBranchExactRealDigest,
} from "./finoraFullBranchRestoreStoragePlan.js";

import {
  executeFinoraFullBranchRestoreTransaction,
} from "./finoraFullBranchRestoreTransaction.js";

import type {
  FinoraFullBranchRestoreTransactionMaterial,
} from "./finoraFullBranchRestoreTransaction.js";

import {
  createFinoraFullBranchRestoreUsbTargetTransactionDependencies,
} from "./finoraFullBranchRestoreUsbTargetAdapter.js";

const scope = {
  ownerId:
    "OWNER-A",

  businessId:
    "BUSINESS-A",

  branchId:
    "BRANCH-A",
};

const previousEnvelope =
  {
    schemaVersion:
      1,
  } as unknown as FinoraPortableBranchAuthEnvelopeV1;

const restoredEnvelope =
  {
    schemaVersion:
      1,
  } as unknown as FinoraPortableBranchAuthEnvelopeV1;

const PREVIOUS_AUTH_RAW =
  Buffer.from(
    "PREVIOUS-AUTH-RAW",
    "utf8",
  );

const RESTORED_AUTH_RAW =
  Buffer.from(
    "RESTORED-AUTH-RAW",
    "utf8",
  );

const RESTORED_AUTH_SERIALIZED =
  "RESTORED-AUTH-SERIALIZED";

function record(
  input: {
    id:
      string;

    entity:
      string;

    branchId?:
      string;

    demoId?:
      string;
  },
): Record<string, unknown> {
  return {
    id:
      input.id,

    entity:
      input.entity,

    data: {
      id:
        input.id,
    },

    createdAt:
      "2026-09-23T10:00:00.000Z",

    updatedAt:
      "2026-09-23T11:00:00.000Z",

    ownerId:
      scope.ownerId,

    businessId:
      scope.businessId,

    branchId:
      input.branchId ??
      scope.branchId,

    ...(
      input.demoId ===
        undefined
        ? {}
        : {
            demoId:
              input.demoId,
          }
    ),
  };
}

const snapshot =
  createFinoraFullBranchRealSnapshotV1({
    exportedAt:
      "2026-09-23T12:00:00.000Z",

    branchScope:
      scope,

    records: [
      record({
        id:
          "CUSTOMER-1",

        entity:
          "CUSTOMER",
      }),

      record({
        id:
          "LOAN-1",

        entity:
          "LOAN",
      }),
    ],
  });

const material:
  FinoraFullBranchRestoreTransactionMaterial =
  {
    branchScope:
      scope,

    storageMode:
      "USB",

    authGeneration:
      2,

    portableAuthEnvelopeSerialized:
      RESTORED_AUTH_SERIALIZED,

    snapshot,

    snapshotRecordCount:
      2,

    exactRealDigestSha256:
      calculateFinoraFullBranchExactRealDigest(
        snapshot.records as never[],
        scope,
      ),
  };

function storagePath(
  root:
    string,
): string {
  return join(
    root,
    FINORA_PORTABLE_BRANCH_AUTH_DIRECTORY,
    "storage",
    "finora-storage.json",
  );
}

function authPath(
  root:
    string,
): string {
  return join(
    root,
    FINORA_PORTABLE_BRANCH_AUTH_DIRECTORY,
    FINORA_PORTABLE_BRANCH_AUTH_SUBDIRECTORY,
    FINORA_PORTABLE_BRANCH_AUTH_FILE_NAME,
  );
}

function createCurrentStorageBytes():
  Buffer {
  return Buffer.from(
    JSON.stringify(
      {
        version:
          "2.0",

        records: [
          record({
            id:
              "STALE-CUSTOMER",

            entity:
              "CUSTOMER",
          }),

          record({
            id:
              "SIBLING-CUSTOMER",

            entity:
              "CUSTOMER",

            branchId:
              "BRANCH-B",
          }),

          record({
            id:
              "CURRENT-DEMO",

            entity:
              "CUSTOMER",

            demoId:
              "DEMO-1",
          }),
        ],

        updatedAt:
          "2026-09-23T09:00:00.000Z",
      },
      null,
      2,
    ),
    "utf8",
  );
}

function errorCode(
  error:
    unknown,
): string | null {
  if (
    error &&
    typeof error ===
      "object" &&
    "code" in
      error &&
    typeof (
      error as {
        code?:
          unknown;
      }
    ).code ===
      "string"
  ) {
    return (
      error as {
        code:
          string;
      }
    ).code;
  }

  return null;
}

async function fileExists(
  path:
    string,
): Promise<boolean> {
  try {
    await readFile(
      path,
    );

    return true;
  }
  catch (
    error
  ) {
    if (
      errorCode(
        error,
      ) ===
        "ENOENT"
    ) {
      return false;
    }

    throw error;
  }
}

function createFakePortableStore(
  root:
    string,
  options: {
    failAfterWrite?:
      boolean;
  } = {},
) {
  const filePath =
    authPath(
      root,
    );

  return {
    read:
      async (
        storageMode:
          "LOCAL" | "USB",
      ) => {
        assert.equal(
          storageMode,
          "USB",
        );

        let raw:
          Buffer;

        try {
          raw =
            await readFile(
              filePath,
            );
        }
        catch (
          error
        ) {
          if (
            errorCode(
              error,
            ) ===
              "ENOENT"
          ) {
            return null;
          }

          throw error;
        }

        if (
          raw.equals(
            PREVIOUS_AUTH_RAW,
          )
        ) {
          return previousEnvelope;
        }

        if (
          raw.equals(
            RESTORED_AUTH_RAW,
          )
        ) {
          return restoredEnvelope;
        }

        throw new Error(
          "Unexpected fake Portable Auth bytes.",
        );
      },

    write:
      async (
        storageMode:
          "LOCAL" | "USB",
        envelope:
          FinoraPortableBranchAuthEnvelopeV1,
      ) => {
        assert.equal(
          storageMode,
          "USB",
        );

        assert.equal(
          envelope,
          restoredEnvelope,
        );

        await mkdir(
          join(
            root,
            FINORA_PORTABLE_BRANCH_AUTH_DIRECTORY,
            FINORA_PORTABLE_BRANCH_AUTH_SUBDIRECTORY,
          ),
          {
            recursive:
              true,
          },
        );

        await writeFile(
          filePath,
          RESTORED_AUTH_RAW,
        );

        if (
          options.failAfterWrite
        ) {
          throw new Error(
            "Injected Portable Auth write failure after mutation.",
          );
        }
      },
  };
}

function withTransactionCryptoSeams(
  dependencies:
    ReturnType<
      typeof createFinoraFullBranchRestoreUsbTargetTransactionDependencies
    >,
) {
  return {
    ...dependencies,

    parsePortableAuth:
      (
        serialized:
          string,
      ) => {
        assert.equal(
          serialized,
          RESTORED_AUTH_SERIALIZED,
        );

        return restoredEnvelope;
      },

    serializePortableAuth:
      (
        envelope:
          FinoraPortableBranchAuthEnvelopeV1,
      ) => {
        if (
          envelope ===
            restoredEnvelope
        ) {
          return RESTORED_AUTH_SERIALIZED;
        }

        return "PREVIOUS-AUTH-SERIALIZED";
      },
  };
}

async function seedExistingTarget(
  root:
    string,
): Promise<{
  storageBytes:
    Buffer;

  authBytes:
    Buffer;
}> {
  const storageBytes =
    createCurrentStorageBytes();

  await mkdir(
    join(
      root,
      FINORA_PORTABLE_BRANCH_AUTH_DIRECTORY,
      "storage",
    ),
    {
      recursive:
        true,
    },
  );

  await mkdir(
    join(
      root,
      FINORA_PORTABLE_BRANCH_AUTH_DIRECTORY,
      FINORA_PORTABLE_BRANCH_AUTH_SUBDIRECTORY,
    ),
    {
      recursive:
        true,
    },
  );

  await writeFile(
    storagePath(
      root,
    ),
    storageBytes,
  );

  await writeFile(
    authPath(
      root,
    ),
    PREVIOUS_AUTH_RAW,
  );

  return {
    storageBytes,
    authBytes:
      Buffer.from(
        PREVIOUS_AUTH_RAW,
      ),
  };
}

export async function runFinoraFullBranchRestoreUsbTargetAdapterSelfTest():
  Promise<void> {
  const root =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-full-restore-native-",
      ),
    );

  try {
    // ========================================================
    // SUCCESS
    // ========================================================

    const successRoot =
      join(
        root,
        "success",
      );

    await seedExistingTarget(
      successRoot,
    );

    const successDependencies =
      createFinoraFullBranchRestoreUsbTargetTransactionDependencies(
        successRoot,
        {
          portableStore:
            createFakePortableStore(
              successRoot,
            ),
        },
      );

    const success =
      await executeFinoraFullBranchRestoreTransaction(
        material,
        withTransactionCryptoSeams(
          successDependencies,
        ),
      );

    assert.equal(
      success.success,
      true,
    );

    const finalStorage =
      JSON.parse(
        (
          await readFile(
            storagePath(
              successRoot,
            ),
            "utf8",
          )
        ),
      ) as {
        version:
          string;

        records:
          Array<{
            id:
              string;
          }>;
      };

    assert.equal(
      finalStorage.version,
      "2.0",
    );

    const ids =
      finalStorage.records.map(
        (
          item,
        ) =>
          item.id,
      );

    assert.equal(
      ids.includes(
        "STALE-CUSTOMER",
      ),
      false,
    );

    assert.equal(
      ids.includes(
        "SIBLING-CUSTOMER",
      ),
      true,
    );

    assert.equal(
      ids.includes(
        "CURRENT-DEMO",
      ),
      true,
    );

    assert.equal(
      ids.includes(
        "CUSTOMER-1",
      ),
      true,
    );

    assert.equal(
      ids.includes(
        "LOAN-1",
      ),
      true,
    );

    assert.equal(
      (
        await readFile(
          authPath(
            successRoot,
          ),
        )
      ).equals(
        RESTORED_AUTH_RAW,
      ),
      true,
    );

    console.log(
      "PASS: native target adapter commits exact REAL storage and Portable Auth on temp target",
    );

    // ========================================================
    // EXISTING TARGET — RAW ROLLBACK
    // ========================================================

    const rollbackRoot =
      join(
        root,
        "rollback-existing",
      );

    const predecessor =
      await seedExistingTarget(
        rollbackRoot,
      );

    const rollbackDependencies =
      createFinoraFullBranchRestoreUsbTargetTransactionDependencies(
        rollbackRoot,
        {
          portableStore:
            createFakePortableStore(
              rollbackRoot,
              {
                failAfterWrite:
                  true,
              },
            ),
        },
      );

    const rollbackResult =
      await executeFinoraFullBranchRestoreTransaction(
        material,
        withTransactionCryptoSeams(
          rollbackDependencies,
        ),
      );

    assert.equal(
      rollbackResult.success,
      false,
    );

    if (
      !rollbackResult.success
    ) {
      assert.equal(
        rollbackResult.errorCode,
        "TARGET_AUTH_WRITE_FAILED",
      );
    }

    const rolledBackStorage =
      await readFile(
        storagePath(
          rollbackRoot,
        ),
      );

    const rolledBackAuth =
      await readFile(
        authPath(
          rollbackRoot,
        ),
      );

    assert.equal(
      rolledBackStorage.equals(
        predecessor.storageBytes,
      ),
      true,
    );

    assert.equal(
      rolledBackAuth.equals(
        predecessor.authBytes,
      ),
      true,
    );

    console.log(
      "PASS: existing target rollback restores exact predecessor storage/auth bytes",
    );

    // ========================================================
    // BLANK TARGET — REMOVE NEWLY CREATED FILES ON ROLLBACK
    // ========================================================

    const blankRoot =
      join(
        root,
        "rollback-blank",
      );

    await mkdir(
      blankRoot,
      {
        recursive:
          true,
      },
    );

    const blankDependencies =
      createFinoraFullBranchRestoreUsbTargetTransactionDependencies(
        blankRoot,
        {
          portableStore:
            createFakePortableStore(
              blankRoot,
              {
                failAfterWrite:
                  true,
              },
            ),
        },
      );

    const blankResult =
      await executeFinoraFullBranchRestoreTransaction(
        material,
        withTransactionCryptoSeams(
          blankDependencies,
        ),
      );

    assert.equal(
      blankResult.success,
      false,
    );

    if (
      !blankResult.success
    ) {
      assert.equal(
        blankResult.errorCode,
        "TARGET_AUTH_WRITE_FAILED",
      );
    }

    assert.equal(
      await fileExists(
        storagePath(
          blankRoot,
        ),
      ),
      false,
    );

    assert.equal(
      await fileExists(
        authPath(
          blankRoot,
        ),
      ),
      false,
    );

    console.log(
      "PASS: blank replacement USB rollback removes newly created storage/auth files",
    );

    // ========================================================
    // MALFORMED EXISTING TARGET — FAIL BEFORE MUTATION
    // ========================================================

    const malformedRoot =
      join(
        root,
        "malformed",
      );

    await mkdir(
      join(
        malformedRoot,
        FINORA_PORTABLE_BRANCH_AUTH_DIRECTORY,
        "storage",
      ),
      {
        recursive:
          true,
      },
    );

    await mkdir(
      join(
        malformedRoot,
        FINORA_PORTABLE_BRANCH_AUTH_DIRECTORY,
        FINORA_PORTABLE_BRANCH_AUTH_SUBDIRECTORY,
      ),
      {
        recursive:
          true,
      },
    );

    const malformedBytes =
      Buffer.from(
        "{not-json",
        "utf8",
      );

    await writeFile(
      storagePath(
        malformedRoot,
      ),
      malformedBytes,
    );

    await writeFile(
      authPath(
        malformedRoot,
      ),
      PREVIOUS_AUTH_RAW,
    );

    const malformedDependencies =
      createFinoraFullBranchRestoreUsbTargetTransactionDependencies(
        malformedRoot,
        {
          portableStore:
            createFakePortableStore(
              malformedRoot,
            ),
        },
      );

    const malformedResult =
      await executeFinoraFullBranchRestoreTransaction(
        material,
        withTransactionCryptoSeams(
          malformedDependencies,
        ),
      );

    assert.equal(
      malformedResult.success,
      false,
    );

    if (
      !malformedResult.success
    ) {
      assert.equal(
        malformedResult.errorCode,
        "TARGET_CAPTURE_FAILED",
      );
    }

    assert.equal(
      (
        await readFile(
          storagePath(
            malformedRoot,
          ),
        )
      ).equals(
        malformedBytes,
      ),
      true,
    );

    assert.equal(
      (
        await readFile(
          authPath(
            malformedRoot,
          ),
        )
      ).equals(
        PREVIOUS_AUTH_RAW,
      ),
      true,
    );

    console.log(
      "PASS: malformed existing target fails before mutation",
    );

    console.log(
      "PASS: Full Branch Restore native USB target adapter self-test complete",
    );
  }
  finally {
    await rm(
      root,
      {
        recursive:
          true,

        force:
          true,
      },
    );
  }
}

if (
  require.main ===
    module
) {
  runFinoraFullBranchRestoreUsbTargetAdapterSelfTest()
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