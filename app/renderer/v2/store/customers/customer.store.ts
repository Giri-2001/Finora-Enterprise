// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 CUSTOMER STORE
//
// MODULE  : Customer
// LAYER   : Business
// VERSION : 2.0
// STATUS  : Production
//
// RESPONSIBILITY:
//
// - Maintain the synchronous Customer UI state contract
// - Keep CustomerProfile objects in memory for immediate UI access
// - Delegate persistence through CustomerService
// - Keep existing Customer Hub / Wizard callers compatible
// - Support asynchronous hydration from V2 storage
// - Preserve legacy Customer records during migration
//
// IMPORTANT:
//
// - Existing UI-facing functions remain synchronous.
// - Persistent storage is asynchronous internally.
// - No direct repository access.
// - No filesystem access.
// - No Electron IPC.
// - V2 persistence goes through CustomerService.
// - Legacy storage is used only as compatibility fallback/migration.
// - Customer IDs are used to prevent duplicate records.
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  CustomerProfile,
} from "../../types/customers";

import {
  customerService,
} from "../../services/customer/customerService";

// ============================================================
// CONSTANTS
// ============================================================

const LEGACY_STORAGE_KEY =
  "FINORA_CUSTOMERS_V2";

// ============================================================
// LOCAL MEMORY CACHE
// ============================================================

let customerCache:
  CustomerProfile[] = [];

// ============================================================
// CACHE STATE
// ============================================================

let cacheHydrated =
  false;

// ============================================================
// LEGACY LOAD
//
// Compatibility fallback only.
//
// New Customer persistence goes through CustomerService.
//
// This function is intentionally synchronous because the
// existing Customer Store contract is synchronous.
// ============================================================

function loadLegacy():
  CustomerProfile[] {

  try {

    if (
      typeof localStorage ===
      "undefined"
    ) {

      customerCache = [];

      cacheHydrated = true;

      return [];

    }

    const value =
      localStorage.getItem(
        LEGACY_STORAGE_KEY,
      );

    if (!value) {

      customerCache = [];

      cacheHydrated = true;

      return [];

    }

    const parsed =
      JSON.parse(
        value,
      );

    if (
      !Array.isArray(parsed)
    ) {

      customerCache = [];

      cacheHydrated = true;

      return [];

    }

    customerCache =
      parsed as CustomerProfile[];

    cacheHydrated = true;

    return [
      ...customerCache,
    ];

  } catch {

    customerCache = [];

    cacheHydrated = true;

    return [];

  }
}

// ============================================================
// MERGE CUSTOMERS
//
// Customer ID is the canonical identity.
//
// Existing records are preserved.
// V2 records override legacy records with the same ID.
//
// This allows a gradual migration from the old localStorage
// customer collection into the V2 StorageManager boundary.
// ============================================================

function mergeCustomers(
  legacyCustomers: CustomerProfile[],
  v2Customers: CustomerProfile[],
):
  CustomerProfile[] {

  const merged =
    new Map<
      string,
      CustomerProfile
    >();

  // ----------------------------------------------------------
  // LEGACY FIRST
  // ----------------------------------------------------------

  for (
    const customer of
    legacyCustomers
  ) {

    const customerId =
      customer?.identity?.customerId;

    if (!customerId) {

      continue;

    }

    merged.set(
      customerId,
      customer,
    );

  }

  // ----------------------------------------------------------
  // V2 SECOND
  //
  // V2 is authoritative when the same customer exists
  // in both sources.
  // ----------------------------------------------------------

  for (
    const customer of
    v2Customers
  ) {

    const customerId =
      customer?.identity?.customerId;

    if (!customerId) {

      continue;

    }

    merged.set(
      customerId,
      customer,
    );

  }

  return Array.from(
    merged.values(),
  );
}

// ============================================================
// HYDRATE FROM V2 STORAGE
//
// This is the important V2 startup/read boundary.
//
// CustomerDepartment calls this before rendering the
// Customer Office.
//
// The function:
//
// 1. Reads V2 Customer storage.
// 2. Reads legacy customers for compatibility.
// 3. Merges both collections by customerId.
// 4. Updates the in-memory Customer Store cache.
// 5. Migrates the merged collection back into V2 storage.
//
// This prevents:
//
// - stale 10-customer cache
// - restart data loss appearance
// - duplicate customers
// - legacy/V2 split-brain state
// ============================================================

export async function hydrateCustomersFromStorage():
  Promise<CustomerProfile[]> {

  try {

    // --------------------------------------------------------
    // LOAD LEGACY DATA FIRST
    // --------------------------------------------------------

    let legacyCustomers:
      CustomerProfile[] = [];

    try {

      if (
        typeof localStorage !==
        "undefined"
      ) {

        const raw =
          localStorage.getItem(
            LEGACY_STORAGE_KEY,
          );

        if (raw) {

          const parsed =
            JSON.parse(
              raw,
            );

          if (
            Array.isArray(parsed)
          ) {

            legacyCustomers =
              parsed as CustomerProfile[];

          }

        }

      }

    } catch {

      legacyCustomers = [];

    }

    // --------------------------------------------------------
    // LOAD V2 DATA
    // --------------------------------------------------------

    const result =
      await customerService.getAll();

    // --------------------------------------------------------
    // V2 READ FAILED
    //
    // Preserve legacy data instead of replacing it with
    // an empty cache.
    // --------------------------------------------------------

    if (!result.success) {

      if (
        legacyCustomers.length > 0
      ) {

        customerCache = [
          ...legacyCustomers,
        ];

      } else {

        customerCache = [];

      }

      cacheHydrated = true;

      console.error(
        "FINORA CUSTOMER V2 HYDRATION FAILED:",
        result.error,
      );

      return [
        ...customerCache,
      ];

    }

    const v2Customers =
      result.data ?? [];

    // --------------------------------------------------------
    // MERGE LEGACY + V2
    // --------------------------------------------------------

    const mergedCustomers =
      mergeCustomers(
        legacyCustomers,
        v2Customers,
      );

    // --------------------------------------------------------
    // UPDATE MEMORY CACHE
    // --------------------------------------------------------

    customerCache = [
      ...mergedCustomers,
    ];

    cacheHydrated = true;

    // --------------------------------------------------------
    // MIGRATE / SYNCHRONIZE V2 STORAGE
    //
    // If legacy customers existed, or if the merged result
    // differs from the current V2 collection, persist the
    // complete merged collection through CustomerService.
    //
    // This makes the V2 collection authoritative after the
    // first successful hydration.
    // --------------------------------------------------------

    if (
      mergedCustomers.length > 0
    ) {

      const currentV2Ids =
        v2Customers.map(
          (customer) =>
            customer.identity.customerId,
        );

      const mergedIds =
        mergedCustomers.map(
          (customer) =>
            customer.identity.customerId,
        );

      const currentIdsKey =
        [...currentV2Ids]
          .sort()
          .join("|");

      const mergedIdsKey =
        [...mergedIds]
          .sort()
          .join("|");

      if (
        currentIdsKey !==
        mergedIdsKey
      ) {

        const persistResult =
          await customerService.replaceAll(
            mergedCustomers,
          );

        if (
          !persistResult.success
        ) {

          console.error(
            "FINORA CUSTOMER V2 MIGRATION FAILED:",
            persistResult.error,
          );

        }

      }

    }

    return [
      ...customerCache,
    ];

  } catch (error) {

    console.error(
      "FINORA CUSTOMER HYDRATION ERROR:",
      error,
    );

    // --------------------------------------------------------
    // FINAL LEGACY FALLBACK
    // --------------------------------------------------------

    const legacy =
      loadLegacy();

    customerCache = [
      ...legacy,
    ];

    cacheHydrated = true;

    return [
      ...customerCache,
    ];

  }

}

// ============================================================
// PERSIST
//
// The UI remains synchronous while persistence is delegated
// through the Customer Service layer.
// ============================================================

function persistCustomers(
  customers: CustomerProfile[],
): void {

  void customerService
    .replaceAll(
      customers,
    )
    .catch(() => {

      // ------------------------------------------------------
      // Persistence failures do not break synchronous UI
      // operations.
      //
      // Future application-level notification handling can
      // surface these failures without changing this API.
      // ------------------------------------------------------

    });

}

// ============================================================
// GET ALL
// ============================================================

export function getCustomers():
  CustomerProfile[] {

  if (!cacheHydrated) {

    loadLegacy();

  }

  return [
    ...customerCache,
  ];

}

// ============================================================
// GET ONE
// ============================================================

export function getCustomer(
  customerId: string,
):
  CustomerProfile | undefined {

  return getCustomers().find(
    (customer) =>
      customer.identity.customerId ===
      customerId,
  );

}

// ============================================================
// ADD
// ============================================================

export function addCustomer(
  customer: CustomerProfile,
): void {

  const customers =
    getCustomers();

  customerCache = [
    ...customers,
    customer,
  ];

  cacheHydrated = true;

  persistCustomers(
    customerCache,
  );

}

// ============================================================
// UPDATE
// ============================================================

export function updateCustomer(
  updated: CustomerProfile,
): void {

  const customers =
    getCustomers();

  customerCache =
    customers.map(
      (customer) =>
        customer.identity.customerId ===
        updated.identity.customerId

          ? updated

          : customer,
    );

  cacheHydrated = true;

  persistCustomers(
    customerCache,
  );

}

// ============================================================
// ARCHIVE
// ============================================================

export function archiveCustomer(
  customerId: string,
): void {

  const customers =
    getCustomers();

  customerCache =
    customers.map(
      (customer) =>
        customer.identity.customerId ===
        customerId

          ? {
              ...customer,

              internal: {
                ...customer.internal,

                isArchived:
                  true,
              },
            }

          : customer,
    );

  cacheHydrated = true;

  persistCustomers(
    customerCache,
  );

}

// ============================================================
// RESTORE
// ============================================================

export function restoreCustomer(
  customerId: string,
): void {

  const customers =
    getCustomers();

  customerCache =
    customers.map(
      (customer) =>
        customer.identity.customerId ===
        customerId

          ? {
              ...customer,

              internal: {
                ...customer.internal,

                isArchived:
                  false,
              },
            }

          : customer,
    );

  cacheHydrated = true;

  persistCustomers(
    customerCache,
  );

}

// ============================================================
// SOFT DELETE
// ============================================================

export function deleteCustomer(
  customerId: string,
): void {

  const customers =
    getCustomers();

  customerCache =
    customers.map(
      (customer) =>
        customer.identity.customerId ===
        customerId

          ? {
              ...customer,

              internal: {
                ...customer.internal,

                isDeleted:
                  true,
              },
            }

          : customer,
    );

  cacheHydrated = true;

  persistCustomers(
    customerCache,
  );

}

// ============================================================
// REPLACE
// ============================================================

export function replaceCustomers(
  customers: CustomerProfile[],
): void {

  customerCache = [
    ...customers,
  ];

  cacheHydrated = true;

  persistCustomers(
    customerCache,
  );

}

// ============================================================
// HYDRATE
//
// Used by startup migration layers.
//
// This updates memory only.
// It does NOT write data again.
// ============================================================

export function hydrateCustomers(
  customers: CustomerProfile[],
): void {

  customerCache = [
    ...customers,
  ];

  cacheHydrated = true;

}

// ============================================================
// CLEAR CACHE
//
// Does NOT delete persisted Customer records.
// ============================================================

export function clearCustomerCache():
  void {

  customerCache = [];

  cacheHydrated = false;

}

// ============================================================
// CACHE STATUS
// ============================================================

export function isCustomerCacheHydrated():
  boolean {

  return cacheHydrated;

}

// ============================================================
// END
// ============================================================
