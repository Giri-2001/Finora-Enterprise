/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SUMMARY
--------------------------------------------------------------
Customer Review Summary
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

interface CustomerSummaryProps {

  customerId?: string;

  customerName?: string;

  phoneNumber?: string;

  kycVerified?: boolean;

}

/* ===========================================================
   STYLES
=========================================================== */

const cardStyle: CSSProperties = {

  padding: "24px",

  borderRadius: "18px",

  border: "1px solid #e5e7eb",

  background: "#ffffff",

};

const titleStyle: CSSProperties = {

  margin: 0,

  marginBottom: "18px",

  fontSize: "20px",

  fontWeight: 700,

};

const rowStyle: CSSProperties = {

  marginBottom: "12px",

  color: "#374151",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerSummary({

  customerId,

  customerName,

  phoneNumber,

  kycVerified,

}: CustomerSummaryProps) {

  return (

    <section style={cardStyle}>

      <h3 style={titleStyle}>

        Customer Summary

      </h3>

      <div style={rowStyle}>

        <strong>Customer ID :</strong> {customerId || "--"}

      </div>

      <div style={rowStyle}>

        <strong>Name :</strong> {customerName || "--"}

      </div>

      <div style={rowStyle}>

        <strong>Phone :</strong> {phoneNumber || "--"}

      </div>

      <div style={rowStyle}>

        <strong>KYC :</strong>{" "}

        {kycVerified ? "Verified ✅" : "Pending"}

      </div>

    </section>

  );

}
