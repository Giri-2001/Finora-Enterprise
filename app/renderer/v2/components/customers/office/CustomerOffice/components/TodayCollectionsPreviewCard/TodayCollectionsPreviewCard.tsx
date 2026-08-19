/* ===========================================================
   FINORA ENTERPRISE OS™
   TODAY COLLECTIONS PREVIEW CARD™

   COMPONENT
=========================================================== */


/* ===========================================================
   IMPORTS
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
  useResponsive,
} from "../../../../../../utils/responsive";

import {
  createTodayCollectionsPreviewCardStyles,
} from "./styles";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function TodayCollectionsPreviewCard({

  customer,

}: TodayCollectionsPreviewCardProps) {


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
    createTodayCollectionsPreviewCardStyles(
      tokens,
    );


  /* =========================================================
     BUSINESS DATA
  ========================================================= */

  const dueAmount =
    getTodayDueAmount(
      customer,
    );

  const collectedAmount =
    getTodayCollectedAmount(
      customer,
    );

  const pendingAmount =
    getTodayPendingAmount(
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
              DUE TODAY
          ================================== */}

          <div
            style={
              styles.dueCardStyle
            }
          >

            <div
              style={
                styles.statLabelStyle
              }
            >

              {
                DUE_LABEL
              }

            </div>


            <div
              style={
                styles.dueValueStyle
              }
            >

              ₹ {dueAmount}

            </div>

          </div>


          {/* ==================================
              COLLECTED
          ================================== */}

          <div
            style={
              styles.collectedCardStyle
            }
          >

            <div
              style={
                styles.statLabelStyle
              }
            >

              {
                COLLECTED_LABEL
              }

            </div>


            <div
              style={
                styles.collectedValueStyle
              }
            >

              ₹ {collectedAmount}

            </div>

          </div>


          {/* ==================================
              PENDING
          ================================== */}

          <div
            style={
              styles.pendingCardStyle
            }
          >

            <div
              style={
                styles.statLabelStyle
              }
            >

              {
                PENDING_LABEL
              }

            </div>


            <div
              style={
                styles.pendingValueStyle
              }
            >

              ₹ {pendingAmount}

            </div>

          </div>


          {/* ==================================
              TARGET
          ================================== */}

          <div
            style={
              styles.targetCardStyle
            }
          >

            <div
              style={
                styles.statLabelStyle
              }
            >

              {
                TARGET_LABEL
              }

            </div>


            <div
              style={
                styles.targetValueStyle
              }
            >

              ₹ {DEFAULT_AMOUNT}

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