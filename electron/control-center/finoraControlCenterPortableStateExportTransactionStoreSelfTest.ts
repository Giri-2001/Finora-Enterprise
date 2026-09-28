// ============================================================
// FINORA ENTERPRISE
// PORTABLE STATE EXPORT TRANSACTION STORE SELF TEST
// ============================================================

import {
  Buffer,
} from "node:buffer";

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
  app,
  safeStorage,
} from "electron";

import {
  clearFinoraControlCenterPortableStateExportTransaction,
  loadFinoraControlCenterPortableStateExportTransaction,
  prepareFinoraControlCenterPortableStateExportTransaction,
} from "./finoraControlCenterPortableStateExportTransactionStore.js";


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


const PAYLOAD_A =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const PAYLOAD_B =
  "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

const TRANSFER_A =
  "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";

const TRANSFER_B =
  "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd";


async function run():
  Promise<void> {

  const isolatedUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-portable-state-export-transaction-",
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
      await loadFinoraControlCenterPortableStateExportTransaction();

    assert(
      fresh ===
        undefined,
      "Fresh pending export transaction was not absent.",
    );

    console.log(
      "PASS: fresh pending export transaction is absent",
    );


    const privateOperationalMarker =
      "GGB-PRIVATE-SIGNED-PORTABLE-STATE-MARKER";

    const targetPath =
      join(
        isolatedUserData,
        "FINORA-Portable-State.finora",
      );

    const serializedEnvelope =
      JSON.stringify({
        format:
          "FINORA_CONTROL_CENTER_PORTABLE_STATE",

        payload: {
          marker:
            privateOperationalMarker,
        },

        payloadSha256:
          PAYLOAD_A,

        signatureBase64:
          "SELFTEST-SIGNATURE",
      });


    const prepared =
      await prepareFinoraControlCenterPortableStateExportTransaction({
        issuerId:
          "FINORA-CC-SELFTEST",

        signingKeyId:
          "FINORA-KEY-SELFTEST",

        stateGeneration:
          1,

        parentPayloadSha256:
          null,

        payloadSha256:
          PAYLOAD_A,

        targetPath,

        transferBundleSha256:
          TRANSFER_A,

        serializedEnvelope,
      });


    assert(
      prepared.stateGeneration ===
        1 &&
      prepared.parentPayloadSha256 ===
        null &&
      prepared.payloadSha256 ===
        PAYLOAD_A &&
      prepared.transferBundleSha256 ===
        TRANSFER_A &&
      prepared.serializedEnvelope ===
        serializedEnvelope &&
      prepared.targetPath ===
        targetPath,
      "Prepared export transaction did not preserve exact evidence.",
    );

    console.log(
      "PASS: pending export transaction persisted exact evidence",
    );


    const storePath =
      join(
        isolatedUserData,
        "FINORA",
        "control-center",
        "finora-control-center-portable-state-export-transaction.bin",
      );

    const encryptedBeforeRejects =
      await readFile(
        storePath,
      );

    const encryptedText =
      encryptedBeforeRejects.toString(
        "utf8",
      );

    assert(
      !encryptedText.includes(
        "FINORA-CC-SELFTEST",
      ) &&
      !encryptedText.includes(
        targetPath,
      ) &&
      !encryptedText.includes(
        privateOperationalMarker,
      ) &&
      !encryptedText.includes(
        PAYLOAD_A,
      ),
      "Pending export transaction store leaked plaintext evidence.",
    );

    console.log(
      "PASS: pending transaction store is encrypted at rest",
    );

    console.log(
      "PASS: encrypted bytes contain no issuer/path/envelope/digest plaintext",
    );


    const decrypted =
      safeStorage.decryptString(
        encryptedBeforeRejects,
      );

    const decryptedRecord =
      JSON.parse(
        decrypted,
      ) as {
        transactionId:
          string;
        serializedEnvelope:
          string;
        targetPath:
          string;
      };

    assert(
      decryptedRecord.transactionId ===
        prepared.transactionId &&
      decryptedRecord.serializedEnvelope ===
        serializedEnvelope &&
      decryptedRecord.targetPath ===
        targetPath,
      "safeStorage decrypted pending transaction does not match exact evidence.",
    );

    console.log(
      "PASS: safeStorage decrypt proves exact pending evidence",
    );


    // --------------------------------------------------------
    // Duplicate prepare must reject without byte mutation.
    // --------------------------------------------------------

    let duplicateRejected =
      false;

    try {

      await prepareFinoraControlCenterPortableStateExportTransaction({
        issuerId:
          "FINORA-CC-SELFTEST",

        signingKeyId:
          "FINORA-KEY-SELFTEST",

        stateGeneration:
          2,

        parentPayloadSha256:
          PAYLOAD_A,

        payloadSha256:
          PAYLOAD_B,

        targetPath,

        transferBundleSha256:
          TRANSFER_B,

        serializedEnvelope:
          "{\"different\":true}",
      });
    } catch (
      error
    ) {

      duplicateRejected =
        error instanceof Error &&
        error.message.includes(
          "pending export transaction already exists",
        );
    }

    assert(
      duplicateRejected,
      "Duplicate pending export transaction was accepted.",
    );

    const encryptedAfterDuplicate =
      await readFile(
        storePath,
      );

    assert(
      encryptedAfterDuplicate.equals(
        encryptedBeforeRejects,
      ),
      "Duplicate prepare rejection mutated encrypted bytes.",
    );

    console.log(
      "PASS: duplicate pending transaction rejected with zero byte mutation",
    );


    // --------------------------------------------------------
    // Wrong transaction clear must reject with zero mutation.
    // --------------------------------------------------------

    let wrongClearRejected =
      false;

    try {

      await clearFinoraControlCenterPortableStateExportTransaction(
        "FINORA-PS-EXPORT-WRONG-ID",
      );
    } catch (
      error
    ) {

      wrongClearRejected =
        error instanceof Error &&
        error.message.includes(
          "transaction ID does not match",
        );
    }

    assert(
      wrongClearRejected,
      "Wrong transaction ID unexpectedly cleared pending export.",
    );

    const encryptedAfterWrongClear =
      await readFile(
        storePath,
      );

    assert(
      encryptedAfterWrongClear.equals(
        encryptedBeforeRejects,
      ),
      "Wrong clear rejection mutated encrypted bytes.",
    );

    console.log(
      "PASS: wrong transaction clear rejected with zero byte mutation",
    );


    const clearResult =
      await clearFinoraControlCenterPortableStateExportTransaction(
        prepared.transactionId,
      );

    assert(
      clearResult.status ===
        "CLEARED",
      "Correct pending export transaction was not cleared.",
    );

    const afterClear =
      await loadFinoraControlCenterPortableStateExportTransaction();

    assert(
      afterClear ===
        undefined,
      "Pending export transaction remained after clear.",
    );

    console.log(
      "PASS: exact pending transaction cleared",
    );


    const alreadyClear =
      await clearFinoraControlCenterPortableStateExportTransaction(
        prepared.transactionId,
      );

    assert(
      alreadyClear.status ===
        "ALREADY_CLEAR",
      "Already-clear transaction store was not idempotent.",
    );

    console.log(
      "PASS: repeated clear is idempotent",
    );


    // --------------------------------------------------------
    // Concurrency: only one sibling may become pending.
    // --------------------------------------------------------

    const concurrent =
      await Promise.allSettled([
        prepareFinoraControlCenterPortableStateExportTransaction({
          issuerId:
            "FINORA-CC-SELFTEST",

          signingKeyId:
            "FINORA-KEY-SELFTEST",

          stateGeneration:
            10,

          parentPayloadSha256:
            PAYLOAD_A,

          payloadSha256:
            PAYLOAD_B,

          targetPath:
            targetPath + ".A",

          transferBundleSha256:
            TRANSFER_A,

          serializedEnvelope:
            "{\"sibling\":\"A\"}",
        }),

        prepareFinoraControlCenterPortableStateExportTransaction({
          issuerId:
            "FINORA-CC-SELFTEST",

          signingKeyId:
            "FINORA-KEY-SELFTEST",

          stateGeneration:
            10,

          parentPayloadSha256:
            PAYLOAD_A,

          payloadSha256:
            PAYLOAD_A,

          targetPath:
            targetPath + ".B",

          transferBundleSha256:
            TRANSFER_B,

          serializedEnvelope:
            "{\"sibling\":\"B\"}",
        }),
      ]);

    const fulfilled =
      concurrent.filter(
        (
          result,
        ) =>
          result.status ===
            "fulfilled",
      );

    const rejected =
      concurrent.filter(
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
      "Concurrent pending export siblings were not serialized to one winner.",
    );

    const winner =
      (
        fulfilled[0] as PromiseFulfilledResult<
          Awaited<
            ReturnType<
              typeof prepareFinoraControlCenterPortableStateExportTransaction
            >
          >
        >
      ).value;

    const loadedWinner =
      await loadFinoraControlCenterPortableStateExportTransaction();

    assert(
      loadedWinner !==
        undefined &&
      loadedWinner.transactionId ===
        winner.transactionId,
      "Concurrent pending export winner was not persisted exactly.",
    );

    console.log(
      "PASS: concurrent pending export siblings serialized to one winner",
    );


    await clearFinoraControlCenterPortableStateExportTransaction(
      winner.transactionId,
    );

    const finalState =
      await loadFinoraControlCenterPortableStateExportTransaction();

    assert(
      finalState ===
        undefined,
      "Final pending export transaction store was not empty.",
    );

    console.log(
      "PASS: final pending export transaction state is empty",
    );

    console.log(
      "PASS: PORTABLE STATE EXPORT TRANSACTION STORE SELFTEST",
    );
  } catch (
    error
  ) {

    exitCode =
      1;

    console.error(
      "FAIL: PORTABLE STATE EXPORT TRANSACTION STORE SELFTEST",
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
      "PASS: isolated export-transaction self-test userData deleted",
    );

    app.exit(
      exitCode,
    );
  }
}


void run();