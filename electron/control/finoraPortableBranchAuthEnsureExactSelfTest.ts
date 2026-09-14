// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH ENSURE-EXACT SELF TEST
//
// PROVES:
//
// - Missing portable state is written exactly once
// - Exact retry is idempotent
// - Different valid envelope cannot overwrite existing state
// - Conflict fails closed with INVALID_STORAGE
// - Original persisted envelope remains unchanged
// - LOCAL path never consults USB resolver
// ============================================================

import {
  createFinoraPortableBranchAuthTestSourceAuthorizationEvidence,
} from "./finoraPortableBranchAuthTestEvidence.js";

import {
  mkdir,
  mkdtemp,
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
  createFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthCrypto.js";

import {
  FINORA_PORTABLE_BRANCH_AUTH_DIRECTORY,
  FINORA_PORTABLE_BRANCH_AUTH_FILE_NAME,
  FINORA_PORTABLE_BRANCH_AUTH_SUBDIRECTORY,
  FinoraPortableBranchAuthStore,
  FinoraPortableBranchAuthStoreError,
} from "./finoraPortableBranchAuthStore.js";

// ============================================================
// HELPERS
// ============================================================

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

function assertJsonEqual(
  actual:
    unknown,
  expected:
    unknown,
  message:
    string,
): void {
  assert(
    JSON.stringify(
      actual,
    ) ===
      JSON.stringify(
        expected,
      ),
    message,
  );
}

// ============================================================
// SELF TEST
// ============================================================

async function runSelfTest():
  Promise<void> {
  let temporaryRoot:
    string |
    undefined;

  try {
    temporaryRoot =
      await mkdtemp(
        join(
          tmpdir(),
          "finora-portable-auth-ensure-exact-",
        ),
      );

    let usbResolverCalls =
      0;

    const store =
      new FinoraPortableBranchAuthStore({
        resolveLocalRoot:
          () =>
            temporaryRoot,

        resolveUsbRoot:
          async () => {
            usbResolverCalls +=
              1;

            return null;
          },
      });

    const createdAt =
      "2026-09-11T12:00:00.000Z";

    const firstEnvelope =
      await createFinoraPortableBranchAuthEnvelopeV1({
        authStateId:
          "PORTABLE-ENSURE-EXACT-AUTH-STATE-000001",

        sourceAuthorizationId:
          "FINORA-SOURCE-AUTHORIZATION-SELFTEST-000001",

        sourceAuthorizationVerificationEvidence:
          createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
            "FINORA-SOURCE-AUTHORIZATION-SELFTEST-000001",
          ),

        ownerId:
          "OWNER-ENSURE-EXACT-000001",

        businessId:
          "BUSINESS-ENSURE-EXACT-000001",

        branchId:
          "BRANCH-ENSURE-EXACT-000001",

        userId:
          "USER-ENSURE-EXACT-000001",

        username:
          "admin",

        fullName:
          "FINORA Admin",

        role:
          "ADMIN",

        dataContext:
          "REAL",

        storageMode:
          "LOCAL",

        authGeneration:
          1,

        createdAt,

        updatedAt:
          createdAt,

        password:
          "admin123",

        securityCode:
          "FINORA-Security@8421",
      });

    // ========================================================
    // MISSING -> WRITTEN
    // ========================================================

    const firstResult =
      await store.ensureExact(
        "LOCAL",
        firstEnvelope,
      );

    assert(
      firstResult ===
        "WRITTEN",
      "Missing Portable Auth state did not return WRITTEN.",
    );

    console.log(
      "PASS: missing portable state -> WRITTEN",
    );

    const firstRead =
      await store.read(
        "LOCAL",
      );

    assert(
      firstRead !==
        null,
      "Portable Auth state is missing after WRITTEN result.",
    );

    assertJsonEqual(
      firstRead,
      firstEnvelope,
      "Persisted Portable Auth envelope does not match first envelope.",
    );

    console.log(
      "PASS: first envelope persisted exactly",
    );

    // ========================================================
    // EXACT RETRY -> ALREADY_MATCHED
    // ========================================================

    const retryResult =
      await store.ensureExact(
        "LOCAL",
        firstEnvelope,
      );

    assert(
      retryResult ===
        "ALREADY_MATCHED",
      "Exact Portable Auth retry did not return ALREADY_MATCHED.",
    );

    console.log(
      "PASS: exact retry -> ALREADY_MATCHED",
    );

    const afterRetryRead =
      await store.read(
        "LOCAL",
      );

    assertJsonEqual(
      afterRetryRead,
      firstEnvelope,
      "Exact retry changed persisted Portable Auth state.",
    );

    console.log(
      "PASS: exact retry leaves persisted envelope unchanged",
    );

    // ========================================================
    // DIFFERENT VALID ENVELOPE
    // ========================================================

    const secondEnvelope =
      await createFinoraPortableBranchAuthEnvelopeV1({
        authStateId:
          "PORTABLE-ENSURE-EXACT-AUTH-STATE-000002",

        sourceAuthorizationId:
          "FINORA-SOURCE-AUTHORIZATION-SELFTEST-000001",

        sourceAuthorizationVerificationEvidence:
          createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
            "FINORA-SOURCE-AUTHORIZATION-SELFTEST-000001",
          ),

        ownerId:
          "OWNER-ENSURE-EXACT-000001",

        businessId:
          "BUSINESS-ENSURE-EXACT-000001",

        branchId:
          "BRANCH-ENSURE-EXACT-000001",

        userId:
          "USER-ENSURE-EXACT-000001",

        username:
          "admin",

        fullName:
          "FINORA Admin",

        role:
          "ADMIN",

        dataContext:
          "REAL",

        storageMode:
          "LOCAL",

        authGeneration:
          2,

        createdAt:
          "2026-09-11T12:00:01.000Z",

        updatedAt:
          "2026-09-11T12:00:01.000Z",

        password:
          "admin123",

        securityCode:
          "FINORA-Security@8421",
      });

    assert(
      JSON.stringify(
        secondEnvelope,
      ) !==
        JSON.stringify(
          firstEnvelope,
        ),
      "Conflict fixture unexpectedly produced the same envelope.",
    );

    let conflict:
      unknown;

    try {
      await store.ensureExact(
        "LOCAL",
        secondEnvelope,
      );
    }
    catch (
      error
    ) {
      conflict =
        error;
    }

    assert(
      conflict instanceof
        FinoraPortableBranchAuthStoreError,
      "Different valid envelope did not fail with Portable Auth Store error.",
    );

    assert(
      conflict.code ===
        "INVALID_STORAGE",
      `Different valid envelope returned unexpected error code: ${conflict.code}`,
    );

    console.log(
      "PASS: different valid envelope -> INVALID_STORAGE",
    );

    // ========================================================
    // ORIGINAL MUST SURVIVE CONFLICT
    // ========================================================

    const afterConflictRead =
      await store.read(
        "LOCAL",
      );

    assertJsonEqual(
      afterConflictRead,
      firstEnvelope,
      "Conflict attempt overwrote the original Portable Auth envelope.",
    );

    assert(
      JSON.stringify(
        afterConflictRead,
      ) !==
        JSON.stringify(
          secondEnvelope,
        ),
      "Conflicting envelope replaced original Portable Auth state.",
    );

    console.log(
      "PASS: conflict does not overwrite original envelope",
    );

    // ========================================================
    // REPLACE EXACT — EXPECTED CURRENT -> REPLACED
    // ========================================================

    const replaceResult =
      await store.replaceExact(
        "LOCAL",
        firstEnvelope,
        secondEnvelope,
      );

    assert(
      replaceResult ===
        "REPLACED",
      "Expected-current Portable Auth was not replaced.",
    );

    const afterReplaceRead =
      await store.read(
        "LOCAL",
      );

    assertJsonEqual(
      afterReplaceRead,
      secondEnvelope,
      "CAS replacement did not persist replacement envelope.",
    );

    console.log(
      "PASS: expected current -> REPLACED",
    );

    // ========================================================
    // EXACT RETRY — REPLACEMENT ALREADY PRESENT
    // ========================================================

    const replaceRetry =
      await store.replaceExact(
        "LOCAL",
        firstEnvelope,
        secondEnvelope,
      );

    assert(
      replaceRetry ===
        "ALREADY_MATCHED",
      "Exact replacement retry was not idempotent.",
    );

    console.log(
      "PASS: replacement retry -> ALREADY_MATCHED",
    );

    const thirdEnvelope =
      await createFinoraPortableBranchAuthEnvelopeV1({
        authStateId:
          "PORTABLE-ENSURE-EXACT-AUTH-STATE-000003",

        sourceAuthorizationId:
          "FINORA-SOURCE-AUTHORIZATION-SELFTEST-000001",

        sourceAuthorizationVerificationEvidence:
          createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
            "FINORA-SOURCE-AUTHORIZATION-SELFTEST-000001",
          ),

        ownerId:
          "OWNER-ENSURE-EXACT-000001",

        businessId:
          "BUSINESS-ENSURE-EXACT-000001",

        branchId:
          "BRANCH-ENSURE-EXACT-000001",

        userId:
          "USER-ENSURE-EXACT-000001",

        username:
          "admin",

        fullName:
          "FINORA Admin",

        role:
          "ADMIN",

        dataContext:
          "REAL",

        storageMode:
          "LOCAL",

        authGeneration:
          3,

        createdAt:
          "2026-09-11T12:00:02.000Z",

        updatedAt:
          "2026-09-11T12:00:02.000Z",

        password:
          "admin123",

        securityCode:
          "FINORA-Security@8421",
      });

    // ========================================================
    // UNEXPECTED VALID CURRENT -> FAIL CLOSED
    //
    // Current is secondEnvelope. Caller incorrectly expects
    // firstEnvelope and asks to replace with thirdEnvelope.
    // ========================================================

    let unexpectedCurrentError:
      unknown;

    try {
      await store.replaceExact(
        "LOCAL",
        firstEnvelope,
        thirdEnvelope,
      );
    }
    catch (error) {
      unexpectedCurrentError =
        error;
    }

    assert(
      unexpectedCurrentError instanceof
        FinoraPortableBranchAuthStoreError &&
      unexpectedCurrentError.code ===
        "INVALID_STORAGE",
      "Unexpected valid current state did not fail closed.",
    );

    const afterUnexpectedRead =
      await store.read(
        "LOCAL",
      );

    assertJsonEqual(
      afterUnexpectedRead,
      secondEnvelope,
      "Unexpected-current failure overwrote current Portable Auth.",
    );

    console.log(
      "PASS: unexpected valid current fails closed without overwrite",
    );

    // ========================================================
    // MISSING CURRENT -> FAIL CLOSED
    // ========================================================

    const missingRoot =
      join(
        temporaryRoot,
        "missing-cas",
      );

    const missingStore =
      new FinoraPortableBranchAuthStore({
        resolveLocalRoot:
          () =>
            missingRoot,

        resolveUsbRoot:
          async () =>
            null,
      });

    let missingError:
      unknown;

    try {
      await missingStore.replaceExact(
        "LOCAL",
        firstEnvelope,
        secondEnvelope,
      );
    }
    catch (error) {
      missingError =
        error;
    }

    assert(
      missingError instanceof
        FinoraPortableBranchAuthStoreError &&
      missingError.code ===
        "INVALID_STORAGE",
      "Missing current Portable Auth did not fail closed.",
    );

    console.log(
      "PASS: missing current state fails closed",
    );

    // ========================================================
    // MALFORMED CURRENT -> FAIL CLOSED / NO OVERWRITE
    // ========================================================

    const malformedRoot =
      join(
        temporaryRoot,
        "malformed-cas",
      );

    const malformedDirectory =
      join(
        malformedRoot,
        FINORA_PORTABLE_BRANCH_AUTH_DIRECTORY,
        FINORA_PORTABLE_BRANCH_AUTH_SUBDIRECTORY,
      );

    const malformedPath =
      join(
        malformedDirectory,
        FINORA_PORTABLE_BRANCH_AUTH_FILE_NAME,
      );

    await mkdir(
      malformedDirectory,
      {
        recursive:
          true,
      },
    );

    const malformedBytes =
      "FINORA-MALFORMED-PORTABLE-AUTH";

    await writeFile(
      malformedPath,
      malformedBytes,
      "utf8",
    );

    const malformedStore =
      new FinoraPortableBranchAuthStore({
        resolveLocalRoot:
          () =>
            malformedRoot,

        resolveUsbRoot:
          async () =>
            null,
      });

    let malformedError:
      unknown;

    try {
      await malformedStore.replaceExact(
        "LOCAL",
        firstEnvelope,
        secondEnvelope,
      );
    }
    catch (error) {
      malformedError =
        error;
    }

    assert(
      malformedError instanceof
        FinoraPortableBranchAuthStoreError &&
      malformedError.code ===
        "INVALID_STORAGE",
      "Malformed current Portable Auth did not fail closed.",
    );

    const malformedAfter =
      await readFile(
        malformedPath,
        "utf8",
      );

    assert(
      malformedAfter ===
        malformedBytes,
      "Malformed-current failure overwrote storage.",
    );

    console.log(
      "PASS: malformed current fails closed without overwrite",
    );

    // ========================================================
    // LOCAL MUST NEVER CONSULT USB
    // ========================================================

    assert(
      usbResolverCalls ===
        0,
      `LOCAL ensureExact unexpectedly consulted USB resolver ${usbResolverCalls} time(s).`,
    );

    console.log(
      "PASS: LOCAL ensureExact never consults USB resolver",
    );

    console.log(
      "",
    );

    console.log(
      "PASS: D4E4I8-B4.2 PORTABLE AUTH ENSURE + CAS REPLACEMENT EXECUTABLE PROOF",
    );
  }
  finally {
    if (
      temporaryRoot !==
        undefined
    ) {
      await rm(
        temporaryRoot,
        {
          recursive:
            true,
          force:
            true,
        },
      );

      console.log(
        "PASS: isolated ensureExact self-test root deleted",
      );
    }
  }
}

void runSelfTest().catch(
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