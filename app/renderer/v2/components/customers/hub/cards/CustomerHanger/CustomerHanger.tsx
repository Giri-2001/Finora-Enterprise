/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HANGER™

   PREMIUM FRONT IDENTITY PRESENTATION

   Module  : Customer Hub
   Layer   : Cards
   Version : 2.0
   Status  : Production

   Responsibility:
   - Customer selection
   - Premium hanging presentation
   - Front Customer ID Card only

   Intentionally removed:
   - Card flip
   - Back card
   - Loan summary
   - Back-side customer details
=========================================================== */

import CustomerIdCard
  from "../CustomerIdCard";

import type {
  CustomerHangerProps,
} from "./types";

import {
  canOpen,
} from "./helpers";

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

  const {

    id,

    name,

    phone,

    profilePhoto,

    branch,

    active,

    kycVerified,

  } = customer;

  /* =========================================================
     CUSTOMER SELECTION
  ========================================================= */

  function handleCardClick(
    event:
      React.MouseEvent<HTMLDivElement>,
  ): void {

    const target =
      event.target as HTMLElement;

    const clickedCustomerCard =
      target.closest(
        '[data-finora-customer-card="true"]',
      );

    /*
      Customer Hanger contains:
      PIN / ROPE / HANGER / CARD.

      Only the actual customer card
      should select the customer.
    */

    if (!clickedCustomerCard) {

      return;

    }

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
      style={containerStyle}
      onClick={handleCardClick}
    >

      {/* =================================================
          PIN
      ================================================= */}

      <div
        style={pinStyle}
      />

      {/* =================================================
          ROPE
      ================================================= */}

      <div
        style={ropeStyle}
      />

      {/* =================================================
          METAL CONNECTOR
      ================================================= */}

      <div
        style={{

          width: "8px",

          height: "8px",

          borderRadius: "50%",

          background:
            "linear-gradient(180deg,#D6B06A,#8A612B)",

          border:
            "1px solid #6B4B1D",

          marginTop: "-5px",

          marginBottom: "4px",

          zIndex: 4,

          boxShadow:
            "0 1px 2px rgba(0,0,0,.25)",

        }}
      />

      {/* =================================================
          HANGER
      ================================================= */}

      <div
        style={hangerStyle}
      />

      {/* =================================================
          FRONT CUSTOMER ID CARD
      ================================================= */}

      <div
        style={{
          ...cardContainerStyle,

          width: "180px",

          maxWidth: "180px",

          height: "290px",

          maxHeight: "290px",

          transform:
            "translateX(0)",

        }}
      >

        <div
          data-finora-customer-card="true"
        >

          <CustomerIdCard

            customerId={
              id
            }

            customerName={
              name
            }

            profilePhoto={
              profilePhoto
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

              compact={true}

          />

        </div>

      </div>

      {/* =================================================
          FINISHING RAIL
      ================================================= */}

      <div
        style={bottomRailStyle}
      />

    </div>

  );

}
