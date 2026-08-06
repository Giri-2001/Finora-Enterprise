  /* ===========================================================
    FINORA ENTERPRISE OS™
    CUSTOMER OFFICE CONTROLLER™

    ASSEMBLY COMPONENT
  =========================================================== */

  import SmartWallPanel
    from "./components/SmartWallPanel";

  import WorkDeskPanel
    from "./components/WorkDeskPanel";


  import useCustomerOfficeController
    from "./hooks/useCustomerOfficeController";

  import type {
    CustomerOfficeControllerProps,
  } from "./types";

  /* ===========================================================
    COMPONENT
  =========================================================== */

  export default function CustomerOfficeController({

    customers,

  }: CustomerOfficeControllerProps) {

    const controller =
      useCustomerOfficeController(
        customers,
      );

  return (

    <div
      style={{

        width: "100%",

        display: "flex",

        flexDirection: "column",

        gap: "12px",

      }}
    >

      <SmartWallPanel

        title="FINORA Smart Customers Hub™"

        smartWallCustomers={
          controller.smartWallCustomers
        }

        railCustomers={
          controller.paginatedCustomers
        }

        selectedCustomerId={
          controller.selectedCustomer?.id
        }

        selectedCustomer={
          controller.selectedCustomer
        }

        onCustomerSelect={
  (customer) => {
    controller.selectCustomer({
      ...customer,
      phone: "",
    });
  }
}

        currentPage={
          controller.currentPage
        }

        totalCustomers={
          controller.filteredCustomers.length
        }

        customersPerPage={
          controller.customersPerPage
        }

        onPrevious={
          controller.previousPage
        }

        onNext={
          controller.nextPage
        }

      />


      <WorkDeskPanel

        selectedCustomer={
          controller.selectedCustomer
        }

      />

    </div>

  );

  }
