/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST TRANSITION ISSUANCE LEDGER SELF TEST

   RESPONSIBILITY:

   - Verify first sequence starts at 1
   - Verify same installation advances monotonically
   - Verify concurrent reservations serialize uniquely
   - Verify different installation starts independently at 1
   - Verify foreign issuer is rejected without ledger mutation
   - Verify unique package IDs
   - Verify issuedAt canonical timestamps
   - Verify encrypted persisted ledger
   - Verify exact persisted installation-level sequence scopes
   - Verify successful writes leave no temporary files

   IMPORTANT:

   - Real Electron safeStorage runtime.
   - Isolated temporary userData.
   - Uses Control Center public identity only; no private-key export.
   - No package signing.
   - No renderer.
   - No IPC.
=========================================================== */

import {
  app,
  safeStorage,
} from "electron";

import {
  mkdtemp,
  readFile,
  readdir,
  rm,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  loadFinoraControlCenterClockHighWaterState,
  persistFinoraControlCenterClockHighWaterState,
} from "./finoraControlCenterClockHighWaterStore.js";

import {
  getFinoraControlCenterPublicIdentity,
} from "./finoraControlCenterKeyVault.js";

import {
  reserveFinoraRecipientTrustTransitionIssuance,
} from "./finoraRecipientTrustTransitionIssuanceLedger.js";

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
// TIMESTAMP
// ============================================================

function isCanonicalIsoTimestamp(
  value:
    string,
): boolean {
  const parsed =
    Date.parse(
      value,
    );

  return (
    Number.isFinite(
      parsed,
    ) &&
    new Date(
      parsed,
    ).toISOString() ===
      value
  );
}

// ============================================================
// RUN
// ============================================================

async function runSelfTest():
  Promise<void> {
  const temporaryUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-recipient-trust-transition-ledger-selftest-",
      ),
    );

  try {
    // --------------------------------------------------------
    // ISOLATED ELECTRON USERDATA
    // --------------------------------------------------------

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    assert(
      safeStorage.isEncryptionAvailable(),
      "Electron safeStorage encryption is unavailable for issuance-ledger selftest.",
    );

    console.log(
      "PASS: isolated Electron userData configured",
    );

    // --------------------------------------------------------
    // FIXTURES
    // --------------------------------------------------------

    const identity =
      await getFinoraControlCenterPublicIdentity();

    const issuerId =
      identity.issuerId;

    const foreignIssuer =
      "FINORA-CC-TRUST-LEDGER-FOREIGN";

    assert(
      typeof issuerId ===
        "string" &&
      issuerId.length >
        0,
      "Authoritative Control Center public identity did not provide issuerId.",
    );

    const installationA =
      "FINORA-INSTALLATION-TRUST-LEDGER-A";

    const installationB =
      "FINORA-INSTALLATION-TRUST-LEDGER-B";

    console.log(
      "PASS: authoritative Control Center issuer identity established",
    );

    // --------------------------------------------------------
    // SAME SCOPE: SEQUENCE 1
    // --------------------------------------------------------

    const reservation1 =
      await reserveFinoraRecipientTrustTransitionIssuance({
        issuerId:
          issuerId,

        installationId:
          installationA,
      });

    assert(
      reservation1.sequence ===
        1,
      "First trust-transition sequence did not start at 1.",
    );

    assert(
      reservation1.packageId.startsWith(
        "FINORA-TRUST-",
      ) &&
      isCanonicalIsoTimestamp(
        reservation1.issuedAt,
      ),
      "First trust-transition reservation metadata is invalid.",
    );

    console.log(
      "PASS: first installation-level reservation started at sequence 1",
    );

    // --------------------------------------------------------
    // SAME SCOPE: SEQUENCE 2
    // --------------------------------------------------------

    const reservation2 =
      await reserveFinoraRecipientTrustTransitionIssuance({
        issuerId:
          issuerId,

        installationId:
          installationA,
      });

    assert(
      reservation2.sequence ===
        2,
      "Second reservation did not advance to sequence 2.",
    );

    assert(
      reservation2.packageId !==
        reservation1.packageId &&
      isCanonicalIsoTimestamp(
        reservation2.issuedAt,
      ),
      "Second reservation package identity/timestamp is invalid.",
    );

    console.log(
      "PASS: same installation scope advanced monotonically to sequence 2",
    );

    // --------------------------------------------------------
    // CONCURRENT SAME-SCOPE RESERVATIONS
    //
    // Four concurrent callers must serialize to unique
    // sequences 3, 4, 5, 6.
    // --------------------------------------------------------

    const concurrent =
      await Promise.all([
        reserveFinoraRecipientTrustTransitionIssuance({
          issuerId:
            issuerId,

          installationId:
            installationA,
        }),
        reserveFinoraRecipientTrustTransitionIssuance({
          issuerId:
            issuerId,

          installationId:
            installationA,
        }),
        reserveFinoraRecipientTrustTransitionIssuance({
          issuerId:
            issuerId,

          installationId:
            installationA,
        }),
        reserveFinoraRecipientTrustTransitionIssuance({
          issuerId:
            issuerId,

          installationId:
            installationA,
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
          3,
          4,
          5,
          6,
        ]),
      `Concurrent reservation sequences were invalid: ${JSON.stringify(concurrentSequences)}`,
    );

    const concurrentPackageIds =
      new Set(
        concurrent.map(
          (reservation) =>
            reservation.packageId,
        ),
      );

    assert(
      concurrentPackageIds.size ===
        4,
      "Concurrent trust-transition reservations produced duplicate package IDs.",
    );

    assert(
      concurrent.every(
        (reservation) =>
          isCanonicalIsoTimestamp(
            reservation.issuedAt,
          ),
      ),
      "Concurrent reservation issuedAt timestamps are not canonical ISO timestamps.",
    );

    console.log(
      "PASS: concurrent same-scope reservations serialized uniquely through sequences 3-6",
    );

    // --------------------------------------------------------
    // DIFFERENT INSTALLATION = INDEPENDENT SEQUENCE
    // --------------------------------------------------------

    const installationBReservation =
      await reserveFinoraRecipientTrustTransitionIssuance({
        issuerId:
          issuerId,

        installationId:
          installationB,
      });

    assert(
      installationBReservation.sequence ===
        1,
      "Different installation did not start an independent sequence at 1.",
    );

    console.log(
      "PASS: different installation scope independently started at sequence 1",
    );

    // Foreign issuer rejection is verified below after the
    // persisted transition-ledger path is available.

    // --------------------------------------------------------
    // GLOBAL PACKAGE-ID UNIQUENESS ACROSS THIS TEST
    // --------------------------------------------------------

    const allPackageIds =
      [
        reservation1.packageId,
        reservation2.packageId,
        ...concurrent.map(
          (reservation) =>
            reservation.packageId,
        ),
        installationBReservation.packageId,
      ];

    assert(
      new Set(
        allPackageIds,
      ).size ===
        allPackageIds.length,
      "Trust-transition issuance produced duplicate package IDs.",
    );

    console.log(
      "PASS: all runtime reservation package IDs are unique",
    );

    // --------------------------------------------------------
    // ENCRYPTED LEDGER FILE
    // --------------------------------------------------------

    const ledgerDirectory =
      join(
        temporaryUserData,
        "FINORA",
        "control-center",
      );

    const ledgerPath =
      join(
        ledgerDirectory,
        "finora-recipient-trust-transition-issuance.bin",
      );

    const beforeForeignIssuer =
      await readFile(
        ledgerPath,
      );

    let foreignIssuerError:
      unknown;

    try {
      await reserveFinoraRecipientTrustTransitionIssuance({
        issuerId:
          foreignIssuer,

        installationId:
          installationA,
      });
    } catch (
      error
    ) {
      foreignIssuerError =
        error;
    }

    assert(
      foreignIssuerError instanceof
        Error &&
      /authoritative Control Center issuer/i.test(
        foreignIssuerError.message,
      ),
      "Foreign issuer trust-transition reservation was not rejected.",
    );

    const afterForeignIssuer =
      await readFile(
        ledgerPath,
      );

    assert(
      afterForeignIssuer.equals(
        beforeForeignIssuer,
      ),
      "Foreign issuer rejection mutated persisted transition issuance ledger bytes.",
    );

    console.log(
      "PASS: foreign issuer reservation rejected with zero transition-ledger mutation",
    );

    const encryptedLedger =
      afterForeignIssuer;

    const rawText =
      encryptedLedger.toString(
        "utf8",
      );

    assert(
      !rawText.includes(
        issuerId,
      ) &&
      !rawText.includes(
        installationA,
      ) &&
      !rawText.includes(
        '"sequences"',
      ),
      "Recipient trust-transition issuance ledger appears to contain plaintext authority data.",
    );

    const plaintext =
      safeStorage.decryptString(
        encryptedLedger,
      );

    const parsed =
      JSON.parse(
        plaintext,
      ) as {
        sequences:
          Array<{
            issuerId:
              string;

            purpose:
              string;

            installationId:
              string;

            lastReservedSequence:
              number;

            updatedAt:
              string;
          }>;

        createdAt:
          string;

        updatedAt:
          string;

        schemaVersion:
          number;
      };

    assert(
      parsed.schemaVersion ===
        1 &&
      Array.isArray(
        parsed.sequences,
      ) &&
      parsed.sequences.length ===
        2 &&
      isCanonicalIsoTimestamp(
        parsed.createdAt,
      ) &&
      isCanonicalIsoTimestamp(
        parsed.updatedAt,
      ),
      "Persisted trust-transition issuance ledger root is invalid.",
    );

    const authoritativeInstallationA =
      parsed.sequences.find(
        (record) =>
          record.issuerId ===
            issuerId &&
          record.purpose ===
            "RECIPIENT_TRUST_TRANSITION" &&
          record.installationId ===
            installationA,
      );

    const authoritativeInstallationB =
      parsed.sequences.find(
        (record) =>
          record.issuerId ===
            issuerId &&
          record.purpose ===
            "RECIPIENT_TRUST_TRANSITION" &&
          record.installationId ===
            installationB,
      );

    const foreignIssuerPersisted =
      parsed.sequences.some(
        (record) =>
          record.issuerId ===
            foreignIssuer,
      );

    assert(
      authoritativeInstallationA?.lastReservedSequence ===
        6 &&
      authoritativeInstallationB?.lastReservedSequence ===
        1 &&
      foreignIssuerPersisted ===
        false,
      "Persisted installation-level sequence scopes do not match authoritative runtime reservations.",
    );

    assert(
      parsed.sequences.every(
        (record) =>
          isCanonicalIsoTimestamp(
            record.updatedAt,
          ),
      ),
      "Persisted sequence updatedAt timestamps are invalid.",
    );

    console.log(
      "PASS: encrypted persisted ledger contains exact issuer+installation monotonic sequence scopes",
    );

    // --------------------------------------------------------
    // FUTURE CLOCK HIGH-WATER -> FAIL CLOSED
    // --------------------------------------------------------

    const highWaterBeforeFuture =
      await loadFinoraControlCenterClockHighWaterState();

    assert(
      highWaterBeforeFuture !==
        undefined &&
      highWaterBeforeFuture.issuerId ===
        issuerId &&
      isCanonicalIsoTimestamp(
        highWaterBeforeFuture.highWaterAt,
      ),
      "Authoritative issuer clock high-water was unavailable before rollback fixture.",
    );

    const futureHighWaterAt =
      new Date(
        Date.parse(
          highWaterBeforeFuture.highWaterAt,
        ) +
        60 *
        60 *
        1000,
      ).toISOString();

    await persistFinoraControlCenterClockHighWaterState({
      schemaVersion:
        1,

      issuerId,

      highWaterAt:
        futureHighWaterAt,
    });

    const seededHighWater =
      await loadFinoraControlCenterClockHighWaterState();

    assert(
      seededHighWater !==
        undefined &&
      seededHighWater.issuerId ===
        issuerId &&
      seededHighWater.highWaterAt ===
        futureHighWaterAt,
      "Future issuer high-water fixture was not persisted.",
    );

    const seededHighWaterSerialized =
      JSON.stringify(
        seededHighWater,
      );

    const ledgerBeforeRollback =
      await readFile(
        ledgerPath,
      );

    let rollbackError:
      unknown;

    try {
      await reserveFinoraRecipientTrustTransitionIssuance({
        issuerId,

        installationId:
          installationA,
      });
    } catch (
      error
    ) {
      rollbackError =
        error;
    }

    assert(
      rollbackError instanceof
        Error &&
      /rollback/i.test(
        rollbackError.message,
      ),
      "Future issuer high-water did not reject trust-transition reservation.",
    );

    const ledgerAfterRollback =
      await readFile(
        ledgerPath,
      );

    assert(
      ledgerAfterRollback.equals(
        ledgerBeforeRollback,
      ),
      "Rejected clock rollback mutated persisted transition issuance ledger bytes.",
    );

    const highWaterAfterRollback =
      await loadFinoraControlCenterClockHighWaterState();

    assert(
      highWaterAfterRollback !==
        undefined &&
      JSON.stringify(
        highWaterAfterRollback,
      ) ===
        seededHighWaterSerialized,
      "Rejected clock rollback mutated seeded issuer high-water.",
    );

    const rollbackLedgerPlaintext =
      safeStorage.decryptString(
        ledgerAfterRollback,
      );

    const rollbackLedger =
      JSON.parse(
        rollbackLedgerPlaintext,
      ) as {
        sequences:
          Array<{
            issuerId:
              string;

            purpose:
              string;

            installationId:
              string;

            lastReservedSequence:
              number;
          }>;
      };

    const installationAAfterRollback =
      rollbackLedger.sequences.find(
        (record) =>
          record.issuerId ===
            issuerId &&
          record.purpose ===
            "RECIPIENT_TRUST_TRANSITION" &&
          record.installationId ===
            installationA,
      );

    assert(
      installationAAfterRollback?.lastReservedSequence ===
        6,
      "Rejected clock rollback consumed another transition issuance sequence.",
    );

    console.log(
      "PASS: future issuer high-water rejected reservation with zero ledger/high-water mutation",
    );

    // --------------------------------------------------------
    // TEMP FILE CLEANUP
    // --------------------------------------------------------

    const directoryEntries =
      await readdir(
        ledgerDirectory,
      );

    const temporaryEntries =
      directoryEntries.filter(
        (entry) =>
          entry.endsWith(
            ".tmp",
          ),
      );

    assert(
      temporaryEntries.length ===
        0,
      `Issuance ledger left temporary files behind: ${temporaryEntries.join(", ")}`,
    );

    console.log(
      "PASS: successful issuance ledger writes left no temporary files",
    );

    // --------------------------------------------------------
    // FINAL
    // --------------------------------------------------------

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA RECIPIENT TRUST TRANSITION ISSUANCE LEDGER SELFTEST",
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
      },
    );

    console.log(
      "PASS: isolated temporary trust-transition issuance userData deleted",
    );
  }
}

// ============================================================
// ENTRY
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
        "FAIL: FINORA RECIPIENT TRUST TRANSITION ISSUANCE LEDGER SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );