/* ===========================================================
   FINORA ENTERPRISE OS™
   LOAN CARD™

   REUSABLE COMPONENT
=========================================================== */

import { useState } from "react";

import LoanDetails from "./LoanDetails";

interface LoanCardProps {

  loan: {

    id: string;

    title: string;

    loanNumber?: string;

    loanType?: string;

    repaymentType?: string;

    amount: number;

    outstanding: number;

    dueDate: string;

    status: "ACTIVE" | "RUNNING" | "CLOSED";

    interest?: number;

    processingFee?: number;

    loanDate?: string;

    guarantor?: string;

  }

}

export default function LoanCard({

  loan,

}: LoanCardProps) {

  const {

    id,

    title,

     loanNumber,

    loanType,

    repaymentType,

    amount,

    outstanding,

    dueDate,

    status,

  } = loan;

  const [

  expanded,

  setExpanded,

] = useState(false);

  const statusColor =

    status === "ACTIVE"
      ? "#15803D"
      : status === "RUNNING"
      ? "#CA8A04"
      : "#B91C1C";

  const statusBackground =

    status === "ACTIVE"
      ? "#DCFCE7"
      : status === "RUNNING"
      ? "#FEF3C7"
      : "#FEE2E2";

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

    transition:
      "all .25s ease",

  }}

>

      {/* HEADER */}

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

              fontWeight: 700,

              fontSize: "18px",

              color: "#1E293B",

            }}

          >

            {loanType || title}

          </div>

          <div

            style={{

              marginTop: "4px",

              fontSize: "13px",

              color: "#64748B",

            }}

          >

            {loanNumber || id}

          </div>

        </div>

        <div

          style={{

            background: statusBackground,

            color: statusColor,

            borderRadius: "999px",

            padding: "6px 14px",

            fontWeight: 700,

            fontSize: "12px",

          }}

        >

          {status}

        </div>

      </div>

      {/* DETAILS */}

      <div

        style={{

          display: "grid",

          gridTemplateColumns: "repeat(3,1fr)",

          marginTop: "18px",

          gap: "16px",

        }}

      >

        <div>

          <div style={{ fontSize: "12px", color: "#64748B" }}>

            Amount

          </div>

          <strong>₹{amount.toLocaleString()}</strong>

        </div>

        <div>

          <div style={{ fontSize: "12px", color: "#64748B" }}>

            Outstanding

          </div>

          <strong>₹{outstanding.toLocaleString()}</strong>

        </div>

        <div>

          <div style={{ fontSize: "12px", color: "#64748B" }}>

            Due Date

          </div>


          <strong>{dueDate}</strong>

        </div>


      </div>

            {/* ==========================================
          EXPANDED DETAILS
      ========================================== */}
{expanded && (

  <LoanDetails

  loan={{

    interest: loan.interest ?? 0,

    processingFee: loan.processingFee ?? 0,

    loanDate: loan.loanDate ?? "--",

    guarantor: loan.guarantor ?? "--",

  }}

/>

)}

    </div>

  );

}
