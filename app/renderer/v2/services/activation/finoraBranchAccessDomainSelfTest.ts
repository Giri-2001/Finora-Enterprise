// ============================================================
// FINORA ENTERPRISE OS™
//
// BRANCH ACCESS DOMAIN SELF TEST
//
// RESPONSIBILITY:
//
// - Prove exact 365-day REGISTERED validity
// - Prove inclusive start / exclusive expiry boundary
// - Prove early-renewal carry-forward
// - Prove expired-renewal restart
// - Prove arbitrary DEMO duration
// - Prove automatic Demo expiry
// - Prove suspended / revoked denial
// - Prove malformed grant rejection
// - Prove invalid payment rejection
//
// IMPORTANT:
//
// - Pure executable domain test.
// - No persistence.
// - No signing.
// - No Business Date.
// - No operational data.
//
// ============================================================

import type {
  FinoraRegistrationPayment,
} from "../../types/activation/finoraBranchAccess.types";

import {
  FINORA_REGISTERED_ACCESS_DURATION_MS,
  evaluateFinoraBranchAccess,
  validateFinoraBranchAccessGrant,
} from "./finoraBranchAccessEvaluator";

import {
  FINORA_ANNUAL_REGISTRATION_FEE,
  createFinoraDemoAccessGrant,
  createFinoraRegisteredAccessGrant,
  renewFinoraRegisteredAccessGrant,
} from "./finoraBranchAccessGrantFactory";

// ============================================================
// TEST HELPERS
// ============================================================

function assert(
  condition: unknown,
  message: string,
): asserts condition {

  if (!condition) {
    throw new Error(
      message,
    );
  }
}

function createPayment(
  paidAt: string,
  amount:
    number =
      FINORA_ANNUAL_REGISTRATION_FEE,
): FinoraRegistrationPayment {

  return {
    amount,

    currency:
      "INR",

    paymentMode:
      "CASH",

    paidAt,

    reference:
      "SELF-TEST",

    refundable:
      false,
  };
}

function expectThrow(
  action:
    () => unknown,
  expectedMessageFragment:
    string,
): void {

  try {

    action();

  } catch (error) {

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    assert(
      message.includes(
        expectedMessageFragment,
      ),
      `Unexpected error message: ${message}`,
    );

    return;
  }

  throw new Error(
    `Expected failure containing: ${expectedMessageFragment}`,
  );
}

// ============================================================
// COMMON IDENTITY
// ============================================================

const identity = {
  userId:
    "USER-001",

  ownerId:
    "OWNER-001",

  businessId:
    "BUSINESS-001",

  branchId:
    "BRANCH-001",
};

// ============================================================
// 1. INITIAL REGISTERED ACCESS
// ============================================================

const activatedAt =
  "2026-09-05T10:00:00.000Z";

const registered =
  createFinoraRegisteredAccessGrant({
    ...identity,

    activatedAt,

    payment:
      createPayment(
        activatedAt,
      ),
  });

assert(
  registered.accessType ===
    "REGISTERED",
  "Initial access must be REGISTERED.",
);

assert(
  registered.registrationCycle ===
    1,
  "Initial registration cycle must be 1.",
);

assert(
  registered.validity.validFrom ===
    activatedAt,
  "Initial registration must start at activation timestamp.",
);

const registeredStart =
  Date.parse(
    registered.validity.validFrom,
  );

const registeredEnd =
  Date.parse(
    registered.validity.validUntil,
  );

assert(
  registeredEnd -
    registeredStart ===
      FINORA_REGISTERED_ACCESS_DURATION_MS,
  "REGISTERED validity is not exactly 365 x 24 hours.",
);


// ============================================================
// 2. ACCESS BOUNDARIES
// ============================================================

const atStart =
  evaluateFinoraBranchAccess(
    registered,
    new Date(
      registered.validity.validFrom,
    ),
  );

assert(
  atStart.allowed,
  "REGISTERED access must be active exactly at validFrom.",
);


const oneMillisecondBeforeExpiry =
  evaluateFinoraBranchAccess(
    registered,
    new Date(
      registeredEnd - 1,
    ),
  );

assert(
  oneMillisecondBeforeExpiry.allowed,
  "REGISTERED access must remain active immediately before validUntil.",
);


const atExactExpiry =
  evaluateFinoraBranchAccess(
    registered,
    new Date(
      registered.validity.validUntil,
    ),
  );

assert(
  !atExactExpiry.allowed &&
  atExactExpiry.state ===
    "EXPIRED",
  "REGISTERED access must expire exactly at validUntil.",
);


// ============================================================
// 3. EARLY RENEWAL
// ============================================================

const earlyRenewedAt =
  "2027-08-01T00:00:00.000Z";

const earlyRenewal =
  renewFinoraRegisteredAccessGrant({
    currentGrant:
      registered,

    renewedAt:
      earlyRenewedAt,

    payment:
      createPayment(
        earlyRenewedAt,
      ),
  });

assert(
  earlyRenewal.registrationCycle ===
    2,
  "Early renewal must increment registration cycle.",
);

assert(
  earlyRenewal.validity.validFrom ===
    registered.validity.validUntil,
  "Early renewal must preserve remaining paid validity.",
);

assert(
  Date.parse(
    earlyRenewal.validity.validUntil,
  ) -
  Date.parse(
    earlyRenewal.validity.validFrom,
  ) ===
    FINORA_REGISTERED_ACCESS_DURATION_MS,
  "Renewed registration must receive exactly another 365 days.",
);


// ============================================================
// 4. EXPIRED RENEWAL
// ============================================================

const expiredRenewedAt =
  "2027-10-01T12:30:00.000Z";

const expiredRenewal =
  renewFinoraRegisteredAccessGrant({
    currentGrant:
      registered,

    renewedAt:
      expiredRenewedAt,

    payment:
      createPayment(
        expiredRenewedAt,
      ),
  });

assert(
  expiredRenewal.validity.validFrom ===
    expiredRenewedAt,
  "Expired registration renewal must start at renewal timestamp.",
);

assert(
  expiredRenewal.registrationCycle ===
    2,
  "Expired renewal must increment registration cycle.",
);


// ============================================================
// 5. ARBITRARY DEMO WINDOW
//
// 37 hours deliberately proves Demo is NOT tied to a
// fixed 2-day / 7-day / 10-day rule.
// ============================================================

const demoValidFrom =
  "2026-09-10T08:00:00.000Z";

const demoValidUntil =
  "2026-09-11T21:00:00.000Z";

const demo =
  createFinoraDemoAccessGrant({
    ...identity,

    validFrom:
      demoValidFrom,

    validUntil:
      demoValidUntil,

    createdAt:
      "2026-09-09T12:00:00.000Z",

    demoRemarks:
      "37-hour arbitrary Demo self-test",
  });

const demoDuration =
  Date.parse(
    demo.validity.validUntil,
  ) -
  Date.parse(
    demo.validity.validFrom,
  );

assert(
  demoDuration ===
    37 * 60 * 60 * 1000,
  "Demo validity must preserve administrator-selected arbitrary duration.",
);


// ============================================================
// 6. DEMO BEFORE START
// ============================================================

const demoBeforeStart =
  evaluateFinoraBranchAccess(
    demo,
    new Date(
      "2026-09-10T07:59:59.999Z",
    ),
  );

assert(
  !demoBeforeStart.allowed &&
  demoBeforeStart.state ===
    "NOT_YET_VALID",
  "Demo must be denied before validFrom.",
);


// ============================================================
// 7. DEMO START
// ============================================================

const demoAtStart =
  evaluateFinoraBranchAccess(
    demo,
    new Date(
      demoValidFrom,
    ),
  );

assert(
  demoAtStart.allowed,
  "Demo must become active exactly at validFrom.",
);


// ============================================================
// 8. AUTOMATIC DEMO EXPIRY
//
// No delete/revoke operation is performed here.
// Time crossing validUntil alone must deny access.
// ============================================================

const demoAtExpiry =
  evaluateFinoraBranchAccess(
    demo,
    new Date(
      demoValidUntil,
    ),
  );

assert(
  !demoAtExpiry.allowed &&
  demoAtExpiry.state ===
    "EXPIRED",
  "Demo must automatically expire without administrator deletion.",
);


// ============================================================
// 9. SUSPENDED ACCESS
// ============================================================

const suspendedDemo = {
  ...demo,

  administrativeStatus:
    "SUSPENDED" as const,
};

const suspendedDecision =
  evaluateFinoraBranchAccess(
    suspendedDemo,
    new Date(
      "2026-09-10T12:00:00.000Z",
    ),
  );

assert(
  !suspendedDecision.allowed &&
  suspendedDecision.state ===
    "SUSPENDED",
  "Suspended Demo must be denied.",
);


// ============================================================
// 10. REVOKED ACCESS
// ============================================================

const revokedDemo = {
  ...demo,

  administrativeStatus:
    "REVOKED" as const,
};

const revokedDecision =
  evaluateFinoraBranchAccess(
    revokedDemo,
    new Date(
      "2026-09-10T12:00:00.000Z",
    ),
  );

assert(
  !revokedDecision.allowed &&
  revokedDecision.state ===
    "REVOKED",
  "Revoked Demo must be denied.",
);


// ============================================================
// 11. MISSING ACCESS
// ============================================================

const missingDecision =
  evaluateFinoraBranchAccess(
    undefined,
    new Date(
      "2026-09-10T12:00:00.000Z",
    ),
  );

assert(
  !missingDecision.allowed &&
  missingDecision.state ===
    "MISSING",
  "Missing FINORA access grant must fail closed.",
);


// ============================================================
// 12. MALFORMED REGISTERED VALIDITY
// ============================================================

const malformedRegistered = {
  ...registered,

  validity: {
    ...registered.validity,

    validUntil:
      new Date(
        registeredStart +
        24 * 60 * 60 * 1000,
      ).toISOString(),
  },
};

const malformedValidation =
  validateFinoraBranchAccessGrant(
    malformedRegistered,
  );

assert(
  !malformedValidation.valid,
  "REGISTERED grant with non-365-day validity must be invalid.",
);


const malformedDecision =
  evaluateFinoraBranchAccess(
    malformedRegistered,
    new Date(
      activatedAt,
    ),
  );

assert(
  !malformedDecision.allowed &&
  malformedDecision.state ===
    "INVALID",
  "Malformed REGISTERED grant must fail closed at runtime.",
);


// ============================================================
// 13. WRONG REGISTRATION FEE
// ============================================================

expectThrow(
  () =>
    createFinoraRegisteredAccessGrant({
      ...identity,

      activatedAt,

      payment:
        createPayment(
          activatedAt,
          1999,
        ),
    }),
  "must be INR 2000",
);


// ============================================================
// 14. INVALID DEMO WINDOW
// ============================================================

expectThrow(
  () =>
    createFinoraDemoAccessGrant({
      ...identity,

      validFrom:
        "2026-09-10T10:00:00.000Z",

      validUntil:
        "2026-09-10T10:00:00.000Z",
    }),
  "expiry must be later",
);


// ============================================================
// RESULTS
// ============================================================

console.log(
  "PASS: REGISTERED validity is exactly 365 days",
);

console.log(
  "PASS: validFrom is inclusive and validUntil is exclusive",
);

console.log(
  "PASS: Early renewal preserves remaining paid validity",
);

console.log(
  "PASS: Expired renewal starts from renewal timestamp",
);

console.log(
  "PASS: DEMO accepts arbitrary administrator-selected duration",
);

console.log(
  "PASS: DEMO expires automatically without deletion",
);

console.log(
  "PASS: Suspended / revoked / missing access is denied",
);

console.log(
  "PASS: Malformed REGISTERED validity fails closed",
);

console.log(
  "PASS: Invalid registration fee is rejected",
);

console.log(
  "PASS: Invalid DEMO validity window is rejected",
);

console.log(
  "PASS: FINORA Branch Access domain rules verified",
);

// ============================================================
// END
// ============================================================