/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HUB SUMMARY CARDS™

   RESPONSIVE PRESENTATION
   -----------------------------------------------------------
   Responsive geometry is supplied exclusively by the
   Customer Hub Summary Cards Responsive Engine.

   Component contains:
   - no viewport calculations
   - no breakpoint logic
   - no responsive dimensions
=========================================================== */


/* ===========================================================
   IMPORTS
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

  getCustomerHubSummaryCardsStyles,

} from "./styles";


import {
  useCustomerResponsive,
} from "../../../../../../utils/responsive/customers/customers.useResponsive";


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


  /* =========================================================
     CUSTOMER RESPONSIVE ENGINE
  ========================================================= */

  const {
    tokens,
  } =
    useCustomerResponsive();


  /* =========================================================
     SUMMARY CARDS RESPONSIVE TOKENS
  ========================================================= */

  const summaryStyles =
    getCustomerHubSummaryCardsStyles(
      tokens.meta.viewport,
      
    );


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <div
      style={
        containerStyle(
          summaryStyles,
        )
      }
    >


      {/* =====================================================
          TOTAL CUSTOMERS
      ===================================================== */}

      <div
        style={{
  ...cardStyle(
    summaryStyles,
  ),
  order: summaryStyles.totalCustomersOrder,
}}
      >

        <div
          style={
            titleStyle(
              summaryStyles,
            )
          }
        >
          Total Customers
        </div>


        <div
          style={
            valueStyle(
              summaryStyles,
            )
          }
        >
          {totalCustomers}
        </div>


        <div
          style={
            descriptionStyle(
              summaryStyles,
            )
          }
        >
          All Registered Customers
        </div>

      </div>


      {/* =====================================================
          ACTIVE CUSTOMERS
      ===================================================== */}

      <div
        style={{
  ...cardStyle(
    summaryStyles,
  ),
  order: summaryStyles.activeCustomersOrder,
}}
      >

        <div
          style={
            titleStyle(
              summaryStyles,
            )
          }
        >
          Active Customers
        </div>


        <div
          style={
            valueStyle(
              summaryStyles,
            )
          }
        >
          {activeCustomers}
        </div>


        <div
          style={
            descriptionStyle(
              summaryStyles,
            )
          }
        >
          Currently Active
        </div>

      </div>


      {/* =====================================================
          PAGINATION
      ===================================================== */}

      <div
        style={{
  ...paginationCardStyle(
    summaryStyles,
  ),
  order: summaryStyles.paginationOrder,
}}
      >

        <button
          type="button"
          onClick={onPrevious}
          style={
            paginationButtonStyle(
              summaryStyles,
            )
          }
        >
          {"<"}
        </button>


        <div
          style={
            paginationCenterStyle(
              summaryStyles,
            )
          }
        >

          <span
            style={
              paginationActiveDotStyle(
                summaryStyles,
              )
            }
          />

          <span
            style={
              paginationDotStyle(
                summaryStyles,
              )
            }
          />

          <span
            style={
              paginationDotStyle(
                summaryStyles,
              )
            }
          />

        </div>


        <button
          type="button"
          onClick={onNext}
          style={
            paginationButtonStyle(
              summaryStyles,
            )
          }
        >
          {">"}
        </button>

      </div>


      {/* =====================================================
          WORK DESK
      ===================================================== */}

      <div
        style={{
  ...cardStyle(
    summaryStyles,
  ),
  order: summaryStyles.workDeskOrder,
}}

        onClick={
          onOpenWorkspace
        }
      >

        <div
          style={
            titleStyle(
              summaryStyles,
            )
          }
        >
          Work Desk
        </div>


        <div
          style={
            valueStyle(
              summaryStyles,
            )
          }
        >
          Open
        </div>


        <div
          style={
            descriptionStyle(
              summaryStyles,
            )
          }
        >
          Customer Workspace
        </div>

      </div>


      {/* =====================================================
          CUSTOMER DATA
      ===================================================== */}

      <div
        style={{
  ...cardStyle(
    summaryStyles,
  ),
  order: summaryStyles.customerDataOrder,
}}

        onClick={
          onOpenCustomerData
        }
      >

        <div
          style={
            titleStyle(
              summaryStyles,
            )
          }
        >
          Customer Data
        </div>


        <div
          style={
            valueStyle(
              summaryStyles,
            )
          }
        >
          View
        </div>


        <div
          style={
            descriptionStyle(
              summaryStyles,
            )
          }
        >
          Profile Details
        </div>

      </div>


    </div>

  );

}


/* ===========================================================
   END
=========================================================== */