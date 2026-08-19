/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER LOAN PREVIEW CARD™

   COMPONENT
=========================================================== */


/* ===========================================================
   IMPORTS
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
  useResponsive,
} from "../../../../../../utils/responsive";

import {
  createCustomerLoanPreviewCardStyles,
} from "./styles";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerLoanPreviewCard({

  customer,

}: CustomerLoanPreviewCardProps) {


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
    createCustomerLoanPreviewCardStyles(
      tokens,
    );


  /* =========================================================
     LOAN DATA
  ========================================================= */

  const runningLoans =
    getRunningLoans(
      customer,
    );

  const closedLoans =
    getClosedLoans(
      customer,
    );

  const outstandingAmount =
    getOutstandingAmount(
      customer,
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

        <div
          style={
            styles.gridStyle
          }
        >

          {/* ==================================
              RUNNING
          ================================== */}

          <div
            style={
              styles.runningCardStyle
            }
          >

            <div
              style={
                styles.statLabelStyle
              }
            >

              {
                RUNNING_LABEL
              }

            </div>


            <div
              style={
                styles.runningValueStyle
              }
            >

              {
                runningLoans.length
              }

            </div>

          </div>


          {/* ==================================
              CLOSED
          ================================== */}

          <div
            style={
              styles.closedCardStyle
            }
          >

            <div
              style={
                styles.statLabelStyle
              }
            >

              {
                CLOSED_LABEL
              }

            </div>


            <div
              style={
                styles.closedValueStyle
              }
            >

              {
                closedLoans.length
              }

            </div>

          </div>


          {/* ==================================
              OUTSTANDING
          ================================== */}

          <div
            style={
              styles.outstandingCardStyle
            }
          >

            <div
              style={
                styles.statLabelStyle
              }
            >

              {
                OUTSTANDING_LABEL
              }

            </div>


            <div
              style={
                styles.moneyValueStyle
              }
            >

              ₹{" "}

              {
                outstandingAmount
              }

            </div>

          </div>


          {/* ==================================
              EMI TODAY
          ================================== */}

          <div
            style={
              styles.emiCardStyle
            }
          >

            <div
              style={
                styles.statLabelStyle
              }
            >

              {
                EMI_TODAY_LABEL
              }

            </div>


            <div
              style={
                styles.emiValueStyle
              }
            >

              {
                DEFAULT_EMI_COUNT
              }

            </div>

          </div>

        </div>

      </div>


      {/* ======================================
          FOOTER
      ====================================== */}

      <footer
        style={
          styles.footerStyle
        }
      >

        <div
          style={
            styles.footerLabelStyle
          }
        >

          {
            FOOTER_LABEL
          }

        </div>


        <div
          style={
            styles.footerArrowStyle
          }
        >

          →

        </div>

      </footer>

    </section>

  );

}


/* ===========================================================
   END
=========================================================== */