/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER STORE
   -----------------------------------------------------------
   Module  : Customer
   Layer   : Business
   Version : 2.0
   Status  : Production
=========================================================== */

import type { CustomerProfile } from "../../types/customers";

/* ===========================================================
   STORAGE KEY
=========================================================== */

const STORAGE_KEY = "FINORA_CUSTOMERS_V2";

/* ===========================================================
   LOCAL CACHE
=========================================================== */

let customerCache: CustomerProfile[] = [];

/* ===========================================================
   LOAD
=========================================================== */

function load(): CustomerProfile[] {
  try {
    const value = localStorage.getItem(STORAGE_KEY);

    if (!value) {
      customerCache = [];
      return customerCache;
    }

    customerCache = JSON.parse(value) as CustomerProfile[];

    return [...customerCache];
  } catch {
    customerCache = [];
    return [];
  }
}

/* ===========================================================
   SAVE
=========================================================== */

function save(customers: CustomerProfile[]): void {
  customerCache = [...customers];

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(customerCache),
  );
}

/* ===========================================================
   GET ALL
=========================================================== */

export function getCustomers(): CustomerProfile[] {
  if (customerCache.length === 0) {
    load();
  }

  return [...customerCache];
}

/* ===========================================================
   GET ONE
=========================================================== */

export function getCustomer(
  customerId: string,
): CustomerProfile | undefined {
  return getCustomers().find(
    (customer) =>
      customer.identity.customerId === customerId,
  );
}

/* ===========================================================
   ADD
=========================================================== */

export function addCustomer(
  customer: CustomerProfile,
): void {
  save([
    ...getCustomers(),
    customer,
  ]);
}

/* ===========================================================
   UPDATE
=========================================================== */

export function updateCustomer(
  updated: CustomerProfile,
): void {
  save(
    getCustomers().map((customer) =>
      customer.identity.customerId ===
      updated.identity.customerId
        ? updated
        : customer,
    ),
  );
}

/* ===========================================================
   ARCHIVE
=========================================================== */

export function archiveCustomer(
  customerId: string,
): void {
  save(
    getCustomers().map((customer) =>
      customer.identity.customerId === customerId
        ? {
            ...customer,
            internal: {
              ...customer.internal,
              isArchived: true,
            },
          }
        : customer,
    ),
  );
}

/* ===========================================================
   RESTORE
=========================================================== */

export function restoreCustomer(
  customerId: string,
): void {
  save(
    getCustomers().map((customer) =>
      customer.identity.customerId === customerId
        ? {
            ...customer,
            internal: {
              ...customer.internal,
              isArchived: false,
            },
          }
        : customer,
    ),
  );
}

/* ===========================================================
   SOFT DELETE
=========================================================== */

export function deleteCustomer(
  customerId: string,
): void {
  save(
    getCustomers().map((customer) =>
      customer.identity.customerId === customerId
        ? {
            ...customer,
            internal: {
              ...customer.internal,
              isDeleted: true,
            },
          }
        : customer,
    ),
  );
}

/* ===========================================================
   REPLACE
=========================================================== */

export function replaceCustomers(
  customers: CustomerProfile[],
): void {
  save(customers);
}
