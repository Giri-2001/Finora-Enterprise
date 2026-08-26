/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER OFFICE CONTROLLER™

   RECEPTION / WORKSPACE ASSEMBLY

   RESPONSIBILITY:
   - Control Customer Reception Wall / Work Desk view
   - Preserve existing Customer Office selection logic
   - Open existing WorkDeskPanel
   - Keep Customer Wizard / Edit Customer flow intact
   - No new Customer page is created here
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import { useState } from "react";

import SmartWallPanel from "./components/SmartWallPanel";

import WorkDeskPanel from "./components/WorkDeskPanel";

import useCustomerOfficeController from "./hooks/useCustomerOfficeController";

import type { CustomerRailItem } from "../../hub/sections/CustomerHangerRail/types";

import type { CustomerOfficeControllerProps } from "./types";

/* ===========================================================
   VIEW MODE
=========================================================== */

type CustomerOfficeView = "wall" | "workspace";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerOfficeController({
  customers,

  onOpenCustomerWizard,

  onEditCustomer,
}: CustomerOfficeControllerProps) {
  /* =========================================================
     CUSTOMER OFFICE CONTROLLER
  ========================================================= */

  const controller = useCustomerOfficeController(customers);

  /* =========================================================
     VIEW STATE
     
     WALL:
       Customer Reception / Smart Wall

     WORKSPACE:
       Existing Customer Work Desk
  ========================================================= */

  const [view, setView] = useState<CustomerOfficeView>("wall");

  /* =========================================================
     CUSTOMER RAIL SELECTION
     
     CustomerRailItem is only a presentation item.

     Customer Office selection must always resolve back
     to the canonical OfficeCustomer record.
  ========================================================= */

  function handleCustomerSelect(customer: CustomerRailItem) {
    const officeCustomer = controller.filteredCustomers.find(
      (officeCustomer) => officeCustomer.id === customer.id,
    );

    if (!officeCustomer) {
      return;
    }

    controller.selectCustomer(officeCustomer);
  }

  /* =========================================================
     OPEN WORK DESK
     
     IMPORTANT:
     This does NOT create a new page.

     It opens the existing WorkDeskPanel that already
     exists in this Customer Office architecture.
  ========================================================= */

  function handleOpenWorkspace() {
    setView("workspace");
  }

  /* =========================================================
     OPEN CUSTOMER DATA
     
     Customer Data navigation remains available through the
     existing parent-level navigation architecture.

     This controller does not invent a new Customer Data page.
  ========================================================= */

  function handleOpenCustomerData() {
    /*
     * Customer Data destination will be connected through
     * the existing Customer Hub navigation once its existing
     * destination file is confirmed.
     *
     * No duplicate page is created here.
     */

    console.log("FINORA CUSTOMER DATA REQUEST");
  }

  /* =========================================================
     RETURN TO CUSTOMER WALL
     
     Existing Work Desk can use the normal Customer Hub
     navigation/back flow. This helper keeps the controller
     ready for that existing architecture.
  ========================================================= */

  function handleReturnToWall() {
    setView("wall");
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      style={{
        width: "100%",

        height: "100%",

        flex: 1,

        display: "flex",

        flexDirection: "column",

        overflow: "hidden",

        minHeight: 0,
      }}
      onMouseDownCapture={(event) => {
        const target = event.target as HTMLElement;

        /* =====================================================
           PROTECTED INTERACTIVE AREA
        ===================================================== */

        const protectedElement = target.closest(
          [
            '[data-finora-customer-card="true"]',

            '[data-finora-interactive="true"]',

            "button",

            "input",

            "textarea",

            "select",

            "a",
          ].join(","),
        );

        if (protectedElement) {
          return;
        }

        /* =====================================================
           EMPTY HUB AREA
        ===================================================== */

        controller.clearSelection();
      }}
    >
      {view === "wall" ? (
        /* ===================================================
             CUSTOMER RECEPTION WALL
          =================================================== */

        <div
          style={{
            flex: 1,

            minHeight: 0,

            overflow: "hidden",
          }}
        >
          <SmartWallPanel
            title={"FINORA Smart Customers Hub™"}
            /* =================================================
                 SMART WALL
              ================================================= */

            smartWallCustomers={controller.smartWallCustomers}
            /* =================================================
                 CUSTOMER RAIL
              ================================================= */

            railCustomers={controller.paginatedCustomers}
            /* =================================================
                 SELECTION
              ================================================= */

            selectedCustomerId={controller.selectedCustomer?.id}
            selectedCustomer={controller.selectedCustomer}
            onCustomerSelect={handleCustomerSelect}
            /* =================================================
                 CUSTOMER OFFICE SEARCH
              ================================================= */

            searchText={controller.searchText}
            onSearchChange={controller.setSearchText}
            /* =================================================
                 CUSTOMER WIZARD
              ================================================= */

            onOpenCustomerWizard={onOpenCustomerWizard}
            /* =================================================
                 EDIT CUSTOMER
              ================================================= */

            onEditCustomer={
              controller.selectedCustomer
                ? () => {
                    onEditCustomer?.(controller.selectedCustomer!);
                  }
                : undefined
            }
            /* =================================================
                 WORK DESK
                 
                 Opens the EXISTING WorkDeskPanel.
              ================================================= */

            onOpenWorkspace={handleOpenWorkspace}
            /* =================================================
                 CUSTOMER DATA
                 
                 Existing destination hook.
              ================================================= */

            onOpenCustomerData={handleOpenCustomerData}
            /* =================================================
                 CLEAR SELECTION
              ================================================= */

            onClearSelection={controller.clearSelection}
            /* =================================================
                 PAGINATION
              ================================================= */

            currentPage={controller.currentPage}
            totalCustomers={controller.filteredCustomers.length}
            customersPerPage={controller.customersPerPage}
            onPrevious={controller.previousPage}
            onNext={controller.nextPage}
          />
        </div>
      ) : (
        /* ===================================================
             CUSTOMER WORKSPACE / WORK DESK
          =================================================== */

        <div
          style={{
            flex: 1,

            minHeight: 0,

            overflow: "hidden",

            width: "100%",
          }}
        >
          <WorkDeskPanel selectedCustomer={controller.selectedCustomer} />
        </div>
      )}
    </div>
  );
}

/* ===========================================================
   END
=========================================================== */
