/* ===========================================================
   FINORA ENTERPRISE OS™

   BRANCH ACCESS AUTHORITY SERVICE SELF TEST

   VERIFY:

   - Isolated Electron userData
   - Authoritative native installation binding
   - Trusted Control Store installation identity
   - ACTIVE Demo authorization
   - EXPIRED Demo authorization
   - ACTIVE Registered authorization
   - EXPIRED Registered authorization
   - SUSPENDED denial
   - REVOKED denial
   - MISSING denial
   - Persisted clock rollback fails closed
   - Rollback rejection does not mutate Control Store
   - Rollback rejection does not mutate clock high-water state

   IMPORTANT:

   Direct Branch Access Grant persistence in this file is fixture
   setup only. Production Branch Access mutation remains inside
   verified signed package application.
=========================================================== */

import {
  app,
} from "electron";

import {
  mkdtemp,
  rm,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  evaluateFinoraAuthoritativeBranchAccess,
} from "./finoraBranchAccessAuthorityService.js";

import {
  loadFinoraClockHighWaterState,
  persistFinoraClockHighWaterState,
} from "./finoraClockHighWaterStore.js";

import {
  ensureFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import type {
  FinoraControlBranchAccessGrant,
  FinoraControlInstallationIdentity,
} from "./finoraControlStore.js";

import {
  readFinoraControlStore,
  saveFinoraBranchAccessGrant,
  saveFinoraInstallationIdentity,
} from "./finoraControlStore.js";

// ============================================================
// TYPES
// ============================================================

interface SelfTestScope {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

type AdministrativeStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED";

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
// TIME HELPERS
// ============================================================

function addMilliseconds(
  value:
    string,
  milliseconds:
    number,
): string {
  const parsed =
    Date.parse(
      value,
    );

  assert(
    Number.isFinite(
      parsed,
    ),
    "Selftest timestamp is invalid.",
  );

  return new Date(
    parsed +
      milliseconds,
  ).toISOString();
}

function addDays(
  value:
    string,
  days:
    number,
): string {
  return addMilliseconds(
    value,
    days *
      24 *
      60 *
      60 *
      1000,
  );
}

// ============================================================
// FIXTURES
// ============================================================

function createDemoGrant(
  scope:
    SelfTestScope,
  userId:
    string,
  administrativeStatus:
    AdministrativeStatus,
  validFrom:
    string,
  validUntil:
    string,
): FinoraControlBranchAccessGrant {
  return {
    grantId:
      `FINORA-DEMO-GRANT-${userId}`,

    userId,

    ownerId:
      scope.ownerId,

    businessId:
      scope.businessId,

    branchId:
      scope.branchId,

    storageMode:
      "LOCAL",

    accessType:
      "DEMO",

    administrativeStatus,

    validity: {
      validFrom,
      validUntil,
    },

    demoId:
      `FINORA-DEMO-${userId}`,

    demoRemarks:
      "Phase 14 clock-high-water Branch Access authority selftest",

    createdAt:
      validFrom,

    updatedAt:
      validFrom,

    schemaVersion:
      1,
  };
}

function createRegisteredGrant(
  scope:
    SelfTestScope,
  userId:
    string,
  administrativeStatus:
    AdministrativeStatus,
  validFrom:
    string,
): FinoraControlBranchAccessGrant {
  const validUntil =
    addDays(
      validFrom,
      365,
    );

  return {
    grantId:
      `FINORA-REGISTERED-GRANT-${userId}`,

    userId,

    ownerId:
      scope.ownerId,

    businessId:
      scope.businessId,

    branchId:
      scope.branchId,

    storageMode:
      "LOCAL",

    accessType:
      "REGISTERED",

    administrativeStatus,

    validity: {
      validFrom,
      validUntil,
    },

    registrationPayment: {
      amount:
        2000,

      currency:
        "INR",

      paymentMode:
        "CASH",

      paidAt:
        validFrom,

      reference:
        `SELFTEST-PAYMENT-${userId}`,

      remarks:
        "Phase 14 clock-high-water Branch Access authority selftest",

      refundable:
        false,
    },

    registrationCycle:
      1,

    createdAt:
      validFrom,

    updatedAt:
      validFrom,

    schemaVersion:
      1,
  };
}

async function persistFixtureGrant(
  grant:
    FinoraControlBranchAccessGrant,
): Promise<void> {
  const result =
    await saveFinoraBranchAccessGrant(
      grant,
    );

  assert(
    result.success &&
    result.data,
    result.error ??
      `Unable to persist Branch Access fixture ${grant.grantId}.`,
  );
}

async function evaluateFixture(
  scope:
    SelfTestScope,
  userId:
    string,
) {
  return evaluateFinoraAuthoritativeBranchAccess({
    userId,

    ownerId:
      scope.ownerId,

    businessId:
      scope.businessId,

    branchId:
      scope.branchId,
  });
}

// ============================================================
// SELF TEST
// ============================================================

async function runSelfTest():
  Promise<void> {
  const temporaryUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-branch-access-authority-selftest-",
      ),
    );

  app.setPath(
    "userData",
    temporaryUserData,
  );

  try {
    await app.whenReady();

    console.log(
      "PASS: isolated Electron userData configured",
    );

    // --------------------------------------------------------
    // AUTHORITATIVE NATIVE INSTALLATION
    // --------------------------------------------------------

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    assert(
      nativeBinding.installationId.length >
        0,
      "Native installation binding was not created.",
    );

    console.log(
      "PASS: authoritative native installation binding established",
    );

    // --------------------------------------------------------
    // CONTROL STORE INSTALLATION
    // --------------------------------------------------------

    const fixtureNow =
      new Date();

    const installationTimestamp =
      new Date(
        fixtureNow.getTime() -
          60 *
            60 *
            1000,
      ).toISOString();

    const scope:
      SelfTestScope = {
        ownerId:
          "OWNER-BRANCH-ACCESS-AUTHORITY-SELFTEST",

        businessId:
          "BUSINESS-BRANCH-ACCESS-AUTHORITY-SELFTEST",

        branchId:
          "BRANCH-BRANCH-ACCESS-AUTHORITY-SELFTEST",
      };

    const installation:
      FinoraControlInstallationIdentity = {
        installationId:
          nativeBinding.installationId,

        ownerId:
          scope.ownerId,

        businessId:
          scope.businessId,

        branchId:
          scope.branchId,

        businessCode:
          "BAS01",

        branchCode:
          "B01",

        createdAt:
          installationTimestamp,

        updatedAt:
          installationTimestamp,

        schemaVersion:
          1,
      };

    const installationResult =
      await saveFinoraInstallationIdentity(
        installation,
      );

    assert(
      installationResult.success &&
      installationResult.data,
      installationResult.error ??
        "Unable to persist isolated Control Store installation identity.",
    );

    console.log(
      "PASS: isolated Control Store installation identity persisted",
    );

    // --------------------------------------------------------
    // TIME WINDOWS
    // --------------------------------------------------------

    const activeFrom =
      new Date(
        fixtureNow.getTime() -
          10 *
            60 *
            1000,
      ).toISOString();

    const activeUntil =
      new Date(
        fixtureNow.getTime() +
          60 *
            60 *
            1000,
      ).toISOString();

    const expiredFrom =
      new Date(
        fixtureNow.getTime() -
          2 *
            60 *
            60 *
            1000,
      ).toISOString();

    const expiredUntil =
      new Date(
        fixtureNow.getTime() -
          60 *
            60 *
            1000,
      ).toISOString();

    const activeRegisteredFrom =
      new Date(
        fixtureNow.getTime() -
          24 *
            60 *
            60 *
            1000,
      ).toISOString();

    const expiredRegisteredFrom =
      new Date(
        fixtureNow.getTime() -
          366 *
            24 *
            60 *
            60 *
            1000,
      ).toISOString();

    // --------------------------------------------------------
    // PERSIST FIXTURES
    // --------------------------------------------------------

    const activeDemoUserId =
      "USER-ACTIVE-DEMO";

    const expiredDemoUserId =
      "USER-EXPIRED-DEMO";

    const activeRegisteredUserId =
      "USER-ACTIVE-REGISTERED";

    const expiredRegisteredUserId =
      "USER-EXPIRED-REGISTERED";

    const suspendedUserId =
      "USER-SUSPENDED";

    const revokedUserId =
      "USER-REVOKED";

    const missingUserId =
      "USER-MISSING";

    await persistFixtureGrant(
      createDemoGrant(
        scope,
        activeDemoUserId,
        "ACTIVE",
        activeFrom,
        activeUntil,
      ),
    );

    await persistFixtureGrant(
      createDemoGrant(
        scope,
        expiredDemoUserId,
        "ACTIVE",
        expiredFrom,
        expiredUntil,
      ),
    );

    await persistFixtureGrant(
      createRegisteredGrant(
        scope,
        activeRegisteredUserId,
        "ACTIVE",
        activeRegisteredFrom,
      ),
    );

    await persistFixtureGrant(
      createRegisteredGrant(
        scope,
        expiredRegisteredUserId,
        "ACTIVE",
        expiredRegisteredFrom,
      ),
    );

    await persistFixtureGrant(
      createDemoGrant(
        scope,
        suspendedUserId,
        "SUSPENDED",
        activeFrom,
        activeUntil,
      ),
    );

    await persistFixtureGrant(
      createDemoGrant(
        scope,
        revokedUserId,
        "REVOKED",
        activeFrom,
        activeUntil,
      ),
    );

    console.log(
      "PASS: isolated Branch Access authority fixtures persisted",
    );

    // --------------------------------------------------------
    // ACTIVE DEMO
    // --------------------------------------------------------

    const activeDemo =
      await evaluateFixture(
        scope,
        activeDemoUserId,
      );

    assert(
      activeDemo.success &&
      activeDemo.data.allowed &&
      activeDemo.data.state ===
        "ACTIVE" &&
      activeDemo.data.grant?.accessType ===
        "DEMO",
      "Active Demo Branch Access was not authorized.",
    );

    console.log(
      "PASS: authoritative ACTIVE Demo access allowed",
    );

    // --------------------------------------------------------
    // EXPIRED DEMO
    // --------------------------------------------------------

    const expiredDemo =
      await evaluateFixture(
        scope,
        expiredDemoUserId,
      );

    assert(
      expiredDemo.success &&
      !expiredDemo.data.allowed &&
      expiredDemo.data.state ===
        "EXPIRED" &&
      expiredDemo.data.grant?.accessType ===
        "DEMO",
      "Expired Demo Branch Access was not denied as EXPIRED.",
    );

    console.log(
      "PASS: authoritative expired Demo access denied",
    );

    // --------------------------------------------------------
    // ACTIVE REGISTERED
    // --------------------------------------------------------

    const activeRegistered =
      await evaluateFixture(
        scope,
        activeRegisteredUserId,
      );

    assert(
      activeRegistered.success &&
      activeRegistered.data.allowed &&
      activeRegistered.data.state ===
        "ACTIVE" &&
      activeRegistered.data.grant?.accessType ===
        "REGISTERED",
      "Active Registered Branch Access was not authorized.",
    );

    console.log(
      "PASS: authoritative ACTIVE Registered access allowed",
    );

    // --------------------------------------------------------
    // EXPIRED REGISTERED
    // --------------------------------------------------------

    const expiredRegistered =
      await evaluateFixture(
        scope,
        expiredRegisteredUserId,
      );

    assert(
      expiredRegistered.success &&
      !expiredRegistered.data.allowed &&
      expiredRegistered.data.state ===
        "EXPIRED" &&
      expiredRegistered.data.grant?.accessType ===
        "REGISTERED",
      "Expired Registered Branch Access was not denied as EXPIRED.",
    );

    console.log(
      "PASS: authoritative expired Registered access denied",
    );

    // --------------------------------------------------------
    // SUSPENDED
    // --------------------------------------------------------

    const suspended =
      await evaluateFixture(
        scope,
        suspendedUserId,
      );

    assert(
      suspended.success &&
      !suspended.data.allowed &&
      suspended.data.state ===
        "SUSPENDED",
      "Suspended Branch Access was not denied.",
    );

    console.log(
      "PASS: authoritative suspended Branch Access denied",
    );

    // --------------------------------------------------------
    // REVOKED
    // --------------------------------------------------------

    const revoked =
      await evaluateFixture(
        scope,
        revokedUserId,
      );

    assert(
      revoked.success &&
      !revoked.data.allowed &&
      revoked.data.state ===
        "REVOKED",
      "Revoked Branch Access was not denied.",
    );

    console.log(
      "PASS: authoritative revoked Branch Access denied",
    );

    // --------------------------------------------------------
    // MISSING
    // --------------------------------------------------------

    const missing =
      await evaluateFixture(
        scope,
        missingUserId,
      );

    assert(
      missing.success &&
      !missing.data.allowed &&
      missing.data.state ===
        "MISSING" &&
      missing.data.grant ===
        undefined,
      "Missing Branch Access was not denied as MISSING.",
    );

    console.log(
      "PASS: authoritative missing Branch Access denied",
    );

    // --------------------------------------------------------
    // CLOCK ROLLBACK
    // --------------------------------------------------------

    const controlBeforeRollback =
      await readFinoraControlStore();

    assert(
      controlBeforeRollback.success &&
      controlBeforeRollback.data,
      controlBeforeRollback.error ??
        "Unable to snapshot Control Store before rollback proof.",
    );

    const controlSnapshotBeforeRollback =
      JSON.stringify(
        controlBeforeRollback.data,
      );

    const futureHighWaterAt =
      new Date(
        Date.now() +
          24 *
            60 *
            60 *
            1000,
      ).toISOString();

    await persistFinoraClockHighWaterState({
      schemaVersion:
        1,

      installationId:
        nativeBinding.installationId,

      highWaterAt:
        futureHighWaterAt,
    });

    const seededHighWater =
      await loadFinoraClockHighWaterState();

    assert(
      seededHighWater !==
        undefined &&
      seededHighWater.installationId ===
        nativeBinding.installationId &&
      seededHighWater.highWaterAt ===
        futureHighWaterAt,
      "Future Branch Access clock high-water fixture was not persisted.",
    );

    const rollbackResult =
      await evaluateFixture(
        scope,
        activeDemoUserId,
      );

    assert(
      !rollbackResult.success &&
      rollbackResult.errorCode ===
        "CLOCK_AUTHORITY_FAILED" &&
      rollbackResult.clockErrorCode ===
        "CLOCK_ROLLBACK_DETECTED",
      "Branch Access authority did not fail closed on persisted clock rollback.",
    );

    const controlAfterRollback =
      await readFinoraControlStore();

    assert(
      controlAfterRollback.success &&
      controlAfterRollback.data &&
      JSON.stringify(
        controlAfterRollback.data,
      ) ===
        controlSnapshotBeforeRollback,
      "Clock rollback rejection mutated trusted Control Store state.",
    );

    const highWaterAfterRollback =
      await loadFinoraClockHighWaterState();

    assert(
      highWaterAfterRollback !==
        undefined &&
      highWaterAfterRollback.installationId ===
        nativeBinding.installationId &&
      highWaterAfterRollback.highWaterAt ===
        futureHighWaterAt,
      "Clock rollback rejection mutated persisted high-water state.",
    );

    console.log(
      "PASS: Branch Access authority rejected persisted clock rollback with zero Control Store/high-water mutation",
    );

    // --------------------------------------------------------
    // FINAL
    // --------------------------------------------------------

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA BRANCH ACCESS AUTHORITY SERVICE SELFTEST",
    );

    console.log(
      "============================================================",
    );
  } finally {
    await rm(
      temporaryUserData,
      {
        recursive:
          true,

        force:
          true,
      },
    );

    console.log(
      "PASS: isolated Branch Access authority userData deleted",
    );
  }
}

// ============================================================
// ENTRY
// ============================================================

void runSelfTest()
  .then(
    () => {
      app.exit(
        0,
      );
    },
  )
  .catch(
    (
      error,
    ) => {
      console.error(
        "FAIL: FINORA BRANCH ACCESS AUTHORITY SERVICE SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );