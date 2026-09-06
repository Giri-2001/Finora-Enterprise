/* ============================================================
   FINORA ENTERPRISE OS™

   PRICING OVERRIDE ENGINE™

   DOMAIN SELF-TEST

   RESPONSIBILITY:

   - Verify positive fixed-price override validation
   - Verify zero / negative pricing rejection
   - Verify base-disabled charge protection
   - Verify duplicate override identity rejection
   - Verify same-charge overlap rejection
   - Verify adjacent inclusive/exclusive windows are legal
   - Verify empty authoritative REPLACE schedule is legal

   IMPORTANT:

   This test intentionally exercises the pure override-set
   contract only. Native installation-binding verification is
   covered by the existing Control Plane binding tests and will
   be exercised again at signed package integration.

============================================================ */

import {
  validateFinoraPricingOverrideSet,
} from "./finoraPricingOverrideControlService";

import type {
  FinoraPricingOverrideRuleV1,
  FinoraPricingOverrideSetV1,
} from "../../types/pricing/finoraPricingOverride.types";

/* ============================================================
   ASSERT
============================================================ */

function assert(
  condition:
    unknown,

  message:
    string,
): asserts condition {

  if (!condition) {
    throw new Error(
      `ASSERTION FAILED: ${message}`,
    );
  }
}

function pass(
  message:
    string,
): void {

  console.log(
    `PASS: ${message}`,
  );
}

/* ============================================================
   FIXTURES
============================================================ */

const scope = {
  ownerId:
    "OWNER-1",

  businessId:
    "BUSINESS-1",

  branchId:
    "BRANCH-1",
} as const;

function createRule(
  input:
    Partial<
      FinoraPricingOverrideRuleV1
    > = {},
): FinoraPricingOverrideRuleV1 {

  return {
    overrideId:
      "OVERRIDE-1",

    chargeCode:
      "LOAN_DISBURSEMENT",

    model:
      "FIXED_PRICE_OVERRIDE",

    amount:
      7,

    currency:
      "INR",

    validity: {
      validFrom:
        "2026-09-05T10:00:00.000Z",

      validUntil:
        "2026-09-05T11:00:00.000Z",
    },

    schemaVersion:
      1,

    ...input,
  };
}

function createSet(
  overrides:
    readonly FinoraPricingOverrideRuleV1[],
): FinoraPricingOverrideSetV1 {

  return {
    overrideSetId:
      "PRICING-SET-1",

    scope,

    overrides,

    schemaVersion:
      1,
  };
}

/* ============================================================
   RUN
============================================================ */

function run(): void {

  // ----------------------------------------------------------
  // VALID LIVE OVERRIDE
  // ----------------------------------------------------------

  const valid =
    validateFinoraPricingOverrideSet(
      createSet([
        createRule(),
      ]),
    );

  assert(
    valid.valid,
    valid.error ??
    "Positive Loan override must be valid.",
  );

  pass(
    "positive FIXED_PRICE_OVERRIDE for enabled Loan charge is valid",
  );


  // ----------------------------------------------------------
  // EMPTY REPLACE SCHEDULE
  // ----------------------------------------------------------

  const empty =
    validateFinoraPricingOverrideSet(
      createSet([]),
    );

  assert(
    empty.valid,
    "Empty authoritative REPLACE schedule must be valid.",
  );

  pass(
    "empty override schedule is valid and can restore Base Pricing",
  );


  // ----------------------------------------------------------
  // ZERO PRICE
  // ----------------------------------------------------------

  const zero =
    validateFinoraPricingOverrideSet(
      createSet([
        createRule({
          amount:
            0,
        }),
      ]),
    );

  assert(
    !zero.valid,
    "Zero-fee Pricing Override must be rejected.",
  );

  pass(
    "zero-fee override is rejected",
  );


  // ----------------------------------------------------------
  // NEGATIVE PRICE
  // ----------------------------------------------------------

  const negative =
    validateFinoraPricingOverrideSet(
      createSet([
        createRule({
          amount:
            -1,
        }),
      ]),
    );

  assert(
    !negative.valid,
    "Negative Pricing Override must be rejected.",
  );

  pass(
    "negative override is rejected",
  );


  // ----------------------------------------------------------
  // BASE-DISABLED CHARGE
  // ----------------------------------------------------------

  const disabledBase =
    validateFinoraPricingOverrideSet(
      createSet([
        createRule({
          chargeCode:
            "COLLECTION_PROCESSING",
        }),
      ]),
    );

  assert(
    !disabledBase.valid,
    "Override must not activate a base-disabled charge.",
  );

  pass(
    "base-disabled platform charge cannot be activated by override",
  );


  // ----------------------------------------------------------
  // DUPLICATE OVERRIDE ID
  // ----------------------------------------------------------

  const duplicateId =
    validateFinoraPricingOverrideSet(
      createSet([
        createRule({
          overrideId:
            "DUPLICATE",
        }),

        createRule({
          overrideId:
            "DUPLICATE",

          validity: {
            validFrom:
              "2026-09-05T11:00:00.000Z",

            validUntil:
              "2026-09-05T12:00:00.000Z",
          },
        }),
      ]),
    );

  assert(
    !duplicateId.valid,
    "Duplicate override IDs must be rejected.",
  );

  pass(
    "duplicate override identity is rejected",
  );


  // ----------------------------------------------------------
  // OVERLAPPING SAME-CHARGE WINDOWS
  // ----------------------------------------------------------

  const overlap =
    validateFinoraPricingOverrideSet(
      createSet([
        createRule({
          overrideId:
            "A",

          validity: {
            validFrom:
              "2026-09-05T10:00:00.000Z",

            validUntil:
              "2026-09-05T11:30:00.000Z",
          },
        }),

        createRule({
          overrideId:
            "B",

          validity: {
            validFrom:
              "2026-09-05T11:00:00.000Z",

            validUntil:
              "2026-09-05T12:00:00.000Z",
          },
        }),
      ]),
    );

  assert(
    !overlap.valid,
    "Overlapping same-charge Pricing Overrides must be rejected.",
  );

  pass(
    "overlapping same-charge windows are rejected",
  );


  // ----------------------------------------------------------
  // ADJACENT WINDOWS
  //
  // validUntil is exclusive, so exact boundary handoff is safe.
  // ----------------------------------------------------------

  const adjacent =
    validateFinoraPricingOverrideSet(
      createSet([
        createRule({
          overrideId:
            "A",

          validity: {
            validFrom:
              "2026-09-05T10:00:00.000Z",

            validUntil:
              "2026-09-05T11:00:00.000Z",
          },
        }),

        createRule({
          overrideId:
            "B",

          validity: {
            validFrom:
              "2026-09-05T11:00:00.000Z",

            validUntil:
              "2026-09-05T12:00:00.000Z",
          },
        }),
      ]),
    );

  assert(
    adjacent.valid,
    adjacent.error ??
    "Adjacent Pricing Override windows must be valid.",
  );

  pass(
    "validUntil exclusive permits deterministic adjacent windows",
  );


  // ----------------------------------------------------------
  // INVALID WINDOW
  // ----------------------------------------------------------

  const invalidWindow =
    validateFinoraPricingOverrideSet(
      createSet([
        createRule({
          validity: {
            validFrom:
              "2026-09-05T12:00:00.000Z",

            validUntil:
              "2026-09-05T12:00:00.000Z",
          },
        }),
      ]),
    );

  assert(
    !invalidWindow.valid,
    "Pricing Override expiry must be later than start.",
  );

  pass(
    "invalid validity window is rejected",
  );


  console.log("");
  console.log(
    "PASS: FINORA Pricing Override domain rules verified",
  );
}

run();

/* ============================================================
   END
============================================================ */