/* ===========================================================
   FINORA ENTERPRISE V2
   ADDRESS PROOF CARD
--------------------------------------------------------------
Customer Address Proof Information
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

interface AddressProofCardProps {

  documentType?: string;

  verified?: boolean;

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

const headingStyle: CSSProperties = {

  margin: 0,

  fontSize: "20px",

  fontWeight: 700,

};

const textStyle: CSSProperties = {

  marginTop: "14px",

  color: "#6b7280",

  lineHeight: 1.6,

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function AddressProofCard({

  documentType,

  verified,

}: AddressProofCardProps) {

  return (

    <section style={cardStyle}>

      <h3 style={headingStyle}>

        Address Proof

      </h3>

      <div style={textStyle}>

        Document :

        {" "}

        {documentType || "--"}

      </div>

      <div style={textStyle}>

        Verification :

        {" "}

        {verified ? "Verified ✅" : "Pending"}

      </div>

      <div style={textStyle}>

        Future versions will support automatic
        document verification and OCR integration.

      </div>

    </section>

  );

}
