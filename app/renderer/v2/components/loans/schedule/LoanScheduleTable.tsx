// ============================================================
// FINORA ENTERPRISE OS™
//
// PAYMENT SCHEDULE ENGINE™
//
// LOAN SCHEDULE TABLE
//
// RESPONSIBILITY:
// - Render generated repayment schedule
// - Display EMI number, due date, amount and status
// - Premium FINORA Enterprise presentation
//
// IMPORTANT:
// - Does NOT generate schedule.
// - Does NOT modify installments.
// - Does NOT access persistence.
// - Receives LoanInstallment[] from parent.
// - Existing schedule contract remains unchanged.
//
// DESIGN:
// - Deep Navy
// - FINORA Primary Blue
// - White / Slate typography
// - No brown
// - No gold
// - Compact enterprise table
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  LoanInstallment,
} from "./types";

import LoanScheduleRow
  from "./LoanScheduleRow";

// ============================================================
// TYPES
// ============================================================

interface LoanScheduleTableProps {

  schedule:
    LoanInstallment[];

}

// ============================================================
// COMPONENT
// ============================================================

export default function LoanScheduleTable({

  schedule,

}: LoanScheduleTableProps) {

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  if (
    schedule.length === 0
  ) {

    return (

      <section
        style={{
          width: "100%",
          boxSizing: "border-box",

          border:
            "1px solid rgba(148, 163, 184, 0.16)",

          borderRadius: "10px",

          background: "#111C2E",

          padding: "18px",

          color: "#94A3B8",

          fontSize: "12px",

          fontWeight: 500,

          textAlign: "center",
        }}
      >

        No repayment schedule available.

      </section>

    );

  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <section
      style={{
        width: "100%",
        minWidth: 0,

        boxSizing: "border-box",

        border:
          "1px solid rgba(148, 163, 184, 0.16)",

        borderRadius: "10px",

        overflow: "hidden",

        background: "#0F172A",

        boxShadow:
          "0 8px 24px rgba(0, 0, 0, 0.18)",
      }}
    >

      {/* ====================================================
          TABLE HEADER
      ==================================================== */}

      <div
        style={{
          display: "flex",

          alignItems: "center",

          justifyContent:
            "space-between",

          gap: "12px",

          padding:
            "10px 12px",

          borderBottom:
            "1px solid rgba(148, 163, 184, 0.16)",

          background:
            "linear-gradient(90deg,#142238,#111C2E)",
        }}
      >

        <div
          style={{
            display: "flex",

            alignItems: "center",

            gap: "8px",

            minWidth: 0,
          }}
        >

          <span
            style={{
              width: "3px",
              height: "16px",

              flexShrink: 0,

              borderRadius: "3px",

              background: "#2563EB",

              boxShadow:
                "0 0 10px rgba(37,99,235,0.22)",
            }}
          />

          <span
            style={{
              color: "#FFFFFF",

              fontSize: "13px",

              fontWeight: 750,

              lineHeight: 1.2,
            }}
          >
            EMI Schedule
          </span>

        </div>


        <span
          style={{
            flexShrink: 0,

            padding:
              "4px 8px",

            border:
              "1px solid rgba(37, 99, 235, 0.35)",

            borderRadius: "999px",

            background:
              "rgba(37, 99, 235, 0.10)",

            color: "#93C5FD",

            fontSize: "12px",

            fontWeight: 650,
          }}
        >
          {schedule.length} Installments
        </span>

      </div>


      {/* ====================================================
          TABLE
      ==================================================== */}

      <div
        style={{
          width: "100%",

          minWidth: 0,

          overflowX: "auto",

          overflowY: "hidden",
        }}
      >

        <table
          style={{
            width: "100%",

            minWidth: "560px",

            borderCollapse:
              "collapse",

            tableLayout:
              "fixed",
          }}
        >

          {/* ==================================================
              TABLE HEAD
          ================================================== */}

          <thead>

            <tr
              style={{
                background: "#111C2E",

                borderBottom:
                  "1px solid rgba(148, 163, 184, 0.16)",
              }}
            >

              <th
                style={{
                  width: "14%",

                  padding:
                    "8px 10px",

                  textAlign:
                    "left",

                  color:
                    "#94A3B8",

                  fontSize: "12px",

                  fontWeight: 650,

                  lineHeight: 1.2,
                }}
              >
                EMI
              </th>


              <th
                style={{
                  width: "28%",

                  padding:
                    "8px 10px",

                  textAlign:
                    "left",

                  color:
                    "#94A3B8",

                  fontSize: "12px",

                  fontWeight: 650,

                  lineHeight: 1.2,
                }}
              >
                Due Date
              </th>


              <th
                style={{
                  width: "28%",

                  padding:
                    "8px 10px",

                  textAlign:
                    "right",

                  color:
                    "#94A3B8",

                  fontSize: "12px",

                  fontWeight: 650,

                  lineHeight: 1.2,
                }}
              >
                Amount
              </th>


              <th
                style={{
                  width: "30%",

                  padding:
                    "8px 10px",

                  textAlign:
                    "center",

                  color:
                    "#94A3B8",

                  fontSize: "12px",

                  fontWeight: 650,

                  lineHeight: 1.2,
                }}
              >
                Status
              </th>

            </tr>

          </thead>


          {/* ==================================================
              TABLE BODY
          ================================================== */}

          <tbody>

            {schedule.map(
              (
                installment,
              ) => (

                <LoanScheduleRow

                  key={
                    installment.installmentNumber
                  }

                  installment={
                    installment
                  }

                />

              ),
            )}

          </tbody>

        </table>

      </div>

    </section>

  );

}

// ============================================================
// END
// ============================================================
