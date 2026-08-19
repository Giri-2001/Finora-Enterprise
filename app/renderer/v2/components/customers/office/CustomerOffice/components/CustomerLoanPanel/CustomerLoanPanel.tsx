/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER LOAN PANEL™

   COMPONENT
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CustomerLoanPanelProps,
} from "./types";

import {
  LOAN_PANEL_TITLE,
  LOAN_PANEL_SUBTITLE_PREFIX,
  LOAN_STATISTICS,
} from "./constants";

import {
  buildLoanStatistics,
  getCustomerLoans,
} from "./helpers";

import {
  useResponsive,
} from "../../../../../../utils/responsive";

import {
  createCustomerLoanPanelStyles,
} from "./styles";

import LoanCard from "../LoanCard";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerLoanPanel({
  customer,
}: CustomerLoanPanelProps) {


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
    createCustomerLoanPanelStyles(
      tokens,
    );


  /* =========================================================
     LOAN DATA
  ========================================================= */

  const loans =
    getCustomerLoans(
      customer,
    );


  const {
    runningLoans,
    closedLoans,
    totalAmount,
    outstandingAmount,
  } =
    buildLoanStatistics(
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

      <div>

        <h2
          style={
            styles.titleStyle
          }
        >

          {
            LOAN_PANEL_TITLE
          }

        </h2>


        <p
          style={
            styles.subtitleStyle
          }
        >

          {
            LOAN_PANEL_SUBTITLE_PREFIX
          }

          {" "}

          {
            customer.name
          }

        </p>

      </div>


      {/* ======================================
          STATISTICS
      ====================================== */}

      <section
        style={
          styles.statisticsGridStyle
        }
      >

        {/* ====================================
            RUNNING LOANS
        ==================================== */}

        <div
          style={
            styles.statisticCardStyle
          }
        >

          <div
            style={
              styles.statisticLabelStyle
            }
          >

            {
              LOAN_STATISTICS.RUNNING
            }

          </div>


          <div
            style={
              styles.runningValueStyle
            }
          >

            {
              runningLoans
            }

          </div>

        </div>


        {/* ====================================
            CLOSED LOANS
        ==================================== */}

        <div
          style={
            styles.statisticCardStyle
          }
        >

          <div
            style={
              styles.statisticLabelStyle
            }
          >

            {
              LOAN_STATISTICS.CLOSED
            }

          </div>


          <div
            style={
              styles.closedValueStyle
            }
          >

            {
              closedLoans
            }

          </div>

        </div>


        {/* ====================================
            TOTAL LOAN AMOUNT
        ==================================== */}

        <div
          style={
            styles.statisticCardStyle
          }
        >

          <div
            style={
              styles.statisticLabelStyle
            }
          >

            {
              LOAN_STATISTICS.TOTAL
            }

          </div>


          <div
            style={
              styles.amountValueStyle
            }
          >

            ₹
            {
              totalAmount.toLocaleString()
            }

          </div>

        </div>


        {/* ====================================
            OUTSTANDING AMOUNT
        ==================================== */}

        <div
          style={
            styles.statisticCardStyle
          }
        >

          <div
            style={
              styles.statisticLabelStyle
            }
          >

            {
              LOAN_STATISTICS.PENDING
            }

          </div>


          <div
            style={
              styles.amountValueStyle
            }
          >

            ₹
            {
              outstandingAmount.toLocaleString()
            }

          </div>

        </div>

      </section>


      {/* ======================================
          RECENT LOANS TITLE
      ====================================== */}

      <h3
        style={
          styles.sectionTitleStyle
        }
      >

        Recent Loans

      </h3>


      {/* ======================================
          LOANS
      ====================================== */}

      <section
        style={
          styles.loansSectionStyle
        }
      >

        {
          loans.length > 0

            ?

            loans.map(
              (loan) => (

                <LoanCard
                  key={
                    loan.id
                  }

                  loan={
                    loan
                  }
                />

              ),
            )

            :

            (

              <div
                style={
                  styles.emptyStateStyle
                }
              >

                No loans available

              </div>

            )
        }

      </section>

    </section>

  );

}


/* ===========================================================
   END
=========================================================== */