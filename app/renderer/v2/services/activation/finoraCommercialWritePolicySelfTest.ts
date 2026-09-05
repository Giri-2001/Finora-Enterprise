/* ===========================================================
   FINORA ENTERPRISE OS™

   COMMERCIAL WRITE POLICY SELF TEST

   MODULE  : Activation / Commercial Access
   LAYER   : Domain Self Test
   VERSION : 1.0
   STATUS  : Production Foundation

   PROVES:

   - ACTIVE REGISTERED access permits all current commercial
     capabilities
   - REGISTERED access remains writable immediately before
     validUntil
   - REGISTERED access denies commercial writes exactly at
     validUntil
   - ACTIVE DEMO access permits commercial writes
   - DEMO access denies commercial writes exactly at validUntil
   - NOT_YET_VALID access is denied
   - SUSPENDED access is denied
   - REVOKED access is denied
   - Missing access is denied
   - Malformed access fails closed as INVALID
   - FINORA Business Date is not involved
=========================================================== */

import type {
  FinoraCommercialWriteCapability,
} from "../../types/activation/finoraBranchAccess.types";

import {
  createFinoraDemoAccessGrant,
  createFinoraRegisteredAccessGrant,
} from "./finoraBranchAccessGrantFactory";

import {
  evaluateFinoraCommercialWrite,
} from "./finoraCommercialWritePolicy";

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
// FIXTURES
// ============================================================

const identity = {
  userId:
    "1",

  ownerId:
    "OWNER-COMMERCIAL-TEST",

  businessId:
    "BUSINESS-COMMERCIAL-TEST",

  branchId:
    "BRANCH-COMMERCIAL-TEST",

  storageMode:
    "LOCAL" as const,
};

function createPayment(
  paidAt:
    string,
) {

  return {
    amount:
      2000,

    currency:
      "INR",

    paymentMode:
      "CASH" as const,

    refundable:
      false as const,

    paidAt,
  };
}

const capabilities:
  FinoraCommercialWriteCapability[] = [
    "CREATE_CUSTOMER",
    "DISBURSE_LOAN",
    "POST_COLLECTION",
  ];

// ============================================================
// SELF TEST
// ============================================================

export function runFinoraCommercialWritePolicySelfTest():
  void {

  // ==========================================================
  // 1. ACTIVE REGISTERED ACCESS
  // ==========================================================

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

  for (const capability of capabilities) {

    const decision =
      evaluateFinoraCommercialWrite(
        registered,
        capability,
        new Date(
          activatedAt,
        ),
      );

    assert(
      decision.allowed &&
      decision.state === "ACTIVE",
      `ACTIVE REGISTERED access must allow ${capability}.`,
    );

    assert(
      decision.capability ===
        capability,
      `Commercial decision must preserve ${capability}.`,
    );
  }

  console.log(
    "PASS: ACTIVE REGISTERED permits all commercial write capabilities",
  );

  // ==========================================================
  // 2. REGISTERED IMMEDIATELY BEFORE EXPIRY
  // ==========================================================

  const registeredValidUntilMs =
    Date.parse(
      registered.validity.validUntil,
    );

  const registeredBeforeExpiry =
    new Date(
      registeredValidUntilMs - 1,
    );

  for (const capability of capabilities) {

    const decision =
      evaluateFinoraCommercialWrite(
        registered,
        capability,
        registeredBeforeExpiry,
      );

    assert(
      decision.allowed &&
      decision.state === "ACTIVE",
      `REGISTERED access must allow ${capability} immediately before validUntil.`,
    );
  }

  console.log(
    "PASS: REGISTERED remains writable immediately before validUntil",
  );

  // ==========================================================
  // 3. REGISTERED EXACT EXPIRY
  // ==========================================================

  for (const capability of capabilities) {

    const decision =
      evaluateFinoraCommercialWrite(
        registered,
        capability,
        new Date(
          registered.validity.validUntil,
        ),
      );

    assert(
      !decision.allowed &&
      decision.state === "EXPIRED",
      `REGISTERED ${capability} must be denied exactly at validUntil.`,
    );

    assert(
      decision.reason.includes(
        "Commercial writes are disabled until renewal",
      ),
      "Expired REGISTERED commercial denial must carry the renewal reason.",
    );
  }

  console.log(
    "PASS: REGISTERED commercial writes stop exactly at validUntil",
  );

  // ==========================================================
  // 4. ACTIVE DEMO ACCESS
  // ==========================================================

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
        "Commercial write policy self-test",
    });

  const activeDemoTime =
    new Date(
      "2026-09-10T12:00:00.000Z",
    );

  for (const capability of capabilities) {

    const decision =
      evaluateFinoraCommercialWrite(
        demo,
        capability,
        activeDemoTime,
      );

    assert(
      decision.allowed &&
      decision.state === "ACTIVE",
      `ACTIVE DEMO access must allow ${capability}.`,
    );
  }

  console.log(
    "PASS: ACTIVE DEMO permits all commercial write capabilities",
  );

  // ==========================================================
  // 5. DEMO EXACT EXPIRY
  // ==========================================================

  for (const capability of capabilities) {

    const decision =
      evaluateFinoraCommercialWrite(
        demo,
        capability,
        new Date(
          demoValidUntil,
        ),
      );

    assert(
      !decision.allowed &&
      decision.state === "EXPIRED",
      `DEMO ${capability} must be denied exactly at validUntil.`,
    );
  }

  console.log(
    "PASS: DEMO commercial writes stop exactly at validUntil",
  );

  // ==========================================================
  // 6. DEMO NOT YET VALID
  // ==========================================================

  const beforeDemo =
    evaluateFinoraCommercialWrite(
      demo,
      "CREATE_CUSTOMER",
      new Date(
        "2026-09-10T07:59:59.999Z",
      ),
    );

  assert(
    !beforeDemo.allowed &&
    beforeDemo.state ===
      "NOT_YET_VALID",
    "Commercial writes must be denied before Demo validFrom.",
  );

  console.log(
    "PASS: NOT_YET_VALID commercial access is denied",
  );

  // ==========================================================
  // 7. SUSPENDED
  // ==========================================================

  const suspendedDemo = {
    ...demo,

    administrativeStatus:
      "SUSPENDED" as const,
  };

  const suspendedDecision =
    evaluateFinoraCommercialWrite(
      suspendedDemo,
      "POST_COLLECTION",
      activeDemoTime,
    );

  assert(
    !suspendedDecision.allowed &&
    suspendedDecision.state ===
      "SUSPENDED",
    "Suspended access must deny commercial writes.",
  );

  console.log(
    "PASS: SUSPENDED commercial access is denied",
  );

  // ==========================================================
  // 8. REVOKED
  // ==========================================================

  const revokedDemo = {
    ...demo,

    administrativeStatus:
      "REVOKED" as const,
  };

  const revokedDecision =
    evaluateFinoraCommercialWrite(
      revokedDemo,
      "DISBURSE_LOAN",
      activeDemoTime,
    );

  assert(
    !revokedDecision.allowed &&
    revokedDecision.state ===
      "REVOKED",
    "Revoked access must deny commercial writes.",
  );

  console.log(
    "PASS: REVOKED commercial access is denied",
  );

  // ==========================================================
  // 9. MISSING
  // ==========================================================

  const missingDecision =
    evaluateFinoraCommercialWrite(
      undefined,
      "CREATE_CUSTOMER",
      activeDemoTime,
    );

  assert(
    !missingDecision.allowed &&
    missingDecision.state ===
      "MISSING",
    "Missing signed access must deny commercial writes.",
  );

  console.log(
    "PASS: MISSING commercial access is denied",
  );

  // ==========================================================
  // 10. MALFORMED REGISTERED GRANT
  //
  // Break the exact 365-day REGISTERED validity requirement.
  // ==========================================================

  const malformedRegistered = {
    ...registered,

    validity: {
      ...registered.validity,

      validUntil:
        new Date(
          Date.parse(
            registered.validity.validFrom,
          ) +
          24 * 60 * 60 * 1000,
        ).toISOString(),
    },
  };

  const malformedDecision =
    evaluateFinoraCommercialWrite(
      malformedRegistered,
      "POST_COLLECTION",
      new Date(
        registered.validity.validFrom,
      ),
    );

  assert(
    !malformedDecision.allowed &&
    malformedDecision.state ===
      "INVALID",
    "Malformed REGISTERED access must fail closed for commercial writes.",
  );

  console.log(
    "PASS: malformed commercial access fails closed as INVALID",
  );

  // ==========================================================
  // FINAL
  // ==========================================================

  console.log(
    "PASS: FINORA Commercial Write Policy rules verified",
  );
}

// ============================================================
// EXECUTE WHEN THIS SELF-TEST MODULE IS RUN DIRECTLY
// ============================================================

runFinoraCommercialWritePolicySelfTest();

// ============================================================
// END
// ============================================================