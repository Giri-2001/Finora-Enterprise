/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER HOOK
   -----------------------------------------------------------
   Module  : Customer
   Layer   : Hooks
   Version : 2.0
   Status  : Production
=========================================================== */

import { useCallback, useEffect, useState } from "react";

import type { CustomerProfile } from "../../types/customers";

import {
  addCustomer,
  archiveCustomer,
  deleteCustomer,
  getCustomers,
  replaceCustomers,
  restoreCustomer,
  updateCustomer,
} from "../../store/customers/customer.store";

/* ===========================================================
   CUSTOMER HOOK
=========================================================== */

export function useCustomer() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  /* ===========================================================
     REFRESH
  =========================================================== */

  const refresh = useCallback(() => {
    try {
      setLoading(true);
      setCustomers(getCustomers());
      setError(undefined);
    } catch {
      setError("Unable to load customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /* ===========================================================
     ACTIONS
  =========================================================== */

  const create = useCallback((customer: CustomerProfile) => {
    addCustomer(customer);
    refresh();
  }, [refresh]);

  const update = useCallback((customer: CustomerProfile) => {
    updateCustomer(customer);
    refresh();
  }, [refresh]);

  const archive = useCallback((customerId: string) => {
    archiveCustomer(customerId);
    refresh();
  }, [refresh]);

  const restore = useCallback((customerId: string) => {
    restoreCustomer(customerId);
    refresh();
  }, [refresh]);

  const remove = useCallback((customerId: string) => {
    deleteCustomer(customerId);
    refresh();
  }, [refresh]);

  const replace = useCallback((items: CustomerProfile[]) => {
    replaceCustomers(items);
    refresh();
  }, [refresh]);

  /* ===========================================================
     RETURN
  =========================================================== */

  return {
    customers,

    loading,

    error,

    refresh,

    addCustomer: create,

    updateCustomer: update,

    archiveCustomer: archive,

    restoreCustomer: restore,

    deleteCustomer: remove,

    replaceCustomers: replace,
  };
}
