/* ============================================================
   FINORA ENTERPRISE OS
   CANONICAL WALLET AUTHORITY
   USB1 / USB2 ANTI-FORK SELF TEST

   ISOLATION:
   - Temporary Electron userData
   - Temporary encrypted authority vault
   - No production Wallet
   - No production Control Store
   - No USB filesystem access

   PROOF:
   - One canonical balance across two stale USB snapshots
   - Stale authority snapshot cannot spend
   - Mutation replay cannot credit/debit twice
   - Canonical balance remains authoritative
============================================================ */

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
  createFinoraPersistentCanonicalWalletAuthorityProvider,
  initializeFinoraCanonicalWalletAuthority,
} from "./finoraCanonicalWalletAuthorityProvider.js";

interface SelfTestScope {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  walletId:
    string;
}

function assert(
  condition:
    boolean,
  message:
    string,
): asserts condition {

  if (!condition) {
    throw new Error(
      message,
    );
  }
}

async function runSelfTest(): Promise<void> {

  const temporaryUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-wallet-authority-antifork-",
      ),
    );

  app.setPath(
    "userData",
    temporaryUserData,
  );

  let failure:
    unknown;

  try {

    await app.whenReady();

    const scope:
      SelfTestScope = {
        ownerId:
          "SELFTEST-OWNER-001",

        businessId:
          "SELFTEST-BUSINESS-001",

        branchId:
          "SELFTEST-BRANCH-001",

        walletId:
          "SELFTEST-WALLET-001",
      };

    const initialState = {
      ...scope,

      authorityId:
        "SELFTEST-AUTHORITY-001",

      authoritativeBalance:
        3000,

      authorityGeneration:
        1,

      spendCounter:
        0,

      headHash:
        "SELFTEST-HEAD-000",

      status:
        "ACTIVE" as const,

      updatedAt:
        "2026-10-03T00:00:00.000Z",

      schemaVersion:
        1 as const,
    };

    // ========================================================
    // TEST 1 - INITIALIZE CANONICAL AUTHORITY
    // ========================================================

    await initializeFinoraCanonicalWalletAuthority(
      initialState,
    );

    console.log(
      "PASS: canonical Wallet Authority initialized at ₹3000",
    );

    const provider =
      createFinoraPersistentCanonicalWalletAuthorityProvider();

    const firstRead =
      await provider.readAuthority(
        scope,
      );

    if (!firstRead.success) {
      throw new Error(
        firstRead.error,
      );
    }


    assert(
      firstRead.data.authoritativeBalance ===
        3000,
      "Initial canonical Wallet Authority balance is not ₹3000.",
    );

    // ========================================================
    // SIMULATED USB SNAPSHOTS
    // ========================================================

    const usb1Snapshot =
      firstRead.data;

    const usb2Snapshot =
      firstRead.data;

    assert(
      usb1Snapshot.authoritativeBalance ===
        3000,
      "USB1 simulated snapshot was not ₹3000.",
    );

    assert(
      usb2Snapshot.authoritativeBalance ===
        3000,
      "USB2 simulated snapshot was not ₹3000.",
    );

    console.log(
      "PASS: USB1 and USB2 simulated snapshots both start at ₹3000",
    );

    // ========================================================
    // TEST 2 - USB2 DEBIT ₹750
    // ========================================================

    const usb2Debit =
      await provider.commitMutation({

        ...scope,

        expectedAuthorityGeneration:
          usb2Snapshot.authorityGeneration,

        expectedSpendCounter:
          usb2Snapshot.spendCounter,

        expectedHeadHash:
          usb2Snapshot.headHash,

        amount:
          750,

        mutationKind:
          "DEBIT",

        mutationId:
          "SELFTEST-USB2-DEBIT-750",

        occurredAt:
          "2026-10-03T00:01:00.000Z",
      });

    if (!usb2Debit.success) {
      throw new Error(
        usb2Debit.error,
      );
    }


    assert(
      usb2Debit.data.authoritativeBalance ===
        2250,
      "Canonical balance after USB2 debit must be ₹2250.",
    );

    console.log(
      "PASS: USB2 debit ₹750 committed; canonical balance = ₹2250",
    );

    // ========================================================
    // TEST 3 - USB1 STALE SNAPSHOT MUST NOT SPEND
    // ========================================================

    const staleUsb1Debit =
      await provider.commitMutation({

        ...scope,

        expectedAuthorityGeneration:
          usb1Snapshot.authorityGeneration,

        expectedSpendCounter:
          usb1Snapshot.spendCounter,

        expectedHeadHash:
          usb1Snapshot.headHash,

        amount:
          500,

        mutationKind:
          "DEBIT",

        mutationId:
          "SELFTEST-USB1-STALE-DEBIT-500",

        occurredAt:
          "2026-10-03T00:02:00.000Z",
      });

    assert(
      !staleUsb1Debit.success,
      "STALE USB1 snapshot unexpectedly authorized a debit.",
    );

    console.log(
      "PASS: stale USB1 ₹3000 snapshot cannot authorize new debit",
    );

    // ========================================================
    // TEST 4 - CANONICAL BALANCE REMAINS ₹2250
    // ========================================================

    const afterStaleAttempt =
      await provider.readAuthority(
        scope,
      );

    if (!afterStaleAttempt.success) {
      throw new Error(
        afterStaleAttempt.error,
      );
    }


    assert(
      afterStaleAttempt.data.authoritativeBalance ===
        2250,
      "Stale USB attempt mutated canonical balance.",
    );

    console.log(
      "PASS: stale USB attempt caused zero canonical balance mutation",
    );

    // ========================================================
    // TEST 5 - SAME MUTATION REPLAY
    // ========================================================

    const replay =
      await provider.commitMutation({

        ...scope,

        expectedAuthorityGeneration:
          usb2Debit.data.authorityGeneration,

        expectedSpendCounter:
          usb2Debit.data.spendCounter,

        expectedHeadHash:
          usb2Debit.data.headHash,

        amount:
          750,

        mutationKind:
          "DEBIT",

        mutationId:
          "SELFTEST-USB2-DEBIT-750",

        occurredAt:
          "2026-10-03T00:03:00.000Z",
      });

    assert(
      !replay.success,
      "Same debit mutation was unexpectedly accepted twice.",
    );

    console.log(
      "PASS: same debit mutation replay rejected",
    );

    // ========================================================
    // TEST 6 - FINAL BALANCE
    // ========================================================

    const finalRead =
      await provider.readAuthority(
        scope,
      );

    if (!finalRead.success) {
      throw new Error(
        finalRead.error,
      );
    }


    assert(
      finalRead.data.authoritativeBalance ===
        2250,
      "Final canonical balance must remain ₹2250.",
    );

    assert(
      finalRead.data.lastMutationId ===
        "SELFTEST-USB2-DEBIT-750",
      "Canonical lastMutationId does not match the committed mutation.",
    );

    console.log(
      "PASS: final canonical balance = ₹2250",
    );

    console.log(
      "PASS: CANONICAL WALLET AUTHORITY USB1 / USB2 ANTI-FORK E2E",
    );

  }
  catch (error) {

    failure =
      error;

  }
  finally {

    try {

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
        "PASS: isolated temporary Wallet Authority state deleted",
      );

    }
    catch (cleanupError) {

      if (!failure) {
        failure =
          cleanupError;
      }
    }
  }

  if (failure) {
    throw failure;
  }
}

void runSelfTest()
  .then(
    () => {
      app.exit(
        0,
      );
    },
    (error) => {

      console.error(
        "FAIL: CANONICAL WALLET AUTHORITY USB1 / USB2 ANTI-FORK E2E",
        error,
      );

      app.exit(
        1,
      );
    },
  );
