/* ============================================================
   FINORA ENTERPRISE

   Phase 5.6O-O2
   Portable Branch Auth Restore Coordinator SelfTest
   ============================================================ */

import {
  FinoraPortableBranchAuthStoreError,
} from "./finoraPortableBranchAuthStore.js";

import {
  restoreFinoraPortableBranchAuth,
} from "./finoraPortableBranchAuthRestoreCoordinator.js";

import type {
  FinoraPortableBranchAuthRestoreCoordinatorDependencies,
} from "./finoraPortableBranchAuthRestoreCoordinator.js";

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

const serializedEnvelope =
  "CANONICAL_ENCRYPTED_ENVELOPE";

const envelope =
  {
    testEnvelope:
      true,
  } as never;

const differentEnvelope =
  {
    differentEnvelope:
      true,
  } as never;

const scope = {
  ownerId:
    "owner-1",

  businessId:
    "business-1",

  branchId:
    "branch-1",
};

function createScenario() {
  const state = {
    credentialSuccess:
      true,

    backupParseFails:
      false,

    envelopeParseFails:
      false,

    decryptFails:
      false,

    wrapperScope:
      {
        ...scope,
      },

    wrapperStorageMode:
      "USB" as
        "LOCAL" |
        "USB",

    wrapperGeneration:
      5,

    payloadScope:
      {
        ...scope,
      },

    payloadStorageMode:
      "USB" as
        "LOCAL" |
        "USB",

    payloadGeneration:
      5,

    certificationPresent:
      true,

    currentScope:
      {
        ...scope,
      },

    currentStorageMode:
      "USB" as
        "LOCAL" |
        "USB",

    currentGeneration:
      5,

    writeMode:
      null as
        "LOCAL" |
        "USB" |
        null,

    writtenEnvelope:
      null as
        unknown,

    writeError:
      null as
        Error |
        null,

    readError:
      false,

    readback:
      envelope as
        unknown,

    authCalls:
      0,

    backupParseCalls:
      0,

    decryptCalls:
      0,

    writeCalls:
      0,

    readCalls:
      0,
  };

  const dependencies:
    FinoraPortableBranchAuthRestoreCoordinatorDependencies =
    {
      portableStore: {
        async write(
          storageMode,
          value,
        ) {
          state.writeCalls +=
            1;

          state.writeMode =
            storageMode;

          state.writtenEnvelope =
            value;

          if (state.writeError) {
            throw state.writeError;
          }

          state.readback =
            value;
        },

        async read() {
          state.readCalls +=
            1;

          if (state.readError) {
            throw new Error(
              "read failed",
            );
          }

          return state.readback as never;
        },
      },

      async authenticateCredential() {
        state.authCalls +=
          1;

        if (
          !state.credentialSuccess
        ) {
          return {
            success:
              false,

            errorCode:
              "INVALID_CREDENTIALS",

            error:
              "Invalid credentials.",
          };
        }

        return {
          success:
            true,

          data: {
            credentialId:
              "credential-1",

            authGeneration:
              state.currentGeneration,

            userId:
              "user-1",

            username:
              "owner",

            fullName:
              "Owner",

            role:
              "ADMIN",

            ownerId:
              state.currentScope.ownerId,

            businessId:
              state.currentScope.businessId,

            branchId:
              state.currentScope.branchId,

            storageMode:
              state.currentStorageMode,

            dataContext:
              "REAL",

            authenticatedAt:
              "2026-09-17T10:00:00.000Z",
          },
        };
      },

      parseBackup() {
        state.backupParseCalls +=
          1;

        if (
          state.backupParseFails
        ) {
          throw new Error(
            "invalid backup",
          );
        }

        return {
          format:
            "FINORA_PORTABLE_BRANCH_AUTH_BACKUP",

          schemaVersion:
            1,

          backupId:
            "backup-1",

          createdAt:
            "2026-09-17T10:00:00.000Z",

          branchScope:
            {
              ...state.wrapperScope,
            },

          sourceStorageMode:
            state.wrapperStorageMode,

          authGeneration:
            state.wrapperGeneration,

          envelopeSha256:
            "a".repeat(
              64,
            ),

          portableAuthEnvelopeSerialized:
            serializedEnvelope,
        };
      },

      parseEnvelope() {
        if (
          state.envelopeParseFails
        ) {
          throw new Error(
            "invalid envelope",
          );
        }

        return envelope;
      },

      async decryptEnvelope() {
        state.decryptCalls +=
          1;

        if (
          state.decryptFails
        ) {
          throw new Error(
            "authentication failed",
          );
        }

        return {
          ownerId:
            state.payloadScope.ownerId,

          businessId:
            state.payloadScope.businessId,

          branchId:
            state.payloadScope.branchId,

          storageMode:
            state.payloadStorageMode,

          authGeneration:
            state.payloadGeneration,

          branchCertificationKeyMaterial:
            state.certificationPresent
              ? {
                  present:
                    true,
                }
              : undefined,
        } as never;
      },

      serializeEnvelope(
        value,
      ) {
        if (
          value ===
          differentEnvelope
        ) {
          return "DIFFERENT_ENVELOPE";
        }

        return serializedEnvelope;
      },
    };

  return {
    state,
    dependencies,
  };
}

function request() {
  return {
    credentials: {
      username:
        "owner",

      password:
        "Password-123",

      securityCode:
        "Security-123",
    },

    serializedBackup:
      "PRIVILEGED_BACKUP_BYTES",
  };
}

async function main():
  Promise<void> {

// ============================================================
// SUCCESS
// ============================================================

{
  const {
    state,
    dependencies,
  } =
    createScenario();

  const result =
    await restoreFinoraPortableBranchAuth(
      request(),
      dependencies,
    );

  assert(
    result.success,
    "Valid Restore should succeed.",
  );

  assert(
    state.authCalls ===
      1 &&
    state.backupParseCalls ===
      1 &&
    state.decryptCalls ===
      1 &&
    state.writeCalls ===
      1 &&
    state.readCalls ===
      1,
    "Valid Restore should execute the full authority/write/readback chain once.",
  );

  assert(
    state.writeMode ===
      "USB",
    "Restore must write to authoritative current storage mode.",
  );

  assert(
    state.writtenEnvelope ===
      envelope,
    "Restore must write the exact authenticated embedded envelope.",
  );

  pass(
    "valid Restore authenticates current credential and backup, writes exact envelope, then readback-verifies",
  );
}

// ============================================================
// INVALID INTERNAL REQUEST
// ============================================================

{
  const {
    state,
    dependencies,
  } =
    createScenario();

  const result =
    await restoreFinoraPortableBranchAuth(
      {
        ...request(),

        storageMode:
          "USB",
      },
      dependencies,
    );

  assert(
    !result.success &&
    result.errorCode ===
      "INVALID_REQUEST",
    "Injected internal request authority must fail.",
  );

  assert(
    state.authCalls ===
      0,
    "Invalid request must fail before credential authentication.",
  );

  pass(
    "Restore coordinator rejects unexpected request authority before authentication",
  );
}

// ============================================================
// CREDENTIAL FAILURE BEFORE BACKUP PROCESSING
// ============================================================

{
  const {
    state,
    dependencies,
  } =
    createScenario();

  state.credentialSuccess =
    false;

  const result =
    await restoreFinoraPortableBranchAuth(
      request(),
      dependencies,
    );

  assert(
    !result.success &&
    result.errorCode ===
      "CREDENTIAL_AUTHENTICATION_FAILED",
    "Credential failure must fail closed.",
  );

  assert(
    state.backupParseCalls ===
      0 &&
    state.writeCalls ===
      0,
    "Credential failure must stop before Backup parse/write.",
  );

  pass(
    "current Branch Credential authentication gates Backup processing",
  );
}

// ============================================================
// MALFORMED BACKUP
// ============================================================

{
  const {
    state,
    dependencies,
  } =
    createScenario();

  state.backupParseFails =
    true;

  const result =
    await restoreFinoraPortableBranchAuth(
      request(),
      dependencies,
    );

  assert(
    !result.success &&
    result.errorCode ===
      "BACKUP_INVALID",
    "Malformed Backup must reject.",
  );

  assert(
    state.decryptCalls ===
      0 &&
    state.writeCalls ===
      0,
    "Malformed Backup must fail before decrypt/write.",
  );

  pass(
    "strict Backup parse failure stops before inner authentication or target mutation",
  );
}

// ============================================================
// INNER AUTHENTICATION FAILURE
// ============================================================

{
  const {
    state,
    dependencies,
  } =
    createScenario();

  state.decryptFails =
    true;

  const result =
    await restoreFinoraPortableBranchAuth(
      request(),
      dependencies,
    );

  assert(
    !result.success &&
    result.errorCode ===
      "BACKUP_AUTHENTICATION_FAILED",
    "Wrong Backup factors must fail authentication.",
  );

  assert(
    state.writeCalls ===
      0,
    "Backup authentication failure must not mutate target.",
  );

  pass(
    "Password/Security Code Backup authentication failure performs zero target write",
  );
}

// ============================================================
// WRAPPER ↔ INNER MISMATCH
// ============================================================

{
  const {
    state,
    dependencies,
  } =
    createScenario();

  state.wrapperGeneration =
    4;

  const result =
    await restoreFinoraPortableBranchAuth(
      request(),
      dependencies,
    );

  assert(
    !result.success &&
    result.errorCode ===
      "BACKUP_INVALID",
    "Wrapper/inner generation mismatch must be invalid.",
  );

  assert(
    state.writeCalls ===
      0,
    "Wrapper metadata mismatch must perform zero write.",
  );

  pass(
    "untrusted Backup wrapper metadata must exactly match authenticated inner payload",
  );
}

// ============================================================
// SCOPE MISMATCH
// ============================================================

{
  const {
    state,
    dependencies,
  } =
    createScenario();

  state.payloadScope =
    {
      ...scope,

      branchId:
        "branch-other",
    };

  state.wrapperScope =
    {
      ...state.payloadScope,
    };

  const result =
    await restoreFinoraPortableBranchAuth(
      request(),
      dependencies,
    );

  assert(
    !result.success &&
    result.errorCode ===
      "SCOPE_MISMATCH",
    "Different authenticated scope must reject.",
  );

  assert(
    state.writeCalls ===
      0,
    "Scope mismatch must not write.",
  );

  pass(
    "authenticated Backup branch scope must equal current credential scope",
  );
}

// ============================================================
// STORAGE MODE MISMATCH
// ============================================================

{
  const {
    state,
    dependencies,
  } =
    createScenario();

  state.payloadStorageMode =
    "LOCAL";

  state.wrapperStorageMode =
    "LOCAL";

  const result =
    await restoreFinoraPortableBranchAuth(
      request(),
      dependencies,
    );

  assert(
    !result.success &&
    result.errorCode ===
      "STORAGE_MODE_MISMATCH",
    "Cross-mode Restore must reject.",
  );

  assert(
    state.writeCalls ===
      0,
    "Cross-mode Restore must not write.",
  );

  pass(
    "Restore rejects cross-storage-mode migration",
  );
}

// ============================================================
// STALE BACKUP
// ============================================================

{
  const {
    state,
    dependencies,
  } =
    createScenario();

  state.payloadGeneration =
    4;

  state.wrapperGeneration =
    4;

  const result =
    await restoreFinoraPortableBranchAuth(
      request(),
      dependencies,
    );

  assert(
    !result.success &&
    result.errorCode ===
      "STALE_BACKUP",
    "Stale generation must reject.",
  );

  assert(
    state.writeCalls ===
      0,
    "Stale Restore must not write.",
  );

  pass(
    "stale Backup generation is rejected before target mutation",
  );
}

// ============================================================
// FUTURE BACKUP
// ============================================================

{
  const {
    state,
    dependencies,
  } =
    createScenario();

  state.payloadGeneration =
    6;

  state.wrapperGeneration =
    6;

  const result =
    await restoreFinoraPortableBranchAuth(
      request(),
      dependencies,
    );

  assert(
    !result.success &&
    result.errorCode ===
      "FUTURE_BACKUP",
    "Future generation must reject.",
  );

  assert(
    state.writeCalls ===
      0,
    "Future Restore must not write.",
  );

  pass(
    "future Backup generation fails closed before target mutation",
  );
}

// ============================================================
// CERTIFICATION AUTHORITY REQUIRED
// ============================================================

{
  const {
    state,
    dependencies,
  } =
    createScenario();

  state.certificationPresent =
    false;

  const result =
    await restoreFinoraPortableBranchAuth(
      request(),
      dependencies,
    );

  assert(
    !result.success &&
    result.errorCode ===
      "CERTIFICATION_AUTHORITY_MISSING",
    "Backup without Certification authority must reject.",
  );

  assert(
    state.writeCalls ===
      0,
    "Missing Certification authority must not write.",
  );

  pass(
    "Restore requires migrated Branch Certification private authority inside authenticated Portable Auth",
  );
}

// ============================================================
// TARGET UNAVAILABLE
// ============================================================

{
  const {
    state,
    dependencies,
  } =
    createScenario();

  state.writeError =
    new FinoraPortableBranchAuthStoreError(
      "STORAGE_UNAVAILABLE",
      "target unavailable",
    );

  const result =
    await restoreFinoraPortableBranchAuth(
      request(),
      dependencies,
    );

  assert(
    !result.success &&
    result.errorCode ===
      "TARGET_UNAVAILABLE",
    "Unavailable target must map safely.",
  );

  assert(
    state.readCalls ===
      0,
    "Failed write must not perform readback.",
  );

  pass(
    "unavailable Restore target fails closed before readback",
  );
}

// ============================================================
// READBACK REQUIRED
// ============================================================

{
  const {
    state,
    dependencies,
  } =
    createScenario();

  state.readback =
    null;

  // Preserve null after write for this test.
  dependencies.portableStore.write =
    async (
      storageMode,
      value,
    ) => {
      state.writeCalls +=
        1;

      state.writeMode =
        storageMode;

      state.writtenEnvelope =
        value;

      state.readback =
        null;
    };

  const result =
    await restoreFinoraPortableBranchAuth(
      request(),
      dependencies,
    );

  assert(
    !result.success &&
    result.errorCode ===
      "TARGET_READBACK_FAILED",
    "Missing readback must fail Restore.",
  );

  pass(
    "Restore success requires persisted target readback",
  );
}

// ============================================================
// EXACT READBACK REQUIRED
// ============================================================

{
  const {
    state,
    dependencies,
  } =
    createScenario();

  dependencies.portableStore.write =
    async (
      storageMode,
      value,
    ) => {
      state.writeCalls +=
        1;

      state.writeMode =
        storageMode;

      state.writtenEnvelope =
        value;

      state.readback =
        differentEnvelope;
    };

  const result =
    await restoreFinoraPortableBranchAuth(
      request(),
      dependencies,
    );

  assert(
    !result.success &&
    result.errorCode ===
      "TARGET_READBACK_FAILED",
    "Different persisted envelope must fail readback.",
  );

  pass(
    "Restore readback must canonicalize to the exact encrypted Backup envelope",
  );
}

console.log(
  "PASS: 5.6O-O2 Portable Branch Auth Restore coordinator executable proof",
);
}

void main().catch(
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