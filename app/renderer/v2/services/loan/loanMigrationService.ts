// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 LOAN MIGRATION SERVICE
//
// MODULE  : Loan
// LAYER   : Migration Service
// VERSION : 2.0
// STATUS  : Production Foundation
//
// RESPONSIBILITY:
//
// - Migrate legacy Loan master records into V2 Storage
// - Preserve existing Loan data
// - Preserve Daily / Weekly / Monthly normalization
// - Prevent duplicate migration
// - Keep legacy storage untouched
// - Write migrated records through StorageManager
//
// IMPORTANT:
//
// - Legacy localStorage access is allowed ONLY here.
// - LoanRepository is NOT used by this migration service.
// - No Loan UI logic.
// - No Collection logic.
// - No Payment logic.
// - No direct filesystem access.
// - No Electron IPC.
//
// ARCHITECTURE:
//
// Legacy Loan Storage
//        ↓
// Loan Migration Service
//        ↓
// StorageManager
//        ↓
// V2 Storage Adapter
//
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import type {
  Loan,
} from "../../components/customers/office/CustomerOffice/types";


import {
  storageManager,
} from "../../storage/storageManager";


import {
  StorageMode,
} from "../../storage/storage.types";


// ============================================================
// CONSTANTS
// ============================================================

const LEGACY_STORAGE_KEY =
  "FINORA_LOANS_V2";


const LOAN_ENTITY =
  "LOAN";


const MIGRATION_FLAG_KEY =
  "FINORA_V2_LOAN_MIGRATION_COMPLETE";


// ============================================================
// LEGACY LOAN NORMALIZATION
// ============================================================
//
// Preserve the existing FINORA Loan normalization behavior.
//
// Existing legacy records may have only a title such as:
//
// Daily Loan
// Weekly Loan
// Monthly Loan
//
// The migration converts those records into the normalized
// Loan fields used by the V2 Loan model.
//
// ============================================================

function normalizeLegacyLoans(
  loans: Loan[],
):
  Loan[] {

  return loans.map(
    (loan) => {

      let loanType =
        loan.loanType;


      let repaymentType =
        loan.repaymentType;


      let title =
        loan.title;


      // ======================================================
      // DAILY
      // ======================================================

      if (
        title?.toLowerCase()
          .includes("daily")
      ) {

        title =
          "Daily Loan";


        loanType =
          "DAILY";


        repaymentType =
          "DAILY";

      }


      // ======================================================
      // WEEKLY
      // ======================================================

      else if (
        title?.toLowerCase()
          .includes("weekly")
      ) {

        title =
          "Weekly Loan";


        loanType =
          "WEEKLY";


        repaymentType =
          "WEEKLY";

      }


      // ======================================================
      // MONTHLY
      // ======================================================

      else if (
        title?.toLowerCase()
          .includes("monthly")
      ) {

        title =
          "Monthly Loan";


        loanType =
          "MONTHLY";


        repaymentType =
          "MONTHLY";

      }


      return {

        ...loan,

        title,

        loanType,

        repaymentType,

      };

    },
  );

}


// ============================================================
// LEGACY DATA LOADER
// ============================================================
//
// This is intentionally the ONLY location in the V2 Loan
// migration flow that reads the legacy localStorage record.
//
// ============================================================

function readLegacyLoans():
  Loan[] {

  try {

    if (
      typeof localStorage ===
      "undefined"
    ) {

      return [];

    }


    const raw =
      localStorage.getItem(
        LEGACY_STORAGE_KEY,
      );


    if (!raw) {

      return [];

    }


    const parsed =
      JSON.parse(raw);


    if (
      !Array.isArray(parsed)
    ) {

      return [];

    }


    return normalizeLegacyLoans(
      parsed as Loan[],
    );

  } catch {

    return [];

  }

}


// ============================================================
// MIGRATION FLAG
// ============================================================

function isMigrationComplete():
  boolean {

  try {

    return (
      localStorage.getItem(
        MIGRATION_FLAG_KEY,
      ) === "true"
    );

  } catch {

    return false;

  }

}


// ============================================================
// MARK MIGRATION COMPLETE
// ============================================================

function markMigrationComplete():
  void {

  try {

    localStorage.setItem(
      MIGRATION_FLAG_KEY,
      "true",
    );

  } catch {

    // --------------------------------------------------------
    // Migration flag failure must not crash application
    // startup.
    // --------------------------------------------------------

  }

}


// ============================================================
// LOAD V2 LOANS
// ============================================================

async function loadV2Loans():
  Promise<Loan[]> {

  const result =
    await storageManager.getAll<Loan>({
      entity:
        LOAN_ENTITY,
    });


  if (
    !result.success ||
    !result.data
  ) {

    return [];

  }


  return result.data;

}


// ============================================================
// CHECK EXISTING V2 LOANS
// ============================================================

async function hasV2Loans():
  Promise<boolean> {

  const loans =
    await loadV2Loans();


  return (
    loans.length >
    0
  );

}


// ============================================================
// MIGRATE LOAN DATA
// ============================================================

export async function migrateLoanData():
  Promise<void> {

  // ========================================================
  // STORAGE SAFETY
  // ========================================================

  if (
    !storageManager.isInitialized()
  ) {

    return;

  }


  // ========================================================
  // LOCAL LEGACY MIGRATION ONLY
  // ========================================================
  //
  // The legacy source is browser localStorage.
  //
  // Therefore migration can only run while V2 is using
  // the Local Storage adapter.
  //
  // ========================================================

  if (
    storageManager.getStorageMode() !==
    StorageMode.LOCAL
  ) {

    return;

  }


  // ========================================================
  // ALREADY MIGRATED
  // ========================================================

  if (
    isMigrationComplete()
  ) {

    return;

  }


  // ========================================================
  // CHECK EXISTING V2 LOANS
  // ========================================================
  //
  // Never overwrite an existing V2 Loan dataset with
  // legacy records.
  //
  // ========================================================

  const alreadyMigrated =
    await hasV2Loans();


  if (
    alreadyMigrated
  ) {

    markMigrationComplete();

    return;

  }


  // ========================================================
  // READ LEGACY LOANS
  // ========================================================

  const legacyLoans =
    readLegacyLoans();


  // ========================================================
  // NOTHING TO MIGRATE
  // ========================================================

  if (
    legacyLoans.length ===
    0
  ) {

    markMigrationComplete();

    return;

  }


  // ========================================================
  // WRITE TO V2 STORAGE
  // ========================================================
  //
  // StorageManager owns the active storage adapter.
  //
  // The migration service does not know whether the physical
  // implementation is local, USB, or cloud.
  //
  // ========================================================

  const result =
    await storageManager.replaceAll<Loan>(
      legacyLoans,
    );


  // ========================================================
  // SUCCESS
  // ========================================================

  if (
    result.success
  ) {

    markMigrationComplete();

  }

}


// ============================================================
// SERVICE EXPORT
// ============================================================

export const loanMigrationService = {

  migrate:
    migrateLoanData,

};


// ============================================================
// END
// ============================================================
