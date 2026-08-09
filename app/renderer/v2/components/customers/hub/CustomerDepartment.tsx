/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER DEPARTMENT™

   DIGITAL FINANCE OFFICE
=========================================================== */

import {
  useEffect,
  useMemo,
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
} from "../../../store/customers/customer.store";

import customerOfficeMapper
  from "../office/CustomerOfficeController/mappers/customerOfficeMapper";

import type {
  OfficeCustomer,
} from "../office/CustomerOffice/types";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerDepartment() {

  const [
    showCustomerWizard,
    setShowCustomerWizard,
  ] = useState(false);

  const [
    editingCustomer,
    setEditingCustomer,
  ] = useState<OfficeCustomer | undefined>(
    undefined,
  );

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);

  /* ==========================================
     FINORA DATA UPDATE LISTENER
  ========================================== */

  useEffect(() => {

    function handleLoanUpdate() {

      console.log(
        "FINORA CUSTOMER DATA REFRESH",
      );

      setRefreshKey(
        (previous) => previous + 1,
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

  /* ===========================================================
     CUSTOMER DATA
  =========================================================== */

  const customers = useMemo(() => {

    return customerOfficeMapper(
      getCustomers(),
    );

  }, [
    refreshKey,
  ]);

  /* ===========================================================
     OPEN CUSTOMER WIZARD
  =========================================================== */

  function handleOpenCustomerWizard() {

    setEditingCustomer(
      undefined,
    );

    setShowCustomerWizard(
      true,
    );

  }

  /* ===========================================================
     OPEN CUSTOMER WIZARD — EDIT MODE
  =========================================================== */

  function handleEditCustomer(
    customer: OfficeCustomer,
  ) {

    setEditingCustomer(
      customer,
    );

    setShowCustomerWizard(
      true,
    );

  }

  /* ===========================================================
   BACK TO CUSTOMERS HUB
=========================================================== */

function handleBackToCustomersHub() {

  setEditingCustomer(
    undefined,
  );

  setShowCustomerWizard(
    false,
  );

}

  return (

    <StudioLayout
      department="Customers Hub"
      allowScroll={false}
    >

      {/* ==========================================
          CUSTOMER OFFICE CONTENT ONLY

          HEADER REMOVED
          RECEPTION STYLE VIEW
      ========================================== */}

      {
        showCustomerWizard

          ?

          (
            <CustomerWizard

  editCustomer={
    editingCustomer
  }

  onBackToCustomersHub={
    handleBackToCustomersHub
  }

/>
          )

          :

          (
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
          )
      }

    </StudioLayout>

  );

}
