// ============================================================
// FINORA ENTERPRISE
// PORTABLE STATE GENERATION STORE SELF TEST
//
// Runs only against isolated temporary Electron userData.
//
// Proves:
// - fresh absence
// - monotonic reservation
// - concurrent serialization
// - encrypted persistence
// - issuer binding
// - foreign issuer rejection with zero byte mutation
// ============================================================

import {
  app,
  safeStorage,
} from "electron";

import {
  mkdtemp,
  readFile,
  rm,
} from "node:fs/promises";

import {
  join,
} from "node:path";

import {
  tmpdir,
} from "node:os";

import {
  loadFinoraControlCenterPortableStateGenerationState,
  reserveFinoraControlCenterPortableStateGeneration,
} from "./finoraControlCenterPortableStateGenerationStore.js";


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


async function runSelfTest():
  Promise<void> {

  const temporaryUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-portable-state-generation-",
      ),
    );

  /*
   * Set isolated userData before Electron becomes ready.
   *
   * The genuine FINORA Control Center state is never addressed
   * by this self-test.
   */
  app.setPath(
    "userData",
    temporaryUserData,
  );

  try {

    await app.whenReady();

    assert(
      safeStorage.isEncryptionAvailable(),
      "Electron safeStorage is unavailable for Portable State generation self-test.",
    );

    console.log(
      "PASS: isolated Electron userData configured",
    );

    const issuerA =
      "FINORA-CC-PORTABLE-STATE-SELFTEST-A";

    const issuerB =
      "FINORA-CC-PORTABLE-STATE-SELFTEST-B";

    const storePath =
      join(
        temporaryUserData,
        "FINORA",
        "control-center",
        "finora-control-center-portable-state-generation.bin",
      );


    // ========================================================
    // FRESH STATE
    // ========================================================

    const fresh =
      await loadFinoraControlCenterPortableStateGenerationState();

    assert(
      fresh ===
        undefined,
      "Fresh Portable State generation store was not absent.",
    );

    console.log(
      "PASS: fresh generation state is absent",
    );


    // ========================================================
    // FIRST RESERVATION
    // ========================================================

    const first =
      await reserveFinoraControlCenterPortableStateGeneration(
        issuerA,
      );

    assert(
      first.issuerId ===
        issuerA &&
      first.generation ===
        1,
      "First Portable State generation reservation was not 1.",
    );

    const afterFirst =
      await loadFinoraControlCenterPortableStateGenerationState();

    assert(
      afterFirst !==
        undefined &&
      afterFirst.issuerId ===
        issuerA &&
      afterFirst.lastReservedGeneration ===
        1,
      "First Portable State generation was not persisted.",
    );

    console.log(
      "PASS: first generation reservation = 1",
    );


    // ========================================================
    // SECOND RESERVATION
    // ========================================================

    const second =
      await reserveFinoraControlCenterPortableStateGeneration(
        issuerA,
      );

    assert(
      second.generation ===
        2,
      "Second Portable State generation reservation was not 2.",
    );

    console.log(
      "PASS: second generation reservation = 2",
    );


    // ========================================================
    // CONCURRENT RESERVATIONS
    // ========================================================

    const concurrentCount =
      8;

    const concurrent =
      await Promise.all(
        Array.from(
          {
            length:
              concurrentCount,
          },
          () =>
            reserveFinoraControlCenterPortableStateGeneration(
              issuerA,
            ),
        ),
      );

    const generations =
      concurrent
        .map(
          (
            reservation,
          ) =>
            reservation.generation,
        )
        .sort(
          (
            left,
            right,
          ) =>
            left -
            right,
        );

    const expectedGenerations =
      Array.from(
        {
          length:
            concurrentCount,
        },
        (
          _,
          index,
        ) =>
          index +
          3,
      );

    assert(
      JSON.stringify(
        generations,
      ) ===
        JSON.stringify(
          expectedGenerations,
        ),
      "Concurrent Portable State generations were not unique and monotonic.",
    );

    assert(
      new Set(
        generations,
      ).size ===
        concurrentCount,
      "Concurrent Portable State generation reservation reused a generation.",
    );

    console.log(
      "PASS: concurrent generation reservations serialized uniquely",
    );


    // ========================================================
    // FINAL HIGH-WATER
    // ========================================================

    const expectedHighWater =
      2 +
      concurrentCount;

    const finalState =
      await loadFinoraControlCenterPortableStateGenerationState();

    assert(
      finalState !==
        undefined &&
      finalState.issuerId ===
        issuerA &&
      finalState.lastReservedGeneration ===
        expectedHighWater,
      "Final Portable State generation high-water is incorrect.",
    );

    assert(
      finalState.createdAt.length >
        0 &&
      finalState.updatedAt.length >
        0 &&
      Date.parse(
        finalState.updatedAt,
      ) >=
        Date.parse(
          finalState.createdAt,
        ),
      "Portable State generation timestamps are invalid.",
    );

    console.log(
      `PASS: final generation high-water = ${expectedHighWater}`,
    );


    // ========================================================
    // ENCRYPTION AT REST
    // ========================================================

    const encryptedBeforeForeign =
      await readFile(
        storePath,
      );

    assert(
      encryptedBeforeForeign.byteLength >
        0,
      "Portable State generation encrypted file is empty.",
    );

    const encryptedUtf8 =
      encryptedBeforeForeign.toString(
        "utf8",
      );

    assert(
      !encryptedUtf8.includes(
        issuerA,
      ),
      "Portable State generation file leaked issuerId as plaintext.",
    );

    assert(
      !encryptedUtf8.includes(
        "lastReservedGeneration",
      ),
      "Portable State generation file leaked JSON schema as plaintext.",
    );

    const decrypted =
      safeStorage.decryptString(
        encryptedBeforeForeign,
      );

    const parsed =
      JSON.parse(
        decrypted,
      ) as {
        issuerId?:
          unknown;

        lastReservedGeneration?:
          unknown;
      };

    assert(
      parsed.issuerId ===
        issuerA &&
      parsed.lastReservedGeneration ===
        expectedHighWater,
      "Encrypted Portable State generation file did not decrypt to exact persisted state.",
    );

    console.log(
      "PASS: generation state is encrypted at rest",
    );

    console.log(
      "PASS: encrypted bytes contain no plaintext issuer/schema markers",
    );


    // ========================================================
    // FOREIGN ISSUER REJECTION
    // ========================================================

    let foreignRejected =
      false;

    try {

      await reserveFinoraControlCenterPortableStateGeneration(
        issuerB,
      );
    } catch (
      error
    ) {

      foreignRejected =
        error instanceof Error &&
        error.message.includes(
          "bound to another issuer",
        );
    }

    assert(
      foreignRejected,
      "Foreign Portable State issuer was not rejected.",
    );

    const encryptedAfterForeign =
      await readFile(
        storePath,
      );

    assert(
      encryptedAfterForeign.equals(
        encryptedBeforeForeign,
      ),
      "Foreign issuer rejection mutated Portable State generation bytes.",
    );

    const afterForeign =
      await loadFinoraControlCenterPortableStateGenerationState();

    assert(
      afterForeign !==
        undefined &&
      afterForeign.issuerId ===
        issuerA &&
      afterForeign.lastReservedGeneration ===
        expectedHighWater,
      "Foreign issuer rejection mutated Portable State generation state.",
    );

    console.log(
      "PASS: foreign issuer rejected",
    );

    console.log(
      "PASS: foreign issuer rejection preserved exact encrypted bytes",
    );


    // ========================================================
    // FINAL RESULT
    // ========================================================

    console.log(
      "PASS: PORTABLE STATE GENERATION AUTHORITY RUNTIME SELFTEST",
    );
  } finally {

    await rm(
      temporaryUserData,
      {
        recursive:
          true,
        force:
          true,
      },
    );

    console.log(
      "PASS: isolated generation self-test userData deleted",
    );
  }
}


void runSelfTest()
  .then(
    () => {

      app.exit(
        0,
      );
    },
    (
      error,
    ) => {

      console.error(
        "FAIL: PORTABLE STATE GENERATION AUTHORITY RUNTIME SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );