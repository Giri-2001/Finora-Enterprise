/* ===========================================================
   FINORA ENTERPRISE OS™
   TODAY COLLECTIONS PREVIEW CARD™

   COMPONENT
=========================================================== */

import type {
  TodayCollectionsPreviewCardProps,
} from "./types";

import {
  CARD_TITLE,
  DUE_LABEL,
  COLLECTED_LABEL,
  PENDING_LABEL,
  TARGET_LABEL,
  FOOTER_LABEL,
  DEFAULT_AMOUNT,
} from "./constants";

import {
  getTodayDueAmount,
  getTodayCollectedAmount,
  getTodayPendingAmount,
} from "./helpers";

import {
  containerStyle,
  headerStyle,
  titleStyle,
  bodyStyle,
  gridStyle,
  dueCardStyle,
  collectedCardStyle,
  pendingCardStyle,
  targetCardStyle,
  statLabelStyle,
  dueValueStyle,
  collectedValueStyle,
  pendingValueStyle,
  targetValueStyle,
  footerStyle,
  footerLabelStyle,
  footerArrowStyle,
} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function TodayCollectionsPreviewCard({

  customer,

}: TodayCollectionsPreviewCardProps) {

  const dueAmount =
    getTodayDueAmount(customer);

  const collectedAmount =
    getTodayCollectedAmount(customer);

  const pendingAmount =
    getTodayPendingAmount(customer);

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

          {/* Due Today */}

          <div style={dueCardStyle}>

            <div style={statLabelStyle}>

              {DUE_LABEL}

            </div>

            <div style={dueValueStyle}>

              ₹ {dueAmount}

            </div>

          </div>

          {/* Collected */}

          <div style={collectedCardStyle}>

            <div style={statLabelStyle}>

              {COLLECTED_LABEL}

            </div>

            <div style={collectedValueStyle}>

              ₹ {collectedAmount}

            </div>

          </div>

                    {/* Pending */}

          <div style={pendingCardStyle}>

            <div style={statLabelStyle}>

              {PENDING_LABEL}

            </div>

            <div style={pendingValueStyle}>

              ₹ {pendingAmount}

            </div>

          </div>

          {/* Target */}

          <div style={targetCardStyle}>

            <div style={statLabelStyle}>

              {TARGET_LABEL}

            </div>

            <div style={targetValueStyle}>

              ₹ {DEFAULT_AMOUNT}

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
