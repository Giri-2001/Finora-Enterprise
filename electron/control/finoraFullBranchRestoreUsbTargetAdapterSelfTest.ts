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
  generateFinoraBranchCertificationKeyMaterial,
} from "./finoraBranchCertificationCrypto.js";

import type {
  FinoraBranchCertificationKeyMaterialV1,
} from "./finoraBranchCertificationContract.js";

import {
  FINORA_PORTABLE_BRANCH_AUTH_DIRECTORY,
  FINORA_PORTABLE_BRANCH_AUTH_FILE_NAME,
  FINORA_PORTABLE_BRANCH_AUTH_SUBDIRECTORY,
} from "./finoraPortableBranchAuthStore.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_PURPOSE,
  FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_SCHEMA_VERSION,
} from "./finoraPortableFreshDeviceRuntimeAuthorityContract.js";

import type {
  FinoraPortableFreshDeviceRuntimeAuthorityPayloadV1,
} from "./finoraPortableFreshDeviceRuntimeAuthorityContract.js";

import {
  createFinoraPortableFreshDeviceRuntimeAuthorityPackageV1,
} from "./finoraPortableFreshDeviceRuntimeAuthorityCrypto.js";

import {
  getFinoraPortableFreshDeviceRuntimeAuthorityFilePath,
} from "./finoraPortableFreshDeviceRuntimeAuthorityStore.js";

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

function createKeyMaterial(
  createdAt:
    string,
): FinoraBranchCertificationKeyMaterialV1 {
  const generator =
    generateFinoraBranchCertificationKeyMaterial as unknown as
      (
        ...args:
          unknown[]
      ) =>
        FinoraBranchCertificationKeyMaterialV1;

  const attempts:
    unknown[][] = [
      [
        createdAt,
      ],
      [
        new Date(
          createdAt,
        ),
      ],
      [],
    ];

  let lastError:
    unknown;

  for (
    const args of attempts
  ) {
    try {
      return generator(
        ...args,
      );
    }
    catch (
      error
    ) {
      lastError =
        error;
    }
  }

  throw (
    lastError instanceof Error
      ? lastError
      : new Error(
          "Unable to generate Branch Certification test key material.",
        )
  );
}

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

const runtimeKeyMaterial =
  createKeyMaterial(
    "2026-09-20T00:00:00.000Z",
  );

const runtimePayload:
  FinoraPortableFreshDeviceRuntimeAuthorityPayloadV1 = {
    schemaVersion:
      FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_SCHEMA_VERSION,

    purpose:
      FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_PURPOSE,

    authorityId:
      "FINORA-FRESH-RUNTIME-AUTHORITY-RESTORE-001",

    sourceAuthorizationId:
      "FINORA-SOURCE-AUTH-RESTORE-001",

    credentialId:
      "FINORA-CREDENTIAL-RESTORE-001",

    activationId:
      "FINORA-ACTIVATION-RESTORE-001",

    branchAccessGrantId:
      "FINORA-ACCESS-GRANT-RESTORE-001",

    storageEntitlementId:
      "FINORA-STORAGE-ENTITLEMENT-RESTORE-001",

    ownerId:
      scope.ownerId,

    businessId:
      scope.businessId,

    branchId:
      scope.branchId,

    userId:
      "USER-RESTORE-001",

    username:
      "owner",

    canonicalUsername:
      "owner",

    fullName:
      "Owner",

    role:
      "ADMIN",

    storageMode:
      "USB",

    dataContext:
      "REAL",

    demoId:
      null,

    authGeneration:
      2,

    activationStatus:
      "ACTIVE",

    businessCode:
      null,

    branchCode:
      null,

    activationActivatedAt:
      "2026-01-01T00:00:00.000Z",

    activationCreatedAt:
      "2026-01-01T00:00:00.000Z",

    activationUpdatedAt:
      "2026-09-20T00:00:00.000Z",

    branchAccessType:
      "REGISTERED",

    registrationPayment: {
      amount:
        2000,

      currency:
        "INR",

      paymentMode:
        "CASH",

      paidAt:
        "2026-01-01T00:00:00.000Z",

      refundable:
        false,
    },

    registrationCycle:
      1,

    demoRemarks:
      null,

    accessMode:
      "ACTIVE",

    accessValidFrom:
      "2026-01-01T00:00:00.000Z",

    accessValidUntil:
      "2027-01-01T00:00:00.000Z",

    branchAccessCreatedAt:
      "2026-01-01T00:00:00.000Z",

    branchAccessUpdatedAt:
      "2026-09-20T00:00:00.000Z",

    storageEntitlementStatus:
      "ACTIVE",

    storageEntitlementActivatedAt:
      "2026-01-01T00:00:00.000Z",

    storageEntitlementCreatedAt:
      "2026-01-01T00:00:00.000Z",

    storageEntitlementUpdatedAt:
      "2026-09-20T00:00:00.000Z",

    portableAuthFingerprint:
      "a".repeat(
        64,
      ),

    issuedAt:
      "2026-09-20T00:00:00.000Z",
  };

const restoredRuntimeAuthorityPackage =
  createFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
    runtimePayload,
    runtimeKeyMaterial,
  );

const previousRuntimeAuthorityPackage =
  createFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
    {
      ...runtimePayload,

      authorityId:
        "FINORA-FRESH-RUNTIME-AUTHORITY-PREVIOUS-001",

      authGeneration:
        1,

      portableAuthFingerprint:
        "b".repeat(
          64,
        ),
    },
    runtimeKeyMaterial,
  );

const RESTORED_RUNTIME_SERIALIZED =
  JSON.stringify(
    restoredRuntimeAuthorityPackage,
  );

const PREVIOUS_RUNTIME_SERIALIZED =
  JSON.stringify(
    previousRuntimeAuthorityPackage,
  );

const RESTORED_RUNTIME_RAW =
  Buffer.from(
    RESTORED_RUNTIME_SERIALIZED,
    "utf8",
  );

const PREVIOUS_RUNTIME_RAW =
  Buffer.from(
    PREVIOUS_RUNTIME_SERIALIZED,
    "utf8",
  );

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

    runtimeAuthorityPackageSerialized:
      RESTORED_RUNTIME_SERIALIZED,

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

function runtimeAuthorityPath(
  root:
    string,
): string {
  return getFinoraPortableFreshDeviceRuntimeAuthorityFilePath(
    root,
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

function withRuntimeReadbackMismatch(
  dependencies:
    ReturnType<
      typeof createFinoraFullBranchRestoreUsbTargetTransactionDependencies
    >,
) {
  const readRuntimeAuthority =
    dependencies.readTargetRuntimeAuthority;

  if (
    !readRuntimeAuthority
  ) {
    throw new Error(
      "Runtime Authority reader is unavailable in adapter self-test.",
    );
  }

  let runtimeReadCalls =
    0;

  return {
    ...withTransactionCryptoSeams(
      dependencies,
    ),

    readTargetRuntimeAuthority:
      async () => {
        runtimeReadCalls +=
          1;

        const actual =
          await readRuntimeAuthority();

        if (
          runtimeReadCalls ===
            1
        ) {
          return actual;
        }

        return PREVIOUS_RUNTIME_SERIALIZED;
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

  runtimeAuthorityBytes:
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

  await writeFile(
    runtimeAuthorityPath(
      root,
    ),
    PREVIOUS_RUNTIME_RAW,
  );

  return {
    storageBytes,
    authBytes:
      Buffer.from(
        PREVIOUS_AUTH_RAW,
      ),

    runtimeAuthorityBytes:
      Buffer.from(
        PREVIOUS_RUNTIME_RAW,
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

    assert.equal(
      (
        await readFile(
          runtimeAuthorityPath(
            successRoot,
          ),
        )
      ).equals(
        RESTORED_RUNTIME_RAW,
      ),
      true,
    );

    console.log(
      "PASS: native target adapter commits exact REAL storage, Portable Auth and Runtime Authority on temp target",
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
            ),
        },
      );

    const rollbackResult =
      await executeFinoraFullBranchRestoreTransaction(
        material,
        withRuntimeReadbackMismatch(
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
        "TARGET_RUNTIME_AUTHORITY_READBACK_FAILED",
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

    const rolledBackRuntimeAuthority =
      await readFile(
        runtimeAuthorityPath(
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

    assert.equal(
      rolledBackRuntimeAuthority.equals(
        predecessor.runtimeAuthorityBytes,
      ),
      true,
    );

    console.log(
      "PASS: existing target Runtime failure restores exact predecessor storage/auth/runtime bytes",
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
            ),
        },
      );

    const blankResult =
      await executeFinoraFullBranchRestoreTransaction(
        material,
        withRuntimeReadbackMismatch(
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
        "TARGET_RUNTIME_AUTHORITY_READBACK_FAILED",
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

    assert.equal(
      await fileExists(
        runtimeAuthorityPath(
          blankRoot,
        ),
      ),
      false,
    );

    console.log(
      "PASS: blank replacement USB Runtime failure removes newly created storage/auth/runtime files",
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