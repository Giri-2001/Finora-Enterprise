// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 CUSTOMER MIGRATION SERVICE
//
// RESPONSIBILITY:
//
// - Migrate legacy Customer master records into V2 Storage
// - Preserve existing customer data
// - Prevent duplicate migration
// - Keep legacy storage untouched
// - Run only after V2 Storage has been initialized
//
// IMPORTANT:
//
// - Wizard drafts are NOT migrated.
// - Customer business rules do NOT belong here.
// - No Customer Store dependency.
// - No direct filesystem access.
// - No Electron IPC.
// - No Loan / Collection / Payment logic.
//
// ARCHITECTURE:
//
// Legacy Customer Storage
//          ↓
// Customer Migration Service
//          ↓
// Customer Repository
//          ↓
// StorageManager
//          ↓
// V2 Storage Adapter
//
// VERSION : 2.0
// STATUS  : Production Foundation
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import type {
  CustomerProfile,
} from "../../types/customers";


import {
  customerRepository,
} from "../../repositories/customer/customerRepository";


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
  "FINORA_CUSTOMERS_V2";


const MIGRATION_FLAG_KEY =
  "FINORA_V2_CUSTOMER_MIGRATION_COMPLETE";


// ============================================================
// LEGACY DATA LOADER
// ============================================================
//
// IMPORTANT:
//
// This is intentionally the ONLY place in the V2 Customer
// migration flow that reads the legacy localStorage record.
//
// The legacy storage remains untouched.
//
// ============================================================

function readLegacyCustomers():
  CustomerProfile[] {

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


    return parsed as CustomerProfile[];

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
    //
    // V2 data migration itself remains the primary concern.
    // --------------------------------------------------------

  }

}


// ============================================================
// LOAD V2 CUSTOMERS
// ============================================================

async function loadV2Customers():
  Promise<CustomerProfile[]> {

  const result =
    await customerRepository.getAll();


  if (
    !result.success ||
    !result.data
  ) {

    return [];

  }


  return result.data;

}


// ============================================================
// CHECK EXISTING V2 DATA
// ============================================================

async function hasV2Customers():
  Promise<boolean> {

  const customers =
    await loadV2Customers();


  return (
    customers.length >
    0
  );

}


// ============================================================
// MIGRATE CUSTOMER DATA
// ============================================================

export async function migrateCustomerData():
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
  // Therefore migration must only execute when the active
  // V2 storage mode is LOCAL.
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
  //
  // Once migration is complete, never copy the legacy data
  // again.
  //
  // This prevents duplicate records.
  //
  // ========================================================

  if (
    isMigrationComplete()
  ) {

    return;

  }


  // ========================================================
  // CHECK EXISTING V2 CUSTOMER DATA
  // ========================================================
  //
  // If V2 already contains customers, assume the migration
  // has already been performed or the V2 dataset is already
  // authoritative.
  //
  // Do NOT overwrite existing V2 data with legacy records.
  //
  // ========================================================

  const alreadyMigrated =
    await hasV2Customers();


  if (
    alreadyMigrated
  ) {

    markMigrationComplete();

    return;

  }


  // ========================================================
  // READ LEGACY CUSTOMER DATA
  // ========================================================

  const legacyCustomers =
    readLegacyCustomers();


  // ========================================================
  // NOTHING TO MIGRATE
  // ========================================================

  if (
    legacyCustomers.length ===
    0
  ) {

    markMigrationComplete();

    return;

  }


  // ========================================================
  // MIGRATE LEGACY DATA
  // ========================================================
  //
  // CustomerRepository owns the actual V2 persistence.
  //
  // The migration service does not know whether the
  // repository ultimately writes to local / USB / cloud.
  //
  // ========================================================

  const result =
    await customerRepository.replaceAll(
      legacyCustomers,
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

export const customerMigrationService = {

  migrate:
    migrateCustomerData,

};


// ============================================================
// END
// ============================================================
