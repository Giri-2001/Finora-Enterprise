/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER REVIEW SUMMARY

   RESPONSIBILITY:
   - Customer summary presentation
   - Customer identity preview
   - Customer contact preview
   - KYC status presentation

   BUSINESS LOGIC:
   - NONE

   STYLES:
   CustomerSummary.styles.ts
=========================================================== */

import {
  cardStyle,
  headerStyle,
  titleStyle,
  subtitleStyle,
  dividerStyle,
  rowStyle,
  labelStyle,
  valueStyle,
  emptyValueStyle,
  statusStyle,
} from "./CustomerSummary.styles";

/* ===========================================================
   TYPES
=========================================================== */

interface CustomerSummaryProps {

  customerId?: string;

  customerName?: string;

  phoneNumber?: string;

  kycVerified?: boolean;
}

/* ===========================================================
   SUMMARY ROW
=========================================================== */

function SummaryRow({

  label,

  value,

}: {

  label: string;

  value?: string;

}) {

  const hasValue =
    Boolean(
      value?.trim(),
    );

  return (

    <div style={rowStyle}>

      <span style={labelStyle}>
        {label}
      </span>

      <span
        style={
          hasValue
            ? valueStyle
            : emptyValueStyle
        }
      >
        {hasValue
          ? value
          : "--"}
      </span>

    </div>

  );

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerSummary({

  customerId,

  customerName,

  phoneNumber,

  kycVerified,

}: CustomerSummaryProps) {

  return (

    <section style={cardStyle}>

      {/* =====================================================
         HEADER
      ===================================================== */}

      <div style={headerStyle}>

        <div>

          <h3 style={titleStyle}>
            Customer Summary
          </h3>

          <p style={subtitleStyle}>
            Review the primary customer information before confirmation.
          </p>

        </div>

        <div style={statusStyle}>

          {kycVerified
            ? "✓ KYC Ready"
            : "● KYC Pending"}

        </div>

      </div>

      {/* =====================================================
         DIVIDER
      ===================================================== */}

      <div style={dividerStyle} />

      {/* =====================================================
         CUSTOMER DATA
      ===================================================== */}

      <div>

        <SummaryRow
          label="Customer ID"
          value={customerId}
        />

        <SummaryRow
          label="Customer Name"
          value={customerName}
        />

        <SummaryRow
          label="Phone Number"
          value={phoneNumber}
        />

        <SummaryRow
          label="KYC Status"
          value={
            kycVerified
              ? "Verified"
              : "Pending Verification"
          }
        />

      </div>

    </section>

  );

}
