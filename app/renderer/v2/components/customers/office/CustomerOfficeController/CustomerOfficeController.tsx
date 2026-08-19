/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER OFFICE CONTROLLER™

   RECEPTION / WORKSPACE ASSEMBLY
=========================================================== */

import {
  useState,
} from "react";

import SmartWallPanel
  from "./components/SmartWallPanel";

import WorkDeskPanel
  from "./components/WorkDeskPanel";

import useCustomerOfficeController
  from "./hooks/useCustomerOfficeController";

import type {
  CustomerRailItem,
} from "../../hub/sections/CustomerHangerRail/types";

import type {
  CustomerOfficeControllerProps,
} from "./types";

/* ===========================================================
   VIEW MODE
=========================================================== */

type CustomerOfficeView =
  | "wall"
  | "workspace";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerOfficeController({

  customers,

  onOpenCustomerWizard,

  onEditCustomer,

}: CustomerOfficeControllerProps) {

  const controller =
    useCustomerOfficeController(
      customers,
    );


  /* =========================================================
     VIEW STATE
  ========================================================= */

  const [
    view,
    setView,
  ] = useState<CustomerOfficeView>(
    "wall",
  );


  /* =========================================================
     CUSTOMER RAIL SELECTION
     
     CustomerRailItem is only a presentation item.
     
     Customer Office selection must always resolve back
     to the canonical OfficeCustomer record.
  ========================================================= */

  function handleCustomerSelect(
    customer: CustomerRailItem,
  ) {

    const officeCustomer =
      controller.filteredCustomers.find(
        (officeCustomer) =>
          officeCustomer.id ===
          customer.id,
      );


    if (!officeCustomer) {

      return;

    }


    controller.selectCustomer(
      officeCustomer,
    );

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

        const target =
          event.target as HTMLElement;


        /* =====================================================
           PROTECTED INTERACTIVE AREA
        ===================================================== */

        const protectedElement =
          target.closest(
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

      {
        view === "wall"

          ?

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

              title="FINORA Smart Customers Hub™"


              /* =================================================
                 SMART WALL
              ================================================= */

              smartWallCustomers={
                controller.smartWallCustomers
              }


              /* =================================================
                 CUSTOMER RAIL
              ================================================= */

              railCustomers={
                controller.paginatedCustomers
              }


              /* =================================================
                 SELECTION
              ================================================= */

              selectedCustomerId={
                controller.selectedCustomer?.id
              }

              selectedCustomer={
                controller.selectedCustomer
              }

              onCustomerSelect={
                handleCustomerSelect
              }


              /* =================================================
                 CUSTOMER OFFICE SEARCH
              ================================================= */

              searchText={
                controller.searchText
              }

              onSearchChange={
                controller.setSearchText
              }


              /* =================================================
                 CUSTOMER WIZARD
              ================================================= */

              onOpenCustomerWizard={
                onOpenCustomerWizard
              }


              /* =================================================
                 EDIT CUSTOMER
              ================================================= */

              onEditCustomer={

                controller.selectedCustomer

                  ?

                  () => {

                    onEditCustomer?.(
                      controller.selectedCustomer!,
                    );

                  }

                  :

                  undefined

              }


              /* =================================================
                 CLEAR SELECTION
              ================================================= */

              onClearSelection={
                controller.clearSelection
              }


              /* =================================================
                 PAGINATION
              ================================================= */

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

          </div>


          :


          /* ===================================================
             CUSTOMER WORKSPACE
          =================================================== */

          <div

            style={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}

          >

            <WorkDeskPanel

              selectedCustomer={
                controller.selectedCustomer
              }

            />

          </div>

      }

    </div>

  );

}


/* ===========================================================
   END
=========================================================== */