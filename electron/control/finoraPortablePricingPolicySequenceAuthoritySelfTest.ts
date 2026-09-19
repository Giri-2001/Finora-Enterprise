/*
 * FINORA ENTERPRISE OS
 * PORTABLE PRICING_POLICY RECIPIENT SEQUENCE AUTHORITY SELF TEST
 *
 * PROVES:
 * - global packageId replay remains global
 * - historical PRICING_POLICY rows fold across installationIds
 * - portable and historical high-water join correctly
 * - later native history is re-read
 * - unrelated purpose is ignored
 * - unrelated branch is ignored
 * - equal/stale portable sequences fail closed
 * - fresh branch starts at sequence 1
 * - malformed authority input fails closed
 */

import {
  evaluateFinoraPortablePricingPolicySequence,
  type FinoraPortablePricingPolicyAppliedPackageRecord,
  type FinoraPortablePricingPolicyLegacySequenceRecord,
  type FinoraPortablePricingPolicySequenceStateRecord,
} from "./finoraPortablePricingPolicySequenceAuthority.js";

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
): FinoraPortablePricingPolicyLegacySequenceRecord {

  return {
    issuerId,

    purpose:
      input.purpose ??
      "PRICING_POLICY",

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
): FinoraPortablePricingPolicySequenceStateRecord {

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
    readonly FinoraPortablePricingPolicyLegacySequenceRecord[],

  portableSequences:
    readonly FinoraPortablePricingPolicySequenceStateRecord[],

  applied:
    readonly FinoraPortablePricingPolicyAppliedPackageRecord[] =
      [],
) {

  return evaluateFinoraPortablePricingPolicySequence({
    packageId,

    issuerId,

    ownerId,

    businessId,

    branchId,

    sequence,

    appliedControlPackages:
      applied,

    controlSequences,

    portablePricingPolicySequences:
      portableSequences,
  });
}

export function runFinoraPortablePricingPolicySequenceAuthoritySelfTest():
  void {

  const historical:
    FinoraPortablePricingPolicyLegacySequenceRecord[] = [
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
    FinoraPortablePricingPolicySequenceStateRecord[] = [
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
    "Portable PRICING_POLICY did not continue above max(native=7, portable=9).",
  );

  console.log(
    "PASS: portable PRICING_POLICY joins historical native + portable high-water",
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
      "Equal portable PRICING_POLICY sequence unexpectedly succeeded.",
    );
  }

  assert(
    equal.reason ===
      "STALE_SEQUENCE" &&
      equal.previousSequence ===
        9,
    "Equal portable PRICING_POLICY sequence was accepted.",
  );

  console.log(
    "PASS: equal PRICING_POLICY sequence fails closed",
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
      "Stale portable PRICING_POLICY sequence unexpectedly succeeded.",
    );
  }

  assert(
    stale.reason ===
      "STALE_SEQUENCE" &&
      stale.previousSequence ===
        9,
    "Stale portable PRICING_POLICY sequence was accepted.",
  );

  console.log(
    "PASS: stale PRICING_POLICY sequence fails closed",
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
    "Later native PRICING_POLICY history was not re-read.",
  );

  console.log(
    "PASS: historical native PRICING_POLICY rows fold across installationIds",
  );

  const unrelatedPurposeHistory = [
    ...historical,

    makeNativeSequence({
      purpose:
        "STORAGE_ENTITLEMENT",

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
    "Unrelated purpose polluted PRICING_POLICY high-water.",
  );

  console.log(
    "PASS: unrelated purpose excluded from PRICING_POLICY high-water",
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
    "Unrelated branch polluted PRICING_POLICY high-water.",
  );

  console.log(
    "PASS: unrelated branch excluded from PRICING_POLICY high-water",
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
    "Fresh portable PRICING_POLICY branch rejected sequence 1.",
  );

  console.log(
    "PASS: fresh PRICING_POLICY branch accepts sequence 1",
  );

  const malformed =
    evaluateFinoraPortablePricingPolicySequence({
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

      portablePricingPolicySequences:
        [],
    });

  if (!("reason" in malformed)) {
    throw new Error(
      "Malformed portable PRICING_POLICY sequence input unexpectedly succeeded.",
    );
  }

  assert(
    malformed.reason ===
      "INVALID_INPUT",
    "Malformed portable PRICING_POLICY sequence input was accepted.",
  );

  console.log(
    "PASS: malformed PRICING_POLICY sequence input fails closed",
  );

  console.log(
    "PASS: PHASE 5.6J-G5C-1D PORTABLE PRICING_POLICY RECIPIENT SEQUENCE AUTHORITY EXECUTABLE PROOF",
  );
}

runFinoraPortablePricingPolicySequenceAuthoritySelfTest();