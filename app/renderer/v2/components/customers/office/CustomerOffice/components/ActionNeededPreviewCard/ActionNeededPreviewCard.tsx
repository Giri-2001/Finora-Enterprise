/* ===========================================================
   FINORA ENTERPRISE OS™
   ACTION NEEDED PREVIEW CARD™

   COMPONENT
=========================================================== */

import type {
  ActionNeededPreviewCardProps,
} from "./types";

import {
  CARD_TITLE,
  OUTSTANDING_LABEL,
  CUSTOMER_STATUS_LABEL,
  NEXT_COLLECTION_LABEL,
  FOOTER_LABEL,
  OUTSTANDING_ICON,
  STATUS_ICON,
  COLLECTION_ICON,
  FOOTER_ARROW,
} from "./constants";

import {
  getOutstandingMessage,
  getCustomerStatus,
  getNextCollectionDate,
} from "./helpers";

import {
  containerStyle,
  headerStyle,
  titleStyle,
  bodyStyle,
  sectionStyle,
  outstandingLabelStyle,
  statusLabelStyle,
  collectionLabelStyle,
  valueStyle,
  footerStyle,
  footerLabelStyle,
  footerArrowStyle,
} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ActionNeededPreviewCard({

  customer,

}: ActionNeededPreviewCardProps) {

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

        {/* Outstanding */}

        <div style={sectionStyle}>

          <div style={outstandingLabelStyle}>

            {OUTSTANDING_ICON} {OUTSTANDING_LABEL}

          </div>

          <div style={valueStyle}>

            {getOutstandingMessage(customer)}

          </div>

        </div>

        {/* Customer Status */}

        <div style={sectionStyle}>

          <div style={statusLabelStyle}>

            {STATUS_ICON} {CUSTOMER_STATUS_LABEL}

          </div>

          <div style={valueStyle}>

            {getCustomerStatus(customer)}

          </div>

        </div>

                {/* Next Collection */}

        <div style={sectionStyle}>

          <div style={collectionLabelStyle}>

            {COLLECTION_ICON} {NEXT_COLLECTION_LABEL}

          </div>

          <div style={valueStyle}>

            {getNextCollectionDate(customer)}

          </div>

        </div>

        {/* Footer */}

        <div style={footerStyle}>

          <span style={footerLabelStyle}>

            {FOOTER_LABEL}

          </span>

          <span style={footerArrowStyle}>

            {FOOTER_ARROW}

          </span>

        </div>

      </div>

    </section>

  );

}
