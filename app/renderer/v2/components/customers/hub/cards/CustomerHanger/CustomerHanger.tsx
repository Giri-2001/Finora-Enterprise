/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HANGER™

   PREMIUM FRONT IDENTITY PRESENTATION

   Module  : Customer Hub
   Layer   : Cards
   Version : 2.5
   Status  : Production

   RESPONSIBILITY:
   - Customer selection
   - Premium hanging presentation
   - Front Customer ID Card only
   - Customer Responsive Engine integration

   RESPONSIVE CONTRACT:
   - Mobile  → 1 card
   - Tablet  → 3 cards
   - Laptop  → 5 cards
   - Desktop → 6 cards

   IMPORTANT:
   - Responsive visual values come from the Customer
     Responsive Engine.
   - This component does NOT decide breakpoint values.
   - This component does NOT contain independent responsive
     width / height decisions.
   - Customer card width comes only from
     customerTokens.customerCards.width.
   - Customer card minimum height comes only from
     customerTokens.customerCards.minHeight.
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
     CUSTOMER CARD GEOMETRY

     SINGLE SOURCE OF TRUTH:

       customerTokens.customerCards.width

     IMPORTANT:

     - No width calculation here.
     - No viewport-based width calculation here.
     - No percentage width here.
     - No "100%" width here.
     - Mobile therefore remains a real ID-card width.
  ========================================================= */

  const customerCardWidth =
    customerTokens.customerCards.width;


  /* =========================================================
     CUSTOMER CARD HEIGHT CONTRACT

     The Responsive Engine owns the minimum card height.

     When minHeight is greater than zero, preserve it.

     When the Responsive Engine intentionally exposes zero,
     the CustomerIdCard remains content-driven.

     IMPORTANT:

     Never force minHeight to zero here.
  ========================================================= */

  const customerCardMinHeight =
    customerTokens.customerCards.minHeight;


  /* =========================================================
     HANGER ROOT

     IMPORTANT:

     The hanger root must have exactly the same width as
     the resolved Customer ID Card.

     This gives the parent grid a real packing width.

     marginInline: auto is intentionally used only for
     horizontal centering.

     It does NOT change the card width.

     Therefore on mobile:

       viewport
          ↓
       side gap
          ↓
       fixed ID card
          ↓
       side gap

     The card never fills the remaining space.
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

     IMPORTANT:

     This wrapper must preserve the exact resolved card
     width.

     It must NEVER stretch to the parent width.

     The minimum height is forwarded from the Responsive
     Engine instead of being reset to zero.
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

    /*
     * Preserve the Responsive Engine's minimum card height.
     *
     * Do NOT write:
     *
     *   minHeight: 0
     *
     * because that would destroy the mobile real-card
     * height contract.
     */

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
          FRONT CUSTOMER ID CARD

          IMPORTANT:

          CustomerIdCard receives the SAME resolved
          Responsive Engine token set.

          Therefore:

          Mobile:
            width  = mobile token
            height = mobile token minimum

          Tablet:
            width  = tablet token

          Laptop:
            width  = laptop token

          Desktop:
            width  = desktop token

          No local breakpoint logic exists here.
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

            minWidth:
              0,

            boxSizing:
              "border-box",

            overflow:
              "visible",

          }}

        >

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
