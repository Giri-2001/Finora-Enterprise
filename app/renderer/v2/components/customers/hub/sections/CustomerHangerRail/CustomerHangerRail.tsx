/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HANGER RAIL™

   RESPONSIVE CUSTOMER PRESENTATION

   Module  : Customer Hub
   Layer   : Sections
   Version : 3.0
   Status  : Production

   RESPONSIBILITY:
   - Render the customer hanger rail
   - Resolve Customer Responsive Engine tokens
   - Supply responsive grid geometry to EnterpriseCardGrid
   - Preserve customer selection behavior
   - Preserve premium hanger presentation
   - Control the active customer card flip

   CUSTOMER GRID CONTRACT:
   MOBILE   → 1
   TABLET   → 3
   LAPTOP   → 5
   DESKTOP  → 6

   FLIP CONTRACT:
   - CustomerHanger does NOT own flip state
   - CustomerHangerRail owns the active flipped customer ID
   - At most ONE customer card can be flipped at a time
   - Clicking the active flipped card closes it
   - Clicking another card automatically closes the previous card

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
     CONTROLLED FLIP STATE
     ---------------------------------------------------------
     Only one customer card may be flipped at a time.

     null
       ↓
     No card is flipped.

     customer.id
       ↓
     That specific customer card shows its back.
  ========================================================= */

  const [
    flippedCustomerId,
    setFlippedCustomerId,
  ] = useState<string | null>(
    null,
  );


  /* =========================================================
     RESPONSIVE VIEWPORT UPDATE
=========================================================== */

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
     FLIP STATE SAFETY
     ---------------------------------------------------------
     If the currently flipped customer is no longer present
     in the rail, automatically close the stale flip state.
  ========================================================= */

  useEffect(() => {

    if (
      flippedCustomerId ===
      null
    ) {

      return;

    }


    const customerStillExists =
      customers.some(
        (customer) =>
          customer.id ===
          flippedCustomerId,
      );


    if (
      !customerStillExists
    ) {

      setFlippedCustomerId(
        null,
      );

    }

  }, [
    customers,
    flippedCustomerId,
  ]);


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
     ---------------------------------------------------------
     Selection remains controlled by the parent.

     The value is intentionally consumed here so the rail
     remains compatible with controlled selection state.
  ========================================================= */

  void selectedCustomerId;


  /* =========================================================
     CUSTOMER FLIP HANDLER
     ---------------------------------------------------------
     This is the single source of truth for card flipping.

     Same card:
       flipped → front

     Different card:
       previous → front
       clicked card → back
  ========================================================= */

  function handleCustomerFlip(
    customerId: string,
  ): void {

    setFlippedCustomerId(
      (currentId) => {

        if (
          currentId ===
          customerId
        ) {

          return null;

        }


        return customerId;

      },
    );

  }


  /* =========================================================
     UI
=========================================================== */

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


                    /* =========================================
                       CONTROLLED FLIP STATE
                       ========================================= */

                    flipped={
                      flippedCustomerId ===
                      customer.id
                    }


                    /* =========================================
                       CONTROLLED FLIP ACTION
                       ========================================= */

                    onFlip={() => {

                      handleCustomerFlip(
                        customer.id,
                      );

                    }}


                    /* =========================================
                       CUSTOMER SELECTION
                       ========================================= */

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