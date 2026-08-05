/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER LOAN PANEL™

   WORK DESK
=========================================================== */

import type {
  OfficeCustomer,
} from "../types";

import LoanCard from "./LoanCard";

/* ===========================================================
   TYPES
=========================================================== */

interface CustomerLoanPanelProps {

  customer: OfficeCustomer;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerLoanPanel({

  customer,

}: CustomerLoanPanelProps) {

  const loans = customer.loans ?? [];

  const runningLoans =

    loans.filter(

      (loan) =>

        loan.status === "ACTIVE" ||

        loan.status === "RUNNING",

    ).length;

  const closedLoans =

    loans.filter(

      (loan) =>

        loan.status === "CLOSED",

    ).length;

  const totalAmount =

    loans.reduce(

      (sum, loan) =>

        sum + loan.amount,

      0,

    );

  const outstandingAmount =

    loans.reduce(

      (sum, loan) =>

        sum + loan.outstanding,

      0,

    );

  return (

    <section

      style={{

        background: "#FFFFFF",

        border: "1px solid #E2E8F0",

        borderRadius: "20px",

        padding: "24px",

        minHeight: "520px",

        boxShadow:
          "0 8px 24px rgba(15,23,42,.06)",

        display: "flex",

        flexDirection: "column",

        gap: "20px",

      }}

    >

      {/* ==========================================
          HEADER
      ========================================== */}

      <div>

        <h2

          style={{

            margin: 0,

            fontSize: "22px",

            fontWeight: 700,

            color: "#0F172A",

          }}

        >

          Loan Overview

        </h2>

        <p

          style={{

            marginTop: "6px",

            color: "#64748B",

            fontSize: "14px",

          }}

        >

          Finance summary for {customer.name}

        </p>

      </div>

      {/* ==========================================
          STATISTICS
      ========================================== */}

      <section

        style={{

          display: "grid",

          gridTemplateColumns: "repeat(4,1fr)",

          gap: "14px",

        }}

      >

        {/* Running */}

        <div

          style={{

            borderRadius: "18px",

            border: "1px solid #D6B36A",

            background:
              "linear-gradient(180deg,#FFFDF8,#FFF6E6)",

            padding: "18px",

          }}

        >

          <div

            style={{

              color: "#7C5A2C",

              fontSize: "13px",

              fontWeight: 600,

            }}

          >

            Running

          </div>

          <div

            style={{

              marginTop: "8px",

              fontSize: "28px",

              fontWeight: 700,

              color: "#15803D",

            }}

          >

            {runningLoans}

          </div>

        </div>

        {/* Closed */}

        <div

          style={{

            borderRadius: "18px",

            border: "1px solid #D6B36A",

            background:
              "linear-gradient(180deg,#FFFDF8,#FFF6E6)",

            padding: "18px",

          }}

        >

          <div

            style={{

              color: "#7C5A2C",

              fontSize: "13px",

              fontWeight: 600,

            }}

          >

            Closed

          </div>

          <div

            style={{

              marginTop: "8px",

              fontSize: "28px",

              fontWeight: 700,

              color: "#B91C1C",

            }}

          >

            {closedLoans}

          </div>

        </div>

        {/* Total */}

        <div

          style={{

            borderRadius: "18px",

            border: "1px solid #D6B36A",

            background:
              "linear-gradient(180deg,#FFFDF8,#FFF6E6)",

            padding: "18px",

          }}

        >

          <div

            style={{

              color: "#7C5A2C",

              fontSize: "13px",

              fontWeight: 600,

            }}

          >

            Total

          </div>

          <div

            style={{

              marginTop: "8px",

              fontSize: "22px",

              fontWeight: 700,

              color: "#8B5E34",

            }}

          >

            ₹{totalAmount.toLocaleString()}

          </div>

        </div>

        {/* Pending */}

        <div

          style={{

            borderRadius: "18px",

            border: "1px solid #D6B36A",

            background:
              "linear-gradient(180deg,#FFFDF8,#FFF6E6)",

            padding: "18px",

          }}

        >

          <div

            style={{

              color: "#7C5A2C",

              fontSize: "13px",

              fontWeight: 600,

            }}

          >

            Pending

          </div>

          <div

            style={{

              marginTop: "8px",

              fontSize: "22px",

              fontWeight: 700,

              color: "#8B5E34",

            }}

          >

            ₹{outstandingAmount.toLocaleString()}

          </div>

        </div>

      </section>

      {/* ==========================================
          LOAN CARDS
      ========================================== */}

      <section

        style={{

          display: "flex",

          flexDirection: "column",

          gap: "16px",

          marginTop: "4px",

        }}

      >

        {loans.map((loan) => (

          <LoanCard

            key={loan.id}

            loan={loan}

          />

        ))}

      </section>

    </section>

  );

}
