// ============================================================
// FINORA ENTERPRISE
// IMPORTED PORTABLE STATE HEAD SELF TEST
// ============================================================

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
  adoptFinoraControlCenterPortableStateImportedHead,
  loadFinoraControlCenterPortableStateHead,
} from "./finoraControlCenterPortableStateHeadStore.js";


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


async function collectBinFiles(
  root:
    string,
): Promise<string[]> {

  const result:
    string[] =
      [];

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
      entry.isDirectory()
    ) {

      result.push(
        ...(
          await collectBinFiles(
            candidate,
          )
        ),
      );

      continue;
    }

    if (
      entry.isFile() &&
      entry.name.endsWith(
        ".bin",
      )
    ) {

      result.push(
        candidate,
      );
    }
  }

  return result;
}


const ISSUER =
  "FINORA-CC-IMPORTED-HEAD-SELFTEST";

const FOREIGN_ISSUER =
  "FINORA-CC-IMPORTED-HEAD-FOREIGN";

const PARENT_BEFORE_SEVEN =
  "1111111111111111111111111111111111111111111111111111111111111111";

const PAYLOAD_SEVEN =
  "7777777777777777777777777777777777777777777777777777777777777777";

const PAYLOAD_NINE =
  "9999999999999999999999999999999999999999999999999999999999999999";

const PAYLOAD_TEN_A =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const PAYLOAD_TEN_B =
  "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

const WRONG_PARENT =
  "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";


async function run():
  Promise<void> {

  const isolatedUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-imported-portable-state-head-",
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
      await loadFinoraControlCenterPortableStateHead();

    assert(
      fresh ===
        undefined,
      "Fresh Portable State Head was not absent.",
    );

    console.log(
      "PASS: fresh receiver Head is absent",
    );


    // ========================================================
    // FRESH RECEIVER ADOPTS EXISTING CHAIN WITH NON-NULL PARENT
    // ========================================================

    const adoptedSeven =
      await adoptFinoraControlCenterPortableStateImportedHead({
        issuerId:
          ISSUER,

        generation:
          7,

        payloadSha256:
          PAYLOAD_SEVEN,

        parentPayloadSha256:
          PARENT_BEFORE_SEVEN,
      });

    assert(
      adoptedSeven.status ===
        "ADOPTED" &&
      adoptedSeven.head.issuerId ===
        ISSUER &&
      adoptedSeven.head.headGeneration ===
        7 &&
      adoptedSeven.head.headPayloadSha256 ===
        PAYLOAD_SEVEN,
      "Fresh receiver did not adopt imported generation 7.",
    );

    console.log(
      "PASS: fresh receiver adopted generation 7 with non-null imported parent",
    );


    const binFiles =
      await collectBinFiles(
        isolatedUserData,
      );

    assert(
      binFiles.length ===
        1,
      "Imported Head self-test expected exactly one encrypted .bin store.",
    );

    const headStorePath =
      binFiles[0];

    const encryptedAtSeven =
      await readFile(
        headStorePath,
      );

    assert(
      encryptedAtSeven.length >
        0 &&
      !encryptedAtSeven
        .toString(
          "utf8",
        )
        .includes(
          ISSUER,
        ) &&
      !encryptedAtSeven
        .toString(
          "utf8",
        )
        .includes(
          PAYLOAD_SEVEN,
        ),
      "Imported Head authority leaked plaintext evidence.",
    );

    console.log(
      "PASS: imported Head remains safeStorage encrypted",
    );


    // ========================================================
    // EXACT RE-IMPORT = NO BYTE MUTATION
    // ========================================================

    const exactAgain =
      await adoptFinoraControlCenterPortableStateImportedHead({
        issuerId:
          ISSUER,

        generation:
          7,

        payloadSha256:
          PAYLOAD_SEVEN,

        parentPayloadSha256:
          PARENT_BEFORE_SEVEN,
      });

    assert(
      exactAgain.status ===
        "ALREADY_ADOPTED",
      "Exact imported Head re-adoption was not idempotent.",
    );

    const encryptedAfterExact =
      await readFile(
        headStorePath,
      );

    assert(
      encryptedAfterExact.equals(
        encryptedAtSeven,
      ),
      "Exact imported Head re-adoption rewrote encrypted bytes.",
    );

    console.log(
      "PASS: exact imported Head re-adoption is zero-byte idempotent",
    );


    // ========================================================
    // SAME GENERATION / DIFFERENT DIGEST
    // ========================================================

    let conflictRejected =
      false;

    try {

      await adoptFinoraControlCenterPortableStateImportedHead({
        issuerId:
          ISSUER,

        generation:
          7,

        payloadSha256:
          PAYLOAD_NINE,

        parentPayloadSha256:
          PARENT_BEFORE_SEVEN,
      });
    } catch (
      error
    ) {

      conflictRejected =
        error instanceof Error &&
        error.message.includes(
          "conflicting payload exists at the current generation",
        );
    }

    assert(
      conflictRejected,
      "Same-generation divergent imported payload was accepted.",
    );

    const afterConflict =
      await readFile(
        headStorePath,
      );

    assert(
      afterConflict.equals(
        encryptedAtSeven,
      ),
      "Same-generation conflict mutated imported Head bytes.",
    );

    console.log(
      "PASS: same-generation divergent import rejected with zero byte mutation",
    );


    // ========================================================
    // STALE IMPORT
    // ========================================================

    let staleRejected =
      false;

    try {

      await adoptFinoraControlCenterPortableStateImportedHead({
        issuerId:
          ISSUER,

        generation:
          6,

        payloadSha256:
          PAYLOAD_NINE,

        parentPayloadSha256:
          PARENT_BEFORE_SEVEN,
      });
    } catch (
      error
    ) {

      staleRejected =
        error instanceof Error &&
        error.message.includes(
          "head generation is stale",
        );
    }

    assert(
      staleRejected,
      "Stale imported Head was accepted.",
    );

    const afterStale =
      await readFile(
        headStorePath,
      );

    assert(
      afterStale.equals(
        encryptedAtSeven,
      ),
      "Stale imported Head rejection mutated bytes.",
    );

    console.log(
      "PASS: stale imported Head rejected with zero byte mutation",
    );


    // ========================================================
    // WRONG PARENT
    // ========================================================

    let wrongParentRejected =
      false;

    try {

      await adoptFinoraControlCenterPortableStateImportedHead({
        issuerId:
          ISSUER,

        generation:
          8,

        payloadSha256:
          PAYLOAD_NINE,

        parentPayloadSha256:
          WRONG_PARENT,
      });
    } catch (
      error
    ) {

      wrongParentRejected =
        error instanceof Error &&
        error.message.includes(
          "parent payload digest does not match the current local head",
        );
    }

    assert(
      wrongParentRejected,
      "Wrong-parent imported Head was accepted.",
    );

    const afterWrongParent =
      await readFile(
        headStorePath,
      );

    assert(
      afterWrongParent.equals(
        encryptedAtSeven,
      ),
      "Wrong-parent rejection mutated imported Head bytes.",
    );

    console.log(
      "PASS: wrong-parent imported Head rejected with zero byte mutation",
    );


    // ========================================================
    // FOREIGN ISSUER
    // ========================================================

    let foreignRejected =
      false;

    try {

      await adoptFinoraControlCenterPortableStateImportedHead({
        issuerId:
          FOREIGN_ISSUER,

        generation:
          8,

        payloadSha256:
          PAYLOAD_NINE,

        parentPayloadSha256:
          PAYLOAD_SEVEN,
      });
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
      "Foreign issuer imported Head was accepted.",
    );

    const afterForeign =
      await readFile(
        headStorePath,
      );

    assert(
      afterForeign.equals(
        encryptedAtSeven,
      ),
      "Foreign issuer rejection mutated imported Head bytes.",
    );

    console.log(
      "PASS: foreign issuer imported Head rejected with zero byte mutation",
    );


    // ========================================================
    // VALID FORWARD IMPORT WITH GENERATION GAP
    // ========================================================

    const adoptedNine =
      await adoptFinoraControlCenterPortableStateImportedHead({
        issuerId:
          ISSUER,

        generation:
          9,

        payloadSha256:
          PAYLOAD_NINE,

        parentPayloadSha256:
          PAYLOAD_SEVEN,
      });

    assert(
      adoptedNine.status ===
        "ADOPTED" &&
      adoptedNine.head.headGeneration ===
        9 &&
      adoptedNine.head.headPayloadSha256 ===
        PAYLOAD_NINE,
      "Valid forward imported Head did not advance to generation 9.",
    );

    console.log(
      "PASS: valid imported Head advanced from generation 7 to 9",
    );

    console.log(
      "PASS: imported Head permits generation gaps with exact parent continuity",
    );


    // ========================================================
    // CONCURRENT DIVERGENT SIBLINGS
    // ========================================================

    const siblings =
      await Promise.allSettled([
        adoptFinoraControlCenterPortableStateImportedHead({
          issuerId:
            ISSUER,

          generation:
            10,

          payloadSha256:
            PAYLOAD_TEN_A,

          parentPayloadSha256:
            PAYLOAD_NINE,
        }),

        adoptFinoraControlCenterPortableStateImportedHead({
          issuerId:
            ISSUER,

          generation:
            10,

          payloadSha256:
            PAYLOAD_TEN_B,

          parentPayloadSha256:
            PAYLOAD_NINE,
        }),
      ]);

    const siblingWinners =
      siblings.filter(
        (
          result,
        ) =>
          result.status ===
            "fulfilled",
      );

    const siblingLosers =
      siblings.filter(
        (
          result,
        ) =>
          result.status ===
            "rejected",
      );

    assert(
      siblingWinners.length ===
        1 &&
      siblingLosers.length ===
        1,
      "Concurrent imported siblings did not serialize to exactly one winner.",
    );

    const winner =
      (
        siblingWinners[0] as
          PromiseFulfilledResult<{
            readonly status:
              "ADOPTED" | "ALREADY_ADOPTED";

            readonly head: {
              readonly issuerId:
                string;

              readonly headGeneration:
                number;

              readonly headPayloadSha256:
                string;
            };
          }>
      ).value;

    assert(
      winner.status ===
        "ADOPTED" &&
      winner.head.headGeneration ===
        10 &&
      (
        winner.head.headPayloadSha256 ===
          PAYLOAD_TEN_A ||
        winner.head.headPayloadSha256 ===
          PAYLOAD_TEN_B
      ),
      "Concurrent imported sibling winner is invalid.",
    );

    const finalHead =
      await loadFinoraControlCenterPortableStateHead();

    assert(
      finalHead !==
        undefined &&
      finalHead.issuerId ===
        ISSUER &&
      finalHead.headGeneration ===
        10 &&
      finalHead.headPayloadSha256 ===
        winner.head.headPayloadSha256,
      "Final imported Head does not equal concurrent sibling winner.",
    );

    console.log(
      "PASS: concurrent divergent imported siblings serialize to one winner",
    );


    const exactWinnerAgain =
      await adoptFinoraControlCenterPortableStateImportedHead({
        issuerId:
          ISSUER,

        generation:
          10,

        payloadSha256:
          winner.head.headPayloadSha256,

        parentPayloadSha256:
          PAYLOAD_NINE,
      });

    assert(
      exactWinnerAgain.status ===
        "ALREADY_ADOPTED",
      "Winning imported Head was not idempotent on replay.",
    );

    console.log(
      "PASS: winning imported Head replay is idempotent",
    );

    console.log(
      "PASS: final imported Head generation = 10",
    );

    console.log(
      "PASS: IMPORTED PORTABLE STATE HEAD SELFTEST",
    );
  } catch (
    error
  ) {

    exitCode =
      1;

    console.error(
      "FAIL: IMPORTED PORTABLE STATE HEAD SELFTEST",
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
      "PASS: isolated imported-Head self-test userData deleted",
    );

    app.exit(
      exitCode,
    );
  }
}


void run();