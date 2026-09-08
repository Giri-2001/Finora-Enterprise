// ============================================================
// FINORA ENTERPRISE OS™
//
// RECIPIENT TRUST RECOVERY SEQUENCE LEDGER SELFTEST
//
// VERIFY:
//
// - Real isolated Electron userData
// - Real safeStorage encryption
// - First scope reservation starts at sequence 1
// - Concurrent same-scope reservations serialize deterministically
// - Independent installation / operational-issuer scopes start at 1
// - Forward clock observation advances persisted high-water
// - Wall-clock rollback rejects with zero persisted mutation
// - Foreign Recovery Authority rejects with zero persisted mutation
// - Persisted ciphertext does not expose scope identifiers
// - Persisted state decrypts to exact validated ledger state
// - Corrupt ciphertext fails closed with zero silent replacement
// - Canonical encrypted state restores exactly
// - No temporary persistence artifacts remain
//
// NOTE:
//
// Durable reservation occurs before signing. Sequence gaps after a
// later signing/export failure are intentional and receiver-valid.
// ============================================================

import {
  app,
  safeStorage,
} from "electron";

import {
  mkdtemp,
  readFile,
  readdir,
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
  FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE,
} from "../control/finoraRecipientTrustRecoveryContract.js";

import {
  loadFinoraRecipientTrustRecoverySequenceLedger,
  reserveFinoraRecipientTrustRecoverySequence,
  validateFinoraRecipientTrustRecoverySequenceLedgerState,
} from "./finoraRecipientTrustRecoverySequenceLedger.js";

// ============================================================
// ASSERT
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

// ============================================================
// SELFTEST
// ============================================================

async function runSelfTest():
  Promise<void> {
  const temporaryUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-recovery-sequence-ledger-selftest-",
      ),
    );

  const recoveryAuthorityId =
    "FINORA-RECOVERY-AUTHORITY-11111111-1111-4111-8111-111111111111";

  const foreignRecoveryAuthorityId =
    "FINORA-RECOVERY-AUTHORITY-22222222-2222-4222-8222-222222222222";

  const installationA =
    "FINORA-INSTALLATION-RECOVERY-SELFTEST-A";

  const installationB =
    "FINORA-INSTALLATION-RECOVERY-SELFTEST-B";

  const operationalIssuerA =
    "FINORA-ISSUER-RECOVERY-SELFTEST-A";

  const operationalIssuerB =
    "FINORA-ISSUER-RECOVERY-SELFTEST-B";

  const firstAt =
    "2026-09-08T10:00:00.000Z";

  const forwardAt =
    "2026-09-08T10:05:00.000Z";

  const rollbackAt =
    "2026-09-08T10:04:59.999Z";

  try {
    // --------------------------------------------------------
    // ISOLATED ELECTRON
    // --------------------------------------------------------

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    assert(
      safeStorage.isEncryptionAvailable(),
      "Electron safeStorage encryption is unavailable for Recovery sequence-ledger selftest.",
    );

    console.log(
      "PASS: isolated Electron userData + safeStorage available",
    );

    // --------------------------------------------------------
    // INITIAL STATE
    // --------------------------------------------------------

    const initial =
      await loadFinoraRecipientTrustRecoverySequenceLedger();

    assert(
      initial ===
        undefined,
      "Recovery sequence ledger unexpectedly existed before first reservation.",
    );

    console.log(
      "PASS: Recovery sequence ledger begins unprovisioned",
    );

    // --------------------------------------------------------
    // FIRST RESERVATION
    // --------------------------------------------------------

    const first =
      await reserveFinoraRecipientTrustRecoverySequence({
        recoveryAuthorityId,

        installationId:
          installationA,

        operationalIssuerId:
          operationalIssuerA,

        observedAt:
          firstAt,
      });

    assert(
      first.recoveryAuthorityId ===
        recoveryAuthorityId &&
      first.purpose ===
        FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE &&
      first.installationId ===
        installationA &&
      first.operationalIssuerId ===
        operationalIssuerA &&
      first.sequence ===
        1 &&
      first.reservedAt ===
        firstAt &&
      first.highWaterAt ===
        firstAt,
      "First Recovery sequence reservation was not exact.",
    );

    console.log(
      "PASS: first Recovery scope reservation produced sequence 1",
    );

    // --------------------------------------------------------
    // CONCURRENT SAME-SCOPE RESERVATIONS
    // --------------------------------------------------------

    const concurrent =
      await Promise.all([
        reserveFinoraRecipientTrustRecoverySequence({
          recoveryAuthorityId,
          installationId:
            installationA,
          operationalIssuerId:
            operationalIssuerA,
          observedAt:
            firstAt,
        }),
        reserveFinoraRecipientTrustRecoverySequence({
          recoveryAuthorityId,
          installationId:
            installationA,
          operationalIssuerId:
            operationalIssuerA,
          observedAt:
            firstAt,
        }),
        reserveFinoraRecipientTrustRecoverySequence({
          recoveryAuthorityId,
          installationId:
            installationA,
          operationalIssuerId:
            operationalIssuerA,
          observedAt:
            firstAt,
        }),
        reserveFinoraRecipientTrustRecoverySequence({
          recoveryAuthorityId,
          installationId:
            installationA,
          operationalIssuerId:
            operationalIssuerA,
          observedAt:
            firstAt,
        }),
        reserveFinoraRecipientTrustRecoverySequence({
          recoveryAuthorityId,
          installationId:
            installationA,
          operationalIssuerId:
            operationalIssuerA,
          observedAt:
            firstAt,
        }),
      ]);

    const concurrentSequences =
      concurrent
        .map(
          (reservation) =>
            reservation.sequence,
        )
        .sort(
          (
            left,
            right,
          ) =>
            left -
            right,
        );

    assert(
      JSON.stringify(
        concurrentSequences,
      ) ===
        JSON.stringify([
          2,
          3,
          4,
          5,
          6,
        ]),
      `Concurrent Recovery sequences were invalid: ${JSON.stringify(concurrentSequences)}`,
    );

    console.log(
      "PASS: concurrent same-scope reservations serialized as sequences 2 through 6",
    );

    // --------------------------------------------------------
    // INDEPENDENT INSTALLATION SCOPE
    // --------------------------------------------------------

    const installationBReservation =
      await reserveFinoraRecipientTrustRecoverySequence({
        recoveryAuthorityId,

        installationId:
          installationB,

        operationalIssuerId:
          operationalIssuerA,

        observedAt:
          firstAt,
      });

    assert(
      installationBReservation.sequence ===
        1,
      "Independent installation Recovery sequence scope did not start at 1.",
    );

    console.log(
      "PASS: independent installation scope started at sequence 1",
    );

    // --------------------------------------------------------
    // INDEPENDENT OPERATIONAL ISSUER SCOPE
    // --------------------------------------------------------

    const issuerBReservation =
      await reserveFinoraRecipientTrustRecoverySequence({
        recoveryAuthorityId,

        installationId:
          installationA,

        operationalIssuerId:
          operationalIssuerB,

        observedAt:
          firstAt,
      });

    assert(
      issuerBReservation.sequence ===
        1,
      "Independent operational-issuer Recovery sequence scope did not start at 1.",
    );

    console.log(
      "PASS: independent operational-issuer scope started at sequence 1",
    );

    // --------------------------------------------------------
    // FORWARD CLOCK ADVANCE
    // --------------------------------------------------------

    const forward =
      await reserveFinoraRecipientTrustRecoverySequence({
        recoveryAuthorityId,

        installationId:
          installationA,

        operationalIssuerId:
          operationalIssuerA,

        observedAt:
          forwardAt,
      });

    assert(
      forward.sequence ===
        7 &&
      forward.reservedAt ===
        forwardAt &&
      forward.highWaterAt ===
        forwardAt,
      "Forward Recovery reservation did not advance sequence/high-water exactly.",
    );

    const afterForward =
      await loadFinoraRecipientTrustRecoverySequenceLedger();

    assert(
      afterForward !==
        undefined &&
      afterForward.highWaterAt ===
        forwardAt,
      "Forward Recovery clock observation was not persisted as high-water.",
    );

    console.log(
      "PASS: forward Recovery Authority clock observation advanced persisted high-water",
    );

    // --------------------------------------------------------
    // CANONICAL PERSISTED CIPHERTEXT
    // --------------------------------------------------------

    const ledgerDirectory =
      join(
        temporaryUserData,
        "finora",
        "recovery",
      );

    const ledgerPath =
      join(
        ledgerDirectory,
        "finora-recipient-trust-recovery-sequence-ledger.bin",
      );

    const canonicalCiphertext =
      await readFile(
        ledgerPath,
      );

    assert(
      canonicalCiphertext.byteLength >
        0,
      "Recovery sequence-ledger ciphertext is empty.",
    );

    const ciphertextUtf8 =
      canonicalCiphertext.toString(
        "utf8",
      );

    assert(
      !ciphertextUtf8.includes(
        recoveryAuthorityId,
      ) &&
      !ciphertextUtf8.includes(
        installationA,
      ) &&
      !ciphertextUtf8.includes(
        operationalIssuerA,
      ),
      "Recovery sequence-ledger scope identifiers are visible in ciphertext.",
    );

    console.log(
      "PASS: persisted Recovery sequence ledger hides authority and scope identifiers at rest",
    );

    // --------------------------------------------------------
    // EXACT DECRYPTED STATE
    // --------------------------------------------------------

    const decrypted =
      safeStorage.decryptString(
        canonicalCiphertext,
      );

    const parsed:
      unknown =
        JSON.parse(
          decrypted,
        );

    validateFinoraRecipientTrustRecoverySequenceLedgerState(
      parsed,
    );

    assert(
      afterForward !==
        undefined &&
      JSON.stringify(
        parsed,
      ) ===
        JSON.stringify(
          afterForward,
        ),
      "Decrypted Recovery sequence ledger differs from authoritative loaded state.",
    );

    assert(
      afterForward.scopes.length ===
        3,
      "Recovery sequence ledger did not preserve exactly three expected scopes.",
    );

    const mainScope =
      afterForward.scopes.find(
        (scope) =>
          scope.installationId ===
            installationA &&
          scope.operationalIssuerId ===
            operationalIssuerA,
      );

    const installationScope =
      afterForward.scopes.find(
        (scope) =>
          scope.installationId ===
            installationB &&
          scope.operationalIssuerId ===
            operationalIssuerA,
      );

    const issuerScope =
      afterForward.scopes.find(
        (scope) =>
          scope.installationId ===
            installationA &&
          scope.operationalIssuerId ===
            operationalIssuerB,
      );

    assert(
      mainScope?.lastReservedSequence ===
        7 &&
      mainScope.updatedAt ===
        forwardAt &&
      installationScope?.lastReservedSequence ===
        1 &&
      issuerScope?.lastReservedSequence ===
        1,
      "Recovery sequence scopes do not contain the expected final sequences.",
    );

    console.log(
      "PASS: decrypted Recovery sequence ledger contains exact three-scope state",
    );

    // --------------------------------------------------------
    // WALL-CLOCK ROLLBACK — ZERO MUTATION
    // --------------------------------------------------------

    const beforeRollbackBytes =
      await readFile(
        ledgerPath,
      );

    let rollbackRejected =
      false;

    try {
      await reserveFinoraRecipientTrustRecoverySequence({
        recoveryAuthorityId,

        installationId:
          installationA,

        operationalIssuerId:
          operationalIssuerA,

        observedAt:
          rollbackAt,
      });
    } catch {
      rollbackRejected =
        true;
    }

    assert(
      rollbackRejected,
      "Recovery Authority persisted wall-clock rollback was not rejected.",
    );

    const afterRollbackBytes =
      await readFile(
        ledgerPath,
      );

    assert(
      afterRollbackBytes.equals(
        beforeRollbackBytes,
      ),
      "Rejected Recovery Authority clock rollback mutated persisted ledger bytes.",
    );

    console.log(
      "PASS: Recovery Authority wall-clock rollback rejected with zero persisted mutation",
    );

    // --------------------------------------------------------
    // FOREIGN AUTHORITY — ZERO MUTATION
    // --------------------------------------------------------

    const beforeForeignBytes =
      await readFile(
        ledgerPath,
      );

    let foreignRejected =
      false;

    try {
      await reserveFinoraRecipientTrustRecoverySequence({
        recoveryAuthorityId:
          foreignRecoveryAuthorityId,

        installationId:
          installationA,

        operationalIssuerId:
          operationalIssuerA,

        observedAt:
          forwardAt,
      });
    } catch {
      foreignRejected =
        true;
    }

    assert(
      foreignRejected,
      "Recovery sequence ledger accepted a foreign Recovery Authority.",
    );

    const afterForeignBytes =
      await readFile(
        ledgerPath,
      );

    assert(
      afterForeignBytes.equals(
        beforeForeignBytes,
      ),
      "Foreign Recovery Authority rejection mutated persisted ledger bytes.",
    );

    console.log(
      "PASS: foreign Recovery Authority rejected with zero persisted mutation",
    );

    // --------------------------------------------------------
    // CORRUPT CIPHERTEXT — FAIL CLOSED
    // --------------------------------------------------------

    const corruptCiphertext =
      Buffer.from(
        "FINORA-RECOVERY-SEQUENCE-LEDGER-CORRUPT-SELFTEST",
        "utf8",
      );

    await writeFile(
      ledgerPath,
      corruptCiphertext,
    );

    let corruptRejected =
      false;

    try {
      await loadFinoraRecipientTrustRecoverySequenceLedger();
    } catch {
      corruptRejected =
        true;
    }

    assert(
      corruptRejected,
      "Corrupt Recovery sequence ledger did not fail closed.",
    );

    const afterCorruptReject =
      await readFile(
        ledgerPath,
      );

    assert(
      afterCorruptReject.equals(
        corruptCiphertext,
      ),
      "Corrupt Recovery ledger rejection silently replaced persisted state.",
    );

    console.log(
      "PASS: corrupt encrypted Recovery sequence ledger failed closed with zero silent replacement",
    );

    // --------------------------------------------------------
    // RESTORE CANONICAL STATE
    // --------------------------------------------------------

    await writeFile(
      ledgerPath,
      canonicalCiphertext,
    );

    const restored =
      await loadFinoraRecipientTrustRecoverySequenceLedger();

    assert(
      restored !==
        undefined &&
      JSON.stringify(
        restored,
      ) ===
        JSON.stringify(
          afterForward,
        ),
      "Canonical Recovery sequence ledger did not restore exactly.",
    );

    console.log(
      "PASS: canonical encrypted Recovery sequence ledger restored exactly",
    );

    // --------------------------------------------------------
    // TEMP ARTIFACT CLEANLINESS
    // --------------------------------------------------------

    const entries =
      await readdir(
        ledgerDirectory,
      );

    const unexpected =
      entries.filter(
        (entry) =>
          entry !==
            "finora-recipient-trust-recovery-sequence-ledger.bin",
      );

    assert(
      unexpected.length ===
        0,
      `Recovery sequence ledger left temporary artifacts: ${unexpected.join(", ")}`,
    );

    console.log(
      "PASS: Recovery sequence ledger left no temporary persistence artifacts",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA OFFLINE RECIPIENT TRUST RECOVERY SEQUENCE LEDGER SELFTEST",
    );

    console.log(
      "============================================================",
    );
  } finally {
    await rm(
      temporaryUserData,
      {
        recursive:
          true,

        force:
          true,

        maxRetries:
          20,

        retryDelay:
          100,
      },
    );

    console.log(
      "PASS: isolated Recovery sequence-ledger selftest userData deleted",
    );
  }
}

// ============================================================
// RUN
// ============================================================

void runSelfTest()
  .then(
    () => {
      app.exit(
        0,
      );
    },
  )
  .catch(
    (error) => {
      console.error(
        "FAIL: FINORA OFFLINE RECIPIENT TRUST RECOVERY SEQUENCE LEDGER SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );