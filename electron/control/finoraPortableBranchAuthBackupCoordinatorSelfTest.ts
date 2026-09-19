// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH BACKUP COORDINATOR SELF-TEST
// PHASE : 5.6N-N2
// ============================================================

import {
  createFinoraPortableBranchAuthBackup,
} from "./finoraPortableBranchAuthBackupCoordinator.js";

import type {
  FinoraPortableBranchAuthBackupCoordinatorDependencies,
} from "./finoraPortableBranchAuthBackupCoordinator.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
  FinoraPortableBranchAuthPayloadV1,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import type {
  FinoraBranchOperationalSessionContextResult,
} from "./finoraBranchLoginSessionAuthority.js";

function assert(
  condition:
    unknown,
  message:
    string,
): asserts condition {
  if (
    !condition
  ) {
    throw new Error(
      message,
    );
  }
}

const PASSWORD =
  "Correct-Password-For-N2";

const SECURITY_CODE =
  "Correct-Security-Code-N2";

const SESSION_ID =
  "FINORA-SESSION-N2-TEST";

const SERIALIZED_PORTABLE_AUTH =
  '{"format":"ENCRYPTED-PORTABLE-AUTH-N2-TEST"}';

const TEST_ENVELOPE =
  {} as FinoraPortableBranchAuthEnvelopeV1;

function createPayload(
  overrides:
    Partial<
      FinoraPortableBranchAuthPayloadV1
    > = {},
): FinoraPortableBranchAuthPayloadV1 {
  return {
    ownerId:
      "OWNER-N2",

    businessId:
      "BUSINESS-N2",

    branchId:
      "BRANCH-N2",

    storageMode:
      "USB",

    authGeneration:
      7,

    branchCertificationKeyMaterial:
      {} as NonNullable<
        FinoraPortableBranchAuthPayloadV1[
          "branchCertificationKeyMaterial"
        ]
      >,

    ...overrides,
  } as FinoraPortableBranchAuthPayloadV1;
}

function createSessionResult(
  accessMode:
    "ACTIVE" |
    "REGISTERED_EXPIRED_READ_ONLY" = "ACTIVE",
  storageMode:
    "LOCAL" |
    "USB" = "USB",
  authGeneration:
    number = 7,
): FinoraBranchOperationalSessionContextResult {
  return {
    success:
      true,

    data: {
      session: {
        sessionId:
          SESSION_ID,

        userId:
          "USER-N2",

        username:
          "owner-n2",

        fullName:
          "Owner N2",

        role:
          "ADMIN",

        ownerId:
          "OWNER-N2",

        businessId:
          "BUSINESS-N2",

        branchId:
          "BRANCH-N2",

        storageMode,

        dataContext:
          "REAL",

        accessMode,

        loginTime:
          "2026-09-17T10:00:00.000Z",

        lastActivity:
          "2026-09-17T10:01:00.000Z",

        validatedAt:
          "2026-09-17T10:01:00.000Z",
      },

      principal: {
        authGeneration,

        userId:
          "USER-N2",

        username:
          "owner-n2",

        ownerId:
          "OWNER-N2",

        businessId:
          "BUSINESS-N2",

        branchId:
          "BRANCH-N2",

        storageMode,

        dataContext:
          "REAL",
      },
    },
  };
}

function createStore(
  envelope:
    FinoraPortableBranchAuthEnvelopeV1 | null = TEST_ENVELOPE,
  onRead?:
    (
      storageMode:
        "LOCAL" | "USB",
    ) =>
      void,
): Pick<
  FinoraPortableBranchAuthStore,
  "read"
> {
  return {
    read:
      async (
        storageMode,
      ) => {
        onRead?.(
          storageMode,
        );

        return envelope;
      },
  };
}

function createDependencies(
  options:
    {
      sessionResult?:
        FinoraBranchOperationalSessionContextResult;

      payload?:
        FinoraPortableBranchAuthPayloadV1;

      onResolveSession?:
        (
          sessionId:
            string,
        ) =>
          void;

      onDecrypt?:
        (
          password:
            string,
          securityCode:
            string,
          scope: {
            ownerId:
              string;

            businessId:
              string;

            branchId:
              string;
          },
        ) =>
          void;
    } = {},
): FinoraPortableBranchAuthBackupCoordinatorDependencies {
  return {
    resolveSession:
      async (
        sessionId,
      ) => {
        options.onResolveSession?.(
          sessionId,
        );

        return (
          options.sessionResult ??
          createSessionResult()
        );
      },

    decryptPortableAuth:
      async (
        _envelope,
        password,
        securityCode,
        expectedScope,
      ) => {
        options.onDecrypt?.(
          password,
          securityCode,
          expectedScope,
        );

        if (
          password !==
            PASSWORD ||
          securityCode !==
            SECURITY_CODE
        ) {
          throw new Error(
            "TEST AUTH FAILURE",
          );
        }

        return (
          options.payload ??
          createPayload()
        );
      },

    serializePortableAuth:
      () =>
        SERIALIZED_PORTABLE_AUTH,

    now:
      () =>
        new Date(
          "2026-09-17T16:45:00.000Z",
        ),

    createBackupId:
      () =>
        "FINORA-PBA-BACKUP-N2-TEST-0001",
  };
}

async function runSelfTest(): Promise<void> {
  // ==========================================================
  // SUCCESS — ACTIVE
  // ==========================================================

  let readMode:
    "LOCAL" | "USB" | null =
      null;

  const observation:
    {
      decryptedScope:
        {
          ownerId:
            string;

          businessId:
            string;

          branchId:
            string;
        } | null;
    } = {
      decryptedScope:
        null,
    };

  const success =
    await createFinoraPortableBranchAuthBackup(
      {
        sessionId:
          SESSION_ID,

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
      createStore(
        TEST_ENVELOPE,
        (
          storageMode,
        ) => {
          readMode =
            storageMode;
        },
      ),
      createDependencies({
        onDecrypt:
          (
            _password,
            _securityCode,
            scope,
          ) => {
            observation.decryptedScope =
              scope;
          },
      }),
    );

  assert(
    success.success,
    "Expected authenticated backup creation success.",
  );

  assert(
    readMode ===
      "USB",
    "Backup did not read Portable Auth from authoritative session storageMode.",
  );

  const decryptedScope =
    observation.decryptedScope;

  assert(
    decryptedScope !==
      null &&
    decryptedScope.ownerId ===
      "OWNER-N2" &&
    decryptedScope.businessId ===
      "BUSINESS-N2" &&
    decryptedScope.branchId ===
      "BRANCH-N2",
    "Backup decrypt did not use authoritative session branch scope.",
  );

  assert(
    success.data.backupId ===
      "FINORA-PBA-BACKUP-N2-TEST-0001" &&
    success.data.createdAt ===
      "2026-09-17T16:45:00.000Z" &&
    success.data.sourceStorageMode ===
      "USB" &&
    success.data.authGeneration ===
      7,
    "Backup authoritative metadata is invalid.",
  );

  assert(
    success.data.backupFile
      .portableAuthEnvelopeSerialized ===
      SERIALIZED_PORTABLE_AUTH,
    "Backup did not preserve canonical encrypted Portable Auth serialization.",
  );

  assert(
    !success.data.serializedBackup.includes(
      PASSWORD,
    ) &&
    !success.data.serializedBackup.includes(
      SECURITY_CODE,
    ),
    "Backup serialization contains credential plaintext.",
  );

  console.log(
    "PASS: ACTIVE session creates backup from authoritative scope/storage/generation only",
  );

  console.log(
    "PASS: backup output preserves canonical encrypted Portable Auth and excludes credential plaintext",
  );

  // ==========================================================
  // READ-ONLY EXPIRED IS ALLOWED FOR NON-MUTATING BACKUP
  // ==========================================================

  const expiredReadOnly =
    await createFinoraPortableBranchAuthBackup(
      {
        sessionId:
          SESSION_ID,

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
      createStore(),
      createDependencies({
        sessionResult:
          createSessionResult(
            "REGISTERED_EXPIRED_READ_ONLY",
          ),
      }),
    );

  assert(
    expiredReadOnly.success,
    "REGISTERED_EXPIRED_READ_ONLY session must retain backup/export ability.",
  );

  console.log(
    "PASS: REGISTERED_EXPIRED_READ_ONLY session may create non-mutating recovery backup",
  );

  // ==========================================================
  // REQUEST CANNOT INJECT BRANCH SCOPE
  // ==========================================================

  let resolverCalls =
    0;

  const injectedScope =
    await createFinoraPortableBranchAuthBackup(
      {
        sessionId:
          SESSION_ID,

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,

        ownerId:
          "ATTACKER-OWNER",
      },
      createStore(),
      createDependencies({
        onResolveSession:
          () => {
            resolverCalls +=
              1;
          },
      }),
    );

  assert(
    !injectedScope.success &&
    injectedScope.errorCode ===
      "INVALID_REQUEST" &&
    resolverCalls ===
      0,
    "Renderer-injected branch scope was not rejected before authority resolution.",
  );

  console.log(
    "PASS: backup request rejects renderer-injected branch identity before session resolution",
  );

  // ==========================================================
  // SESSION FAILURE STOPS BEFORE SOURCE READ
  // ==========================================================

  let deniedReadCalls =
    0;

  const denied =
    await createFinoraPortableBranchAuthBackup(
      {
        sessionId:
          SESSION_ID,

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
      createStore(
        TEST_ENVELOPE,
        () => {
          deniedReadCalls +=
            1;
        },
      ),
      createDependencies({
        sessionResult: {
          success:
            false,

          errorCode:
            "SESSION_NOT_FOUND",

          error:
            "TEST",
        },
      }),
    );

  assert(
    !denied.success &&
    denied.errorCode ===
      "SESSION_DENIED" &&
    deniedReadCalls ===
      0,
    "Invalid session reached Portable Auth storage.",
  );

  console.log(
    "PASS: invalid session fails before Portable Auth storage access",
  );

  // ==========================================================
  // WRONG CREDENTIALS
  // ==========================================================

  const wrongPassword =
    await createFinoraPortableBranchAuthBackup(
      {
        sessionId:
          SESSION_ID,

        password:
          "WRONG-PASSWORD",

        securityCode:
          SECURITY_CODE,
      },
      createStore(),
      createDependencies(),
    );

  assert(
    !wrongPassword.success &&
    wrongPassword.errorCode ===
      "AUTHENTICATION_FAILED",
    "Wrong Password did not fail closed.",
  );

  const wrongSecurityCode =
    await createFinoraPortableBranchAuthBackup(
      {
        sessionId:
          SESSION_ID,

        password:
          PASSWORD,

        securityCode:
          "WRONG-SECURITY-CODE",
      },
      createStore(),
      createDependencies(),
    );

  assert(
    !wrongSecurityCode.success &&
    wrongSecurityCode.errorCode ===
      "AUTHENTICATION_FAILED",
    "Wrong Security Code did not fail closed.",
  );

  console.log(
    "PASS: wrong Password or Security Code fails backup authentication closed",
  );

  // ==========================================================
  // SOURCE MISSING
  // ==========================================================

  const missing =
    await createFinoraPortableBranchAuthBackup(
      {
        sessionId:
          SESSION_ID,

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
      createStore(
        null,
      ),
      createDependencies(),
    );

  assert(
    !missing.success &&
    missing.errorCode ===
      "SOURCE_NOT_FOUND",
    "Missing Portable Auth source did not fail closed.",
  );

  console.log(
    "PASS: missing live Portable Auth fails backup creation closed",
  );

  // ==========================================================
  // CERTIFICATION AUTHORITY REQUIRED
  // ==========================================================

  const noCertification =
    await createFinoraPortableBranchAuthBackup(
      {
        sessionId:
          SESSION_ID,

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
      createStore(),
      createDependencies({
        payload:
          createPayload({
            branchCertificationKeyMaterial:
              undefined,
          }),
      }),
    );

  assert(
    !noCertification.success &&
    noCertification.errorCode ===
      "CERTIFICATION_AUTHORITY_MISSING",
    "Backup accepted Portable Auth without migrated Branch Certification authority.",
  );

  console.log(
    "PASS: backup requires migrated Branch Certification private authority inside encrypted Portable Auth",
  );

  // ==========================================================
  // STORAGE MODE MUST MATCH SESSION
  // ==========================================================

  const wrongStorage =
    await createFinoraPortableBranchAuthBackup(
      {
        sessionId:
          SESSION_ID,

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
      createStore(),
      createDependencies({
        payload:
          createPayload({
            storageMode:
              "LOCAL",
          }),
      }),
    );

  assert(
    !wrongStorage.success &&
    wrongStorage.errorCode ===
      "STORAGE_MODE_MISMATCH",
    "Backup accepted Portable Auth from mismatched storage mode.",
  );

  console.log(
    "PASS: decrypted Portable Auth storageMode must match authoritative session storageMode",
  );

  // ==========================================================
  // GENERATION MUST MATCH SESSION
  // ==========================================================

  const wrongGeneration =
    await createFinoraPortableBranchAuthBackup(
      {
        sessionId:
          SESSION_ID,

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
      createStore(),
      createDependencies({
        payload:
          createPayload({
            authGeneration:
              8,
          }),
      }),
    );

  assert(
    !wrongGeneration.success &&
    wrongGeneration.errorCode ===
      "AUTH_GENERATION_MISMATCH",
    "Backup accepted mismatched credential generation.",
  );

  console.log(
    "PASS: decrypted Portable Auth authGeneration must match authoritative session generation",
  );

  // ==========================================================
  // SCOPE MUST MATCH SESSION
  // ==========================================================

  const wrongScope =
    await createFinoraPortableBranchAuthBackup(
      {
        sessionId:
          SESSION_ID,

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
      createStore(),
      createDependencies({
        payload:
          createPayload({
            branchId:
              "OTHER-BRANCH",
          }),
      }),
    );

  assert(
    !wrongScope.success &&
    wrongScope.errorCode ===
      "SCOPE_MISMATCH",
    "Backup accepted mismatched branch scope.",
  );

  console.log(
    "PASS: decrypted Portable Auth owner/business/branch scope must match authoritative session",
  );

  // ==========================================================
  // SESSION VIEW / PRINCIPAL CONSISTENCY
  // ==========================================================

  const inconsistentSession =
    createSessionResult();

  if (
    inconsistentSession.success
  ) {
    inconsistentSession.data.session.branchId =
      "OTHER-BRANCH";
  }

  let inconsistentReadCalls =
    0;

  const inconsistent =
    await createFinoraPortableBranchAuthBackup(
      {
        sessionId:
          SESSION_ID,

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
      createStore(
        TEST_ENVELOPE,
        () => {
          inconsistentReadCalls +=
            1;
        },
      ),
      createDependencies({
        sessionResult:
          inconsistentSession,
      }),
    );

  assert(
    !inconsistent.success &&
    inconsistent.errorCode ===
      "SESSION_STATE_MISMATCH" &&
    inconsistentReadCalls ===
      0,
    "Inconsistent session authority reached Portable Auth storage.",
  );

  console.log(
    "PASS: inconsistent session view/principal authority fails before source read",
  );

  console.log(
    "PASS: 5.6N-N2 authenticated backup creation coordinator executable proof",
  );
}

runSelfTest()
  .then(
    () => {
      process.exitCode =
        0;
    },
  )
  .catch(
    (
      error,
    ) => {
      console.error(
        "SELF-TEST FAILED:",
        error,
      );

      process.exitCode =
        1;
    },
  );