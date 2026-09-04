// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 CUSTOMER HOOK
//
// Module  : Customer
// Layer   : Hooks
// Version : 2.0
// Status  : Production
//
// RESPONSIBILITY:
//
// - Provide React state access to Customer records
// - Delegate Customer persistence to CustomerService
// - Keep repository/storage details outside React UI
// - Provide stable Customer CRUD actions
// - Refresh React state after successful mutations
//
// IMPORTANT:
//
// - No direct localStorage access.
// - No direct repository access.
// - No direct StorageManager access.
// - No Customer UI logic.
// - No Loan / Collection / Payment logic.
//
// ARCHITECTURE:
//
// UI
//   ↓
// useCustomer
//   ↓
// CustomerService
//   ↓
// CustomerRepository
//   ↓
// StorageManager
//   ↓
// Storage Adapter
//
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import {
  useCallback,
  useEffect,
  useState,
} from "react";


import type {
  CustomerProfile,
} from "../../types/customers";


import {
  customerService,
} from "../../services/customer/customerService";

import {
  startFinoraProcessing,
  stopFinoraProcessing,
} from "../../components/common/feedback/finoraProcessing.service";


// ============================================================
// CUSTOMER HOOK
// ============================================================

export function useCustomer() {

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    customers,
    setCustomers,
  ] = useState<CustomerProfile[]>([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState<string | undefined>(
    undefined,
  );


  // ==========================================================
  // REFRESH
  // ==========================================================

  const refresh =
    useCallback(
      async (): Promise<void> => {

        try {

          setLoading(true);

          setError(
            undefined,
          );


          const result =
            await customerService.getAll();


          if (!result.success) {

            setError(
              result.error ??
                "Unable to load customers.",
            );

            return;

          }


          setCustomers(
            result.data ?? [],
          );

        } catch {

          setError(
            "Unable to load customers.",
          );

        } finally {

          setLoading(false);

        }

      },
      [],
    );


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    void refresh();

  }, [
    refresh,
  ]);


  // ==========================================================
  // CREATE CUSTOMER
  // ==========================================================

  const create =
    useCallback(
      async (
        customer: CustomerProfile,
      ): Promise<void> => {

        try {

          setError(
            undefined,
          );


          const result =
            await customerService.create(
              customer,
            );


          if (!result.success) {

            const message =
              result.error ??
              "Unable to create customer.";


            setError(
              message,
            );


            throw new Error(
              message,
            );

          }


          await refresh();

        } catch (error) {

          if (
            error instanceof Error
          ) {

            setError(
              error.message,
            );

            throw error;

          }


          const message =
            "Unable to create customer.";


          setError(
            message,
          );


          throw new Error(
            message,
          );

        }

      },
      [
        refresh,
      ],
    );


  // ==========================================================
  // UPDATE CUSTOMER
  // ==========================================================

  const update =
    useCallback(
      async (
        customer: CustomerProfile,
      ): Promise<void> => {

        try {

          setError(
            undefined,
          );


          const result =
            await customerService.update(
              customer,
            );


          if (!result.success) {

            const message =
              result.error ??
              "Unable to update customer.";


            setError(
              message,
            );


            throw new Error(
              message,
            );

          }


          await refresh();

        } catch (error) {

          if (
            error instanceof Error
          ) {

            setError(
              error.message,
            );

            throw error;

          }


          const message =
            "Unable to update customer.";


          setError(
            message,
          );


          throw new Error(
            message,
          );

        }

      },
      [
        refresh,
      ],
    );


  // ==========================================================
  // ARCHIVE CUSTOMER
  //
  // Archive is a CustomerProfile state change.
  // Persistence is still delegated through CustomerService.
  // ==========================================================

  const archive =
    useCallback(
      async (
        customerId: string,
      ): Promise<void> => {

        const processingId =
          startFinoraProcessing(
            "Archiving Customer...",
          );

        try {

          setError(
            undefined,
          );


          const result =
            await customerService.getById(
              customerId,
            );


          if (!result.success) {

            const message =
              result.error ??
              "Unable to load customer.";


            setError(
              message,
            );


            throw new Error(
              message,
            );

          }


          if (!result.data) {

            const message =
              "Customer not found.";


            setError(
              message,
            );


            throw new Error(
              message,
            );

          }


          const updatedCustomer: CustomerProfile = {

            ...result.data,

            internal: {

              ...result.data.internal,

              isArchived:
                true,

            },

          };


          const updateResult =
            await customerService.update(
              updatedCustomer,
            );


          if (!updateResult.success) {

            const message =
              updateResult.error ??
              "Unable to archive customer.";


            setError(
              message,
            );


            throw new Error(
              message,
            );

          }


          await refresh();

        } catch (error) {

          if (
            error instanceof Error
          ) {

            setError(
              error.message,
            );

            throw error;

          }


          const message =
            "Unable to archive customer.";


          setError(
            message,
          );


          throw new Error(
            message,
          );

        } finally {
          stopFinoraProcessing(
            processingId,
          );
        }

      },
      [
        refresh,
      ],
    );


  // ==========================================================
  // RESTORE CUSTOMER
  // ==========================================================

  const restore =
    useCallback(
      async (
        customerId: string,
      ): Promise<void> => {

        const processingId =
          startFinoraProcessing(
            "Restoring Customer...",
          );

        try {

          setError(
            undefined,
          );


          const result =
            await customerService.getById(
              customerId,
            );


          if (!result.success) {

            const message =
              result.error ??
              "Unable to load customer.";


            setError(
              message,
            );


            throw new Error(
              message,
            );

          }


          if (!result.data) {

            const message =
              "Customer not found.";


            setError(
              message,
            );


            throw new Error(
              message,
            );

          }


          const updatedCustomer: CustomerProfile = {

            ...result.data,

            internal: {

              ...result.data.internal,

              isArchived:
                false,

            },

          };


          const updateResult =
            await customerService.update(
              updatedCustomer,
            );


          if (!updateResult.success) {

            const message =
              updateResult.error ??
              "Unable to restore customer.";


            setError(
              message,
            );


            throw new Error(
              message,
            );

          }


          await refresh();

        } catch (error) {

          if (
            error instanceof Error
          ) {

            setError(
              error.message,
            );

            throw error;

          }


          const message =
            "Unable to restore customer.";


          setError(
            message,
          );


          throw new Error(
            message,
          );

        } finally {
          stopFinoraProcessing(
            processingId,
          );
        }

      },
      [
        refresh,
      ],
    );


  // ==========================================================
  // DELETE CUSTOMER
  // ==========================================================

  const remove =
    useCallback(
      async (
        customerId: string,
      ): Promise<void> => {

        const processingId =
          startFinoraProcessing(
            "Deleting Customer...",
          );

        try {

          setError(
            undefined,
          );


          const result =
            await customerService.delete(
              customerId,
            );


          if (!result.success) {

            const message =
              result.error ??
              "Unable to delete customer.";


            setError(
              message,
            );


            throw new Error(
              message,
            );

          }


          await refresh();

        } catch (error) {

          if (
            error instanceof Error
          ) {

            setError(
              error.message,
            );

            throw error;

          }


          const message =
            "Unable to delete customer.";


          setError(
            message,
          );


          throw new Error(
            message,
          );

        } finally {
          stopFinoraProcessing(
            processingId,
          );
        }

      },
      [
        refresh,
      ],
    );


  // ==========================================================
  // REPLACE ALL CUSTOMERS
  // ==========================================================

  const replace =
    useCallback(
      async (
        items: CustomerProfile[],
      ): Promise<void> => {

        try {

          setError(
            undefined,
          );


          const result =
            await customerService.replaceAll(
              items,
            );


          if (!result.success) {

            const message =
              result.error ??
              "Unable to replace customers.";


            setError(
              message,
            );


            throw new Error(
              message,
            );

          }


          await refresh();

        } catch (error) {

          if (
            error instanceof Error
          ) {

            setError(
              error.message,
            );

            throw error;

          }


          const message =
            "Unable to replace customers.";


          setError(
            message,
          );


          throw new Error(
            message,
          );

        }

      },
      [
        refresh,
      ],
    );


  // ==========================================================
  // RETURN
  // ==========================================================

  return {

    customers,

    loading,

    error,

    refresh,

    addCustomer:
      create,

    updateCustomer:
      update,

    archiveCustomer:
      archive,

    restoreCustomer:
      restore,

    deleteCustomer:
      remove,

    replaceCustomers:
      replace,

  };

}


// ============================================================
// END
// ============================================================
