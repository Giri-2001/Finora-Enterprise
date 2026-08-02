/* ===========================================================
   FINORA ENTERPRISE V2
   NOMINEE PREVIEW CARD
--------------------------------------------------------------
Customer Nominee Preview
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

export interface NomineePreviewData {

  customerName?: string;

  nomineeCustomerId?: string;

  nomineeName?: string;

  relationship?: string;

  phoneNumber?: string;

}

interface NomineePreviewCardProps {

  value: NomineePreviewData;

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

export default function NomineePreviewCard({

  value,

}: NomineePreviewCardProps) {

  return (

    <section style={cardStyle}>

      <h3 style={titleStyle}>

        Nominee Preview

      </h3>

      <div style={rowStyle}>

        <strong>Customer :</strong> {value.customerName || "--"}

      </div>

      <div style={rowStyle}>

        <strong>FINORA ID :</strong> {value.nomineeCustomerId || "--"}

      </div>

      <div style={rowStyle}>

        <strong>Nominee :</strong> {value.nomineeName || "--"}

      </div>

      <div style={rowStyle}>

        <strong>Relationship :</strong> {value.relationship || "--"}

      </div>

      <div style={rowStyle}>

        <strong>Phone :</strong> {value.phoneNumber || "--"}

      </div>

    </section>

  );

}
