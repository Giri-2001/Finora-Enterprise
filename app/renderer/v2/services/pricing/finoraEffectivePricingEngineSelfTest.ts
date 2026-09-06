/* ============================================================
   FINORA ENTERPRISE OS™

   EFFECTIVE PRICING ENGINE™

   SELF-TEST

   RESPONSIBILITY:

   - Verify Base Pricing fallback
   - Verify active override application
   - Verify canonical transaction type preservation
   - Verify validFrom inclusive semantics
   - Verify validUntil exclusive semantics
   - Verify future / expired override fallback
   - Verify adjacent deterministic handoff
   - Verify malformed override state fails closed
   - Verify invalid runtime clock fails closed
   - Verify base-disabled charge remains unavailable

============================================================ */

import {
  resolveFinoraEffectivePrice,
} from "./finoraEffectivePricingEngine";

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

function rule(
  input:
    Partial<
      FinoraPricingOverrideRuleV1
    > = {},
): FinoraPricingOverrideRuleV1 {

  return {
    overrideId:
      "OVERRIDE-A",

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

function set(
  overrides:
    readonly FinoraPricingOverrideRuleV1[],
): FinoraPricingOverrideSetV1 {

  return {
    overrideSetId:
      "SET-1",

    scope: {
      ownerId:
        "OWNER-1",

      businessId:
        "BUSINESS-1",

      branchId:
        "BRANCH-1",
    },

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
  // BASE ONLY
  // ----------------------------------------------------------

  const base =
    resolveFinoraEffectivePrice({
      chargeCode:
        "LOAN_DISBURSEMENT",

      now:
        new Date(
          "2026-09-05T10:30:00.000Z",
        ),
    });

  assert(
    base.success,
    "Base Pricing must resolve.",
  );

  assert(
    base.quote.source ===
      "BASE",
    "No override set must resolve from Base Pricing.",
  );

  assert(
    base.quote.amount ===
      10,
    "Canonical Base Loan price must remain INR 10.",
  );

  assert(
    Object.isFrozen(
      base.quote,
    ),
    "Effective Base quote must be immutable.",
  );

  pass(
    "missing override state resolves canonical Base Pricing",
  );


  // ----------------------------------------------------------
  // ACTIVE OVERRIDE
  // ----------------------------------------------------------

  const active =
    resolveFinoraEffectivePrice({
      chargeCode:
        "LOAN_DISBURSEMENT",

      overrideSet:
        set([
          rule(),
        ]),

      now:
        new Date(
          "2026-09-05T10:30:00.000Z",
        ),
    });

  assert(
    active.success,
    "Active Pricing Override must resolve.",
  );

  assert(
    active.quote.source ===
      "PRICING_OVERRIDE",
    "Active override must identify override source.",
  );

  assert(
    active.quote.amount ===
      7,
    "Active fixed-price override must replace Base amount.",
  );

  assert(
    active.quote.transactionType ===
      "LOAN_DISBURSEMENT_PLATFORM_FEE",
    "Override must preserve canonical Wallet transaction type.",
  );

  assert(
    Object.isFrozen(
      active.quote,
    ),
    "Effective override quote must be immutable.",
  );

  pass(
    "active Pricing Override replaces amount and preserves canonical transaction type",
  );


  // ----------------------------------------------------------
  // validFrom INCLUSIVE
  // ----------------------------------------------------------

  const atStart =
    resolveFinoraEffectivePrice({
      chargeCode:
        "LOAN_DISBURSEMENT",

      overrideSet:
        set([
          rule(),
        ]),

      now:
        new Date(
          "2026-09-05T10:00:00.000Z",
        ),
    });

  assert(
    atStart.success &&
    atStart.quote.source ===
      "PRICING_OVERRIDE" &&
    atStart.quote.amount ===
      7,
    "Override must activate exactly at validFrom.",
  );

  pass(
    "validFrom is inclusive",
  );


  // ----------------------------------------------------------
  // validUntil EXCLUSIVE
  // ----------------------------------------------------------

  const atEnd =
    resolveFinoraEffectivePrice({
      chargeCode:
        "LOAN_DISBURSEMENT",

      overrideSet:
        set([
          rule(),
        ]),

      now:
        new Date(
          "2026-09-05T11:00:00.000Z",
        ),
    });

  assert(
    atEnd.success &&
    atEnd.quote.source ===
      "BASE" &&
    atEnd.quote.amount ===
      10,
    "Override must stop exactly at validUntil.",
  );

  pass(
    "validUntil is exclusive",
  );


  // ----------------------------------------------------------
  // FUTURE OVERRIDE
  // ----------------------------------------------------------

  const before =
    resolveFinoraEffectivePrice({
      chargeCode:
        "LOAN_DISBURSEMENT",

      overrideSet:
        set([
          rule(),
        ]),

      now:
        new Date(
          "2026-09-05T09:59:59.999Z",
        ),
    });

  assert(
    before.success &&
    before.quote.source ===
      "BASE",
    "Future Pricing Override must not apply.",
  );

  pass(
    "future override falls back to Base Pricing",
  );


  // ----------------------------------------------------------
  // ADJACENT WINDOW HANDOFF
  // ----------------------------------------------------------

  const adjacentSet =
    set([
      rule({
        overrideId:
          "OVERRIDE-A",

        amount:
          7,

        validity: {
          validFrom:
            "2026-09-05T10:00:00.000Z",

          validUntil:
            "2026-09-05T11:00:00.000Z",
        },
      }),

      rule({
        overrideId:
          "OVERRIDE-B",

        amount:
          6,

        validity: {
          validFrom:
            "2026-09-05T11:00:00.000Z",

          validUntil:
            "2026-09-05T12:00:00.000Z",
        },
      }),
    ]);

  const boundary =
    resolveFinoraEffectivePrice({
      chargeCode:
        "LOAN_DISBURSEMENT",

      overrideSet:
        adjacentSet,

      now:
        new Date(
          "2026-09-05T11:00:00.000Z",
        ),
    });

  assert(
    boundary.success &&
    boundary.quote.source ===
      "PRICING_OVERRIDE" &&
    boundary.quote.amount ===
      6,
    "Adjacent override must deterministically take over at boundary.",
  );

  if (
    boundary.success &&
    boundary.quote.source ===
      "PRICING_OVERRIDE"
  ) {
    assert(
      boundary.quote.overrideId ===
        "OVERRIDE-B",
      "Second adjacent override must own exact boundary.",
    );
  }

  pass(
    "adjacent windows hand off deterministically at exact boundary",
  );


  // ----------------------------------------------------------
  // INVALID CLOCK
  // ----------------------------------------------------------

  const invalidClock =
    resolveFinoraEffectivePrice({
      chargeCode:
        "LOAN_DISBURSEMENT",

      overrideSet:
        set([
          rule(),
        ]),

      now:
        new Date(
          Number.NaN,
        ),
    });

  assert(
    !invalidClock.success,
    "Invalid runtime clock must fail closed.",
  );

  pass(
    "invalid runtime clock fails closed",
  );


  // ----------------------------------------------------------
  // MALFORMED OVERRIDE STATE
  //
  // Force a runtime-malformed set through the static boundary.
  // ----------------------------------------------------------

  const malformed =
    set([
      rule({
        amount:
          0,
      }),
    ]);

  const malformedResult =
    resolveFinoraEffectivePrice({
      chargeCode:
        "LOAN_DISBURSEMENT",

      overrideSet:
        malformed,

      now:
        new Date(
          "2026-09-05T10:30:00.000Z",
        ),
    });

  assert(
    !malformedResult.success,
    "Malformed supplied override state must fail closed.",
  );

  pass(
    "malformed supplied override state does not silently fall back to Base Pricing",
  );


  // ----------------------------------------------------------
  // BASE-DISABLED CHARGE
  // ----------------------------------------------------------

  const disabled =
    resolveFinoraEffectivePrice({
      chargeCode:
        "COLLECTION_PROCESSING",

      overrideSet:
        set([]),

      now:
        new Date(
          "2026-09-05T10:30:00.000Z",
        ),
    });

  assert(
    !disabled.success,
    "Base-disabled platform charge must remain unavailable.",
  );

  pass(
    "base-disabled platform charge remains unavailable",
  );


  console.log("");
  console.log(
    "PASS: FINORA Effective Pricing Engine verified",
  );
}

run();

/* ============================================================
   END
============================================================ */