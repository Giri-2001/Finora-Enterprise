// ============================================================
// FINORA ENTERPRISE OS™
//
// CUSTOMER DEPARTMENT™
//
// DIGITAL FINANCE OFFICE
//
// MODULE  : Customer
// LAYER   : UI / Department
// VERSION : 2.1
// STATUS  : Production
//
// RESPONSIBILITY:
//
// - Render the Customer Department workspace
// - Display Customer Office through CustomerOfficeController
// - Open Customer Wizard for create/edit operations
// - Read Customer data through the Customer Store boundary
// - Restore the authenticated V2 storage mode after renderer
//   reloads
// - Hydrate Customer data from the selected storage before
//   rendering Customer Office
// - Clear stale in-memory Customer cache when storage context
//   changes
// - Load related Office data asynchronously
// - Refresh Customer Office when related FINORA data changes
// - Bridge nested Customer Wizard navigation to the global
//   FINORA application header
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
// - Storage mode comes from the authenticated login session.
// - No LOCAL fallback when the authenticated session is USB.
// - No USB fallback when the authenticated session is LOCAL.
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { useCallback, useEffect, useState } from "react";

import StudioLayout from "../../common/layout/StudioLayout";

import CustomerOfficeController from "../office/CustomerOfficeController";

import CustomerWizard from "../wizard/CustomerWizard";

import {
  getCustomers,
  hydrateCustomersFromStorage,
  clearCustomerCache,
} from "../../../store/customers/customer.store";

import customerOfficeMapper from "../office/CustomerOfficeController/mappers/customerOfficeMapper";

import type { OfficeCustomer } from "../office/CustomerOffice/types";

import { storageManager } from "../../../storage/storageManager";

import { StorageMode } from "../../../storage/storage.types";

// ============================================================
// CONSTANTS
// ============================================================

const STORAGE_MODE_SESSION_KEY = "FINORA_STORAGE_MODE";

const CUSTOMER_DEPARTMENT_REFRESH_EVENT =
  "FINORA_V2_CUSTOMER_DEPARTMENT_REFRESH";

// ============================================================
// CUSTOMER WIZARD NAVIGATION EVENTS
// ============================================================
//
// Customer Wizard is a nested workflow inside Customer
// Department.
//
// App.tsx owns the GlobalHeader Back button.
//
// CustomerDepartment owns the actual Wizard state.
//
// These events create the controlled bridge between the two.
//
// Flow:
//
// Customer Department
//        ↓
// Customer Wizard
//        ↓
// Global Header Back
//        ↓
// CustomerDepartment closes Wizard
//        ↓
// Customer Department
//
// ============================================================

const CUSTOMER_WIZARD_OPEN_EVENT = "FINORA_CUSTOMER_WIZARD_OPEN";

const CUSTOMER_WIZARD_CLOSE_EVENT = "FINORA_CUSTOMER_WIZARD_CLOSE";

const CUSTOMER_WIZARD_GLOBAL_BACK_EVENT = "FINORA_CUSTOMER_WIZARD_GLOBAL_BACK";

// ============================================================
// STORAGE MODE RESOLVER
// ============================================================

function getAuthenticatedStorageMode(): StorageMode {
  try {
    const storedMode = window.sessionStorage.getItem(STORAGE_MODE_SESSION_KEY);

    if (storedMode === StorageMode.USB) {
      return StorageMode.USB;
    }

    if (storedMode === StorageMode.CLOUD) {
      return StorageMode.CLOUD;
    }

    return StorageMode.LOCAL;
  } catch {
    // --------------------------------------------------------
    // A missing session mode means there is no persisted
    // renderer-session selection.
    //
    // Login normally writes this value before entering the
    // application.
    //
    // LOCAL is the safe application default here.
    // --------------------------------------------------------

    return StorageMode.LOCAL;
  }
}

// ============================================================
// COMPONENT
// ============================================================

interface CustomerDepartmentProps {
  companyName?: string;

  branchName?: string;
}


export default function CustomerDepartment({
  companyName,

  branchName,
}: CustomerDepartmentProps) {
  // ==========================================================
  // CUSTOMER WIZARD STATE
  // ==========================================================

  const [showCustomerWizard, setShowCustomerWizard] = useState(false);

  // ==========================================================
  // EDITING CUSTOMER
  // ==========================================================

  const [editingCustomer, setEditingCustomer] = useState<
    OfficeCustomer | undefined
  >(undefined);

  // ==========================================================
  // CUSTOMER OFFICE DATA
  // ==========================================================

  const [customers, setCustomers] = useState<OfficeCustomer[]>([]);

  // ==========================================================
  // CUSTOMER OFFICE LOADING
  // ==========================================================

  const [customersLoading, setCustomersLoading] = useState(true);

  // ==========================================================
  // CUSTOMER OFFICE ERROR
  // ==========================================================

  const [customerLoadError, setCustomerLoadError] = useState<
    string | undefined
  >(undefined);

  // ==========================================================
  // CUSTOMER DATA VERSION
  //
  // Used to trigger a fresh Office data load whenever an
  // external FINORA data event is received.
  // ==========================================================

  const [customerDataVersion, setCustomerDataVersion] = useState(0);

  // ==========================================================
  // FINORA DATA UPDATE LISTENER
  // ==========================================================

  useEffect(() => {
    function handleLoanUpdate(): void {
      setCustomerDataVersion((previous) => previous + 1);
    }

    function handleCustomerDepartmentRefresh(): void {
      setCustomerDataVersion((previous) => previous + 1);
    }

    window.addEventListener(
      "FINORA_LOAN_UPDATED",
      handleLoanUpdate,
    );

    window.addEventListener(
      CUSTOMER_DEPARTMENT_REFRESH_EVENT,
      handleCustomerDepartmentRefresh,
    );

    return () => {
      window.removeEventListener(
        "FINORA_LOAN_UPDATED",
        handleLoanUpdate,
      );

      window.removeEventListener(
        CUSTOMER_DEPARTMENT_REFRESH_EVENT,
        handleCustomerDepartmentRefresh,
      );
    };
  }, []);

  // ==========================================================
  // GLOBAL CUSTOMER WIZARD BACK
  // ==========================================================
  //
  // App.tsx owns the single GlobalHeader Back button.
  //
  // When the Customer Wizard is open, App.tsx sends:
  //
  // FINORA_CUSTOMER_WIZARD_GLOBAL_BACK
  //
  // This component closes the nested Wizard and returns to
  // Customer Office.
  //
  // IMPORTANT:
  //
  // - Does NOT touch Wizard Step state directly.
  // - Does NOT modify CustomerWizard internals.
  // - Does NOT modify Customer persistence.
  // - Does NOT modify top-level App navigation.
  //
  // ==========================================================

  useEffect(() => {
    function handleGlobalWizardBack(): void {
      if (!showCustomerWizard) {
        return;
      }

      setEditingCustomer(undefined);

      setShowCustomerWizard(false);

      // ------------------------------------------------------
      // Force Customer Office to reload after returning from
      // Customer Wizard.
      // ------------------------------------------------------

      setCustomerDataVersion((previous) => previous + 1);

      // ------------------------------------------------------
      // Tell App.tsx that the nested Wizard is now closed.
      // ------------------------------------------------------

      window.dispatchEvent(new CustomEvent(CUSTOMER_WIZARD_CLOSE_EVENT));
    }

    window.addEventListener(
      CUSTOMER_WIZARD_GLOBAL_BACK_EVENT,
      handleGlobalWizardBack,
    );

    return () => {
      window.removeEventListener(
        CUSTOMER_WIZARD_GLOBAL_BACK_EVENT,
        handleGlobalWizardBack,
      );
    };
  }, [showCustomerWizard]);

  // ==========================================================
  // LOAD CUSTOMER OFFICE DATA
  //
  // IMPORTANT:
  //
  // The authenticated login selects:
  //
  // LOCAL -> localStorageAdapter
  // USB   -> usbStorageAdapter
  // CLOUD -> cloudStorageAdapter
  //
  // The selected mode is persisted in sessionStorage so a
  // renderer reload does not silently reset StorageManager
  // back to its constructor default.
  //
  // Customer cache is cleared BEFORE fresh hydration so the
  // previous storage session can never remain visible.
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadCustomerOffice(): Promise<void> {
      try {
        setCustomersLoading(true);

        setCustomerLoadError(undefined);

        // ----------------------------------------------------
        // RESTORE AUTHENTICATED STORAGE MODE
        // ----------------------------------------------------

        const storageMode = getAuthenticatedStorageMode();

        const storageActivated =
          await storageManager.selectStorageMode(storageMode);

        if (!storageActivated.success) {
          throw new Error(
            storageActivated.error ??
              `Unable to restore FINORA ${storageMode} storage.`,
          );
        }

        if (cancelled) {
          return;
        }

        // ----------------------------------------------------
        // CLEAR OLD RAM CACHE
        //
        // This does NOT delete persistent records.
        // ----------------------------------------------------

        clearCustomerCache();

        // ----------------------------------------------------
        // HYDRATE CUSTOMER STORE FROM ACTIVE STORAGE
        // ----------------------------------------------------

        await hydrateCustomersFromStorage();

        if (cancelled) {
          return;
        }

        // ----------------------------------------------------
        // READ FRESH STORE CACHE
        // ----------------------------------------------------

        const customerProfiles = getCustomers();

        // ----------------------------------------------------
        // MAP CUSTOMER DOMAIN → CUSTOMER OFFICE
        // ----------------------------------------------------

        const mappedCustomers = await customerOfficeMapper(customerProfiles);

        if (cancelled) {
          return;
        }

        setCustomers(mappedCustomers);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("FINORA CUSTOMER OFFICE LOAD ERROR:", error);

        setCustomers([]);

        setCustomerLoadError("Unable to load customer office data.");
      } finally {
        if (!cancelled) {
          setCustomersLoading(false);
        }
      }
    }

    void loadCustomerOffice();

    return () => {
      cancelled = true;
    };
  }, [customerDataVersion]);

  // ==========================================================
  // OPEN CUSTOMER WIZARD
  // ==========================================================

  const handleOpenCustomerWizard = useCallback(() => {
    setEditingCustomer(undefined);

    setShowCustomerWizard(true);

    // ------------------------------------------------------
    // Tell App.tsx that the nested Customer Wizard is open.
    // ------------------------------------------------------

    window.dispatchEvent(new CustomEvent(CUSTOMER_WIZARD_OPEN_EVENT));
  }, []);

  // ==========================================================
  // OPEN CUSTOMER WIZARD — EDIT MODE
  // ==========================================================

  const handleEditCustomer = useCallback((customer: OfficeCustomer) => {
    setEditingCustomer(customer);

    setShowCustomerWizard(true);

    // ----------------------------------------------------
    // Tell App.tsx that the nested Customer Wizard is open.
    // ----------------------------------------------------

    window.dispatchEvent(new CustomEvent(CUSTOMER_WIZARD_OPEN_EVENT));
  }, []);

  // ==========================================================
  // BACK TO CUSTOMERS HUB
  // ==========================================================
  //
  // This is the existing Customer Wizard footer navigation.
  //
  // It remains independent from the GlobalHeader Back button.
  //
  // ==========================================================

  const handleBackToCustomersHub = useCallback(() => {
    setEditingCustomer(undefined);

    setShowCustomerWizard(false);

    // ------------------------------------------------------
    // Force Customer Office to reload after returning from
    // Customer Wizard.
    // ------------------------------------------------------

    setCustomerDataVersion((previous) => previous + 1);

    // ------------------------------------------------------
    // Tell App.tsx that the nested Wizard is now closed.
    // ------------------------------------------------------

    window.dispatchEvent(new CustomEvent(CUSTOMER_WIZARD_CLOSE_EVENT));
  }, []);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <StudioLayout department="Customers Hub" allowScroll={false}>
      {/* ====================================================
          CUSTOMER OFFICE / CUSTOMER WIZARD
          ==================================================== */}

      {showCustomerWizard ? (
        <CustomerWizard
          editCustomer={editingCustomer}
          onBackToCustomersHub={handleBackToCustomersHub}
        />
      ) : (
        <>
          {customerLoadError ? (
            <div>{customerLoadError}</div>
          ) : (
            <CustomerOfficeController
              customers={customers}
              companyName={companyName}
              branchName={branchName}
              onOpenCustomerWizard={handleOpenCustomerWizard}
              onEditCustomer={handleEditCustomer}
            />
          )}

          {/* ==================================================
              LOADING STATE
              ==================================================

              Customer Office owns the visual presentation.
              Keep this DOM node lightweight and hidden.
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
