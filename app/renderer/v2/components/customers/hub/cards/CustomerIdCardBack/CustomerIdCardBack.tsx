/* ===========================================================
FINORA ENTERPRISE OS™

CUSTOMER ID CARD BACK™

REUSABLE PREMIUM BACK FACE
=========================================================== */

import type {
  CustomerIdCardBackProps,
} from "./types";

import {
  cardStyle,
  headerStyle,
  detailRowStyle,
  detailLabelStyle,
  detailValueStyle,
  dividerStyle,
  loanTitleStyle,
  loanRowStyle,
  loanLabelStyle,
  loanValueStyle,
  outstandingStyle,
  detailsButtonStyle,
} from "./styles";

/* ===========================================================
HELPERS
=========================================================== */

function formatCustomerSince(
  value?: string,
): string {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString();
}

/* ===========================================================
COMPONENT
=========================================================== */

export default function CustomerIdCardBack({

  customerId,

  fatherName,

  village,

  mandal,

  district,

  customerSince,

  totalLoans,

  activeLoans,

  closedLoans,

  outstandingAmount,

}: CustomerIdCardBackProps) {

  return (

    <article
      style={cardStyle}
    >

      {/* ================================================
          CUSTOMER ID
      ================================================= */}

      <div
        style={headerStyle}
      >
        {customerId}
      </div>

      {/* ================================================
          CUSTOMER DETAILS
      ================================================= */}

      <div
        style={detailRowStyle}
      >

        <span
          style={detailLabelStyle}
        >
          Family
        </span>

        <span
          style={detailValueStyle}
        >
          {fatherName || "—"}
        </span>

      </div>

      <div
        style={detailRowStyle}
      >

        <span
          style={detailLabelStyle}
        >
          Village
        </span>

        <span
          style={detailValueStyle}
        >
          {village || "—"}
        </span>

      </div>

      <div
        style={detailRowStyle}
      >

        <span
          style={detailLabelStyle}
        >
          Mandal
        </span>

        <span
          style={detailValueStyle}
        >
          {mandal || "—"}
        </span>

      </div>

      <div
        style={detailRowStyle}
      >

        <span
          style={detailLabelStyle}
        >
          District
        </span>

        <span
          style={detailValueStyle}
        >
          {district || "—"}
        </span>

      </div>

      <div
        style={detailRowStyle}
      >

        <span
          style={detailLabelStyle}
        >
          Since
        </span>

        <span
          style={detailValueStyle}
        >
          {formatCustomerSince(
            customerSince,
          )}
        </span>

      </div>

      {/* ================================================
          DIVIDER
      ================================================= */}

      <div
        style={dividerStyle}
      />

      {/* ================================================
          LOAN SUMMARY
      ================================================= */}

      <div
        style={loanTitleStyle}
      >
        LOAN SUMMARY
      </div>

      <div
        style={loanRowStyle}
      >

        <span
          style={loanLabelStyle}
        >
          Total Loans
        </span>

        <span
          style={loanValueStyle}
        >
          {totalLoans ?? 0}
        </span>

      </div>

      <div
        style={loanRowStyle}
      >

        <span
          style={loanLabelStyle}
        >
          Active
        </span>

        <span
          style={loanValueStyle}
        >
          {activeLoans ?? 0}
        </span>

      </div>

      <div
        style={loanRowStyle}
      >

        <span
          style={loanLabelStyle}
        >
          Closed
        </span>

        <span
          style={loanValueStyle}
        >
          {closedLoans ?? 0}
        </span>

      </div>

      {/* ================================================
          OUTSTANDING
      ================================================= */}

      <div
        style={outstandingStyle}
      >

        <span
          style={loanLabelStyle}
        >
          Outstanding
        </span>

        <span
          style={loanValueStyle}
        >
          ₹ {outstandingAmount ?? 0}
        </span>

      </div>

      {/* ================================================
          DETAILS ACTION
      ================================================= */}

      <button
        type="button"
        style={detailsButtonStyle}
      >
        VIEW FULL DETAILS
      </button>

    </article>
  );
}
