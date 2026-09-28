// ============================================================
// FINORA ENTERPRISE
// PORTABLE STATE DURABLE EXPORT SERVICE SELF TEST
// ============================================================

import {
  Buffer,
} from "node:buffer";

import {
  createHash,
} from "node:crypto";

import {
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  dirname,
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
  commitFinoraControlCenterPortableStateEnvelopeHead,
  createFinoraControlCenterPortableStateEnvelope,
} from "./finoraControlCenterPortableStateExporter.js";

import {
  loadFinoraControlCenterPortableStateHead,
} from "./finoraControlCenterPortableStateHeadStore.js";

import {
  exportFinoraControlCenterPortableStateToPath,
  recoverFinoraControlCenterPortableStateExport,
} from "./finoraControlCenterPortableStateExportService.js";

import {
  clearFinoraControlCenterPortableStateExportTransaction,
  loadFinoraControlCenterPortableStateExportTransaction,
  prepareFinoraControlCenterPortableStateExportTransaction,
} from "./finoraControlCenterPortableStateExportTransactionStore.js";

import {
  createFinoraControlCenterPortableStateTransferBundleV1,
  decryptFinoraControlCenterPortableStateTransferBundleV1,
  parseFinoraControlCenterPortableStateTransferBundleV1,
  serializeFinoraControlCenterPortableStateTransferBundleV1,
} from "./finoraControlCenterPortableStateTransferCrypto.js";

import type {
  FinoraControlCenterPortableStateEnvelope,
} from "./finoraControlCenterPortableState.types.js";


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


function sha256Text(
  value:
    string,
): string {

  return createHash(
    "sha256",
  )
    .update(
      Buffer.from(
        value,
        "utf8",
      ),
    )
    .digest(
      "hex",
    );
}


function resolveSelfTestStagingPath(
  targetPath:
    string,
  transactionId:
    string,
): string {

  return join(
    dirname(
      targetPath,
    ),
    `.${transactionId}.finora-pending`,
  );
}


async function prepareCrashStaging(
  envelope:
    FinoraControlCenterPortableStateEnvelope,
  targetPath:
    string,
  transferCode:
    string,
): Promise<{
  readonly transactionId:
    string;

  readonly stagingPath:
    string;

  readonly serializedTransfer:
    string;
}> {

  const serializedEnvelope =
    JSON.stringify(
      envelope,
    );

  const transferBundle =
    await createFinoraControlCenterPortableStateTransferBundleV1(
      serializedEnvelope,
      transferCode,
    );

  const serializedTransfer =
    serializeFinoraControlCenterPortableStateTransferBundleV1(
      transferBundle,
    );

  const transaction =
    await prepareFinoraControlCenterPortableStateExportTransaction({
      issuerId:
        envelope.payload.issuerId,

      signingKeyId:
        envelope.payload.signingKeyId,

      stateGeneration:
        envelope.payload.stateGeneration,

      parentPayloadSha256:
        envelope.payload.parentPayloadSha256,

      payloadSha256:
        envelope.payloadSha256,

      targetPath,

      transferBundleSha256:
        sha256Text(
          serializedTransfer,
        ),

      serializedEnvelope,
    });

  const stagingPath =
    resolveSelfTestStagingPath(
      targetPath,
      transaction.transactionId,
    );

  await writeFile(
    stagingPath,
    Buffer.from(
      serializedTransfer,
      "utf8",
    ),
    {
      flag:
        "wx",
    },
  );

  return {
    transactionId:
      transaction.transactionId,

    stagingPath,

    serializedTransfer,
  };
}


async function run():
  Promise<void> {

  const isolatedUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-portable-state-export-service-",
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
      "Electron safeStorage unavailable.",
    );

    const exportDirectory =
      join(
        isolatedUserData,
        "exports",
      );

    const transferCode =
      "FINORA-PORTABLE-STATE-TRANSFER-SELFTEST-2026";

    console.log(
      "PASS: isolated Electron userData configured",
    );


    // ========================================================
    // NORMAL DURABLE EXPORT
    // ========================================================

    const firstTarget =
      join(
        exportDirectory,
        "portable-state-1.finora",
      );

    const firstResult =
      await exportFinoraControlCenterPortableStateToPath({
        targetPath:
          firstTarget,

        transferCode,
      });

    assert(
      firstResult.status ===
        "EXPORTED" &&
      firstResult.stateGeneration ===
        1 &&
      firstResult.parentPayloadSha256 ===
        null &&
      firstResult.bytes >
        0,
      "First durable Portable State export result is invalid.",
    );

    const firstBytes =
      await readFile(
        firstTarget,
      );

    assert(
      sha256Text(
        firstBytes.toString(
          "utf8",
        ),
      ) ===
        firstResult.transferBundleSha256,
      "First durable transfer-file SHA-256 is incorrect.",
    );

    const firstSerializedFile =
      firstBytes.toString(
        "utf8",
      );

    assert(
      !firstSerializedFile.includes(
        transferCode,
      ),
      "Durable Portable State file leaked Transfer Code.",
    );

    const firstTransferBundle =
      parseFinoraControlCenterPortableStateTransferBundleV1(
        firstSerializedFile,
      );

    const firstDecryptedEnvelope =
      await decryptFinoraControlCenterPortableStateTransferBundleV1(
        firstTransferBundle,
        transferCode,
      );

    const firstEnvelope =
      JSON.parse(
        firstDecryptedEnvelope,
      ) as FinoraControlCenterPortableStateEnvelope;

    assert(
      firstEnvelope.payload.stateGeneration ===
        1 &&
      firstEnvelope.payload.parentPayloadSha256 ===
        null &&
      firstEnvelope.payloadSha256 ===
        firstResult.payloadSha256,
      "First encrypted durable file did not decrypt to the exact signed envelope.",
    );

    assert(
      !firstSerializedFile.includes(
        firstEnvelope.payload.issuerId,
      ) &&
      !firstSerializedFile.includes(
        firstEnvelope.payloadSha256,
      ),
      "Durable Portable State file leaked signed operational identity metadata.",
    );

    const firstPending =
      await loadFinoraControlCenterPortableStateExportTransaction();

    assert(
      firstPending ===
        undefined,
      "Successful durable export left a pending transaction.",
    );

    const firstHead =
      await loadFinoraControlCenterPortableStateHead();

    assert(
      firstHead !==
        undefined &&
      firstHead.headGeneration ===
        1 &&
      firstHead.headPayloadSha256 ===
        firstResult.payloadSha256,
      "First durable export did not commit exact lineage Head.",
    );

    console.log(
      "PASS: normal durable encrypted export completed",
    );

    console.log(
      "PASS: final file decrypts to exact signed envelope",
    );

    console.log(
      "PASS: successful export committed Head and cleared journal",
    );


    // ========================================================
    // CRASH WINDOW A:
    // STAGING DURABLE, HEAD NOT YET COMMITTED
    // ========================================================

    const secondEnvelope =
      await createFinoraControlCenterPortableStateEnvelope();

    assert(
      secondEnvelope.payload.stateGeneration ===
        2 &&
      secondEnvelope.payload.parentPayloadSha256 ===
        firstResult.payloadSha256,
      "Second envelope does not extend first committed Head.",
    );

    const secondTarget =
      join(
        exportDirectory,
        "portable-state-2.finora",
      );

    const secondCrash =
      await prepareCrashStaging(
        secondEnvelope,
        secondTarget,
        transferCode,
      );

    const secondRecovery =
      await recoverFinoraControlCenterPortableStateExport();

    assert(
      secondRecovery.status ===
        "RECOVERED_FROM_STAGING" &&
      secondRecovery.stateGeneration ===
        2 &&
      secondRecovery.payloadSha256 ===
        secondEnvelope.payloadSha256,
      "Staging-before-Head crash recovery failed.",
    );

    const secondFinalBytes =
      await readFile(
        secondTarget,
      );

    assert(
      sha256Text(
        secondFinalBytes.toString(
          "utf8",
        ),
      ) ===
        sha256Text(
          secondCrash.serializedTransfer,
        ),
      "Recovered second final artifact differs from staged bytes.",
    );

    const secondHead =
      await loadFinoraControlCenterPortableStateHead();

    assert(
      secondHead !==
        undefined &&
      secondHead.headGeneration ===
        2 &&
      secondHead.headPayloadSha256 ===
        secondEnvelope.payloadSha256,
      "Staging recovery did not commit generation-2 Head.",
    );

    const secondPending =
      await loadFinoraControlCenterPortableStateExportTransaction();

    assert(
      secondPending ===
        undefined,
      "Staging recovery left pending transaction evidence.",
    );

    console.log(
      "PASS: crash recovery from durable staging file",
    );

    console.log(
      "PASS: staging recovery committed Head, renamed final, cleared journal",
    );


    // ========================================================
    // CRASH WINDOW B:
    // HEAD COMMITTED + FINAL RENAMED, JOURNAL NOT CLEARED
    // ========================================================

    const thirdEnvelope =
      await createFinoraControlCenterPortableStateEnvelope();

    assert(
      thirdEnvelope.payload.stateGeneration ===
        3 &&
      thirdEnvelope.payload.parentPayloadSha256 ===
        secondEnvelope.payloadSha256,
      "Third envelope does not extend second committed Head.",
    );

    const thirdTarget =
      join(
        exportDirectory,
        "portable-state-3.finora",
      );

    const thirdCrash =
      await prepareCrashStaging(
        thirdEnvelope,
        thirdTarget,
        transferCode,
      );

    await commitFinoraControlCenterPortableStateEnvelopeHead(
      thirdEnvelope,
    );

    await rename(
      thirdCrash.stagingPath,
      thirdTarget,
    );

    const pendingBeforeFinalRecovery =
      await loadFinoraControlCenterPortableStateExportTransaction();

    assert(
      pendingBeforeFinalRecovery !==
        undefined,
      "Crash simulation unexpectedly cleared transaction before recovery.",
    );

    const thirdRecovery =
      await recoverFinoraControlCenterPortableStateExport();

    assert(
      thirdRecovery.status ===
        "RECOVERED_FROM_FINAL" &&
      thirdRecovery.stateGeneration ===
        3 &&
      thirdRecovery.payloadSha256 ===
        thirdEnvelope.payloadSha256,
      "Final-file crash recovery failed.",
    );

    const thirdHead =
      await loadFinoraControlCenterPortableStateHead();

    assert(
      thirdHead !==
        undefined &&
      thirdHead.headGeneration ===
        3 &&
      thirdHead.headPayloadSha256 ===
        thirdEnvelope.payloadSha256,
      "Final-file recovery changed or lost committed generation-3 Head.",
    );

    const thirdPending =
      await loadFinoraControlCenterPortableStateExportTransaction();

    assert(
      thirdPending ===
        undefined,
      "Final-file recovery did not clear pending transaction.",
    );

    console.log(
      "PASS: crash recovery from already-published final file",
    );

    console.log(
      "PASS: already-committed Head recovery is idempotent",
    );


    // ========================================================
    // CRASH WINDOW C:
    // JOURNAL PREPARED, NO STAGING, NO FINAL, HEAD AT PARENT
    //
    // Safe abandon must clear only the journal.
    // Generation reservation gap is intentionally preserved.
    // ========================================================

    const fourthEnvelope =
      await createFinoraControlCenterPortableStateEnvelope();

    assert(
      fourthEnvelope.payload.stateGeneration ===
        4 &&
      fourthEnvelope.payload.parentPayloadSha256 ===
        thirdEnvelope.payloadSha256,
      "Fourth envelope does not extend current generation-3 Head.",
    );

    const fourthTarget =
      join(
        exportDirectory,
        "portable-state-4.finora",
      );

    const fourthSerializedEnvelope =
      JSON.stringify(
        fourthEnvelope,
      );

    const fourthTransaction =
      await prepareFinoraControlCenterPortableStateExportTransaction({
        issuerId:
          fourthEnvelope.payload.issuerId,

        signingKeyId:
          fourthEnvelope.payload.signingKeyId,

        stateGeneration:
          fourthEnvelope.payload.stateGeneration,

        parentPayloadSha256:
          fourthEnvelope.payload.parentPayloadSha256,

        payloadSha256:
          fourthEnvelope.payloadSha256,

        targetPath:
          fourthTarget,

        transferBundleSha256:
          "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",

        serializedEnvelope:
          fourthSerializedEnvelope,
      });

    assert(
      fourthTransaction.stateGeneration ===
        4,
      "Fourth crash transaction was not prepared.",
    );

    const abandonResult =
      await recoverFinoraControlCenterPortableStateExport();

    assert(
      abandonResult.status ===
        "ABANDONED_NO_DURABLE_ARTIFACT",
      "No-artifact pre-commit transaction was not safely abandoned.",
    );

    const headAfterAbandon =
      await loadFinoraControlCenterPortableStateHead();

    assert(
      headAfterAbandon !==
        undefined &&
      headAfterAbandon.headGeneration ===
        3 &&
      headAfterAbandon.headPayloadSha256 ===
        thirdEnvelope.payloadSha256,
      "Safe abandon unexpectedly advanced lineage Head.",
    );

    const pendingAfterAbandon =
      await loadFinoraControlCenterPortableStateExportTransaction();

    assert(
      pendingAfterAbandon ===
        undefined,
      "Safe abandon did not clear pending transaction.",
    );

    console.log(
      "PASS: pre-commit transaction with no durable artifact safely abandoned",
    );

    console.log(
      "PASS: safe abandon preserves committed Head and generation gap",
    );


    // ========================================================
    // RECOVERY IDEMPOTENCY
    // ========================================================

    const alreadyClear =
      await recoverFinoraControlCenterPortableStateExport();

    assert(
      alreadyClear.status ===
        "ALREADY_CLEAR",
      "Recovery was not idempotent on an empty transaction store.",
    );

    console.log(
      "PASS: empty recovery is idempotent",
    );


    // Defensive cleanup if a future assertion moves.
    const leftover =
      await loadFinoraControlCenterPortableStateExportTransaction();

    if (leftover) {

      await clearFinoraControlCenterPortableStateExportTransaction(
        leftover.transactionId,
      );
    }


    console.log(
      "PASS: PORTABLE STATE DURABLE EXPORT SERVICE SELFTEST",
    );
  } catch (
    error
  ) {

    exitCode =
      1;

    console.error(
      "FAIL: PORTABLE STATE DURABLE EXPORT SERVICE SELFTEST",
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
      "PASS: isolated durable-export self-test userData deleted",
    );

    app.exit(
      exitCode,
    );
  }
}


void run();