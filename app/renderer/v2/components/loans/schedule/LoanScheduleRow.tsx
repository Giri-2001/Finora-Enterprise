// ============================================================
// FINORA ENTERPRISE OS™
//
// PAYMENT SCHEDULE ENGINE™
//
// LOAN SCHEDULE ROW
//
// RESPONSIBILITY:
// - Render one repayment installment
// - Display EMI number
// - Display due date
// - Display installment amount
// - Display installment status
//
// IMPORTANT:
// - No schedule calculation.
// - No persistence.
// - No mutation.
// - Existing LoanInstallment contract preserved.
//
// DESIGN:
// - FINORA Enterprise dark navy
// - Primary blue
// - Slate typography
// - No brown
// - No gold
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  LoanInstallment,
} from "./types";

import {
  formatCurrency,
} from "../../../utils/currency/formatCurrency";

// ============================================================
// TYPES
// ============================================================

interface LoanScheduleRowProps {

  installment:
    LoanInstallment;

}

// ============================================================
// STATUS STYLE HELPER
// ============================================================

function getStatusStyle(
  status:
    LoanInstallment["status"],
) {

  switch (
    status
  ) {

    case "Paid":

      return {
        background:
          "rgba(34, 197, 94, 0.12)",

        border:
          "1px solid rgba(34, 197, 94, 0.28)",

        color:
          "#86EFAC",
      };

    case "Partial":

      return {
        background:
          "rgba(245, 158, 11, 0.12)",

        border:
          "1px solid rgba(245, 158, 11, 0.28)",

        color:
          "#FCD34D",
      };

    case "Overdue":

      return {
        background:
          "rgba(239, 68, 68, 0.12)",

        border:
          "1px solid rgba(239, 68, 68, 0.28)",

        color:
          "#FCA5A5",
      };

    case "Preclosed":

      return {
        background:
          "rgba(37, 99, 235, 0.14)",

        border:
          "1px solid rgba(37, 99, 235, 0.34)",

        color:
          "#93C5FD",
      };

    case "Pending":

    default:

      return {
        background:
          "rgba(37, 99, 235, 0.12)",

        border:
          "1px solid rgba(37, 99, 235, 0.28)",

        color:
          "#93C5FD",
      };
  }
}

// ============================================================
// DATE FORMATTER
// ============================================================
// FINORA standard: DD/MM/YYYY
// Avoid browser locale differences such as MM/DD/YYYY.
// ============================================================

function formatIndianDate(
  value: string,
): string {

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

// ============================================================
// COMPONENT
// ============================================================

export default function LoanScheduleRow({

  installment,

}: LoanScheduleRowProps) {

  const statusStyle =
    getStatusStyle(
      installment.status,
    );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <tr
      style={{
        borderBottom:
          "1px solid rgba(148, 163, 184, 0.10)",

        background:
          "#0F172A",
      }}
    >

      {/* ====================================================
          EMI NUMBER
      ==================================================== */}

      <td
        style={{
          padding:
            "8px 10px",

          color:
            "#FFFFFF",

          fontSize:
            "12px",

          fontWeight:
            700,

          lineHeight:
            1.2,
        }}
      >

        <span
          style={{
            display:
              "inline-flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            width:
              "24px",

            height:
              "24px",

            borderRadius:
              "6px",

            background:
              "rgba(37, 99, 235, 0.10)",

            border:
              "1px solid rgba(37, 99, 235, 0.22)",

            color:
              "#93C5FD",

            fontSize:
              "12px",

            fontWeight:
              700,
          }}
        >

          {installment.installmentNumber}

        </span>

      </td>

      {/* ====================================================
          DUE DATE
      ==================================================== */}

      <td
        style={{
          padding:
            "8px 10px",

          color:
            "#CBD5E1",

          fontSize:
            "12px",

          fontWeight:
            500,

          lineHeight:
            1.2,

          whiteSpace:
            "nowrap",
        }}
      >

        {formatIndianDate(
          installment.dueDate,
        )}

      </td>

      {/* ====================================================
          INSTALLMENT AMOUNT
      ==================================================== */}

      <td
        style={{
          padding:
            "8px 10px",

          textAlign:
            "right",

          color:
            "#FFFFFF",

          fontSize:
            "12px",

          fontWeight:
            700,

          lineHeight:
            1.2,

          whiteSpace:
            "nowrap",
        }}
      >

        ₹{" "}

        {formatCurrency(
          installment.installmentAmount,
        )}

      </td>

      {/* ====================================================
          STATUS
      ==================================================== */}

      <td
        style={{
          padding:
            "8px 10px",

          textAlign:
            "center",
        }}
      >

        <span
          style={{
            display:
              "inline-flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            minWidth:
              "76px",

            padding:
              "4px 9px",

            boxSizing:
              "border-box",

            borderRadius:
              "999px",

            background:
              statusStyle.background,

            border:
              statusStyle.border,

            color:
              statusStyle.color,

            fontSize:
              "12px",

            fontWeight:
              700,

            lineHeight:
              1.2,
          }}
        >

          {installment.status}

        </span>

      </td>

    </tr>

  );
}

// ============================================================
// END
// ============================================================
