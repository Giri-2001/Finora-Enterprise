/* ===========================================================
   FINORA ENTERPRISE V2
   ADDRESS PREVIEW CARD
--------------------------------------------------------------
Customer Address Preview
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

export interface AddressPreviewData {

  customerName?: string;

  currentAddress?: string;

  city?: string;

  state?: string;

  pinCode?: string;

}

interface AddressPreviewCardProps {

  value: AddressPreviewData;

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

  marginBottom: "10px",

  color: "#374151",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function AddressPreviewCard({

  value,

}: AddressPreviewCardProps) {

  return (

    <section style={cardStyle}>

      <h3 style={titleStyle}>

        Address Preview

      </h3>

      <div style={rowStyle}>

        <strong>Customer :</strong> {value.customerName || "--"}

      </div>

      <div style={rowStyle}>

        <strong>Address :</strong> {value.currentAddress || "--"}

      </div>

      <div style={rowStyle}>

        <strong>City :</strong> {value.city || "--"}

      </div>

      <div style={rowStyle}>

        <strong>State :</strong> {value.state || "--"}

      </div>

      <div style={rowStyle}>

        <strong>PIN :</strong> {value.pinCode || "--"}

      </div>

    </section>

  );

}
