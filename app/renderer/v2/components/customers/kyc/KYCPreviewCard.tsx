/* ===========================================================
   FINORA ENTERPRISE V2
   KYC PREVIEW CARD
--------------------------------------------------------------
Customer KYC Preview
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

export interface KYCPreviewData {

  customerName?: string;

  aadhaarNumber?: string;

  panNumber?: string;

  verified?: boolean;

}

interface KYCPreviewCardProps {

  value: KYCPreviewData;

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

export default function KYCPreviewCard({

  value,

}: KYCPreviewCardProps) {

  return (

    <section style={cardStyle}>

      <h3 style={titleStyle}>

        KYC Preview

      </h3>

      <div style={rowStyle}>

        <strong>Customer :</strong> {value.customerName || "--"}

      </div>

      <div style={rowStyle}>

        <strong>Aadhaar :</strong> {value.aadhaarNumber || "--"}

      </div>

      <div style={rowStyle}>

        <strong>PAN :</strong> {value.panNumber || "--"}

      </div>

      <div style={rowStyle}>

        <strong>Status :</strong>{" "}

        {value.verified ? "Verified ✅" : "Pending"}

      </div>

    </section>

  );

}
