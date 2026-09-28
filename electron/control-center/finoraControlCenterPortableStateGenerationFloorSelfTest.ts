// ============================================================
// FINORA ENTERPRISE
// PORTABLE STATE GENERATION FLOOR SELF TEST
// ============================================================

import {
  Buffer,
} from "node:buffer";

import {
  mkdtemp,
  readFile,
  readdir,
  rm,
} from "node:fs/promises";

import {
  join,
} from "node:path";

import {
  tmpdir,
} from "node:os";

import {
  app,
  safeStorage,
} from "electron";

import {
  advanceFinoraControlCenterPortableStateGenerationFloor,
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


async function findFileByName(
  root:
    string,
  fileName:
    string,
): Promise<
  string | undefined
> {

  const entries =
    await readdir(
      root,
      {
        withFileTypes:
          true,
      },
    );

  for (
    const entry of entries
  ) {

    const candidate =
      join(
        root,
        entry.name,
      );

    if (
      entry.isFile() &&
      entry.name ===
        fileName
    ) {

      return candidate;
    }

    if (
      entry.isDirectory()
    ) {

      const nested =
        await findFileByName(
          candidate,
          fileName,
        );

      if (nested) {
        return nested;
      }
    }
  }

  return undefined;
}


async function run():
  Promise<void> {

  const isolatedUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-portable-state-generation-floor-",
      ),
    );

  app.setPath(
    "userData",
    isolatedUserData,
  );

  let exitCode =
    0;

  try {

    await app.whenReady();

    assert(
      safeStorage.isEncryptionAvailable(),
      "Electron safeStorage encryption is unavailable.",
    );

    console.log(
      "PASS: isolated Electron userData configured",
    );


    const fresh =
      await loadFinoraControlCenterPortableStateGenerationState();

    assert(
      fresh ===
        undefined,
      "Fresh generation authority was not absent.",
    );

    console.log(
      "PASS: fresh generation authority is absent",
    );


    // --------------------------------------------------------
    // FRESH IMPORT FLOOR
    // --------------------------------------------------------

    const firstAdvance =
      await advanceFinoraControlCenterPortableStateGenerationFloor(
        "FINORA-CC-FLOOR-SELFTEST",
        7,
      );

    assert(
      firstAdvance.status ===
        "ADVANCED" &&
      firstAdvance.state.issuerId ===
        "FINORA-CC-FLOOR-SELFTEST" &&
      firstAdvance.state.lastReservedGeneration ===
        7,
      "Fresh imported generation floor was not persisted at generation 7.",
    );

    console.log(
      "PASS: fresh imported generation floor advanced directly to 7",
    );


    const storePath =
      await findFileByName(
        isolatedUserData,
        "finora-control-center-portable-state-generation.bin",
      );

    assert(
      storePath !==
        undefined,
      "Generation authority file was not found under isolated userData.",
    );


    const encryptedAtSeven =
      await readFile(
        storePath,
      );

    assert(
      encryptedAtSeven.length >
        0,
      "Generation authority encrypted file is empty.",
    );

    assert(
      !encryptedAtSeven
        .toString(
          "utf8",
        )
        .includes(
          "FINORA-CC-FLOOR-SELFTEST",
        ),
      "Generation authority leaked issuer plaintext.",
    );

    const decryptedAtSeven =
      safeStorage.decryptString(
        encryptedAtSeven,
      );

    const parsedAtSeven =
      JSON.parse(
        decryptedAtSeven,
      ) as {
        issuerId:
          string;

        lastReservedGeneration:
          number;
      };

    assert(
      parsedAtSeven.issuerId ===
        "FINORA-CC-FLOOR-SELFTEST" &&
      parsedAtSeven.lastReservedGeneration ===
        7,
      "Encrypted generation floor did not decrypt to exact state.",
    );

    console.log(
      "PASS: imported generation floor remains safeStorage encrypted",
    );


    // --------------------------------------------------------
    // EQUAL FLOOR = ZERO BYTE MUTATION
    // --------------------------------------------------------

    const equalResult =
      await advanceFinoraControlCenterPortableStateGenerationFloor(
        "FINORA-CC-FLOOR-SELFTEST",
        7,
      );

    assert(
      equalResult.status ===
        "ALREADY_AT_OR_ABOVE_FLOOR",
      "Equal imported generation floor was not idempotent.",
    );

    const encryptedAfterEqual =
      await readFile(
        storePath,
      );

    assert(
      encryptedAfterEqual.equals(
        encryptedAtSeven,
      ),
      "Equal floor request rewrote encrypted generation authority bytes.",
    );

    console.log(
      "PASS: equal floor is idempotent with zero byte mutation",
    );


    // --------------------------------------------------------
    // LOWER FLOOR = ZERO BYTE MUTATION
    // --------------------------------------------------------

    const lowerResult =
      await advanceFinoraControlCenterPortableStateGenerationFloor(
        "FINORA-CC-FLOOR-SELFTEST",
        3,
      );

    assert(
      lowerResult.status ===
        "ALREADY_AT_OR_ABOVE_FLOOR" &&
      lowerResult.state.lastReservedGeneration ===
        7,
      "Lower imported floor did not preserve generation 7.",
    );

    const encryptedAfterLower =
      await readFile(
        storePath,
      );

    assert(
      encryptedAfterLower.equals(
        encryptedAtSeven,
      ),
      "Lower floor request rewrote encrypted generation authority bytes.",
    );

    console.log(
      "PASS: lower floor cannot decrease authority and causes zero byte mutation",
    );


    // --------------------------------------------------------
    // NEXT RESERVATION = FLOOR + 1
    // --------------------------------------------------------

    const reservationEight =
      await reserveFinoraControlCenterPortableStateGeneration(
        "FINORA-CC-FLOOR-SELFTEST",
      );

    assert(
      reservationEight.generation ===
        8,
      "Next reservation after imported floor 7 was not generation 8.",
    );

    console.log(
      "PASS: next reservation after imported floor = floor + 1",
    );


    // --------------------------------------------------------
    // ADVANCE EXISTING FLOOR
    // --------------------------------------------------------

    const stateAfterEight =
      await loadFinoraControlCenterPortableStateGenerationState();

    assert(
      stateAfterEight !==
        undefined &&
      stateAfterEight.lastReservedGeneration ===
        8,
      "Generation authority did not persist reservation 8.",
    );

    const originalCreatedAt =
      stateAfterEight.createdAt;

    const advanceToTen =
      await advanceFinoraControlCenterPortableStateGenerationFloor(
        "FINORA-CC-FLOOR-SELFTEST",
        10,
      );

    assert(
      advanceToTen.status ===
        "ADVANCED" &&
      advanceToTen.state.lastReservedGeneration ===
        10 &&
      advanceToTen.state.createdAt ===
        originalCreatedAt,
      "Existing generation floor did not advance to 10 while preserving createdAt.",
    );

    console.log(
      "PASS: existing generation authority advanced monotonically to 10",
    );

    console.log(
      "PASS: generation-floor advance preserves original createdAt",
    );


    const reservationEleven =
      await reserveFinoraControlCenterPortableStateGeneration(
        "FINORA-CC-FLOOR-SELFTEST",
      );

    assert(
      reservationEleven.generation ===
        11,
      "Next reservation after floor 10 was not generation 11.",
    );

    console.log(
      "PASS: post-advance reservation = 11",
    );


    // --------------------------------------------------------
    // CONCURRENT FLOORS CONVERGE TO MAXIMUM
    // --------------------------------------------------------

    await Promise.all([
      advanceFinoraControlCenterPortableStateGenerationFloor(
        "FINORA-CC-FLOOR-SELFTEST",
        15,
      ),

      advanceFinoraControlCenterPortableStateGenerationFloor(
        "FINORA-CC-FLOOR-SELFTEST",
        20,
      ),

      advanceFinoraControlCenterPortableStateGenerationFloor(
        "FINORA-CC-FLOOR-SELFTEST",
        18,
      ),
    ]);

    const afterConcurrent =
      await loadFinoraControlCenterPortableStateGenerationState();

    assert(
      afterConcurrent !==
        undefined &&
      afterConcurrent.lastReservedGeneration ===
        20,
      "Concurrent imported floors did not converge to maximum generation 20.",
    );

    console.log(
      "PASS: concurrent floor advances serialize and converge to maximum 20",
    );


    const reservationTwentyOne =
      await reserveFinoraControlCenterPortableStateGeneration(
        "FINORA-CC-FLOOR-SELFTEST",
      );

    assert(
      reservationTwentyOne.generation ===
        21,
      "Reservation after concurrent floor 20 was not generation 21.",
    );

    console.log(
      "PASS: reservation after concurrent floor = 21",
    );


    // --------------------------------------------------------
    // FOREIGN ISSUER MUST FAIL WITH ZERO BYTE MUTATION
    // --------------------------------------------------------

    const beforeForeign =
      await readFile(
        storePath,
      );

    let foreignRejected =
      false;

    try {

      await advanceFinoraControlCenterPortableStateGenerationFloor(
        "FINORA-CC-FOREIGN",
        30,
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
      "Foreign issuer generation floor was not rejected.",
    );

    const afterForeign =
      await readFile(
        storePath,
      );

    assert(
      afterForeign.equals(
        beforeForeign,
      ),
      "Foreign issuer rejection mutated encrypted authority bytes.",
    );

    console.log(
      "PASS: foreign issuer floor rejected with zero byte mutation",
    );


    // --------------------------------------------------------
    // INVALID FLOOR MUST FAIL WITH ZERO BYTE MUTATION
    // --------------------------------------------------------

    const beforeInvalid =
      Buffer.from(
        afterForeign,
      );

    let invalidRejected =
      false;

    try {

      await advanceFinoraControlCenterPortableStateGenerationFloor(
        "FINORA-CC-FLOOR-SELFTEST",
        0,
      );
    } catch (
      error
    ) {

      invalidRejected =
        error instanceof Error &&
        error.message.includes(
          "imported generation floor is invalid",
        );
    }

    assert(
      invalidRejected,
      "Invalid imported generation floor was not rejected.",
    );

    const afterInvalid =
      await readFile(
        storePath,
      );

    assert(
      afterInvalid.equals(
        beforeInvalid,
      ),
      "Invalid floor rejection mutated encrypted authority bytes.",
    );

    console.log(
      "PASS: invalid floor rejected with zero byte mutation",
    );


    const finalState =
      await loadFinoraControlCenterPortableStateGenerationState();

    assert(
      finalState !==
        undefined &&
      finalState.issuerId ===
        "FINORA-CC-FLOOR-SELFTEST" &&
      finalState.lastReservedGeneration ===
        21,
      "Final generation authority state is incorrect.",
    );

    console.log(
      "PASS: final generation authority high-water = 21",
    );

    console.log(
      "PASS: PORTABLE STATE GENERATION FLOOR SELFTEST",
    );
  } catch (
    error
  ) {

    exitCode =
      1;

    console.error(
      "FAIL: PORTABLE STATE GENERATION FLOOR SELFTEST",
      error,
    );
  } finally {

    await rm(
      isolatedUserData,
      {
        recursive:
          true,

        force:
          true,
      },
    );

    console.log(
      "PASS: isolated generation-floor self-test userData deleted",
    );

    app.exit(
      exitCode,
    );
  }
}


void run();