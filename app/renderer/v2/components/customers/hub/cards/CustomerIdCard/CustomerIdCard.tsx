/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER ID CARD

   COMPONENT
=========================================================== */

import finoraLogo from "../../../../../app/assets/finoraenterprise.png";

import type {
  CustomerIdCardProps,
} from "./types";

import {
  COMPANY_NAME,
} from "./constants";

import {
  cardStyle,
  statusHeaderStyle,
  companyStyle,
  photoStyle,
  nameStyle,
  customerIdStyle,
  qrStyle,
} from "./styles";

import { QRCodeSVG } from "qrcode.react";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerIdCard({

  customerId,

  customerName,

  kycVerified = false,

}: CustomerIdCardProps) {

  const statusColor =
    kycVerified
      ? "#16A34A"
      : "#DC2626";

  return (

    <article
  style={{
    ...cardStyle,
    position: "relative",
  }}
>

  {/* ======================================
    LAMINATE SHINE
====================================== */}

<div
  style={{
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    borderRadius: "18px",
    background:
  "linear-gradient(120deg,rgba(255,255,255,.55) 0%,rgba(255,255,255,.20) 18%,transparent 42%)",
    opacity: .75,
    zIndex: 1,
  }}
/>

  <div
    style={{
      position: "relative",
      zIndex: 2,
      display: "flex",
      flexDirection: "column",
      height: "100%",
    }}
  >

      {/* Status Strip */}

      <div

        style={{

          ...statusHeaderStyle,

          background: statusColor,

        }}

      />

      {/* Company */}

      <div style={companyStyle}>
  FINORA
</div>

<div
  style={{
    marginTop: "8px",
    background:
  "linear-gradient(180deg,#C99A55 0%,#B1843D 40%,#8A612B 100%)",
    color: "#FFFFFF",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: ".8px",
    textTransform: "uppercase",
    padding: "5px 8px",
    textAlign: "center",
  }}
>
  {COMPANY_NAME}
</div>

{/* Photo */}

<div style={photoStyle}>

  <img
    src={finoraLogo}
    alt="FINORA"
    style={{
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "center",
      borderRadius: "14px",
    }}
  />

</div>

      {/* Name */}

      <div style={nameStyle}>

        {customerName}

      </div>

      {/* Customer ID */}

      <div style={customerIdStyle}>

        {customerId}

      </div>


      {/* KYC */}
{/* KYC STATUS
 Future:
 Verified = Green
 Pending = Orange
 Rejected = Red
*/}
      {/* Branch */}


       {/* QR */}

<div style={qrStyle}>

  <QRCodeSVG

    value={
      `FINORA://CUSTOMER/${customerId}`
    }

    size={42}

    bgColor="#FFFFFF"

    fgColor="#020617"

    level="H"

  />

</div>

</div>

    </article>

  );

}
