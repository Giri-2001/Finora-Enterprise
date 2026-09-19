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
  reserveFinoraPortableBranchAccessIssuance,
} from "./finoraPortableBranchAccessIssuanceLedger.js";

import type {
  FinoraPortableBranchAccessIssuanceScope,
} from "./finoraPortableBranchAccessIssuanceLedger.js";
import {
  resolveFinoraBranchAccessIssuanceSequenceLane,
} from "./finoraControlCenterIssuanceCoordinator.js";

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
        "finora-portable-branch-access-ledger-",
      ),
    );

  try {
    app.setPath(
      "userData",
      isolatedUserData,
    );

    await app.whenReady();

    const branchA:
      FinoraPortableBranchAccessIssuanceScope = {
        ownerId:
          "OWNER-PORTABILITY-LEDGER",

        businessId:
          "BUSINESS-PORTABILITY-LEDGER",

        branchId:
          "BRANCH-A",
      };

    const branchB:
      FinoraPortableBranchAccessIssuanceScope = {
        ...branchA,

        branchId:
          "BRANCH-B",
      };

    const portableLifecycleActions =
      [
        "ISSUE",
        "RENEW",
        "REPLACE",
        "SUSPEND",
        "RESUME",
        "REVOKE",
      ] as const;

    for (
      const action
      of portableLifecycleActions
    ) {
      assertTrue(
        resolveFinoraBranchAccessIssuanceSequenceLane({
          action,

          schemaVersion:
            1,
        }) ===
          "PORTABLE_BRANCH",
        `${action} without credentialEnrollment did not select portable branch sequence authority.`,
      );
    }

    assertTrue(
      resolveFinoraBranchAccessIssuanceSequenceLane({
        action:
          "ISSUE",

        credentialEnrollment: {
          authorizationId:
            "TEST-CREDENTIAL-AUTHORITY",
        },

        schemaVersion:
          1,
      }) ===
        "NATIVE_INSTALLATION",
      "ISSUE carrying credentialEnrollment escaped the native installation sequence lane.",
    );

    assertTrue(
      resolveFinoraBranchAccessIssuanceSequenceLane({
        action:
          "AUTHORIZE_CREDENTIAL",

        credentialEnrollment: {
          authorizationId:
            "TEST-RECOVERY-AUTHORITY",
        },

        schemaVersion:
          1,
      }) ===
        "NATIVE_INSTALLATION",
      "AUTHORIZE_CREDENTIAL escaped the native installation sequence lane.",
    );

    assertTrue(
      resolveFinoraBranchAccessIssuanceSequenceLane({
        action:
          "RENEW",

        credentialEnrollment: {
          malformed:
            true,
        },

        schemaVersion:
          1,
      }) ===
        "NATIVE_INSTALLATION",
      "Credential-bearing malformed lifecycle input acquired portable sequence authority.",
    );

    assertTrue(
      resolveFinoraBranchAccessIssuanceSequenceLane({
        action:
          "ISSUE",

        credentialEnrollment:
          undefined,

        schemaVersion:
          1,
      }) ===
        "NATIVE_INSTALLATION",
      "Explicit credentialEnrollment property acquired portable sequence authority.",
    );

    assertTrue(
      resolveFinoraBranchAccessIssuanceSequenceLane({
        action:
          "NOT_A_BRANCH_ACCESS_ACTION",

        schemaVersion:
          1,
      }) ===
        "NATIVE_INSTALLATION",
      "Unknown Branch Access action acquired portable sequence authority.",
    );

    assertTrue(
      resolveFinoraBranchAccessIssuanceSequenceLane(
        null,
      ) ===
        "NATIVE_INSTALLATION",
      "Malformed Branch Access payload acquired portable sequence authority.",
    );

    console.log(
      "PASS: BRANCH_ACCESS issuance lane matrix is fail-closed toward native credential authority",
    );
    /*
     * Legacy BRANCH_ACCESS sequence history is installation
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
          "BRANCH_ACCESS",

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
          "BRANCH_ACCESS",

        scope:
          historicalInstallationB,
      });
    }

    console.log(
      "PASS: historical BRANCH_ACCESS sequences seeded across two installations",
    );
    let extraFieldRejected =
      false;

    try {
      await reserveFinoraPortableBranchAccessIssuance(
        {
          ...branchA,

          installationId:
            "MUST-NOT-BE-ACCEPTED",
        } as
          FinoraPortableBranchAccessIssuanceScope,
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
      await reserveFinoraPortableBranchAccessIssuance(
        branchA,
      );

    assertTrue(
      first.sequence ===
        4,
      "First portable BRANCH_ACCESS sequence must continue after historical high-water at 4.",
    );

    const consumedWithoutSigning =
      await reserveFinoraPortableBranchAccessIssuance(
        branchA,
      );

    assertTrue(
      consumedWithoutSigning.sequence ===
        5,
      "Second portable reservation must consume sequence 5.",
    );

    const afterConsumedGap =
      await reserveFinoraPortableBranchAccessIssuance(
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
      await reserveFinoraPortableBranchAccessIssuance(
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
        reserveFinoraPortableBranchAccessIssuance(
          branchA,
        ),
        reserveFinoraPortableBranchAccessIssuance(
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
          "BRANCH_ACCESS",

        scope:
          historicalInstallationA,
      });
    }

    const afterLaterNativeAdvance =
      await reserveFinoraPortableBranchAccessIssuance(
        branchA,
      );

    assertTrue(
      afterLaterNativeAdvance.sequence ===
        10,
      "Portable BRANCH_ACCESS reservation did not observe the later native sequence advance.",
    );

    console.log(
      "PASS: later native BRANCH_ACCESS advance forced portable continuation to sequence 10",
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
            "FINORA-PORTABLE-BRANCH-ACCESS-",
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
        "finora-portable-branch-access-issuance-ledger.bin",
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
            "BRANCH_ACCESS",
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
      "PASS: PHASE 5.6J-G5A-7A PORTABLE BRANCH_ACCESS ISSUANCE LEDGER EXECUTABLE PROOF",
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
