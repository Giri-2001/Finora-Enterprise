/* ============================================================
   FINORA ENTERPRISE OS

   PORTABLE BRANCH_ACCESS RECIPIENT SEQUENCE AUTHORITY SELF TEST

   PROVES:
   - packageId replay remains global
   - historical native rows fold across installationIds
   - unrelated issuer / branch rows are ignored
   - portable high-water joins historical native high-water
   - later native history is re-read on every evaluation
   - equal / stale portable sequences fail closed
   ============================================================ */

import {
  app,
} from "electron";

import {
  evaluateFinoraPortableBranchAccessSequence,
} from "./finoraControlStore.js";

import type {
  FinoraPortableBranchAccessSequenceStateRecord,
} from "./finoraControlStore.js";

import type {
  FinoraControlAppliedPackageRecord,
  FinoraControlSequenceStateRecord,
} from "./finoraControlReplayPolicy.js";

function assertTrue(
  condition:
    boolean,

  message:
    string,
): void {

  if (!condition) {
    throw new Error(
      message,
    );
  }
}

const ISSUER =
  "FINORA-CONTROL-CENTER-ISSUER";

const OWNER =
  "OWNER-PORTABLE-SEQUENCE";

const BUSINESS =
  "BUSINESS-PORTABLE-SEQUENCE";

const BRANCH =
  "BRANCH-PORTABLE-SEQUENCE";

const NOW =
  "2026-09-14T06:00:00.000Z";

function legacyState(
  installationId:
    string,

  lastSequence:
    number,

  overrides?: {
    issuerId?:
      string;

    branchId?:
      string;

    purpose?:
      string;
  },
): FinoraControlSequenceStateRecord {

  return {
    issuerId:
      overrides?.issuerId ??
      ISSUER,

    purpose:
      overrides?.purpose ??
      "BRANCH_ACCESS",

    ownerId:
      OWNER,

    businessId:
      BUSINESS,

    branchId:
      overrides?.branchId ??
      BRANCH,

    installationId,

    lastSequence,

    updatedAt:
      NOW,
  };
}

function portableState(
  lastSequence:
    number,

  overrides?: {
    issuerId?:
      string;

    branchId?:
      string;
  },
): FinoraPortableBranchAccessSequenceStateRecord {

  return {
    issuerId:
      overrides?.issuerId ??
      ISSUER,

    ownerId:
      OWNER,

    businessId:
      BUSINESS,

    branchId:
      overrides?.branchId ??
      BRANCH,

    lastSequence,

    updatedAt:
      NOW,
  };
}

function evaluate(
  packageId:
    string,

  sequence:
    number,

  applied:
    readonly FinoraControlAppliedPackageRecord[],

  legacy:
    readonly FinoraControlSequenceStateRecord[],

  portable:
    readonly FinoraPortableBranchAccessSequenceStateRecord[],
) {

  return evaluateFinoraPortableBranchAccessSequence(
    {
      packageId,

      issuerId:
        ISSUER,

      sequence,

      ownerId:
        OWNER,

      businessId:
        BUSINESS,

      branchId:
        BRANCH,
    },
    applied,
    legacy,
    portable,
  );
}

async function runSelfTest():
  Promise<void> {

  const legacy:
    FinoraControlSequenceStateRecord[] = [
      legacyState(
        "INSTALLATION-A",
        3,
      ),

      legacyState(
        "INSTALLATION-B",
        7,
      ),

      legacyState(
        "INSTALLATION-OTHER-PURPOSE",
        500,
        {
          purpose:
            "BUSINESS_PROFILE",
        },
      ),

      legacyState(
        "INSTALLATION-OTHER-ISSUER",
        99,
        {
          issuerId:
            "OTHER-ISSUER",
        },
      ),

      legacyState(
        "INSTALLATION-OTHER-BRANCH",
        88,
        {
          branchId:
            "OTHER-BRANCH",
        },
      ),
    ];

  const portable:
    FinoraPortableBranchAccessSequenceStateRecord[] = [
      portableState(
        9,
      ),

      portableState(
        77,
        {
          branchId:
            "OTHER-BRANCH",
        },
      ),
    ];

  const equalPortable =
    evaluate(
      "PKG-EQUAL-PORTABLE",
      9,
      [],
      legacy,
      portable,
    );

  assertTrue(
    !equalPortable.accepted &&
      equalPortable.reason ===
        "STALE_SEQUENCE" &&
      equalPortable.previousSequence ===
        9,
    "Equal portable high-water was not rejected.",
  );

  const afterPortable =
    evaluate(
      "PKG-AFTER-PORTABLE",
      10,
      [],
      legacy,
      portable,
    );

  assertTrue(
    afterPortable.accepted &&
      afterPortable.previousSequence ===
        9,
    "Portable sequence did not continue above max(native=7, portable=9).",
  );

  console.log(
    "PASS: portable high-water dominates lower native history",
  );

  const laterNative = [
    ...legacy,

    legacyState(
      "INSTALLATION-C",
      12,
    ),
  ];

  const equalLaterNative =
    evaluate(
      "PKG-EQUAL-LATER-NATIVE",
      12,
      [],
      laterNative,
      portable,
    );

  assertTrue(
    !equalLaterNative.accepted &&
      equalLaterNative.reason ===
        "STALE_SEQUENCE" &&
      equalLaterNative.previousSequence ===
        12,
    "Later native history was not re-read.",
  );

  const afterLaterNative =
    evaluate(
      "PKG-AFTER-LATER-NATIVE",
      13,
      [],
      laterNative,
      portable,
    );

  assertTrue(
    afterLaterNative.accepted &&
      afterLaterNative.previousSequence ===
        12,
    "Portable sequence did not continue above later native high-water.",
  );

  console.log(
    "PASS: later native BRANCH_ACCESS history is re-read across installationIds",
  );

  const unrelatedPurposeOnly =
    evaluate(
      "PKG-IGNORE-OTHER-PURPOSE",
      1,
      [],
      [
        legacyState(
          "INSTALLATION-OTHER-PURPOSE-ONLY",
          900,
          {
            purpose:
              "PRICING_POLICY",
          },
        ),
      ],
      [],
    );

  assertTrue(
    unrelatedPurposeOnly.accepted &&
      unrelatedPurposeOnly.previousSequence ===
        undefined,
    "Non-BRANCH_ACCESS historical sequence polluted portable high-water.",
  );

  console.log(
    "PASS: unrelated control purpose does not influence portable BRANCH_ACCESS high-water",
  );

  const applied:
    FinoraControlAppliedPackageRecord[] = [
      {
        packageId:
          "PKG-GLOBAL-REPLAY",

        issuerId:
          "UNRELATED-ISSUER",

        purpose:
          "BUSINESS_PROFILE",

        sequence:
          500,

        ownerId:
          "OTHER-OWNER",

        businessId:
          "OTHER-BUSINESS",

        branchId:
          "OTHER-BRANCH",

        installationId:
          "OTHER-INSTALLATION",

        appliedAt:
          NOW,
      },
    ];

  const replay =
    evaluate(
      "PKG-GLOBAL-REPLAY",
      1000,
      applied,
      laterNative,
      portable,
    );

  assertTrue(
    !replay.accepted &&
      replay.reason ===
        "REPLAYED_PACKAGE",
    "Global packageId replay authority was weakened.",
  );

  console.log(
    "PASS: packageId replay remains global across purpose and scope",
  );

  const fresh =
    evaluate(
      "PKG-FIRST-PORTABLE",
      1,
      [],
      [],
      [],
    );

  assertTrue(
    fresh.accepted &&
      fresh.previousSequence ===
        undefined,
    "Fresh portable branch sequence 1 was rejected.",
  );

  console.log(
    "PASS: fresh portable branch accepts sequence 1",
  );

  console.log("");
  console.log(
    "PASS: PHASE 5.6J-G5A-7C2 PORTABLE BRANCH_ACCESS RECIPIENT SEQUENCE AUTHORITY EXECUTABLE PROOF",
  );
}

void app.whenReady()
  .then(
    async () => {
      await runSelfTest();

      app.quit();
    },
  )
  .catch(
    (error: unknown) => {
      console.error(
        error,
      );

      process.exitCode =
        1;

      app.quit();
    },
  );
