/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HUB SUMMARY CARDS™

   COMPONENT
=========================================================== */


import type {
  CustomerHubSummaryCardsProps,
} from "./types";


import {

  containerStyle,

  cardStyle,

  titleStyle,

  valueStyle,

  descriptionStyle,

 paginationCardStyle,
paginationButtonStyle,
paginationCenterStyle,
paginationDotStyle,
paginationActiveDotStyle,

} from "./styles";



/* ===========================================================
   COMPONENT
=========================================================== */


export default function CustomerHubSummaryCards({

  totalCustomers,

  activeCustomers,

  currentPage,

  totalPages,

  onPrevious,

  onNext,

  onOpenWorkspace,

  onOpenCustomerData,

}: CustomerHubSummaryCardsProps) {


return (

<div style={containerStyle}>


{/* =====================================================
    TOTAL CUSTOMERS
===================================================== */}

<div style={cardStyle}>

  <div style={titleStyle}>
    Total Customers
  </div>


  <div style={valueStyle}>
    {totalCustomers}
  </div>


  <div style={descriptionStyle}>
    All Registered Customers
  </div>


</div>



{/* =====================================================
    ACTIVE CUSTOMERS
===================================================== */}


<div style={cardStyle}>

  <div style={titleStyle}>
    Active Customers
  </div>


  <div style={valueStyle}>
    {activeCustomers}
  </div>


  <div style={descriptionStyle}>
    Currently Active
  </div>


</div>


{/* =====================================================
    PAGINATION
===================================================== */}

{/* =====================================================
    PAGINATION
===================================================== */}

<div style={paginationCardStyle}>

  <button
    onClick={onPrevious}
    style={paginationButtonStyle}
  >
    {"<"}
  </button>


  <div style={paginationCenterStyle}>

    <span style={paginationActiveDotStyle}/>

    <span style={paginationDotStyle}/>

    <span style={paginationDotStyle}/>

  </div>


  <button
    onClick={onNext}
    style={paginationButtonStyle}
  >
    {">"}
  </button>

</div>


{/* =====================================================
    WORK DESK
===================================================== */}


<div

style={cardStyle}

onClick={onOpenWorkspace}

>

<div style={titleStyle}>
  Work Desk
</div>


<div style={valueStyle}>
  Open
</div>


<div style={descriptionStyle}>
  Customer Workspace
</div>


</div>





{/* =====================================================
    CUSTOMER DATA
===================================================== */}


<div

style={cardStyle}

onClick={onOpenCustomerData}

>

<div style={titleStyle}>
  Customer Data
</div>


<div style={valueStyle}>
  View
</div>


<div style={descriptionStyle}>
  Profile Details
</div>


</div>



</div>

);


}
