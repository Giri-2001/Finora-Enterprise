/*
 * FINORA ENTERPRISE OS
 * PORTABLE STORAGE_ENTITLEMENT RECIPIENT SEQUENCE AUTHORITY SELF TEST
 *
 * PROVES:
 * - global packageId replay remains global
 * - historical STORAGE_ENTITLEMENT rows fold across installationIds
 * - portable and historical high-water join correctly
 * - later native history is re-read
 * - unrelated purpose is ignored
 * - unrelated branch is ignored
 * - equal/stale portable sequences fail closed
 * - fresh branch starts at sequence 1
 * - malformed authority input fails closed
 */

import {
  evaluateFinoraPortableStorageEntitlementSequence,
  type FinoraPortableStorageEntitlementAppliedPackageRecord,
  type FinoraPortableStorageEntitlementLegacySequenceRecord,
  type FinoraPortableStorageEntitlementSequenceStateRecord,
} from "./finoraPortableStorageEntitlementSequenceAuthority.js";

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

const issuerId =
  "ISSUER-BUSINESS-PROFILE";

const ownerId =
  "OWNER-BUSINESS-PROFILE";

const businessId =
  "BUSINESS-BUSINESS-PROFILE";

const branchId =
  "BRANCH-BUSINESS-PROFILE";

function makeNativeSequence(
  input:
    {
      purpose?:
        string;

      ownerId?:
        string;

      businessId?:
        string;

      branchId?:
        string;

      installationId:
        string;

      lastSequence:
        number;
    },
): FinoraPortableStorageEntitlementLegacySequenceRecord {

  return {
    issuerId,

    purpose:
      input.purpose ??
      "STORAGE_ENTITLEMENT",

    ownerId:
      input.ownerId ??
      ownerId,

    businessId:
      input.businessId ??
      businessId,

    branchId:
      input.branchId ??
      branchId,

    installationId:
      input.installationId,

    lastSequence:
      input.lastSequence,
  };
}

function makePortableSequence(
  lastSequence:
    number,
): FinoraPortableStorageEntitlementSequenceStateRecord {

  return {
    issuerId,

    ownerId,

    businessId,

    branchId,

    lastSequence,

    updatedAt:
      "2026-09-14T12:00:00.000Z",
  };
}

function evaluate(
  packageId:
    string,

  sequence:
    number,

  controlSequences:
    readonly FinoraPortableStorageEntitlementLegacySequenceRecord[],

  portableSequences:
    readonly FinoraPortableStorageEntitlementSequenceStateRecord[],

  applied:
    readonly FinoraPortableStorageEntitlementAppliedPackageRecord[] =
      [],
) {

  return evaluateFinoraPortableStorageEntitlementSequence({
    packageId,

    issuerId,

    ownerId,

    businessId,

    branchId,

    sequence,

    appliedControlPackages:
      applied,

    controlSequences,

    portableStorageEntitlementSequences:
      portableSequences,
  });
}

export function runFinoraPortableStorageEntitlementSequenceAuthoritySelfTest():
  void {

  const historical:
    FinoraPortableStorageEntitlementLegacySequenceRecord[] = [
      makeNativeSequence({
        installationId:
          "INSTALLATION-A",

        lastSequence:
          7,
      }),

      makeNativeSequence({
        installationId:
          "INSTALLATION-B",

        lastSequence:
          4,
      }),
    ];

  const portable:
    FinoraPortableStorageEntitlementSequenceStateRecord[] = [
      makePortableSequence(
        9,
      ),
    ];

  const next =
    evaluate(
      "PKG-NEXT",
      10,
      historical,
      portable,
    );

  assert(
    next.success &&
      next.previousSequence ===
        9,
    "Portable STORAGE_ENTITLEMENT did not continue above max(native=7, portable=9).",
  );

  console.log(
    "PASS: portable STORAGE_ENTITLEMENT joins historical native + portable high-water",
  );

  const equal =
    evaluate(
      "PKG-EQUAL",
      9,
      historical,
      portable,
    );

  if (!("reason" in equal)) {
    throw new Error(
      "Equal portable STORAGE_ENTITLEMENT sequence unexpectedly succeeded.",
    );
  }

  assert(
    equal.reason ===
      "STALE_SEQUENCE" &&
      equal.previousSequence ===
        9,
    "Equal portable STORAGE_ENTITLEMENT sequence was accepted.",
  );

  console.log(
    "PASS: equal STORAGE_ENTITLEMENT sequence fails closed",
  );

  const stale =
    evaluate(
      "PKG-STALE",
      8,
      historical,
      portable,
    );

  if (!("reason" in stale)) {
    throw new Error(
      "Stale portable STORAGE_ENTITLEMENT sequence unexpectedly succeeded.",
    );
  }

  assert(
    stale.reason ===
      "STALE_SEQUENCE" &&
      stale.previousSequence ===
        9,
    "Stale portable STORAGE_ENTITLEMENT sequence was accepted.",
  );

  console.log(
    "PASS: stale STORAGE_ENTITLEMENT sequence fails closed",
  );

  const laterNative = [
    ...historical,

    makeNativeSequence({
      installationId:
        "INSTALLATION-C",

      lastSequence:
        12,
    }),
  ];

  const afterLaterNative =
    evaluate(
      "PKG-LATER-NATIVE",
      13,
      laterNative,
      portable,
    );

  assert(
    afterLaterNative.success &&
      afterLaterNative.previousSequence ===
        12,
    "Later native STORAGE_ENTITLEMENT history was not re-read.",
  );

  console.log(
    "PASS: historical native STORAGE_ENTITLEMENT rows fold across installationIds",
  );

  const unrelatedPurposeHistory = [
    ...historical,

    makeNativeSequence({
      purpose:
        "BUSINESS_PROFILE",

      installationId:
        "INSTALLATION-OTHER-PURPOSE",

      lastSequence:
        99,
    }),
  ];

  const unrelatedPurpose =
    evaluate(
      "PKG-OTHER-PURPOSE",
      10,
      unrelatedPurposeHistory,
      portable,
    );

  assert(
    unrelatedPurpose.success &&
      unrelatedPurpose.previousSequence ===
        9,
    "Unrelated purpose polluted STORAGE_ENTITLEMENT high-water.",
  );

  console.log(
    "PASS: unrelated purpose excluded from STORAGE_ENTITLEMENT high-water",
  );

  const unrelatedBranchHistory = [
    ...historical,

    makeNativeSequence({
      branchId:
        "BRANCH-OTHER",

      installationId:
        "INSTALLATION-OTHER-BRANCH",

      lastSequence:
        88,
    }),
  ];

  const unrelatedBranch =
    evaluate(
      "PKG-OTHER-BRANCH",
      10,
      unrelatedBranchHistory,
      portable,
    );

  assert(
    unrelatedBranch.success &&
      unrelatedBranch.previousSequence ===
        9,
    "Unrelated branch polluted STORAGE_ENTITLEMENT high-water.",
  );

  console.log(
    "PASS: unrelated branch excluded from STORAGE_ENTITLEMENT high-water",
  );

  const replay =
    evaluate(
      "PKG-GLOBAL-REPLAY",
      100,
      [],
      [],
      [
        {
          packageId:
            "PKG-GLOBAL-REPLAY",
        },
      ],
    );

  if (!("reason" in replay)) {
    throw new Error(
      "Global packageId replay unexpectedly succeeded.",
    );
  }

  assert(
    replay.reason ===
      "PACKAGE_REPLAY",
    "Global packageId replay authority was weakened.",
  );

  console.log(
    "PASS: packageId replay remains global",
  );

  const fresh =
    evaluate(
      "PKG-FRESH",
      1,
      [],
      [],
    );

  assert(
    fresh.success &&
      fresh.previousSequence ===
        0,
    "Fresh portable STORAGE_ENTITLEMENT branch rejected sequence 1.",
  );

  console.log(
    "PASS: fresh STORAGE_ENTITLEMENT branch accepts sequence 1",
  );

  const malformed =
    evaluateFinoraPortableStorageEntitlementSequence({
      packageId:
        "",

      issuerId,

      ownerId,

      businessId,

      branchId,

      sequence:
        1,

      appliedControlPackages:
        [],

      controlSequences:
        [],

      portableStorageEntitlementSequences:
        [],
    });

  if (!("reason" in malformed)) {
    throw new Error(
      "Malformed portable STORAGE_ENTITLEMENT sequence input unexpectedly succeeded.",
    );
  }

  assert(
    malformed.reason ===
      "INVALID_INPUT",
    "Malformed portable STORAGE_ENTITLEMENT sequence input was accepted.",
  );

  console.log(
    "PASS: malformed STORAGE_ENTITLEMENT sequence input fails closed",
  );

  console.log(
    "PASS: PHASE 5.6J-G5D-1H1C PORTABLE STORAGE_ENTITLEMENT RECIPIENT SEQUENCE AUTHORITY EXECUTABLE PROOF",
  );
}

runFinoraPortableStorageEntitlementSequenceAuthoritySelfTest();