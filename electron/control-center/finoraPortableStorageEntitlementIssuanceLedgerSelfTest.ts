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
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  reserveFinoraControlCenterIssuance,
} from "./finoraControlCenterIssuanceLedger.js";
import {
  reserveFinoraPortableStorageEntitlementIssuance,
} from "./finoraPortableStorageEntitlementIssuanceLedger.js";

import type {
  FinoraPortableStorageEntitlementIssuanceScope,
} from "./finoraPortableStorageEntitlementIssuanceLedger.js";

function assertTrue(
  condition:
    unknown,

  message:
    string,
): asserts condition {

  if (!condition) {
    throw new Error(
      `FAIL: ${message}`,
    );
  }
}

async function runSelfTest():
  Promise<void> {

  const isolatedUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-portable-storage-entitlement-ledger-",
      ),
    );

  try {
    app.setPath(
      "userData",
      isolatedUserData,
    );

    await app.whenReady();

    const branchA:
      FinoraPortableStorageEntitlementIssuanceScope = {
        ownerId:
          "OWNER-PORTABILITY-LEDGER",

        businessId:
          "BUSINESS-PORTABILITY-LEDGER",

        branchId:
          "BRANCH-A",
      };

    const branchB:
      FinoraPortableStorageEntitlementIssuanceScope = {
        ...branchA,

        branchId:
          "BRANCH-B",
      };
    /*
     * Legacy STORAGE_ENTITLEMENT sequence history is installation
     * scoped in the generic Control Center issuance ledger.
     *
     * Seed two historical installations belonging to the same
     * permanent branch:
     *
     *   Installation A -> high-water 3
     *   Installation B -> high-water 2
     *
     * First portable reservation must continue at 4.
     */
    const historicalInstallationA = {
      ...branchA,

      installationId:
        "INSTALLATION-HISTORY-A",
    };

    const historicalInstallationB = {
      ...branchA,

      installationId:
        "INSTALLATION-HISTORY-B",
    };

    for (
      let index =
        0;
      index <
        3;
      index++
    ) {
      await reserveFinoraControlCenterIssuance({
        purpose:
          "STORAGE_ENTITLEMENT",

        scope:
          historicalInstallationA,
      });
    }

    for (
      let index =
        0;
      index <
        2;
      index++
    ) {
      await reserveFinoraControlCenterIssuance({
        purpose:
          "STORAGE_ENTITLEMENT",

        scope:
          historicalInstallationB,
      });
    }

    console.log(
      "PASS: historical STORAGE_ENTITLEMENT sequences seeded across two installations",
    );
    let extraFieldRejected =
      false;

    try {
      await reserveFinoraPortableStorageEntitlementIssuance(
        {
          ...branchA,

          installationId:
            "MUST-NOT-BE-ACCEPTED",
        } as
          FinoraPortableStorageEntitlementIssuanceScope,
      );
    } catch {
      extraFieldRejected =
        true;
    }

    assertTrue(
      extraFieldRejected,
      "Branch-only ledger accepted an installation-shaped scope.",
    );

    console.log(
      "PASS: installation-shaped scope rejected before reservation",
    );

    const first =
      await reserveFinoraPortableStorageEntitlementIssuance(
        branchA,
      );

    assertTrue(
      first.sequence ===
        4,
      "First portable STORAGE_ENTITLEMENT sequence must continue after historical high-water at 4.",
    );

    const consumedWithoutSigning =
      await reserveFinoraPortableStorageEntitlementIssuance(
        branchA,
      );

    assertTrue(
      consumedWithoutSigning.sequence ===
        5,
      "Second portable reservation must consume sequence 5.",
    );

    const afterConsumedGap =
      await reserveFinoraPortableStorageEntitlementIssuance(
        branchA,
      );

    assertTrue(
      afterConsumedGap.sequence ===
        6,
      "Consumed reservation was incorrectly reused.",
    );

    console.log(
      "PASS: persisted reservation gaps are never reused",
    );

    const otherBranch =
      await reserveFinoraPortableStorageEntitlementIssuance(
        branchB,
      );

    assertTrue(
      otherBranch.sequence ===
        1,
      "Different branch must own an independent sequence namespace.",
    );

    console.log(
      "PASS: branch sequence namespaces are isolated",
    );

    const concurrent =
      await Promise.all([
        reserveFinoraPortableStorageEntitlementIssuance(
          branchA,
        ),
        reserveFinoraPortableStorageEntitlementIssuance(
          branchA,
        ),
      ]);

    assertTrue(
      concurrent[0].sequence ===
        7 &&
      concurrent[1].sequence ===
        8,
      "Same-process concurrent reservations were not serialized monotonically.",
    );

    console.log(
      "PASS: concurrent same-branch reservations serialized to 7 then 8",
    );

    /*
     * Prove the legacy/native high-water is consulted on EVERY
     * portable reservation, not only when the portable ledger is
     * first created.
     *
     * Historical Installation A currently owns sequence 3.
     * Advance it to 9 after portable state already reached 8.
     */
    for (
      let index =
        0;
      index <
        6;
      index++
    ) {
      await reserveFinoraControlCenterIssuance({
        purpose:
          "STORAGE_ENTITLEMENT",

        scope:
          historicalInstallationA,
      });
    }

    const afterLaterNativeAdvance =
      await reserveFinoraPortableStorageEntitlementIssuance(
        branchA,
      );

    assertTrue(
      afterLaterNativeAdvance.sequence ===
        10,
      "Portable STORAGE_ENTITLEMENT reservation did not observe the later native sequence advance.",
    );

    console.log(
      "PASS: later native STORAGE_ENTITLEMENT advance forced portable continuation to sequence 10",
    );
    const packageIds = [
      first.packageId,
      consumedWithoutSigning.packageId,
      afterConsumedGap.packageId,
      otherBranch.packageId,
      concurrent[0].packageId,
      concurrent[1].packageId,
      afterLaterNativeAdvance.packageId,
    ];

    assertTrue(
      new Set(
        packageIds,
      ).size ===
        packageIds.length,
      "Package IDs are not unique.",
    );

    assertTrue(
      packageIds.every(
        (
          packageId,
        ) =>
          packageId.startsWith(
            "FINORA-PORTABLE-BUSINESS-PROFILE-",
          ),
      ),
      "Package ID namespace is invalid.",
    );

    console.log(
      "PASS: package identifiers are privileged and unique",
    );

    const persistedPath =
      join(
        isolatedUserData,
        "FINORA",
        "control-center",
        "finora-portable-storage-entitlement-issuance-ledger.bin",
      );

    const encrypted =
      await readFile(
        persistedPath,
      );

    assertTrue(
      encrypted.byteLength >
        0,
      "Encrypted ledger is empty.",
    );

    assertTrue(
      safeStorage.isEncryptionAvailable(),
      "safeStorage encryption unexpectedly unavailable.",
    );

    const plaintext =
      safeStorage.decryptString(
        encrypted,
      );

    const parsed =
      JSON.parse(
        plaintext,
      ) as {
        sequences:
          Array<
            Record<string, unknown>
          >;

        schemaVersion:
          number;
      };

    assertTrue(
      parsed.schemaVersion ===
        1,
      "Persisted ledger schemaVersion is invalid.",
    );

    assertTrue(
      parsed.sequences.length ===
        2,
      "Expected exactly two branch sequence records.",
    );

    const recordA =
      parsed.sequences.find(
        (
          record,
        ) =>
          record.branchId ===
            "BRANCH-A",
      );

    const recordB =
      parsed.sequences.find(
        (
          record,
        ) =>
          record.branchId ===
            "BRANCH-B",
      );

    assertTrue(
      recordA?.lastReservedSequence ===
        10,
      "Persisted Branch A high-water sequence is invalid.",
    );

    assertTrue(
      recordB?.lastReservedSequence ===
        1,
      "Persisted Branch B high-water sequence is invalid.",
    );

    assertTrue(
      parsed.sequences.every(
        (
          record,
        ) =>
          record.purpose ===
            "STORAGE_ENTITLEMENT",
      ),
      "Persisted purpose namespace is invalid.",
    );

    assertTrue(
      !plaintext.includes(
        "installationId",
      ),
      "Dedicated branch ledger persisted an installation identifier.",
    );

    assertTrue(
      !encrypted.toString(
        "utf8",
      ).includes(
        "OWNER-PORTABILITY-LEDGER",
      ),
      "Encrypted ledger exposed branch identity as plaintext.",
    );

    console.log(
      "PASS: encrypted ledger persists branch scope only",
    );

    console.log(
      "",
    );

    console.log(
      "PASS: PHASE 5.6J-G5D-1K1B PORTABLE STORAGE_ENTITLEMENT ISSUANCE LEDGER EXECUTABLE PROOF",
    );
  }
  finally {
    await rm(
      isolatedUserData,
      {
        recursive:
          true,

        force:
          true,
      },
    );
  }
}

void runSelfTest()
  .then(
    () => {
      app.quit();
    },
  )
  .catch(
    (
      error,
    ) => {
      console.error(
        "SELF-TEST FAILED",
      );

      console.error(
        error,
      );

      process.exitCode =
        1;

      app.quit();
    },
  );
