/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER ID CARD BACK™

   PREMIUM CUSTOMER SUMMARY PRESENTATION

   Module  : Customer Hub
   Layer   : Cards / Customer Identity
   Version : 2.8
   Status  : Production

   RESPONSIBILITY:
   - Present the reverse side of the Customer ID Card.
   - Keep the customer ID visually dominant at the top.
   - Present address / customer-since information.
   - Present loan summary without text collisions.
   - Present Last Payment as a premium payment snapshot.
   - Present Outstanding as the final card section.
   - Use Lucide icons already installed in FINORA.
   - Consume the existing FINORA Responsive Engine tokens.

   FINAL CARD CONTENT:
   - Customer ID
   - Village
   - PinCode
   - District
   - Since
   - Loan Summary
       → All Loans
       → Active
       → Closed
   - Last Payment
   - Outstanding

   IMPORTANT:
   - FAMILY row intentionally removed.
   - TOTAL LOANS renamed to ALL LOANS.
   - No bottom CUSTOMER ID marker.
   - No breakpoint logic belongs here.
   - No independent responsive sizing belongs here.
   - All responsive dimensions are consumed from
     ResponsiveTokens.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import {
  CalendarDays,
  CircleDollarSign,
  MapPin,
  Navigation,
  Building2,
  WalletCards,
  History,
} from "lucide-react";

import type { CustomerIdCardBackProps } from "./types";

import type { ResponsiveTokens } from "../../../../../utils/responsive/customers/customers.tokens";

import { DEFAULT_CUSTOMER_TOKENS } from "../../../../../utils/responsive/customers/customers.tokens";

import {
  createCardStyle,
  createContentStyle,
  createCustomerIdStyle,
  createTopDividerStyle,
  createFieldListStyle,
  createFieldRowStyle,
  createIconStyle,
  createLabelStyle,
  createValueStyle,
  createSectionDividerStyle,
  createSectionTitleStyle,
  createLoanSummaryStyle,
  createLoanMetricStyle,
  createLoanMetricLabelStyle,
  createLoanMetricValueStyle,
  createLastPaymentStyle,
  createLastPaymentIconStyle,
  createLastPaymentLabelStyle,
  createLastPaymentValueStyle,
  createOutstandingStyle,
  createOutstandingLabelStyle,
  createOutstandingValueStyle,
} from "./styles";

/* ===========================================================
   EXTENDED PROPS
=========================================================== */

type CustomerIdCardBackResolvedProps = CustomerIdCardBackProps & {
  responsiveTokens?: ResponsiveTokens;
};

/* ===========================================================
   HELPERS
=========================================================== */

function safeText(value: string | number | undefined): string {
  if (value === undefined || value === null || String(value).trim() === "") {
    return "--";
  }

  return String(value);
}

function safeNumber(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatAmount(value: number | undefined): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(safeNumber(value));
}

function formatCustomerSince(value: string | undefined): string {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",

    month: "2-digit",

    year: "numeric",
  }).format(date);
}

function formatPaymentDate(value: string | undefined): string {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",

    month: "2-digit",

    year: "numeric",
  }).format(date);
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerIdCardBack({
  customerId,

  village,

  pinCode,

  district,

  customerSince,

  totalLoans,

  activeLoans,

  closedLoans,

  lastPaymentAmount,

  lastPaymentDate,

  outstandingAmount,

  responsiveTokens,
}: CustomerIdCardBackResolvedProps) {
  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const tokens = responsiveTokens ?? DEFAULT_CUSTOMER_TOKENS;

  /* =========================================================
     RESOLVED STYLES
  ========================================================= */

  const cardStyle = createCardStyle(tokens);

  const contentStyle = createContentStyle(tokens);

  const customerIdStyle = createCustomerIdStyle(tokens);

  const topDividerStyle = createTopDividerStyle(tokens);

  const fieldListStyle = createFieldListStyle(tokens);

  const fieldRowStyle = createFieldRowStyle(tokens);

  const iconStyle = createIconStyle(tokens);

  const labelStyle = createLabelStyle(tokens);

  const valueStyle = createValueStyle(tokens);

  const sectionDividerStyle = createSectionDividerStyle(tokens);

  const sectionTitleStyle = createSectionTitleStyle(tokens);

  const loanSummaryStyle = createLoanSummaryStyle(tokens);

  const loanMetricStyle = createLoanMetricStyle(tokens);

  const loanMetricLabelStyle = createLoanMetricLabelStyle(tokens);

  const loanMetricValueStyle = createLoanMetricValueStyle(tokens);

  const lastPaymentStyle = createLastPaymentStyle(tokens);

  const lastPaymentIconStyle = createLastPaymentIconStyle(tokens);

  const lastPaymentLabelStyle = createLastPaymentLabelStyle(tokens);

  const lastPaymentValueStyle = createLastPaymentValueStyle(tokens);

  const outstandingStyle = createOutstandingStyle(tokens);

  const outstandingLabelStyle = createOutstandingLabelStyle(tokens);

  const outstandingValueStyle = createOutstandingValueStyle(tokens);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <article data-finora-customer-card-back="true" style={cardStyle}>
      {/* =====================================================
          INNER CONTENT
      ===================================================== */}

      <div style={contentStyle}>
        {/* ===================================================
            CUSTOMER ID
        =================================================== */}

        <div style={customerIdStyle} title={customerId}>
          {safeText(customerId)}
        </div>

        {/* ===================================================
            TOP ID DIVIDER
        =================================================== */}

        <div style={topDividerStyle} />

        {/* ===================================================
            ADDRESS / CUSTOMER DETAILS

            FAMILY intentionally removed.

            FINAL:
            - Village
            - PinCode
            - District
            - Since
        =================================================== */}

        <div style={fieldListStyle}>
          {/* =================================================
              VILLAGE
          ================================================= */}

          <div style={fieldRowStyle}>
            <MapPin style={iconStyle} />

            <span style={labelStyle}>VILLAGE</span>

            <span
              style={{
                ...labelStyle,
                textAlign: "center",
              }}
            >
              :
            </span>

            <span style={valueStyle} title={safeText(village)}>
              {safeText(village)}
            </span>
          </div>

          {/* =================================================
    PIN CODE
================================================= */}

          <div style={fieldRowStyle}>
            <MapPin style={iconStyle} />

            <span style={labelStyle}>PIN CODE</span>

            <span
              style={{
                ...labelStyle,
                textAlign: "center",
              }}
            >
              :
            </span>

            <span style={valueStyle} title={safeText(pinCode)}>
              {safeText(pinCode)}
            </span>
          </div>

          {/* =================================================
              DISTRICT
          ================================================= */}

          <div style={fieldRowStyle}>
            <Building2 style={iconStyle} />

            <span style={labelStyle}>DISTRICT</span>

            <span
              style={{
                ...labelStyle,
                textAlign: "center",
              }}
            >
              :
            </span>

            <span style={valueStyle} title={safeText(district)}>
              {safeText(district)}
            </span>
          </div>

          {/* =================================================
              CUSTOMER SINCE
          ================================================= */}

          <div style={fieldRowStyle}>
            <CalendarDays style={iconStyle} />

            <span style={labelStyle}>SINCE</span>

            <span
              style={{
                ...labelStyle,
                textAlign: "center",
              }}
            >
              :
            </span>

            <span style={valueStyle}>{formatCustomerSince(customerSince)}</span>
          </div>
        </div>

        {/* ===================================================
            SECTION DIVIDER
        =================================================== */}

        <div style={sectionDividerStyle} />

        {/* ===================================================
            LOAN SUMMARY TITLE
        =================================================== */}

        <div style={sectionTitleStyle}>
          <WalletCards style={iconStyle} />

          <span>LOAN SUMMARY</span>
        </div>

        {/* ===================================================
            LOAN SUMMARY METRICS

            FINAL:
              ALL
              ACTIVE
              CLOSED

            Three equal boxes are preserved.
        =================================================== */}

        <div style={loanSummaryStyle}>
          {/* =================================================
              ALL LOANS
          ================================================= */}

          <div style={loanMetricStyle}>
            <span style={loanMetricLabelStyle}>ALL</span>

            <strong style={loanMetricValueStyle}>
              {safeNumber(totalLoans)}
            </strong>
          </div>

          {/* =================================================
              ACTIVE
          ================================================= */}

          <div style={loanMetricStyle}>
            <span style={loanMetricLabelStyle}>ACTIVE</span>

            <strong style={loanMetricValueStyle}>
              {safeNumber(activeLoans)}
            </strong>
          </div>

          {/* =================================================
              CLOSED
          ================================================= */}

          <div style={loanMetricStyle}>
            <span style={loanMetricLabelStyle}>CLOSED</span>

            <strong style={loanMetricValueStyle}>
              {safeNumber(closedLoans)}
            </strong>
          </div>
        </div>

        {/* ===================================================
            LAST PAYMENT
        =================================================== */}

        <div style={lastPaymentStyle}>
          <History style={lastPaymentIconStyle} />

          <div
            style={{
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "2px",
            }}
          >
            <span style={lastPaymentLabelStyle}>LAST PAYMENT</span>

            <span style={lastPaymentValueStyle}>
              {lastPaymentDate ? formatCustomerSince(lastPaymentDate) : "--"}
            </span>
          </div>

          <strong
            style={{
              ...outstandingValueStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "6px",
              paddingLeft: "6px",
            }}
          >
            <span>₹</span>

            <span>{formatAmount(lastPaymentAmount)}</span>
          </strong>
        </div>

        {/* ===================================================
            OUTSTANDING
        =================================================== */}

        <div style={outstandingStyle}>
          <CircleDollarSign
            style={{
              ...iconStyle,

              width: `${Math.max(tokens.icon.md, 18)}px`,

              height: `${Math.max(tokens.icon.md, 18)}px`,
            }}
          />

          <span style={outstandingLabelStyle}>OUTSTANDING</span>

          <strong
            style={{
              ...outstandingValueStyle,

              display: "flex",

              alignItems: "center",

              justifyContent: "flex-end",

              gap: "6px",
            }}
          >
            <span>₹</span>

            <span>{formatAmount(outstandingAmount)}</span>
          </strong>
        </div>
      </div>
    </article>
  );
}

/* ===========================================================
   END
=========================================================== */
