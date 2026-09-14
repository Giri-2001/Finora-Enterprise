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
  reserveFinoraBranchPortabilityAuthorityIssuance,
} from "./finoraBranchPortabilityAuthorityIssuanceLedger.js";

import type {
  FinoraBranchPortabilityAuthorityIssuanceScope,
} from "./finoraBranchPortabilityAuthorityIssuanceLedger.js";

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
        "finora-portability-ledger-",
      ),
    );

  try {
    app.setPath(
      "userData",
      isolatedUserData,
    );

    await app.whenReady();

    const branchA:
      FinoraBranchPortabilityAuthorityIssuanceScope = {
        ownerId:
          "OWNER-PORTABILITY-LEDGER",

        businessId:
          "BUSINESS-PORTABILITY-LEDGER",

        branchId:
          "BRANCH-A",
      };

    const branchB:
      FinoraBranchPortabilityAuthorityIssuanceScope = {
        ...branchA,

        branchId:
          "BRANCH-B",
      };

    let extraFieldRejected =
      false;

    try {
      await reserveFinoraBranchPortabilityAuthorityIssuance(
        {
          ...branchA,

          installationId:
            "MUST-NOT-BE-ACCEPTED",
        } as
          FinoraBranchPortabilityAuthorityIssuanceScope,
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
      await reserveFinoraBranchPortabilityAuthorityIssuance(
        branchA,
      );

    assertTrue(
      first.sequence ===
        1,
      "First branch sequence must be 1.",
    );

    const consumedWithoutSigning =
      await reserveFinoraBranchPortabilityAuthorityIssuance(
        branchA,
      );

    assertTrue(
      consumedWithoutSigning.sequence ===
        2,
      "Second reservation must consume sequence 2.",
    );

    const afterConsumedGap =
      await reserveFinoraBranchPortabilityAuthorityIssuance(
        branchA,
      );

    assertTrue(
      afterConsumedGap.sequence ===
        3,
      "Consumed reservation was incorrectly reused.",
    );

    console.log(
      "PASS: persisted reservation gaps are never reused",
    );

    const otherBranch =
      await reserveFinoraBranchPortabilityAuthorityIssuance(
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
        reserveFinoraBranchPortabilityAuthorityIssuance(
          branchA,
        ),
        reserveFinoraBranchPortabilityAuthorityIssuance(
          branchA,
        ),
      ]);

    assertTrue(
      concurrent[0].sequence ===
        4 &&
      concurrent[1].sequence ===
        5,
      "Same-process concurrent reservations were not serialized monotonically.",
    );

    console.log(
      "PASS: concurrent same-branch reservations serialized to 4 then 5",
    );

    const packageIds = [
      first.packageId,
      consumedWithoutSigning.packageId,
      afterConsumedGap.packageId,
      otherBranch.packageId,
      concurrent[0].packageId,
      concurrent[1].packageId,
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
            "FINORA-BRANCH-PORTABILITY-",
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
        "finora-branch-portability-authority-issuance-ledger.bin",
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
        5,
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
            "BRANCH_PORTABILITY_AUTHORITY",
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
      "PASS: D4E4I3D DEDICATED BRANCH PORTABILITY ISSUANCE LEDGER EXECUTABLE PROOF",
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