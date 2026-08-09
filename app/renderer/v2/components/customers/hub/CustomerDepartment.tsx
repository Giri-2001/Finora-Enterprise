// ============================================================
// FINORA ENTERPRISE OS™
//
// CUSTOMER DEPARTMENT™
//
// DIGITAL FINANCE OFFICE
//
// MODULE  : Customer
// LAYER   : UI / Department
// VERSION : 2.0
// STATUS  : Production
//
// RESPONSIBILITY:
//
// - Render the Customer Department workspace
// - Display Customer Office through CustomerOfficeController
// - Open Customer Wizard for create/edit operations
// - Read Customer data through the Customer Store boundary
// - Hydrate Customer data from V2 storage before rendering
// - Load related Office data asynchronously
// - Refresh Customer Office when related FINORA data changes
//
// IMPORTANT:
//
// - No direct repository access.
// - No direct service access.
// - No direct localStorage access.
// - Customer persistence remains below the Store layer.
// - Loan / Collection data loading remains below their
//   respective service/repository boundaries.
// - Existing Customer Hub / Wizard behavior is preserved.
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

import StudioLayout
from "../../common/layout/StudioLayout";

import CustomerOfficeController
from "../office/CustomerOfficeController";

import CustomerWizard
from "../wizard/CustomerWizard";

import {
  getCustomers,
  hydrateCustomersFromStorage,
} from "../../../store/customers/customer.store";

import customerOfficeMapper
from "../office/CustomerOfficeController/mappers/customerOfficeMapper";

import type {
  OfficeCustomer,
} from "../office/CustomerOffice/types";

// ============================================================
// COMPONENT
// ============================================================

export default function CustomerDepartment() {

// ==========================================================
// CUSTOMER WIZARD STATE
// ==========================================================

const [
  showCustomerWizard,
  setShowCustomerWizard,
] = useState(false);

// ==========================================================
// EDITING CUSTOMER
// ==========================================================

const [
  editingCustomer,
  setEditingCustomer,
] = useState<
  OfficeCustomer | undefined
>(undefined);

// ==========================================================
// CUSTOMER OFFICE DATA
// ==========================================================

const [
  customers,
  setCustomers,
] = useState<
  OfficeCustomer[]
>([]);

// ==========================================================
// CUSTOMER OFFICE LOADING
// ==========================================================

const [
  customersLoading,
  setCustomersLoading,
] = useState(true);

// ==========================================================
// CUSTOMER OFFICE ERROR
// ==========================================================

const [
  customerLoadError,
  setCustomerLoadError,
] = useState<
  string | undefined
>(undefined);

// ==========================================================
// CUSTOMER DATA VERSION
//
// Used to trigger a fresh Office data load whenever an
// external FINORA data event is received.
// ==========================================================

const [
  customerDataVersion,
  setCustomerDataVersion,
] = useState(0);

// ==========================================================
// FINORA DATA UPDATE LISTENER
// ==========================================================

useEffect(() => {

  function handleLoanUpdate(): void {

    setCustomerDataVersion(
      (previous) =>
        previous + 1,
    );

  }

  window.addEventListener(
    "FINORA_LOAN_UPDATED",
    handleLoanUpdate,
  );

  return () => {

    window.removeEventListener(
      "FINORA_LOAN_UPDATED",
      handleLoanUpdate,
    );

  };

}, []);

// ==========================================================
// LOAD CUSTOMER OFFICE DATA
//
// IMPORTANT:
//
// Customer Store hydration is completed BEFORE the
// synchronous getCustomers() call.
//
// This guarantees that:
//
// - freshly created customers appear immediately
// - V2 persisted customers survive restart
// - legacy customers are migrated into V2 storage
// - Customer Office does not render stale cache data
//
// ==========================================================

useEffect(() => {

  let cancelled = false;

  async function loadCustomerOffice():
    Promise<void> {

    try {

      setCustomersLoading(
        true,
      );

      setCustomerLoadError(
        undefined,
      );

      // ----------------------------------------------------
      // HYDRATE CUSTOMER STORE FROM V2 STORAGE
      // ----------------------------------------------------

      await hydrateCustomersFromStorage();

      if (
        cancelled
      ) {

        return;

      }

      // ----------------------------------------------------
      // READ FRESH STORE CACHE
      // ----------------------------------------------------

      const customerProfiles =
        getCustomers();

      // ----------------------------------------------------
      // MAP CUSTOMER DOMAIN → CUSTOMER OFFICE
      // ----------------------------------------------------

      const mappedCustomers =
        await customerOfficeMapper(
          customerProfiles,
        );

      if (
        cancelled
      ) {

        return;

      }

      setCustomers(
        mappedCustomers,
      );

    } catch (
      error
    ) {

      if (
        cancelled
      ) {

        return;

      }

      console.error(
        "FINORA CUSTOMER OFFICE LOAD ERROR:",
        error,
      );

      setCustomers(
        [],
      );

      setCustomerLoadError(
        "Unable to load customer office data.",
      );

    } finally {

      if (
        !cancelled
      ) {

        setCustomersLoading(
          false,
        );

      }

    }

  }

  void loadCustomerOffice();

  return () => {

    cancelled = true;

  };

}, [
  customerDataVersion,
]);

// ==========================================================
// OPEN CUSTOMER WIZARD
// ==========================================================

const handleOpenCustomerWizard =
useCallback(() => {

  setEditingCustomer(
    undefined,
  );

  setShowCustomerWizard(
    true,
  );

}, []);

// ==========================================================
// OPEN CUSTOMER WIZARD — EDIT MODE
// ==========================================================

const handleEditCustomer =
useCallback(
  (
    customer: OfficeCustomer,
  ) => {

    setEditingCustomer(
      customer,
    );

    setShowCustomerWizard(
      true,
    );

  },
  [],
);

// ==========================================================
// BACK TO CUSTOMERS HUB
// ==========================================================

const handleBackToCustomersHub =
useCallback(() => {

  setEditingCustomer(
    undefined,
  );

  setShowCustomerWizard(
    false,
  );

  // --------------------------------------------------------
  // Force Customer Office to reload after returning from
  // Customer Wizard.
  // --------------------------------------------------------

  setCustomerDataVersion(
    (previous) =>
      previous + 1,
  );

}, []);

// ==========================================================
// RENDER
// ==========================================================

return (

  <StudioLayout
    department="Customers Hub"
    allowScroll={false}
  >

    {/* ====================================================
        CUSTOMER OFFICE / CUSTOMER WIZARD
        ==================================================== */}

    {showCustomerWizard ? (

      <CustomerWizard
        editCustomer={
          editingCustomer
        }

        onBackToCustomersHub={
          handleBackToCustomersHub
        }
      />

    ) : (

      <>

        {customerLoadError ? (

          <div>
            {customerLoadError}
          </div>

        ) : (

          <CustomerOfficeController
            customers={
              customers
            }

            onOpenCustomerWizard={
              handleOpenCustomerWizard
            }

            onEditCustomer={
              handleEditCustomer
            }
          />

        )}

        {/* ==================================================
            Loading state intentionally remains lightweight.
            Customer Office owns its visual presentation.
        ================================================== */}

        {customersLoading && (
          <div
            aria-hidden="true"
            style={{
              display: "none",
            }}
          />
        )}

      </>

    )}

  </StudioLayout>
);

}

// ============================================================
// END
// ============================================================
