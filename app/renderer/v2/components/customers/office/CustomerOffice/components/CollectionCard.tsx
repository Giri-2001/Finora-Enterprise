/* ===========================================================
   FINORA ENTERPRISE OS™
   COLLECTION CARD™

   REUSABLE COMPONENT
=========================================================== */

import { useState } from "react";

import CollectionDetails from "./CollectionDetails";

import type {
  Loan,
} from "../types";

/* ===========================================================
   TYPES
=========================================================== */

interface CollectionCardProps {

  loan: Loan;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CollectionCard({

  loan,

}: CollectionCardProps) {

  const [

    expanded,

    setExpanded,

  ] = useState(false);

  return (

    <div

      onClick={() =>

        setExpanded(

          !expanded,

        )

      }

      style={{

        background: "#FFFDF9",

        border: "1px solid #D8C7A4",

        borderRadius: "20px",

        padding: "18px",

        boxShadow:
          "0 8px 20px rgba(15,23,42,.06)",

        cursor: "pointer",

        transition: "all .25s ease",

      }}

    >

      {/* ======================================
          HEADER
      ====================================== */}

      <div

        style={{

          display: "flex",

          justifyContent: "space-between",

          alignItems: "center",

        }}

      >

        <div>

          <div

            style={{

              fontSize: "18px",

              fontWeight: 700,

              color: "#1E293B",

            }}

          >

            {loan.title}

          </div>

          <div

            style={{

              marginTop: "4px",

              fontSize: "13px",

              color: "#64748B",

            }}

          >

            {loan.id}

          </div>

        </div>

        <div

          style={{

            color: "#15803D",

            fontWeight: 700,

          }}

        >

          Collection

        </div>

      </div>

      {/* ======================================
          SUMMARY
      ====================================== */}

      <div

        style={{

          display: "grid",

          gridTemplateColumns: "repeat(3,1fr)",

          gap: "16px",

          marginTop: "18px",

        }}

      >

        <div>

          <div style={{ fontSize: "12px", color: "#64748B" }}>

            Outstanding

          </div>

          <strong>

            ₹{loan.outstanding.toLocaleString()}

          </strong>

        </div>

        <div>

          <div style={{ fontSize: "12px", color: "#64748B" }}>

            Due Date

          </div>

          <strong>

            {loan.dueDate}

          </strong>

        </div>

        <div>

          <div style={{ fontSize: "12px", color: "#64748B" }}>

            Status

          </div>

          <strong>

            {loan.status}

          </strong>

        </div>

      </div>

      {expanded && (

        <CollectionDetails

          loan={loan}

        />

      )}

    </div>

  );

}
