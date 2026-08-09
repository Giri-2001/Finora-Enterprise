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
// - Support startup hydration from V2 storage
//
// IMPORTANT:
//
// - UI-facing functions remain synchronous.
// - Persistent storage is asynchronous internally.
// - No direct localStorage access for new Customer persistence.
// - No direct repository access.
// - No filesystem access.
// - No Electron IPC.
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
      JSON.parse(value);


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
// Used by the startup migration layer.
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
