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
// - Delegate ALL persistence through CustomerService
// - Keep existing Customer Hub / Wizard callers compatible
// - Support asynchronous hydration from V2 storage
// - Keep the active FINORA storage context authoritative
//
// IMPORTANT:
//
// - Existing UI-facing functions remain synchronous.
// - Persistent storage is asynchronous internally.
// - No direct repository access.
// - No localStorage access.
// - No filesystem access.
// - No Electron IPC.
// - V2 persistence goes through CustomerService.
// - LOCAL legacy Customer storage is NOT used as a fallback.
// - Customer IDs remain the canonical identity.
//
// STORAGE RULE:
//
// Customer Store does NOT decide whether data is stored in:
//
// - LOCAL
// - USB
// - CLOUD
//
// StorageManager decides that.
//
// This Store only consumes CustomerService.
//
// VERSION : 2.0
// STATUS  : Production
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
// LOCAL MEMORY CACHE
//
// IMPORTANT:
//
// This is RAM only.
//
// It is NOT persistent storage.
//
// The cache is populated from CustomerService during
// hydrateCustomersFromStorage().
// ============================================================

let customerCache:
  CustomerProfile[] = [];


// ============================================================
// CACHE STATE
// ============================================================

let cacheHydrated =
  false;


// ============================================================
// HYDRATE FROM V2 STORAGE
//
// This is the ONLY startup/read hydration boundary.
//
// Flow:
//
// CustomerDepartment
//        ↓
// hydrateCustomersFromStorage()
//        ↓
// CustomerService
//        ↓
// CustomerRepository
//        ↓
// StorageManager
//        ↓
// ACTIVE FINORA STORAGE
//
// IMPORTANT:
//
// - No localStorage.
// - No legacy fallback.
// - No merge with browser cache.
// - No silent LOCAL fallback.
// - If active storage is unavailable, the cache becomes empty.
//
// This guarantees that the active FINORA storage boundary is
// authoritative.
// ============================================================

export async function hydrateCustomersFromStorage():
  Promise<CustomerProfile[]> {

  try {

    // --------------------------------------------------------
    // READ FROM V2 CUSTOMER SERVICE
    // --------------------------------------------------------

    const result =
      await customerService.getAll();


    // --------------------------------------------------------
    // STORAGE READ FAILED
    //
    // IMPORTANT:
    //
    // Do NOT resurrect old localStorage data.
    //
    // The active storage context is authoritative.
    // --------------------------------------------------------

    if (!result.success) {

      customerCache =
        [];

      cacheHydrated =
        true;


      console.error(
        "FINORA CUSTOMER V2 HYDRATION FAILED:",
        result.error,
      );


      return [
        ...customerCache,
      ];
    }


    // --------------------------------------------------------
    // READ SUCCESSFUL
    // --------------------------------------------------------

    const customers =
      result.data ?? [];


    // --------------------------------------------------------
    // UPDATE MEMORY CACHE
    // --------------------------------------------------------

    customerCache = [
      ...customers,
    ];


    cacheHydrated =
      true;


    return [
      ...customerCache,
    ];

  } catch (error) {

    // --------------------------------------------------------
    // SAFE FAILURE
    //
    // Never fall back to old local storage.
    // --------------------------------------------------------

    console.error(
      "FINORA CUSTOMER HYDRATION ERROR:",
      error,
    );


    customerCache =
      [];


    cacheHydrated =
      true;


    return [
      ...customerCache,
    ];
  }
}


// ============================================================
// PERSIST
//
// UI remains synchronous.
//
// Persistence is delegated asynchronously through
// CustomerService.
//
// IMPORTANT:
//
// The Store does not know whether CustomerService is using:
//
// LOCAL
// USB
// CLOUD
//
// That decision belongs to StorageManager.
// ============================================================

function persistCustomers(
  customers:
    CustomerProfile[],
): void {

  void customerService
    .replaceAll(
      customers,
    )
    .catch(
      (error) => {

        console.error(
          "FINORA CUSTOMER PERSISTENCE FAILED:",
          error,
        );
      },
    );
}


// ============================================================
// GET ALL
// ============================================================
//
// Synchronous UI contract.
//
// IMPORTANT:
//
// This function NEVER loads localStorage.
//
// If hydration has not happened yet, it returns the current
// memory cache, which is initially empty.
//
// CustomerDepartment is responsible for awaiting
// hydrateCustomersFromStorage() before rendering the office.
// ============================================================

export function getCustomers():
  CustomerProfile[] {

  return [
    ...customerCache,
  ];
}


// ============================================================
// GET ONE
// ============================================================

export function getCustomer(
  customerId:
    string,
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
  customer:
    CustomerProfile,
): void {

  const customers =
    getCustomers();


  // ----------------------------------------------------------
  // CUSTOMER ID PROTECTION
  //
  // Do not create duplicate records inside the memory cache.
  // ----------------------------------------------------------

  const existingIndex =
    customers.findIndex(
      (item) =>
        item.identity.customerId ===
        customer.identity.customerId,
    );


  if (
    existingIndex >= 0
  ) {

    customerCache =
      customers.map(
        (item, index) =>
          index === existingIndex
            ? customer
            : item,
      );

  } else {

    customerCache = [
      ...customers,
      customer,
    ];
  }


  cacheHydrated =
    true;


  persistCustomers(
    customerCache,
  );
}


// ============================================================
// UPDATE
// ============================================================

export function updateCustomer(
  updated:
    CustomerProfile,
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


  cacheHydrated =
    true;


  persistCustomers(
    customerCache,
  );
}


// ============================================================
// ARCHIVE
// ============================================================

export function archiveCustomer(
  customerId:
    string,
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


  cacheHydrated =
    true;


  persistCustomers(
    customerCache,
  );
}


// ============================================================
// RESTORE
// ============================================================

export function restoreCustomer(
  customerId:
    string,
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


  cacheHydrated =
    true;


  persistCustomers(
    customerCache,
  );
}


// ============================================================
// SOFT DELETE
// ============================================================

export function deleteCustomer(
  customerId:
    string,
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


  cacheHydrated =
    true;


  persistCustomers(
    customerCache,
  );
}


// ============================================================
// REPLACE
// ============================================================

export function replaceCustomers(
  customers:
    CustomerProfile[],
): void {

  customerCache = [
    ...customers,
  ];


  cacheHydrated =
    true;


  persistCustomers(
    customerCache,
  );
}


// ============================================================
// HYDRATE MEMORY ONLY
//
// This function intentionally does NOT persist.
//
// Used by callers that already possess authoritative V2 data.
// ============================================================

export function hydrateCustomers(
  customers:
    CustomerProfile[],
): void {

  customerCache = [
    ...customers,
  ];


  cacheHydrated =
    true;
}


// ============================================================
// CLEAR CACHE
//
// IMPORTANT:
//
// This clears ONLY the in-memory Customer Store cache.
//
// It does NOT delete persisted FINORA data.
//
// Use StorageManager.resetFinoraData() for an explicit
// FINORA data reset.
// ============================================================

export function clearCustomerCache():
  void {

  customerCache =
    [];


  cacheHydrated =
    false;
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
