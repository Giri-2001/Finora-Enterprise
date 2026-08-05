/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER DEPARTMENT™

   DIGITAL FINANCE OFFICE
=========================================================== */

import {
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

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerDepartment() {

  const [
    showCustomerWizard,
    setShowCustomerWizard,
  ] = useState(false);

  const customers = useMemo(() => {

    return customerOfficeMapper(
      getCustomers(),
    );

  }, []);

  return (

    <StudioLayout>

      {/* ==========================================
          HEADER
      ========================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >

        <div>

          <h2
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            Customer Department
          </h2>

          <p
            style={{
              margin: "6px 0 0",
              color: "#64748B",
            }}
          >
            Manage customers, loans and collections
          </p>

        </div>

        <button

          onClick={() =>
            setShowCustomerWizard(true)
          }

          style={{

            height: "46px",

            padding: "0 22px",

            borderRadius: "12px",

            border: "none",

            cursor: "pointer",

            fontWeight: 700,

            color: "#FFFFFF",

            background:
              "linear-gradient(180deg,#A67C38,#7A5625)",

          }}

        >

          + Add Customer

        </button>

      </div>

      {/* ==========================================
          BODY
      ========================================== */}

      {showCustomerWizard ? (

        <CustomerWizard />

      ) : (

        <CustomerOfficeController
          customers={customers}
        />

      )}

    </StudioLayout>

  );

}
