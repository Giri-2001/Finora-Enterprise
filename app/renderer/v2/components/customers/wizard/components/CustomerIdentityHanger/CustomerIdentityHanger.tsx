/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER IDENTITY HANGER™

   WIZARD FRONT CARD PRESENTATION
   -----------------------------------------------------------
   Responsibility:
   - Present the reusable FINORA Customer ID Card
   - Add premium hanger presentation
   - No flip
   - No back card
   - No customer navigation
   - No business logic
=========================================================== */

import CustomerIdCard
  from "../../../hub/cards/CustomerIdCard/CustomerIdCard";

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
   COMPONENT
=========================================================== */

export default function CustomerIdentityHanger({

  customerId,

  customerName,

  phoneNumber,

  profilePhoto,

  kycVerified = false,

}: CustomerIdentityHangerProps) {

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
