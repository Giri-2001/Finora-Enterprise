/* ===========================================================
   FINORA ENTERPRISE OS™
   PAYMENT SCHEDULE ENGINE™

   LOAN SCHEDULE TABLE
=========================================================== */

import type {
  LoanInstallment,
} from "./types";

import LoanScheduleRow
  from "./LoanScheduleRow";

/* ===========================================================
   TYPES
=========================================================== */

interface LoanScheduleTableProps {

  schedule: LoanInstallment[];

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function LoanScheduleTable({

  schedule,

}: LoanScheduleTableProps) {

  return (

    <div
      style={{
        marginTop: "24px",
        border: "1px solid #E2E8F0",
        borderRadius: "16px",
        overflow: "hidden",
        background: "#FFFFFF",
      }}
    >

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >

        <thead>

          <tr
            style={{
              background:
                "linear-gradient(180deg,#A67C38,#7A5625)",
              color: "#FFFFFF",
            }}
          >

            <th
              style={{
                padding: "12px",
                textAlign: "left",
              }}
            >
              EMI
            </th>

            <th
              style={{
                padding: "12px",
                textAlign: "left",
              }}
            >
              Due Date
            </th>

            <th
              style={{
                padding: "12px",
                textAlign: "right",
              }}
            >
              Amount
            </th>

            <th
              style={{
                padding: "12px",
                textAlign: "center",
              }}
            >
              Status
            </th>

          </tr>

        </thead>

        <tbody>

          {schedule.map((installment) => (

            <LoanScheduleRow

              key={
                installment.installmentNumber
              }

              installment={
                installment
              }

            />

          ))}

        </tbody>

      </table>

    </div>

  );

}
