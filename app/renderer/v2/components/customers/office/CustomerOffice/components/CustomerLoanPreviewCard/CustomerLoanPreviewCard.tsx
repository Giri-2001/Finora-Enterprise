/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER LOAN PREVIEW CARD™

   COMPONENT
=========================================================== */

import type {
  CustomerLoanPreviewCardProps,
} from "./types";

import {
  CARD_TITLE,
  RUNNING_LABEL,
  CLOSED_LABEL,
  OUTSTANDING_LABEL,
  EMI_TODAY_LABEL,
  FOOTER_LABEL,
  DEFAULT_EMI_COUNT,
} from "./constants";

import {
  getRunningLoans,
  getClosedLoans,
  getOutstandingAmount,
} from "./helpers";

import {
  containerStyle,
  headerStyle,
  titleStyle,
  bodyStyle,
  gridStyle,
  runningCardStyle,
  closedCardStyle,
  outstandingCardStyle,
  emiCardStyle,
  statLabelStyle,
  runningValueStyle,
  closedValueStyle,
  moneyValueStyle,
  emiValueStyle,
  footerStyle,
  footerLabelStyle,
  footerArrowStyle,
} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerLoanPreviewCard({

  customer,

}: CustomerLoanPreviewCardProps) {

  const runningLoans =
    getRunningLoans(customer);

  const closedLoans =
    getClosedLoans(customer);

  const outstandingAmount =
    getOutstandingAmount(customer);

  return (

    <section style={containerStyle}>

      {/* ======================================
          HEADER
      ====================================== */}

      <header style={headerStyle}>

        <div style={titleStyle}>

          {CARD_TITLE}

        </div>

      </header>

      {/* ======================================
          BODY
      ====================================== */}

      <div style={bodyStyle}>

        <div style={gridStyle}>

          {/* Running */}

          <div style={runningCardStyle}>

            <div style={statLabelStyle}>

              {RUNNING_LABEL}

            </div>

            <div style={runningValueStyle}>

              {runningLoans.length}

            </div>

          </div>

          {/* Closed */}

          <div style={closedCardStyle}>

            <div style={statLabelStyle}>

              {CLOSED_LABEL}

            </div>

            <div style={closedValueStyle}>

              {closedLoans.length}

            </div>

          </div>

                      {/* Outstanding */}

          <div style={outstandingCardStyle}>

            <div style={statLabelStyle}>

              {OUTSTANDING_LABEL}

            </div>

            <div style={moneyValueStyle}>

              ₹ {outstandingAmount}

            </div>

          </div>

          {/* EMI Today */}

          <div style={emiCardStyle}>

            <div style={statLabelStyle}>

              {EMI_TODAY_LABEL}

            </div>

            <div style={emiValueStyle}>

              {DEFAULT_EMI_COUNT}

            </div>

          </div>

        </div>

      </div>

      {/* ======================================
          FOOTER
      ====================================== */}

      <footer style={footerStyle}>

        <div style={footerLabelStyle}>

          {FOOTER_LABEL}

        </div>

        <div style={footerArrowStyle}>

          →

        </div>

      </footer>

    </section>

  );

}
