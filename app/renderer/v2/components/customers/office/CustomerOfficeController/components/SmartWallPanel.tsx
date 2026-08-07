/* ===========================================================
   FINORA ENTERPRISE OS™

   SMART WALL PANEL™

   CUSTOMER HUB PRESENTATION
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

import CustomerHubSummaryCards
from "./CustomerHubSummaryCards/CustomerHubSummaryCards";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function SmartWallPanel({

  title,

  smartWallCustomers,

  railCustomers,

  selectedCustomerId,

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


{/* =====================================================
    TOP TOOLBAR
===================================================== */}

<div

style={{

display:"grid",

gridTemplateColumns:
"260px minmax(420px,1fr) 260px",

alignItems:"center",

width:"100%",

marginBottom:"14px",

gap:"20px",

}}

>


{/* ======================================
    LEFT ADD CUSTOMER
====================================== */}

<button

style={{

width:"160px",

height:"42px",

padding:"0",

display:"flex",

alignItems:"center",

justifyContent:"center",

borderRadius:"14px",

border:"none",

cursor:"pointer",

fontWeight:800,

color:"#FFFFFF",

background:
"linear-gradient(180deg,#C99A55,#8A612B)",

boxShadow:
"0 8px 20px rgba(0,0,0,.25)",

}}

>

+ Add Customer

</button>



{/* ======================================
    CENTER SEARCH
====================================== */}

<div

style={{

display:"flex",

justifyContent:"center",

}}

>

<CustomerSearchBar />

</div>



{/* ======================================
    RIGHT EDIT CUSTOMER
====================================== */}

<div

style={{

display:"flex",

justifyContent:"flex-end",

}}

>

<button

style={{

width:"160px",

height:"42px",

padding:"0",

display:"flex",

alignItems:"center",

justifyContent:"center",

borderRadius:"14px",

border:"none",

cursor:"pointer",

fontWeight:800,

color:"#FFFFFF",

background:
"linear-gradient(180deg,#C99A55,#8A612B)",

boxShadow:
"0 8px 20px rgba(0,0,0,.25)",

}}

>

✏ Edit Customer

</button>

</div>


</div>



{/* =====================================================
    CUSTOMER ID WALL
===================================================== */}


<div

style={{

flex:1,

minHeight:0,

overflow:"hidden",

}}

>


<CustomerHangerRail

customers={railCustomers}

selectedCustomerId={selectedCustomerId}

onCustomerSelect={onCustomerSelect}

/>


</div>




{/* =====================================================
    PAGINATION
===================================================== */}


<div

style={{

display:"flex",

justifyContent:"center",

alignItems:"center",

marginTop:"12px",

}}

>


{/* =====================================================
    CUSTOMER HUB SUMMARY
===================================================== */}

<div

style={{

width:"100%",

marginTop:"12px",

}}

>

<CustomerHubSummaryCards

 totalCustomers={totalCustomers}

 activeCustomers={
   totalCustomers
 }


 currentPage={
   currentPage
 }


 totalPages={
   Math.ceil(
     totalCustomers /
     customersPerPage
   )
 }


 onPrevious={
   onPrevious
 }


 onNext={
   onNext
 }


/>


</div>


</div>






</CustomerSmartWall>


);


}

