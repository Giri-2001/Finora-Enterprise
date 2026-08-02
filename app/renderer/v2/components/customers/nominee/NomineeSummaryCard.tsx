/* ===========================================================
   FINORA ENTERPRISE V2
   NOMINEE SUMMARY CARD
--------------------------------------------------------------
Customer Nominee Summary
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

interface NomineeSummaryCardProps {

  totalNominees?: number;

  linkedCustomers?: number;

  pendingVerification?: number;

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

const statStyle: CSSProperties = {

  marginBottom: "12px",

  fontSize: "15px",

  color: "#374151",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function NomineeSummaryCard({

  totalNominees = 0,

  linkedCustomers = 0,

  pendingVerification = 0,

}: NomineeSummaryCardProps) {

  return (

    <section style={cardStyle}>

      <h3 style={titleStyle}>

        Nominee Summary

      </h3>

      <div style={statStyle}>

        <strong>Total Nominees:</strong> {totalNominees}

      </div>

      <div style={statStyle}>

        <strong>Linked FINORA Customers:</strong> {linkedCustomers}

      </div>

      <div style={statStyle}>

        <strong>Pending Verification:</strong> {pendingVerification}

      </div>

    </section>

  );

}
