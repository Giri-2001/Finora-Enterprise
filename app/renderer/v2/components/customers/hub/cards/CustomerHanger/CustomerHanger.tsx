/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HANGER™

   PREMIUM FRONT IDENTITY PRESENTATION

   Module  : Customer Hub
   Layer   : Cards
   Version : 3.0
   Status  : Production

   RESPONSIBILITY:
   - Customer selection
   - Premium hanging presentation
   - Customer ID card presentation
   - Customer Responsive Engine integration
   - Card geometry propagation to CustomerCardFlip
   - Controlled single-card flip presentation

   RESPONSIVE CONTRACT:
   - Mobile  → 1 card
   - Tablet  → 3 cards
   - Laptop  → 5 cards
   - Desktop → 6 cards

   FLIP CONTRACT:
   - CustomerHanger does NOT own flip state.
   - Parent Customer Hub owns the active flipped customer.
   - flipped is received as a controlled prop.
   - onFlip is forwarded to the parent.
   - Parent is responsible for allowing only ONE
     customer card to remain flipped at a time.

   IMPORTANT:
   - Responsive visual values come from the Customer
     Responsive Engine.
   - This component does NOT decide breakpoint values.
   - This component does NOT calculate responsive dimensions.
   - Customer card width comes only from
     customerTokens.customerCards.width.
   - Customer card height comes only from
     customerTokens.customerCards.height.
   - Customer card minimum height comes only from
     customerTokens.customerCards.minHeight.
   - CustomerCardFlip inherits the resolved card geometry
     through this component.
   - Mobile card remains a real fixed-width ID card.
   - Mobile card does NOT expand to fill available width.
   - Mobile card is centered so equal side gaps remain.
   - Parent layout remains responsible for column count
     and inter-card spacing.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
  MouseEvent,
} from "react";


import CustomerIdCard
  from "../CustomerIdCard";


import CustomerCardFlip
  from "../CustomerCardFlip";


import CustomerIdCardBack
  from "../CustomerIdCardBack";


import type {
  CustomerHangerProps,
} from "./types";


import {
  canOpen,
} from "./helpers";


import {
  getCustomerTokens,
} from "../../../../../utils/responsive/customers/customers.tokens";


import {
  containerStyle,
  pinStyle,
  ropeStyle,
  hangerStyle,
  cardContainerStyle,
  bottomRailStyle,
} from "./styles";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerHanger({

  customer,

  onClick,

  flipped = false,

  onFlip,

}: CustomerHangerProps) {


  /* =========================================================
     CUSTOMER DATA
  ========================================================= */

  const {

    id,

    name,

    phone,

    photo,

    branch,

    active,

    kycVerified,

    fatherName,

    village,

    mandal,

    district,

    customerSince,

    outstandingAmount,

    lastPaymentDate,

    lastPaymentAmount,

    totalLoans,

    activeLoans,

    closedLoans,

  } = customer;


  /* =========================================================
     CUSTOMER RESPONSIVE ENGINE

     IMPORTANT:

     This component does NOT calculate breakpoints.

     The Responsive Engine resolves the correct token set.

     CustomerHanger only consumes the resolved values.
  ========================================================= */

  const customerTokens =
    getCustomerTokens(
      typeof window !== "undefined"
        ? window.innerWidth
        : 0,
    );


  /* =========================================================
     CUSTOMER CARD WIDTH

     SINGLE SOURCE OF TRUTH:

       customerTokens.customerCards.width

     IMPORTANT:

     - No local width calculation.
     - No viewport-based width calculation.
     - No percentage width.
     - No "100%" as the resolved card width.
  ========================================================= */

  const customerCardWidth =
    customerTokens.customerCards.width;


  /* =========================================================
     CUSTOMER CARD HEIGHT

     SINGLE SOURCE OF TRUTH:

       customerTokens.customerCards.height

     IMPORTANT:

     CustomerCardFlip uses height: 100%.

     Therefore this resolved height MUST reach the
     CustomerHanger card container so that the percentage
     height inside CustomerCardFlip has a definite parent
     height.
  ========================================================= */

  const customerCardHeight =
    customerTokens.customerCards.height;


  /* =========================================================
     CUSTOMER CARD MINIMUM HEIGHT

     SINGLE SOURCE OF TRUTH:

       customerTokens.customerCards.minHeight

     IMPORTANT:

     Preserve the Responsive Engine contract.

     Never independently calculate or replace this value.
  ========================================================= */

  const customerCardMinHeight =
    customerTokens.customerCards.minHeight;


  /* =========================================================
     HANGER ROOT

     IMPORTANT:

     The hanger root must have exactly the same resolved
     width as the Customer ID Card.

     The root height remains content-driven because the
     decorative hanger elements are part of this presentation
     layer.

     Card geometry itself is controlled by the dedicated
     card container below.
  ========================================================= */

  const resolvedContainerStyle:
    CSSProperties = {

    ...containerStyle,

    width:
      `${customerCardWidth}px`,

    minWidth:
      `${customerCardWidth}px`,

    maxWidth:
      `${customerCardWidth}px`,

    flex:
      `0 0 ${customerCardWidth}px`,

    flexShrink:
      0,

    boxSizing:
      "border-box",

    alignItems:
      "center",

    alignSelf:
      "center",

    marginInline:
      "auto",

    overflow:
      "visible",

  };


  /* =========================================================
     CUSTOMER CARD CONTAINER

     RESPONSIVE GEOMETRY CONTRACT:

       width
         ↓
       Customer Responsive Engine

       height
         ↓
       Customer Responsive Engine

       minHeight
         ↓
       Customer Responsive Engine

     IMPORTANT:

     This wrapper MUST expose an explicit height because
     CustomerCardFlip intentionally consumes:

       width: 100%
       height: 100%

     Without this explicit parent height, the flip surface
     cannot reliably resolve its vertical geometry.

     No breakpoint values are calculated here.

     IMPORTANT FLEX FIX:

     flex-basis must use CARD WIDTH, not CARD HEIGHT.

       CORRECT:
       flex: 0 0 ${customerCardWidth}px

       NOT:
       flex: 0 0 ${customerCardHeight}px
  ========================================================= */

  const resolvedCardContainerStyle:
    CSSProperties = {

    ...cardContainerStyle,

    width:
      `${customerCardWidth}px`,

    minWidth:
      `${customerCardWidth}px`,

    maxWidth:
      `${customerCardWidth}px`,

    height:
      `${customerCardHeight}px`,

    minHeight:
      `${customerCardMinHeight}px`,

    maxHeight:
      `${customerCardHeight}px`,

    boxSizing:
      "border-box",

    flex:
      `0 0 ${customerCardWidth}px`,

    flexShrink:
      0,

    alignSelf:
      "center",

    marginInline:
      "auto",

    overflow:
      "visible",

  };


  /* =========================================================
     CUSTOMER SELECTION
  ========================================================= */

  function handleCardClick(
    event:
      MouseEvent<HTMLDivElement>,
  ): void {


    const target =
      event.target as HTMLElement;


    const clickedCustomerCard =
      target.closest(
        '[data-finora-customer-card="true"]',
      );


    /* -------------------------------------------------------
       Only the actual Customer ID Card is selectable.
    ------------------------------------------------------- */

    if (
      !clickedCustomerCard
    ) {

      return;

    }


    /* -------------------------------------------------------
       Inactive customers cannot be opened.
    ------------------------------------------------------- */

    if (
      !canOpen(active)
    ) {

      return;

    }


    onClick?.(
      customer,
    );

  }


  /* =========================================================
     CONTROLLED FLIP HANDLER

     IMPORTANT:

     CustomerHanger no longer owns flip state.

     The parent Customer Hub decides which customer is
     currently flipped.

     Therefore this component simply forwards the flip
     request to the parent.

     Inactive customers are prevented from flipping here
     as an additional safety boundary.
  ========================================================= */

  function handleFlip(): void {

    if (
      !canOpen(active)
    ) {

      return;

    }

    onFlip?.();

  }


  /* =========================================================
     UI
  ========================================================= */

  return (

    <div

      style={
        resolvedContainerStyle
      }

      onClick={
        handleCardClick
      }

    >

      {/* =====================================================
          PIN
      ===================================================== */}

      <div
        style={
          pinStyle
        }
      />


      {/* =====================================================
          ROPE
      ===================================================== */}

      <div
        style={
          ropeStyle
        }
      />


      {/* =====================================================
          METAL CONNECTOR
      ===================================================== */}

      <div
        style={{

          width:
            "8px",

          height:
            "8px",

          minWidth:
            "8px",

          minHeight:
            "8px",

          borderRadius:
            "50%",

          background:
            "linear-gradient(180deg,#D6B06A,#8A612B)",

          border:
            "1px solid #6B4B1D",

          marginTop:
            "-5px",

          marginBottom:
            "4px",

          zIndex:
            4,

          flexShrink:
            0,

        }}
      />


      {/* =====================================================
          HANGER
      ===================================================== */}

      <div
        style={
          hangerStyle
        }
      />


      {/* =====================================================
          CUSTOMER CARD CONTAINER

          The Responsive Engine owns the actual card
          geometry.

          CustomerCardFlip receives this geometry through
          the parent's definite width and height.
      ===================================================== */}

      <div
        style={
          resolvedCardContainerStyle
        }
      >

        <div

          data-finora-customer-card="true"

          style={{

            width:
              "100%",

            height:
              "100%",

            minWidth:
              0,

            minHeight:
              0,

            boxSizing:
              "border-box",

            overflow:
              "visible",

          }}

        >

          {/* =================================================
              CUSTOMER CARD FLIP

              FLIP STATE IS CONTROLLED BY PARENT
          ================================================= */}

          <CustomerCardFlip

            flipped={
              flipped
            }

            onFlip={
              handleFlip
            }

            front={

              <CustomerIdCard

                customerId={
                  id
                }

                customerName={
                  name
                }

                profilePhoto={
                  photo
                }

                phoneNumber={
                  phone
                }

                branchName={
                  branch
                }

                kycVerified={
                  kycVerified
                }

                responsiveTokens={
                  customerTokens
                }

                compact={
                  true
                }

              />

            }

            back={

              <CustomerIdCardBack

                customerId={
                  id
                }

                fatherName={
                  fatherName
                }

                village={
                  village
                }

                mandal={
                  mandal
                }

                district={
                  district
                }

                customerSince={
                  customerSince
                }

                totalLoans={
                  totalLoans
                }

                activeLoans={
                  activeLoans
                }

                closedLoans={
                  closedLoans
                }

                outstandingAmount={
                  outstandingAmount
                }

                lastPaymentDate={
                  lastPaymentDate
                }

                lastPaymentAmount={
                  lastPaymentAmount
                }

                  responsiveTokens={
                    customerTokens
                  }

              />

            }

          />

        </div>

      </div>


      {/* =====================================================
          FINISHING RAIL
      ===================================================== */}

      <div
        style={
          bottomRailStyle
        }
      />

    </div>

  );

}


/* ===========================================================
   END
=========================================================== */