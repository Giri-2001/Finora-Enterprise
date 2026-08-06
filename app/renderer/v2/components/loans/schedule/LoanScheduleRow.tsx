/* ===========================================================
   FINORA ENTERPRISE OS™
   PAYMENT SCHEDULE ENGINE™

   LOAN SCHEDULE ROW
=========================================================== */

import type {
  LoanInstallment,
} from "./types";

import {
  formatCurrency,
} from "../../../utils/currency/formatCurrency";

/* ===========================================================
   TYPES
=========================================================== */

interface LoanScheduleRowProps {

  installment: LoanInstallment;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function LoanScheduleRow({

  installment,

}: LoanScheduleRowProps) {

  return (

    <tr
      style={{
        borderBottom:
          "1px solid #E5E7EB",
      }}
    >

      <td
        style={{
          padding: "14px",
          fontWeight: 700,
        }}
      >
        {installment.installmentNumber}
      </td>

      <td
        style={{
          padding: "14px",
        }}
      >
        {new Date(
          installment.dueDate,
        ).toLocaleDateString()}
      </td>

      <td
        style={{
          padding: "14px",
          textAlign: "right",
          fontWeight: 600,
        }}
      >
        ₹{" "}
        {formatCurrency(
  installment.installmentAmount,
)}
      </td>

      <td
        style={{
          padding: "14px",
          textAlign: "center",
        }}
      >

        <span
          style={{
            display: "inline-block",
            padding: "4px 10px",
            borderRadius: "999px",
            background: "#FEF3C7",
            color: "#92400E",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          {installment.status}
        </span>

      </td>

    </tr>

  );

}
