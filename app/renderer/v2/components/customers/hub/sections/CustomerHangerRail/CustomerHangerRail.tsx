/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HANGER RAIL™

   RESPONSIVE CUSTOMER PRESENTATION

   Module  : Customer Hub
   Layer   : Sections
   Version : 2.3.1
   Status  : Production

   RESPONSIBILITY:
   - Render the customer hanger rail
   - Resolve Customer Responsive Engine tokens
   - Supply responsive grid geometry to EnterpriseCardGrid
   - Preserve customer selection behavior
   - Preserve premium hanger presentation

   CUSTOMER GRID CONTRACT:
   MOBILE   → 1
   TABLET   → 3
   LAPTOP   → 5
   DESKTOP  → 6

   IMPORTANT:
   - No hard-coded responsive breakpoints
   - No hard-coded responsive column counts
   - No hard-coded responsive gaps
   - Responsive values come from customers.tokens.ts
   - The rail provides the complete resolved content width
     to EnterpriseCardGrid.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useEffect,
  useState,
} from "react";

import type {
  CSSProperties,
} from "react";

import EnterpriseCardGrid
  from "../../../../common/EnterpriseCardGrid";

import CustomerHanger
  from "../../cards/CustomerHanger";

import type {
  CustomerHangerRailProps,
} from "./types";

import {
  containerStyle,
  railWrapperStyle,
  railStyle,
  getHangerAreaStyle,
} from "./styles";

import {
  getCustomerTokens,
} from "../../../../../utils/responsive/customers/customers.tokens";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerHangerRail({

  customers,

  selectedCustomerId,

  onCustomerSelect,

}: CustomerHangerRailProps) {


  /* =========================================================
     CUSTOMER RESPONSIVE TOKENS
  ========================================================= */

  const [
    customerTokens,
    setCustomerTokens,
  ] = useState(() =>
    getCustomerTokens(
      typeof window !== "undefined"
        ? window.innerWidth
        : 1280,
    ),
  );


  /* =========================================================
     RESPONSIVE VIEWPORT UPDATE
  ========================================================= */

  useEffect(() => {

    if (
      typeof window ===
      "undefined"
    ) {

      return;

    }


    function handleViewportChange():
      void {

      setCustomerTokens(
        getCustomerTokens(
          window.innerWidth,
        ),
      );

    }


    window.addEventListener(
      "resize",
      handleViewportChange,
    );


    handleViewportChange();


    return () => {

      window.removeEventListener(
        "resize",
        handleViewportChange,
      );

    };

  }, []);


  /* =========================================================
     HANGER AREA
  ========================================================= */

  const hangerAreaStyle =
    getHangerAreaStyle(
      customerTokens,
    );


  /* =========================================================
     GRID WIDTH CONTRACT
  ========================================================= */

  const resolvedGridStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    maxWidth:
      "100%",

    boxSizing:
      "border-box",

  };


  /* =========================================================
     SELECTED CUSTOMER

     Selection remains controlled by the parent.

     The value is intentionally consumed here so the rail
     remains compatible with controlled selection state.
  ========================================================= */

  void selectedCustomerId;


  /* =========================================================
     UI
  ========================================================= */

  return (

    <section
      style={
        containerStyle
      }
    >

      {/* =====================================================
          PREMIUM RAIL
      ===================================================== */}

      <div
        style={
          railWrapperStyle
        }
      >

        <div
          style={
            railStyle
          }
        />


        {/* ===================================================
            RESPONSIVE HANGER AREA
        =================================================== */}

        <div
          style={
            hangerAreaStyle
          }
        >

          <div
            style={
              resolvedGridStyle
            }
          >

            <EnterpriseCardGrid

              columns={
                customerTokens.grid.columns
              }

              gap={
                customerTokens.grid.gap
              }

            >

              {customers.map(
                (
                  customer,
                ) => (

                  <CustomerHanger

                    key={
                      customer.id
                    }

                    customer={
                      customer
                    }

                    onClick={(
                      selected,
                    ) => {

                      onCustomerSelect?.(
                        selected,
                      );

                    }}

                  />

                ),
              )}

            </EnterpriseCardGrid>

          </div>

        </div>

      </div>

    </section>

  );

}


/* ===========================================================
   END
=========================================================== */