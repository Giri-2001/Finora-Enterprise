// ============================================================
// FINORA ENTERPRISE
// PORTABLE STATE HEAD STORE RUNTIME SELF TEST
//
// Uses isolated temporary Electron userData only.
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
  commitFinoraControlCenterPortableStateHead,
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


function isExpectedError(
  value:
    unknown,
  marker:
    string,
): boolean {

  return (
    value instanceof
      Error &&
    value.message.includes(
      marker,
    )
  );
}


async function runSelfTest():
  Promise<void> {

  const temporaryUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-portable-state-head-",
      ),
    );

  app.setPath(
    "userData",
    temporaryUserData,
  );

  try {

    await app.whenReady();

    assert(
      safeStorage.isEncryptionAvailable(),
      "Electron safeStorage unavailable for Portable State Head Store self-test.",
    );

    console.log(
      "PASS: isolated Electron userData configured",
    );


    const issuerA =
      "FINORA-CC-PORTABLE-STATE-HEAD-SELFTEST-A";

    const issuerB =
      "FINORA-CC-PORTABLE-STATE-HEAD-SELFTEST-B";

    const digestA =
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    const digestB =
      "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    const digestC =
      "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";

    const digestD =
      "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd";

    const digestWrongParent =
      "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

    const storePath =
      join(
        temporaryUserData,
        "FINORA",
        "control-center",
        "finora-control-center-portable-state-head.bin",
      );


    // ========================================================
    // FRESH STATE
    // ========================================================

    const fresh =
      await loadFinoraControlCenterPortableStateHead();

    assert(
      fresh ===
        undefined,
      "Fresh Portable State head was not absent.",
    );

    console.log(
      "PASS: fresh Portable State head is absent",
    );


    // ========================================================
    // FIRST LOCAL HEAD MUST NOT DECLARE A PARENT
    // ========================================================

    let invalidFirstParentRejected =
      false;

    try {

      await commitFinoraControlCenterPortableStateHead({
        issuerId:
          issuerA,

        generation:
          1,

        payloadSha256:
          digestA,

        parentPayloadSha256:
          digestWrongParent,
      });
    } catch (
      error
    ) {

      invalidFirstParentRejected =
        isExpectedError(
          error,
          "first local head must not declare a parent digest",
        );
    }

    assert(
      invalidFirstParentRejected,
      "First local head with a parent digest was not rejected.",
    );

    const stillFresh =
      await loadFinoraControlCenterPortableStateHead();

    assert(
      stillFresh ===
        undefined,
      "Rejected first-parent commit created a Portable State head.",
    );

    console.log(
      "PASS: first local head with non-null parent rejected",
    );

    console.log(
      "PASS: rejected first-parent commit left store absent",
    );


    // ========================================================
    // FIRST VALID HEAD
    // ========================================================

    const first =
      await commitFinoraControlCenterPortableStateHead({
        issuerId:
          issuerA,

        generation:
          1,

        payloadSha256:
          digestA,

        parentPayloadSha256:
          null,
      });

    assert(
      first.status ===
        "COMMITTED" &&
      first.head.issuerId ===
        issuerA &&
      first.head.headGeneration ===
        1 &&
      first.head.headPayloadSha256 ===
        digestA,
      "First Portable State head was not committed exactly.",
    );

    const loadedFirst =
      await loadFinoraControlCenterPortableStateHead();

    assert(
      loadedFirst !==
        undefined &&
      loadedFirst.issuerId ===
        issuerA &&
      loadedFirst.headGeneration ===
        1 &&
      loadedFirst.headPayloadSha256 ===
        digestA,
      "First Portable State head did not round-trip.",
    );

    console.log(
      "PASS: first Portable State head committed at generation 1",
    );


    // ========================================================
    // ENCRYPTION AT REST
    // ========================================================

    const firstEncryptedBytes =
      await readFile(
        storePath,
      );

    assert(
      firstEncryptedBytes.byteLength >
        0,
      "Portable State Head Store encrypted bytes are empty.",
    );

    const firstUtf8 =
      firstEncryptedBytes.toString(
        "utf8",
      );

    assert(
      !firstUtf8.includes(
        issuerA,
      ),
      "Portable State Head Store leaked issuerId as plaintext.",
    );

    assert(
      !firstUtf8.includes(
        digestA,
      ),
      "Portable State Head Store leaked payload digest as plaintext.",
    );

    assert(
      !firstUtf8.includes(
        "headPayloadSha256",
      ),
      "Portable State Head Store leaked schema marker as plaintext.",
    );

    const decryptedFirst =
      JSON.parse(
        safeStorage.decryptString(
          firstEncryptedBytes,
        ),
      ) as {
        issuerId?:
          unknown;

        headGeneration?:
          unknown;

        headPayloadSha256?:
          unknown;
      };

    assert(
      decryptedFirst.issuerId ===
        issuerA &&
      decryptedFirst.headGeneration ===
        1 &&
      decryptedFirst.headPayloadSha256 ===
        digestA,
      "Encrypted first Portable State head did not decrypt exactly.",
    );

    console.log(
      "PASS: Portable State head is encrypted at rest",
    );

    console.log(
      "PASS: encrypted head contains no plaintext issuer/digest/schema markers",
    );


    // ========================================================
    // EXACT IDEMPOTENT RE-COMMIT
    // ========================================================

    const idempotent =
      await commitFinoraControlCenterPortableStateHead({
        issuerId:
          issuerA,

        generation:
          1,

        payloadSha256:
          digestA,

        parentPayloadSha256:
          null,
      });

    assert(
      idempotent.status ===
        "ALREADY_COMMITTED",
      "Exact Portable State head re-commit was not idempotent.",
    );

    const bytesAfterIdempotent =
      await readFile(
        storePath,
      );

    assert(
      bytesAfterIdempotent.equals(
        firstEncryptedBytes,
      ),
      "Idempotent Portable State re-commit rewrote encrypted bytes.",
    );

    console.log(
      "PASS: exact same-generation re-commit is idempotent",
    );

    console.log(
      "PASS: idempotent re-commit preserved exact encrypted bytes",
    );


    // ========================================================
    // SAME-GENERATION CONFLICT
    // ========================================================

    let sameGenerationConflictRejected =
      false;

    try {

      await commitFinoraControlCenterPortableStateHead({
        issuerId:
          issuerA,

        generation:
          1,

        payloadSha256:
          digestB,

        parentPayloadSha256:
          null,
      });
    } catch (
      error
    ) {

      sameGenerationConflictRejected =
        isExpectedError(
          error,
          "conflicting payload exists at the current generation",
        );
    }

    assert(
      sameGenerationConflictRejected,
      "Same-generation divergent Portable State was not rejected.",
    );

    const bytesAfterSameGenerationConflict =
      await readFile(
        storePath,
      );

    assert(
      bytesAfterSameGenerationConflict.equals(
        firstEncryptedBytes,
      ),
      "Same-generation conflict mutated Portable State head bytes.",
    );

    console.log(
      "PASS: same-generation divergent payload rejected",
    );

    console.log(
      "PASS: same-generation rejection caused zero byte mutation",
    );


    // ========================================================
    // CONCURRENT DIVERGENT SIBLINGS
    // ========================================================

    const siblings =
      await Promise.allSettled(
        [
          commitFinoraControlCenterPortableStateHead({
            issuerId:
              issuerA,

            generation:
              2,

            payloadSha256:
              digestB,

            parentPayloadSha256:
              digestA,
          }),

          commitFinoraControlCenterPortableStateHead({
            issuerId:
              issuerA,

            generation:
              2,

            payloadSha256:
              digestC,

            parentPayloadSha256:
              digestA,
          }),
        ],
      );

    const fulfilled =
      siblings.filter(
        (
          result,
        ) =>
          result.status ===
            "fulfilled",
      );

    const rejected =
      siblings.filter(
        (
          result,
        ) =>
          result.status ===
            "rejected",
      );

    assert(
      fulfilled.length ===
        1 &&
      rejected.length ===
        1,
      "Concurrent divergent sibling commits did not resolve to exactly one winner.",
    );

    const rejectedReason =
      (
        rejected[0] as
          PromiseRejectedResult
      ).reason;

    assert(
      isExpectedError(
        rejectedReason,
        "conflicting payload exists at the current generation",
      ),
      "Concurrent losing sibling was not rejected as a same-generation conflict.",
    );

    const siblingHead =
      await loadFinoraControlCenterPortableStateHead();

    assert(
      siblingHead !==
        undefined &&
      siblingHead.headGeneration ===
        2 &&
      (
        siblingHead.headPayloadSha256 ===
          digestB ||
        siblingHead.headPayloadSha256 ===
          digestC
      ),
      "Concurrent sibling winner did not become exact generation-2 head.",
    );

    const winningDigest =
      siblingHead.headPayloadSha256;

    console.log(
      "PASS: concurrent divergent siblings serialized",
    );

    console.log(
      "PASS: exactly one generation-2 sibling won",
    );

    console.log(
      "PASS: losing generation-2 sibling rejected as conflict",
    );


    // ========================================================
    // WRONG PARENT
    // ========================================================

    const bytesBeforeWrongParent =
      await readFile(
        storePath,
      );

    let wrongParentRejected =
      false;

    try {

      await commitFinoraControlCenterPortableStateHead({
        issuerId:
          issuerA,

        generation:
          3,

        payloadSha256:
          digestD,

        parentPayloadSha256:
          digestWrongParent,
      });
    } catch (
      error
    ) {

      wrongParentRejected =
        isExpectedError(
          error,
          "parent payload digest does not match the current local head",
        );
    }

    assert(
      wrongParentRejected,
      "Wrong-parent Portable State was not rejected.",
    );

    const bytesAfterWrongParent =
      await readFile(
        storePath,
      );

    assert(
      bytesAfterWrongParent.equals(
        bytesBeforeWrongParent,
      ),
      "Wrong-parent rejection mutated Portable State head bytes.",
    );

    console.log(
      "PASS: wrong parent digest rejected",
    );

    console.log(
      "PASS: wrong-parent rejection caused zero byte mutation",
    );


    // ========================================================
    // FOREIGN ISSUER
    // ========================================================

    const bytesBeforeForeign =
      await readFile(
        storePath,
      );

    let foreignIssuerRejected =
      false;

    try {

      await commitFinoraControlCenterPortableStateHead({
        issuerId:
          issuerB,

        generation:
          3,

        payloadSha256:
          digestD,

        parentPayloadSha256:
          winningDigest,
      });
    } catch (
      error
    ) {

      foreignIssuerRejected =
        isExpectedError(
          error,
          "bound to another issuer",
        );
    }

    assert(
      foreignIssuerRejected,
      "Foreign issuer Portable State head was not rejected.",
    );

    const bytesAfterForeign =
      await readFile(
        storePath,
      );

    assert(
      bytesAfterForeign.equals(
        bytesBeforeForeign,
      ),
      "Foreign issuer rejection mutated Portable State head bytes.",
    );

    console.log(
      "PASS: foreign issuer rejected",
    );

    console.log(
      "PASS: foreign issuer rejection caused zero byte mutation",
    );


    // ========================================================
    // STALE GENERATION
    // ========================================================

    const bytesBeforeStale =
      await readFile(
        storePath,
      );

    let staleRejected =
      false;

    try {

      await commitFinoraControlCenterPortableStateHead({
        issuerId:
          issuerA,

        generation:
          1,

        payloadSha256:
          digestA,

        parentPayloadSha256:
          null,
      });
    } catch (
      error
    ) {

      staleRejected =
        isExpectedError(
          error,
          "head generation is stale",
        );
    }

    assert(
      staleRejected,
      "Stale Portable State head generation was not rejected.",
    );

    const bytesAfterStale =
      await readFile(
        storePath,
      );

    assert(
      bytesAfterStale.equals(
        bytesBeforeStale,
      ),
      "Stale-generation rejection mutated Portable State head bytes.",
    );

    console.log(
      "PASS: stale generation rejected",
    );

    console.log(
      "PASS: stale rejection caused zero byte mutation",
    );


    // ========================================================
    // GENERATION GAP WITH EXACT PARENT
    //
    // Generation 3 may have been reserved by a failed export.
    // Therefore generation 4 is allowed when it extends the
    // exact current payload digest.
    // ========================================================

    const gapCommit =
      await commitFinoraControlCenterPortableStateHead({
        issuerId:
          issuerA,

        generation:
          4,

        payloadSha256:
          digestD,

        parentPayloadSha256:
          winningDigest,
      });

    assert(
      gapCommit.status ===
        "COMMITTED" &&
      gapCommit.head.headGeneration ===
        4 &&
      gapCommit.head.headPayloadSha256 ===
        digestD,
      "Valid generation-gap Portable State head was not committed.",
    );

    const finalHead =
      await loadFinoraControlCenterPortableStateHead();

    assert(
      finalHead !==
        undefined &&
      finalHead.issuerId ===
        issuerA &&
      finalHead.headGeneration ===
        4 &&
      finalHead.headPayloadSha256 ===
        digestD,
      "Final Portable State lineage head is incorrect.",
    );

    console.log(
      "PASS: generation gap accepted with exact current parent",
    );

    console.log(
      "PASS: final lineage head = generation 4",
    );


    // ========================================================
    // FINAL ENCRYPTED STATE
    // ========================================================

    const finalEncrypted =
      await readFile(
        storePath,
      );

    const finalUtf8 =
      finalEncrypted.toString(
        "utf8",
      );

    assert(
      !finalUtf8.includes(
        issuerA,
      ) &&
      !finalUtf8.includes(
        digestD,
      ) &&
      !finalUtf8.includes(
        "headGeneration",
      ),
      "Final Portable State Head Store leaked plaintext authority data.",
    );

    const finalDecrypted =
      JSON.parse(
        safeStorage.decryptString(
          finalEncrypted,
        ),
      ) as {
        issuerId?:
          unknown;

        headGeneration?:
          unknown;

        headPayloadSha256?:
          unknown;
      };

    assert(
      finalDecrypted.issuerId ===
        issuerA &&
      finalDecrypted.headGeneration ===
        4 &&
      finalDecrypted.headPayloadSha256 ===
        digestD,
      "Final encrypted Portable State head did not decrypt exactly.",
    );

    console.log(
      "PASS: final Head Store encrypted state verified",
    );


    // ========================================================
    // RESULT
    // ========================================================

    console.log(
      "PASS: PORTABLE STATE HEAD STORE RUNTIME SELFTEST",
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
      "PASS: isolated Head Store self-test userData deleted",
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
        "FAIL: PORTABLE STATE HEAD STORE RUNTIME SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );