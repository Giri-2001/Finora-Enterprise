/* ===========================================================
   FINORA ENTERPRISE OS™
   ACTION NEEDED PREVIEW CARD™

   COMPONENT
=========================================================== */


/* ===========================================================
   IMPORTS
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
  useResponsive,
} from "../../../../../../utils/responsive";

import {
  createActionNeededPreviewCardStyles,
} from "./styles";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function ActionNeededPreviewCard({

  customer,

}: ActionNeededPreviewCardProps) {


  /* =========================================================
     RESPONSIVE TOKENS
  ========================================================= */

  const {
    tokens,
  } = useResponsive();


  /* =========================================================
     RESPONSIVE STYLES
  ========================================================= */

  const styles =
    createActionNeededPreviewCardStyles(
      tokens,
    );


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <section
      style={
        styles.containerStyle
      }
    >

      {/* ======================================
          HEADER
      ====================================== */}

      <header
        style={
          styles.headerStyle
        }
      >

        <div
          style={
            styles.titleStyle
          }
        >

          {
            CARD_TITLE
          }

        </div>

      </header>


      {/* ======================================
          BODY
      ====================================== */}

      <div
        style={
          styles.bodyStyle
        }
      >

        {/* ====================================
            OUTSTANDING
        ==================================== */}

        <div
          style={
            styles.sectionStyle
          }
        >

          <div
            style={
              styles.outstandingLabelStyle
            }
          >

            {
              OUTSTANDING_ICON
            }

            {" "}

            {
              OUTSTANDING_LABEL
            }

          </div>


          <div
            style={
              styles.valueStyle
            }
          >

            {
              getOutstandingMessage(
                customer,
              )
            }

          </div>

        </div>


        {/* ====================================
            CUSTOMER STATUS
        ==================================== */}

        <div
          style={
            styles.sectionStyle
          }
        >

          <div
            style={
              styles.statusLabelStyle
            }
          >

            {
              STATUS_ICON
            }

            {" "}

            {
              CUSTOMER_STATUS_LABEL
            }

          </div>


          <div
            style={
              styles.valueStyle
            }
          >

            {
              getCustomerStatus(
                customer,
              )
            }

          </div>

        </div>


        {/* ====================================
            NEXT COLLECTION
        ==================================== */}

        <div
          style={
            styles.sectionStyle
          }
        >

          <div
            style={
              styles.collectionLabelStyle
            }
          >

            {
              COLLECTION_ICON
            }

            {" "}

            {
              NEXT_COLLECTION_LABEL
            }

          </div>


          <div
            style={
              styles.valueStyle
            }
          >

            {
              getNextCollectionDate(
                customer,
              )
            }

          </div>

        </div>


        {/* ====================================
            FOOTER
        ==================================== */}

        <div
          style={
            styles.footerStyle
          }
        >

          <span
            style={
              styles.footerLabelStyle
            }
          >

            {
              FOOTER_LABEL
            }

          </span>


          <span
            style={
              styles.footerArrowStyle
            }
          >

            {
              FOOTER_ARROW
            }

          </span>

        </div>

      </div>

    </section>

  );

}


/* ===========================================================
   END
=========================================================== */