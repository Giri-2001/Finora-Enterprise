/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER OFFICE™

   COMPONENT
=========================================================== */

import {
  useEffect,
  useState,
} from "react";


import CustomerProfilePanel
  from "./components/CustomerProfilePanel";

import CustomerActionsPanel
  from "./components/CustomerActionsPanel";

import CustomerLoanPreviewCard
  from "./components/CustomerLoanPreviewCard";

import TodayCollectionsPreviewCard
  from "./components/TodayCollectionsPreviewCard";

import ActionNeededPreviewCard
  from "./components/ActionNeededPreviewCard";

import CustomerLoanPanel
  from "./components/CustomerLoanPanel";

import LoanStudio
  from "./components/LoanStudio";

import CollectionStudio
  from "./components/CollectionStudio";

import EmptyState
  from "../../../common/feedback/EmptyState";


import {

  OFFICE_TITLE,

  OFFICE_SUBTITLE,

} from "./constants";


import {

  hasCustomer,

  buildEmptyDesk,

} from "./helpers";


import type {

  CustomerOfficeProps,

} from "./types";


import {

  containerStyle,

  headerStyle,

  titleStyle,

  subtitleStyle,

  workspaceStyle,

  leftColumnStyle,

  rightColumnStyle,

  panelStyle,

} from "./styles";



/* ===========================================================
   COMPONENT
=========================================================== */


export default function CustomerOffice({

  selectedCustomer,

}: CustomerOfficeProps) {

  const emptyDesk =
    buildEmptyDesk();


  const [workspace, setWorkspace] =

    useState<
      | "overview"
      | "loan"
      | "collection"
      | "documents"
      | "timeline"
      | "reports"
    >(
      "overview",
    );

    useEffect(() => {


  function refreshCustomerLoans() {


    console.log(
      "FINORA LOAN UPDATE RECEIVED",
    );


    window.dispatchEvent(
      new Event(
        "FINORA_CUSTOMER_REFRESH",
      ),
    );


  }


  window.addEventListener(
    "FINORA_LOAN_UPDATED",
    refreshCustomerLoans,
  );


  return () => {


    window.removeEventListener(
      "FINORA_LOAN_UPDATED",
      refreshCustomerLoans,
    );


  };


}, []);


  console.log(
  "SELECTED CUSTOMER FULL DATA:",
  selectedCustomer,
);

console.log(
  "CUSTOMER LOANS:",
  selectedCustomer?.loans,
);


  return (


    <section style={containerStyle}>


      {/* ==========================================
          HEADER
      ========================================== */}


      <div style={headerStyle}>


        <h2 style={titleStyle}>

          {OFFICE_TITLE}

        </h2>


        <p style={subtitleStyle}>

          {OFFICE_SUBTITLE}

        </p>


      </div>



      {/* ==========================================
          WORKSPACE
      ========================================== */}


      {


        hasCustomer(

          selectedCustomer,

        )


        ? (


          <section style={workspaceStyle}>


            {/* ======================================
                LEFT COLUMN
            ====================================== */}


            <div style={leftColumnStyle}>


              <CustomerProfilePanel

                customer={
                  selectedCustomer!
                }

              />



              <CustomerActionsPanel


                onApplyLoan={() =>
                  setWorkspace(
                    "loan",
                  )
                }


                onCollectPayment={() =>
                  setWorkspace(
                    "collection",
                  )
                }


                onDocuments={() =>
                  setWorkspace(
                    "documents",
                  )
                }


                onTimeline={() =>
                  setWorkspace(
                    "timeline",
                  )
                }


                onReports={() =>
                  setWorkspace(
                    "reports",
                  )
                }


              />



              <CustomerLoanPreviewCard

                customer={
                  selectedCustomer!
                }

              />



              <TodayCollectionsPreviewCard

                customer={
                  selectedCustomer!
                }

              />



              <ActionNeededPreviewCard

                customer={
                  selectedCustomer!
                }

              />


            </div>




            {/* ======================================
                RIGHT COLUMN
            ====================================== */}


            <div style={rightColumnStyle}>


              <div style={panelStyle}>


                {workspace === "overview" && (


                  <CustomerLoanPanel

                    customer={
                      selectedCustomer!
                    }

                  />


                )}



                {workspace === "loan" && (


                  <LoanStudio


                    customerName={
                      selectedCustomer?.name
                    }


                    customerId={
                      selectedCustomer?.id
                    }


                    phoneNumber={
                      selectedCustomer?.phone
                    }


                  />


                )}



               {workspace === "collection" && (

  <CollectionStudio

  customerName={
    selectedCustomer?.name
  }

  customerId={
    selectedCustomer?.id
  }

  phoneNumber={
    selectedCustomer?.phone
  }

  loans={
 selectedCustomer?.loans ?? []
 }

/>

)}



              </div>


            </div>



          </section>


        )


        : (


          <section

            style={{

              padding: "24px",

            }}

          >


            <div

              style={{

                maxWidth: "520px",

                margin: "0 auto",

              }}

            >


              <EmptyState


                title={
                  emptyDesk.title
                }


                description={
                  emptyDesk.description
                }


              />


            </div>


          </section>


        )


      }


    </section>


  );

}
