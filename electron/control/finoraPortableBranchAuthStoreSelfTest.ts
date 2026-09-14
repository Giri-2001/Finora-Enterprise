// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH NATIVE STORE SELF-TEST
// VERSION : 1.0
// STATUS  : Executable Proof
// ============================================================

import {
  createFinoraPortableBranchAuthTestSourceAuthorizationEvidence,
} from "./finoraPortableBranchAuthTestEvidence.js";

import {
  Buffer,
} from "node:buffer";

import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  serializeFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  createFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthCrypto.js";

import {
  FINORA_PORTABLE_BRANCH_AUTH_DIRECTORY,
  FINORA_PORTABLE_BRANCH_AUTH_FILE_NAME,
  FINORA_PORTABLE_BRANCH_AUTH_MAX_SERIALIZED_BYTES,
  FINORA_PORTABLE_BRANCH_AUTH_SUBDIRECTORY,
  FinoraPortableBranchAuthStore,
  FinoraPortableBranchAuthStoreError,
} from "./finoraPortableBranchAuthStore.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthContract.js";

// ============================================================
// ASSERTION HELPERS
// ============================================================

function assertTrue(
  condition:
    unknown,
  message:
    string,
): asserts condition {
  if (
    !condition
  ) {
    throw new Error(
      `FAIL: ${message}`,
    );
  }
}

async function expectStoreError(
  label:
    string,
  expectedCode:
    "STORAGE_UNAVAILABLE" |
    "INVALID_STORAGE" |
    "IO_FAILURE",
  action:
    () => Promise<unknown>,
): Promise<void> {
  try {
    await action();
  }
  catch (
    error
  ) {
    assertTrue(
      error instanceof
        FinoraPortableBranchAuthStoreError,
      `${label}: unexpected error type.`,
    );

    assertTrue(
      error.code ===
        expectedCode,
      `${label}: expected ${expectedCode}, got ${error.code}.`,
    );

    console.log(
      `PASS: ${label}`,
    );

    return;
  }

  throw new Error(
    `FAIL: ${label}: expected rejection.`,
  );
}

function getAuthDirectory(
  root:
    string,
): string {
  return join(
    root,
    FINORA_PORTABLE_BRANCH_AUTH_DIRECTORY,
    FINORA_PORTABLE_BRANCH_AUTH_SUBDIRECTORY,
  );
}

function getAuthFile(
  root:
    string,
): string {
  return join(
    getAuthDirectory(
      root,
    ),
    FINORA_PORTABLE_BRANCH_AUTH_FILE_NAME,
  );
}

async function createEnvelope(
  authStateId:
    string,
  updatedAt:
    string,
): Promise<FinoraPortableBranchAuthEnvelopeV1> {
  return createFinoraPortableBranchAuthEnvelopeV1({
    authStateId,

    sourceAuthorizationId:
      "FINORA-SOURCE-AUTHORIZATION-SELFTEST-000001",

    sourceAuthorizationVerificationEvidence:
      createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
        "FINORA-SOURCE-AUTHORIZATION-SELFTEST-000001",
      ),

    ownerId:
      "OWNER-STORE-000001",

    businessId:
      "BUSINESS-STORE-000001",

    branchId:
      "BRANCH-STORE-000001",

    userId:
      "USER-STORE-000001",

    username:
      "Admin",

    fullName:
      "FINORA Store Test Owner",

    role:
      "OWNER",

    dataContext:
      "REAL",

    storageMode:
      "USB",

    authGeneration:
      1,

    createdAt:
      "2026-09-11T12:00:00.000Z",

    updatedAt,

    password:
      "admin123",

    securityCode:
      "branch-sec-9876",
  });
}

// ============================================================
// EXECUTABLE PROOF
// ============================================================

async function main(): Promise<void> {
  console.log(
    "===== PHASE 5.6E3D2C PORTABLE AUTH NATIVE STORE EXECUTABLE PROOF =====",
  );

  const sandboxRoot =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-portable-auth-store-",
      ),
    );

  const localRoot =
    join(
      sandboxRoot,
      "local-root",
    );

  const usbRoot =
    join(
      sandboxRoot,
      "usb-root",
    );

  await mkdir(
    localRoot,
    {
      recursive:
        true,
    },
  );

  await mkdir(
    usbRoot,
    {
      recursive:
        true,
    },
  );

  try {
    let localResolverCalls =
      0;

    let usbResolverCalls =
      0;

    const store =
      new FinoraPortableBranchAuthStore({
        resolveLocalRoot:
          () => {
            localResolverCalls +=
              1;

            return localRoot;
          },

        resolveUsbRoot:
          async () => {
            usbResolverCalls +=
              1;

            return usbRoot;
          },
      });

    const envelopeA =
      await createEnvelope(
        "PORTABLE-STORE-A",
        "2026-09-11T12:00:01.000Z",
      );

    const envelopeB =
      await createEnvelope(
        "PORTABLE-STORE-B",
        "2026-09-11T12:00:02.000Z",
      );

    // ========================================================
    // EMPTY READS
    // ========================================================

    const emptyLocal =
      await store.read(
        "LOCAL",
      );

    assertTrue(
      emptyLocal === null,
      "Missing LOCAL portable auth must return null.",
    );

    console.log(
      "PASS: missing LOCAL portable auth returns null",
    );

    const emptyUsb =
      await store.read(
        "USB",
      );

    assertTrue(
      emptyUsb === null,
      "Missing USB portable auth must return null.",
    );

    console.log(
      "PASS: missing USB portable auth returns null",
    );

    // ========================================================
    // LOCAL ROUNDTRIP
    // ========================================================

    await store.write(
      "LOCAL",
      envelopeA,
    );

    const localFile =
      getAuthFile(
        localRoot,
      );

    const localFileStat =
      await stat(
        localFile,
      );

    assertTrue(
      localFileStat.isFile(),
      "LOCAL portable auth physical target is not a file.",
    );

    const localRoundtrip =
      await store.read(
        "LOCAL",
      );

    assertTrue(
      localRoundtrip !== null,
      "LOCAL roundtrip returned null.",
    );

    assertTrue(
      serializeFinoraPortableBranchAuthEnvelopeV1(
        localRoundtrip,
      ) ===
        serializeFinoraPortableBranchAuthEnvelopeV1(
          envelopeA,
        ),
      "LOCAL roundtrip changed the envelope.",
    );

    console.log(
      "PASS: LOCAL exact-path write/read roundtrip",
    );

    // ========================================================
    // USB ROUNDTRIP
    // ========================================================

    await store.write(
      "USB",
      envelopeA,
    );

    const usbFile =
      getAuthFile(
        usbRoot,
      );

    const usbFileStat =
      await stat(
        usbFile,
      );

    assertTrue(
      usbFileStat.isFile(),
      "USB portable auth physical target is not a file.",
    );

    const usbRoundtrip =
      await store.read(
        "USB",
      );

    assertTrue(
      usbRoundtrip !== null,
      "USB roundtrip returned null.",
    );

    assertTrue(
      serializeFinoraPortableBranchAuthEnvelopeV1(
        usbRoundtrip,
      ) ===
        serializeFinoraPortableBranchAuthEnvelopeV1(
          envelopeA,
        ),
      "USB roundtrip changed the envelope.",
    );

    console.log(
      "PASS: USB exact-path write/read roundtrip",
    );

    assertTrue(
      localFile ===
        join(
          localRoot,
          "FINORA",
          "auth",
          "finora-branch-auth.bin",
        ),
      "LOCAL physical path contract changed.",
    );

    assertTrue(
      usbFile ===
        join(
          usbRoot,
          "FINORA",
          "auth",
          "finora-branch-auth.bin",
        ),
      "USB physical path contract changed.",
    );

    console.log(
      "PASS: physical path contract is FINORA/auth/finora-branch-auth.bin",
    );

    // ========================================================
    // FILE PERMISSIONS WHERE SUPPORTED
    // ========================================================

    if (
      process.platform !==
        "win32"
    ) {
      const localMode =
        localFileStat.mode &
        0o777;

      const usbMode =
        usbFileStat.mode &
        0o777;

      assertTrue(
        localMode ===
          0o600,
        `LOCAL file mode expected 0600, got ${localMode.toString(8)}.`,
      );

      assertTrue(
        usbMode ===
          0o600,
        `USB file mode expected 0600, got ${usbMode.toString(8)}.`,
      );

      console.log(
        "PASS: portable auth files use 0600 permissions",
      );
    }
    else {
      console.log(
        "PASS: 0600 requested by store; POSIX permission-bit assertion not applicable on win32",
      );
    }

    // ========================================================
    // USB MUST NEVER FALL BACK TO LOCAL
    // ========================================================

    let noFallbackLocalCalls =
      0;

    let noFallbackUsbCalls =
      0;

    const disconnectedUsbStore =
      new FinoraPortableBranchAuthStore({
        resolveLocalRoot:
          () => {
            noFallbackLocalCalls +=
              1;

            return localRoot;
          },

        resolveUsbRoot:
          async () => {
            noFallbackUsbCalls +=
              1;

            return null;
          },
      });

    await expectStoreError(
      "USB disconnected fails closed",
      "STORAGE_UNAVAILABLE",
      () =>
        disconnectedUsbStore.read(
          "USB",
        ),
    );

    assertTrue(
      noFallbackUsbCalls ===
        1,
      "USB resolver was not called exactly once.",
    );

    assertTrue(
      noFallbackLocalCalls ===
        0,
      "USB failure consulted LOCAL root.",
    );

    console.log(
      "PASS: USB disconnected has zero LOCAL fallback",
    );

    // ========================================================
    // STRICT STRUCTURAL VALIDATION
    // ========================================================

    const validUsbSerialized =
      await readFile(
        usbFile,
        "utf8",
      );

    const malformedEnvelope =
      JSON.parse(
        validUsbSerialized,
      ) as Record<string, unknown>;

    malformedEnvelope.unexpectedField =
      "NOT_ALLOWED";

    await writeFile(
      usbFile,
      JSON.stringify(
        malformedEnvelope,
      ),
      "utf8",
    );

    await expectStoreError(
      "unexpected envelope field rejected on native read",
      "INVALID_STORAGE",
      () =>
        store.read(
          "USB",
        ),
    );

    await store.write(
      "USB",
      envelopeA,
    );

    await writeFile(
      usbFile,
      "{not-json",
      "utf8",
    );

    await expectStoreError(
      "malformed JSON rejected on native read",
      "INVALID_STORAGE",
      () =>
        store.read(
          "USB",
        ),
    );

    await store.write(
      "USB",
      envelopeA,
    );

    console.log(
      "PASS: native store performs strict envelope parsing",
    );

    // ========================================================
    // STRICT SIZE LIMIT
    // ========================================================

    await writeFile(
      usbFile,
      Buffer.alloc(
        FINORA_PORTABLE_BRANCH_AUTH_MAX_SERIALIZED_BYTES +
          1,
        0x41,
      ),
    );

    await expectStoreError(
      "oversized portable auth file rejected before parsing",
      "INVALID_STORAGE",
      () =>
        store.read(
          "USB",
        ),
    );

    await store.write(
      "USB",
      envelopeA,
    );

    console.log(
      "PASS: strict serialized size limit enforced",
    );

    // ========================================================
    // SERIALIZED WRITES
    // ========================================================

    await Promise.all([
      store.write(
        "LOCAL",
        envelopeA,
      ),

      store.write(
        "LOCAL",
        envelopeB,
      ),
    ]);

    const serializedFinal =
      await store.read(
        "LOCAL",
      );

    assertTrue(
      serializedFinal !== null,
      "Serialized concurrent writes produced no final state.",
    );

    assertTrue(
      serializeFinoraPortableBranchAuthEnvelopeV1(
        serializedFinal,
      ) ===
        serializeFinoraPortableBranchAuthEnvelopeV1(
          envelopeB,
        ),
      "Serialized write ordering did not preserve the second queued write.",
    );

    console.log(
      "PASS: same-store writes are serialized deterministically",
    );

    // ========================================================
    // TEMP CLEANUP ON FAILED PROMOTION
    // ========================================================

    await rm(
      usbFile,
      {
        force:
          true,
        recursive:
          true,
      },
    );

    await mkdir(
      usbFile,
    );

    await expectStoreError(
      "failed atomic promotion surfaces IO_FAILURE",
      "IO_FAILURE",
      () =>
        store.write(
          "USB",
          envelopeB,
        ),
    );

    const usbAuthDirectory =
      getAuthDirectory(
        usbRoot,
      );

    const authDirectoryEntries =
      await readdir(
        usbAuthDirectory,
      );

    const leakedTemporaryFiles =
      authDirectoryEntries.filter(
        (
          fileName,
        ) =>
          fileName.startsWith(
            `${FINORA_PORTABLE_BRANCH_AUTH_FILE_NAME}.`,
          ) &&
          fileName.endsWith(
            ".tmp",
          ),
      );

    assertTrue(
      leakedTemporaryFiles.length ===
        0,
      `Failed write leaked temporary files: ${leakedTemporaryFiles.join(", ")}`,
    );

    console.log(
      "PASS: failed atomic promotion cleans unique temporary file",
    );

    await rm(
      usbFile,
      {
        recursive:
          true,
        force:
          true,
      },
    );

    await store.write(
      "USB",
      envelopeB,
    );

    const recoveredUsb =
      await store.read(
        "USB",
      );

    assertTrue(
      recoveredUsb !== null,
      "Store did not recover after failed atomic promotion.",
    );

    assertTrue(
      serializeFinoraPortableBranchAuthEnvelopeV1(
        recoveredUsb,
      ) ===
        serializeFinoraPortableBranchAuthEnvelopeV1(
          envelopeB,
        ),
      "Recovered USB state does not match expected envelope.",
    );

    console.log(
      "PASS: store remains usable after failed promotion cleanup",
    );

    // ========================================================
    // RESOLVER AUTHORITY OBSERVATION
    // ========================================================

    assertTrue(
      localResolverCalls >
        0,
      "LOCAL resolver was never used.",
    );

    assertTrue(
      usbResolverCalls >
        0,
      "USB resolver was never used.",
    );

    console.log(
      "PASS: native roots are obtained only through injected authoritative resolvers",
    );

    console.log(
      "",
    );

    console.log(
      "PASS: PHASE 5.6E3D2C PORTABLE BRANCH AUTH NATIVE STORE EXECUTABLE PROOF",
    );
  }
  finally {
    await rm(
      sandboxRoot,
      {
        recursive:
          true,

        force:
          true,
      },
    );
  }
}

void main().catch(
  (
    error,
  ) => {
    console.error(
      "",
    );

    console.error(
      "SELF-TEST FAILED",
    );

    console.error(
      error,
    );

    process.exitCode =
      1;
  },
);

// ============================================================
// END
// ============================================================