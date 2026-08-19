/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER IDENTITY HANGER™

   WIZARD FRONT CARD PRESENTATION
   -----------------------------------------------------------
   Responsibility:
   - Present the reusable FINORA Customer ID Card
   - Resolve the central Customer Responsive Engine tokens
   - Pass resolved tokens to CustomerIdCard
   - Add premium hanger presentation
   - No flip
   - No back card
   - No customer navigation
   - No business logic

   RESPONSIVE CONTRACT
   -----------------------------------------------------------
   - Customer Responsive Engine remains the single source
     of truth for responsive dimensions.
   - This component resolves viewport tokens through the
     central getCustomerTokens() resolver.
   - CustomerIdCard receives the resolved token set.
   - No responsive dimensions are defined here.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useEffect,
  useState,
} from "react";


import CustomerIdCard
  from "../../../hub/cards/CustomerIdCard/CustomerIdCard";


import {
  getCustomerTokens,
} from "../../../../../utils/responsive/customers/customers.tokens";


import type {
  ResponsiveTokens,
} from "../../../../../utils/responsive/customers/customers.tokens";


import {
  containerStyle,
  pinStyle,
  ropeStyle,
  connectorStyle,
  hangerStyle,
  cardHolderStyle,
  bottomRailStyle,
} from "./styles";


/* ===========================================================
   TYPES
=========================================================== */

export interface CustomerIdentityHangerProps {

  customerId: string;

  customerName: string;

  phoneNumber: string;

  profilePhoto: string;

  kycVerified?: boolean;

}


/* ===========================================================
   RESPONSIVE TOKEN RESOLUTION
=========================================================== */

function resolveCustomerTokens(): ResponsiveTokens {

  if (
    typeof window === "undefined"
  ) {

    return getCustomerTokens(
      1024,
    );

  }


  return getCustomerTokens(
    window.innerWidth,
  );

}


/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerIdentityHanger({

  customerId,

  customerName,

  phoneNumber,

  profilePhoto,

  kycVerified = false,

}: CustomerIdentityHangerProps) {


  /* =========================================================
     RESPONSIVE ENGINE

     The viewport is resolved through the central customer
     Responsive Engine.

     No breakpoint values are defined here.

     This component only consumes the public resolver.
  ========================================================= */

  const [
    responsiveTokens,
    setResponsiveTokens,
  ] = useState<ResponsiveTokens>(
    resolveCustomerTokens,
  );


  /* =========================================================
     VIEWPORT CHANGE HANDLING

     Re-resolve the central token set whenever the Electron
     window changes size.

     IMPORTANT:
     - No responsive dimensions are calculated here.
     - Breakpoint rules remain exclusively inside
       customers.tokens.ts.
  ========================================================= */

  useEffect(
    () => {

      const handleResize =
        () => {

          setResponsiveTokens(
            resolveCustomerTokens(),
          );

        };


      window.addEventListener(
        "resize",
        handleResize,
      );


      return () => {

        window.removeEventListener(
          "resize",
          handleResize,
        );

      };

    },
    [],
  );


  /* =========================================================
     UI
  ========================================================= */

  return (

    <div
      style={containerStyle}
    >

      {/* ===================================================
          PIN
      =================================================== */}

      <div
        style={pinStyle}
      />


      {/* ===================================================
          ROPE
      =================================================== */}

      <div
        style={ropeStyle}
      />


      {/* ===================================================
          METAL CONNECTOR
      =================================================== */}

      <div
        style={connectorStyle}
      />


      {/* ===================================================
          HANGER
      =================================================== */}

      <div
        style={hangerStyle}
      />


      {/* ===================================================
          FRONT ID CARD
      =================================================== */}

      <div
        style={cardHolderStyle}
      >

        <CustomerIdCard

          customerId={
            customerId
          }

          customerName={
            customerName
          }

          phoneNumber={
            phoneNumber
          }

          profilePhoto={
            profilePhoto
          }

          kycVerified={
            kycVerified
          }

          responsiveTokens={
            responsiveTokens
          }

        />

      </div>


      {/* ===================================================
          FINISHING RAIL
      =================================================== */}

      <div
        style={bottomRailStyle}
      />

    </div>

  );

}