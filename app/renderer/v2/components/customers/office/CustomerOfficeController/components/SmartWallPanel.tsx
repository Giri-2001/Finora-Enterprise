/* ===========================================================
   FINORA ENTERPRISE OS™
   SMART WALL PANEL™

   COMPONENT
=========================================================== */

import CustomerSmartWall
  from "../../../smartwall/CustomerSmartWall";

import CustomerHangerRail
  from "../../../hub/sections/CustomerHangerRail";

import PaginationPanel
  from "./PaginationPanel";

 import CustomerSearchBar
  from "../../../topbar/components/CustomerSearchBar/CustomerSearchBar";

import type {
  SmartWallPanelProps,
} from "./SmartWallPanel.types";


  import CustomerLoanPreviewCard
  from "../../CustomerOffice/components/CustomerLoanPreviewCard";

  import TodayCollectionsPreviewCard
  from "../../CustomerOffice/components/TodayCollectionsPreviewCard";

import ActionNeededPreviewCard
  from "../../CustomerOffice/components/ActionNeededPreviewCard";
/* ===========================================================
   COMPONENT
=========================================================== */

export default function SmartWallPanel({

  title,

  smartWallCustomers,

  railCustomers,

  selectedCustomerId,

  selectedCustomer,

  onCustomerSelect,

  currentPage,

  totalCustomers,

  customersPerPage,

  onPrevious,

  onNext,

}: SmartWallPanelProps) {

  return (

    <CustomerSmartWall

      title={title}

      customers={smartWallCustomers}

    >

      {/* ==========================================
          SMART HUB TOOLBAR
      ========================================== */}

<div

style={{

display: "grid",

gridTemplateColumns:
"360px minmax(420px,1fr) 220px",

alignItems: "start",

width: "100%",

height: "32px",

marginBottom: "0px",

columnGap: "20px",

paddingTop: "0px",

}}

>

        {/* ======================================
            LEFT
        ====================================== */}

        <div

          style={{

            fontSize: "20px",

            fontWeight: 600,

            color: "#F6D58A",

            lineHeight: "32px",

            marginTop: "-8px",

          }}

        >

          {title}

        </div>

        {/* ======================================
            CENTER
        ====================================== */}

        <div

          style={{

            display: "flex",

            justifyContent: "center",

            alignItems: "center",

          }}

        >

{/* ======================================
    CENTER
====================================== */}

<div

  style={{

    display: "flex",

    justifyContent: "center",

    alignItems: "flex-start",

    marginTop: "-12px",

  }}

>

  <CustomerSearchBar />

</div>
        </div>

        {/* ======================================
            RIGHT
        ====================================== */}

        <div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",

    paddingRight: "20px",   // 👈 New
  }}
>

          <PaginationPanel

            currentPage={currentPage}

            totalCustomers={totalCustomers}

            customersPerPage={customersPerPage}

            onPrevious={onPrevious}

            onNext={onNext}

          />

        </div>

      </div>

      {/* ==========================================
          HANGER RAIL
      ========================================== */}

      <div

style={{

display:"flex",

flexDirection:"column",

width:"100%",

gap:"22px",

}}

>


{/* ===============================
    CUSTOMER CARDS
================================ */}

<div

style={{

flex: 1,

paddingBottom: "6px",

}}

>

<CustomerHangerRail

  customers={railCustomers}

  selectedCustomerId={selectedCustomerId}

  onCustomerSelect={onCustomerSelect}

/>

</div>

{/* ==========================================
    PREMIUM DIVIDER
========================================== */}

<div

  style={{

    height: "3px",

    width: "100%",

    marginTop: "8px",

    marginBottom: "10px",

    borderRadius: "999px",

    background:
      "linear-gradient(90deg, transparent, rgba(212,175,55,.9), transparent)",

  }}

 />


{/* ==========================================
    SMART INSIGHTS
========================================== */}

<div

style={{

display: "grid",

gridTemplateColumns: "repeat(3, minmax(0,1fr))",

gap: "22px",

alignItems: "stretch",

marginTop: "6px",

}}

>

{selectedCustomer && (

<CustomerLoanPreviewCard customer={selectedCustomer}/>

)}

{selectedCustomer && (

  <TodayCollectionsPreviewCard

    customer={selectedCustomer}

  />

)}

{selectedCustomer && (

<ActionNeededPreviewCard

  customer={selectedCustomer}

/>

)}

</div>


</div>

    </CustomerSmartWall>

  );

}
