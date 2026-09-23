// ============================================================
// FINORA ENTERPRISE OS
// FULL BRANCH BACKUP V2
// RESTORE ARTIFACT COORDINATOR SELF-TEST
// ============================================================

import assert from "node:assert/strict";

import {
  Buffer,
} from "node:buffer";

import {
  createFinoraFullBranchBackupFileV2,
  createFinoraFullBranchRealSnapshotV1,
  serializeFinoraFullBranchBackupFileV2,
  serializeFinoraFullBranchRealSnapshotV1,
} from "./finoraFullBranchBackupContract.js";

import {
  encryptFinoraFullBranchRealSnapshotV2,
} from "./finoraFullBranchBackupCrypto.js";

import {
  prepareFinoraFullBranchRestoreArtifact,
} from "./finoraFullBranchRestoreArtifactCoordinator.js";

import type {
  FinoraFullBranchRestoreArtifactDependencies,
  FinoraFullBranchRestoreAuthenticatedAuthority,
} from "./finoraFullBranchRestoreArtifactCoordinator.js";

const scope = {
  ownerId:
    "OWNER-A",

  businessId:
    "BUSINESS-A",

  branchId:
    "BRANCH-A",
};

const password =
  "BackupPassword-123";

const securityCode =
  "BackupSecurity-456";

const binding = {
  backupId:
    "FULL-RESTORE-P3B2-001",

  createdAt:
    "2026-09-23T12:00:00.000Z",

  branchScope:
    scope,

  sourceStorageMode:
    "USB" as const,

  authGeneration:
    2,
};

const authenticatedAuthority:
  FinoraFullBranchRestoreAuthenticatedAuthority =
  {
    branchScope:
      scope,

    storageMode:
      "USB",

    authGeneration:
      2,
  };

function record(
  id:
    string,
  entity:
    string,
): Record<string, unknown> {
  return {
    id,
    entity,

    data: {
      id,
      marker:
        "FULL-RESTORE",
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
      scope.branchId,
  };
}

function portableAuthDependency(
  override?:
    Partial<{
      ownerId:
        string;

      businessId:
        string;

      branchId:
        string;

      storageMode:
        "LOCAL" | "USB";

      authGeneration:
        number;
    }>,
): NonNullable<
  FinoraFullBranchRestoreArtifactDependencies[
    "authenticatePortableAuth"
  ]
> {
  return async (
    input,
  ) => {
    assert.equal(
      input.password,
      password,
    );

    assert.equal(
      input.securityCode,
      securityCode,
    );

    assert.deepEqual(
      input.expectedScope,
      scope,
    );

    assert.equal(
      input.portableAuthEnvelopeSerialized,
      "PORTABLE-AUTH-ENCRYPTED-SELFTEST",
    );

    return {
      branchScope: {
        ownerId:
          override?.ownerId ??
          scope.ownerId,

        businessId:
          override?.businessId ??
          scope.businessId,

        branchId:
          override?.branchId ??
          scope.branchId,
      },

      storageMode:
        override?.storageMode ??
        "USB",

      authGeneration:
        override?.authGeneration ??
        2,
    };
  };
}

async function createSerializedBackup():
  Promise<string> {
  const snapshot =
    createFinoraFullBranchRealSnapshotV1({
      exportedAt:
        "2026-09-23T12:00:01.000Z",

      branchScope:
        scope,

      records: [
        record(
          "CUSTOMER-1",
          "CUSTOMER",
        ),

        record(
          "LOAN-1",
          "LOAN",
        ),
      ],
    });

  const encryptedSnapshot =
    await encryptFinoraFullBranchRealSnapshotV2({
      serializedSnapshot:
        serializeFinoraFullBranchRealSnapshotV1(
          snapshot,
        ),

      password,
      securityCode,
      binding,
    });

  const backup =
    createFinoraFullBranchBackupFileV2({
      backupId:
        binding.backupId,

      createdAt:
        binding.createdAt,

      branchScope:
        binding.branchScope,

      sourceStorageMode:
        binding.sourceStorageMode,

      authGeneration:
        binding.authGeneration,

      portableAuthEnvelopeSerialized:
        "PORTABLE-AUTH-ENCRYPTED-SELFTEST",

      realSnapshot:
        encryptedSnapshot,
    });

  return serializeFinoraFullBranchBackupFileV2(
    backup,
  );
}

export async function runFinoraFullBranchRestoreArtifactCoordinatorSelfTest():
  Promise<void> {
  const serializedBackup =
    await createSerializedBackup();

  const success =
    await prepareFinoraFullBranchRestoreArtifact(
      {
        password,
        securityCode,
        serializedBackup,
        authenticatedAuthority,
      },
      {
        authenticatePortableAuth:
          portableAuthDependency(),
      },
    );

  assert.equal(
    success.success,
    true,
  );

  if (
    success.success
  ) {
    assert.equal(
      success.data.snapshotRecordCount,
      2,
    );

    assert.deepEqual(
      success.data.branchScope,
      scope,
    );

    assert.equal(
      success.data.storageMode,
      "USB",
    );

    assert.equal(
      success.data.authGeneration,
      2,
    );

    assert.equal(
      success.data.portableAuthEnvelopeSerialized,
      "PORTABLE-AUTH-ENCRYPTED-SELFTEST",
    );

    assert.match(
      success.data.exactRealDigestSha256,
      /^[A-F0-9]{64}$/,
    );
  }

  console.log(
    "PASS: Full V2 artifact authenticates and decrypts exact REAL snapshot",
  );

  const legacyV1 =
    await prepareFinoraFullBranchRestoreArtifact(
      {
        password,
        securityCode,

        serializedBackup:
          JSON.stringify({
            format:
              "FINORA_PORTABLE_BRANCH_AUTH_BACKUP",

            schemaVersion:
              1,
          }),

        authenticatedAuthority,
      },
      {
        authenticatePortableAuth:
          portableAuthDependency(),
      },
    );

  assert.equal(
    legacyV1.success,
    false,
  );

  if (
    !legacyV1.success
  ) {
    assert.equal(
      legacyV1.errorCode,
      "BACKUP_FORMAT_INVALID",
    );
  }

  console.log(
    "PASS: legacy auth-only V1 artifact is not silently accepted as Full Restore",
  );

  const wrongScope =
    await prepareFinoraFullBranchRestoreArtifact(
      {
        password,
        securityCode,
        serializedBackup,

        authenticatedAuthority: {
          ...authenticatedAuthority,

          branchScope: {
            ...scope,

            branchId:
              "WRONG-BRANCH",
          },
        },
      },
      {
        authenticatePortableAuth:
          portableAuthDependency(),
      },
    );

  assert.equal(
    wrongScope.success,
    false,
  );

  if (
    !wrongScope.success
  ) {
    assert.equal(
      wrongScope.errorCode,
      "SCOPE_MISMATCH",
    );
  }

  console.log(
    "PASS: authenticated branch-scope mismatch fails closed",
  );

  const wrongStorage =
    await prepareFinoraFullBranchRestoreArtifact(
      {
        password,
        securityCode,
        serializedBackup,

        authenticatedAuthority: {
          ...authenticatedAuthority,

          storageMode:
            "LOCAL",
        },
      },
      {
        authenticatePortableAuth:
          portableAuthDependency(),
      },
    );

  assert.equal(
    wrongStorage.success,
    false,
  );

  if (
    !wrongStorage.success
  ) {
    assert.equal(
      wrongStorage.errorCode,
      "STORAGE_MODE_MISMATCH",
    );
  }

  console.log(
    "PASS: provisioned storage-mode mismatch fails closed",
  );

  const wrongGeneration =
    await prepareFinoraFullBranchRestoreArtifact(
      {
        password,
        securityCode,
        serializedBackup,

        authenticatedAuthority: {
          ...authenticatedAuthority,

          authGeneration:
            3,
        },
      },
      {
        authenticatePortableAuth:
          portableAuthDependency(),
      },
    );

  assert.equal(
    wrongGeneration.success,
    false,
  );

  if (
    !wrongGeneration.success
  ) {
    assert.equal(
      wrongGeneration.errorCode,
      "AUTH_GENERATION_MISMATCH",
    );
  }

  console.log(
    "PASS: authGeneration mismatch fails closed",
  );

  const portableAuthorityMismatch =
    await prepareFinoraFullBranchRestoreArtifact(
      {
        password,
        securityCode,
        serializedBackup,
        authenticatedAuthority,
      },
      {
        authenticatePortableAuth:
          portableAuthDependency({
            branchId:
              "WRONG-PORTABLE-BRANCH",
          }),
      },
    );

  assert.equal(
    portableAuthorityMismatch.success,
    false,
  );

  if (
    !portableAuthorityMismatch.success
  ) {
    assert.equal(
      portableAuthorityMismatch.errorCode,
      "PORTABLE_AUTH_AUTHORITY_MISMATCH",
    );
  }

  console.log(
    "PASS: embedded Portable Auth authority mismatch fails closed",
  );

  const portableAuthenticationFailure =
    await prepareFinoraFullBranchRestoreArtifact(
      {
        password,
        securityCode,
        serializedBackup,
        authenticatedAuthority,
      },
      {
        authenticatePortableAuth:
          async () => {
            throw new Error(
              "Invalid credentials.",
            );
          },
      },
    );

  assert.equal(
    portableAuthenticationFailure.success,
    false,
  );

  if (
    !portableAuthenticationFailure.success
  ) {
    assert.equal(
      portableAuthenticationFailure.errorCode,
      "PORTABLE_AUTH_AUTHENTICATION_FAILED",
    );
  }

  console.log(
    "PASS: Portable Auth authentication failure blocks restore preparation",
  );

  const wrongPassword =
    await prepareFinoraFullBranchRestoreArtifact(
      {
        password:
          "WrongPassword-123",

        securityCode,
        serializedBackup,
        authenticatedAuthority,
      },
      {
        authenticatePortableAuth:
          async () => ({
            branchScope:
              scope,

            storageMode:
              "USB",

            authGeneration:
              2,
          }),
      },
    );

  assert.equal(
    wrongPassword.success,
    false,
  );

  if (
    !wrongPassword.success
  ) {
    assert.equal(
      wrongPassword.errorCode,
      "REAL_SNAPSHOT_AUTHENTICATION_FAILED",
    );
  }

  console.log(
    "PASS: wrong snapshot credentials fail closed",
  );

  const parsed =
    JSON.parse(
      serializedBackup,
    ) as {
      realSnapshot: {
        ciphertext:
          string;
      };
    };

  const ciphertext =
    Buffer.from(
      parsed.realSnapshot.ciphertext,
      "base64",
    );

  ciphertext[0] =
    ciphertext[0] ^
    1;

  parsed.realSnapshot.ciphertext =
    ciphertext.toString(
      "base64",
    );

  const tampered =
    await prepareFinoraFullBranchRestoreArtifact(
      {
        password,
        securityCode,

        serializedBackup:
          JSON.stringify(
            parsed,
          ),

        authenticatedAuthority,
      },
      {
        authenticatePortableAuth:
          portableAuthDependency(),
      },
    );

  assert.equal(
    tampered.success,
    false,
  );

  if (
    !tampered.success
  ) {
    assert.equal(
      tampered.errorCode,
      "REAL_SNAPSHOT_AUTHENTICATION_FAILED",
    );
  }

  console.log(
    "PASS: encrypted REAL snapshot tamper fails closed",
  );

  console.log(
    "PASS: Full Branch Restore artifact coordinator self-test complete",
  );
}

if (
  require.main ===
    module
) {
  runFinoraFullBranchRestoreArtifactCoordinatorSelfTest()
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