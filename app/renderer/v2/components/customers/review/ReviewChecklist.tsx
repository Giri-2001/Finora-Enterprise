/* ===========================================================
   FINORA ENTERPRISE V2
   REVIEW CHECKLIST
--------------------------------------------------------------
Customer Review Checklist
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

interface ReviewChecklistProps {

  items?: {

    label: string;

    completed: boolean;

  }[];

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

const itemStyle: CSSProperties = {

  display: "flex",

  justifyContent: "space-between",

  alignItems: "center",

  padding: "10px 0",

  borderBottom: "1px solid #f3f4f6",

};

/* ===========================================================
   DEFAULT CHECKLIST
=========================================================== */

const defaultItems = [

  { label: "Identity Completed", completed: true },

  { label: "Basic Details Completed", completed: true },

  { label: "Address Completed", completed: true },

  { label: "KYC Verified", completed: true },

  { label: "Nominee Added", completed: true },

];

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReviewChecklist({

  items = defaultItems,

}: ReviewChecklistProps) {

  return (

    <section style={cardStyle}>

      <h3 style={titleStyle}>

        Review Checklist

      </h3>

      {items.map((item) => (

        <div

          key={item.label}

          style={itemStyle}

        >

          <span>{item.label}</span>

          <strong>

            {item.completed ? "✅" : "⚠"}

          </strong>

        </div>

      ))}

    </section>

  );

}
