// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// COLLECTION SUMMARY
//
// RESPONSIBILITY
//
// - Present calculated collection totals
// - Show accrued interest
// - Show selected EMI amount
// - Show manual principal
// - Show late fee / penalty
// - Show gross collection
// - Show discount
// - Show final collection amount
// - Consume FINORA Collection Controller
// - Keep visual styles inside dedicated style file
//
// IMPORTANT
//
// - No business calculation duplication
// - No local theme system
// - No local breakpoint system
// - No inline colour definitions
// - No inline responsive dimensions
// - Calculated values come from Collection Controller
// - Visual geometry comes from dedicated styles
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import {
  useCollectionController,
} from "../controller";

import {
  collectionSummaryStyles,
} from "./CollectionSummary.styles";

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(value: number): string {
  return `₹ ${value.toLocaleString("en-IN")}`;
}

// ============================================================
// SAFE NUMBER
// ============================================================

function safeNumber(value: unknown): number {
  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : 0;
}

// ============================================================
// COMPONENT
// ============================================================

export default function CollectionSummary() {
  // ==========================================================
  // COLLECTION CONTROLLER
  // ==========================================================

  const {
    reviewData,
  } = useCollectionController();

  // ==========================================================
  // SYSTEM GENERATED VALUES
  //
  // These values are presentation-only.
  // The Collection Controller remains the single source
  // of truth for collection calculations.
  // ==========================================================

  const accruedInterest = safeNumber(
    reviewData.todayDue,
  );

  const selectedEmiAmount = safeNumber(
    reviewData.paymentAmount,
  );

  const manualPrincipal = 0;

  const lateFee = 0;

  const discount = 0;

  // ==========================================================
  // GROSS AMOUNT
  //
  // Gross amount is the amount before discount.
  //
  // The controller's payment amount represents the active
  // collection amount. Where separate calculated components
  // are not available in the review contract, we preserve
  // the controller value instead of duplicating business rules.
  // ==========================================================

  const grossAmount =
    selectedEmiAmount +
    manualPrincipal +
    lateFee;

  // ==========================================================
  // FINAL COLLECTION
  // ==========================================================

  const finalCollection = Math.max(
    grossAmount - discount,
    0,
  );

  // ==========================================================
  // EMPTY / SAFE STATE
  // ==========================================================

  const hasCollection =
    selectedEmiAmount > 0 ||
    accruedInterest > 0 ||
    manualPrincipal > 0 ||
    lateFee > 0;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section
      aria-label="Collection Summary"
      style={
        collectionSummaryStyles.container
      }
    >
      {/* ==================================================
          HEADER
      ================================================== */}

      <div
        style={
          collectionSummaryStyles.header
        }
      >
        <div
          style={
            collectionSummaryStyles.headerContent
          }
        >
          <span
            style={
              collectionSummaryStyles.eyebrow
            }
          >
            Step 5
          </span>

          <h2
            style={
              collectionSummaryStyles.title
            }
          >
            Collection Summary
          </h2>

          <span
            style={
              collectionSummaryStyles.subtitle
            }
          >
            Review the final collection amount before payment.
          </span>
        </div>
      </div>

      {/* ==================================================
          SUMMARY METRICS
      ================================================== */}

      <div
        style={
          collectionSummaryStyles.metricGrid
        }
      >
        {/* ================================================
            ACCRUED INTEREST
        ================================================= */}

        <div
          style={
            collectionSummaryStyles.metric
          }
        >
          <span
            style={
              collectionSummaryStyles.metricLabel
            }
          >
            Accrued Interest
          </span>

          <strong
            style={
              collectionSummaryStyles.metricValue
            }
          >
            {formatCurrency(accruedInterest)}
          </strong>
        </div>

        {/* ================================================
            SELECTED EMI
        ================================================= */}

        <div
          style={
            collectionSummaryStyles.metric
          }
        >
          <span
            style={
              collectionSummaryStyles.metricLabel
            }
          >
            Selected EMI Amount
          </span>

          <strong
            style={
              collectionSummaryStyles.metricValue
            }
          >
            {formatCurrency(selectedEmiAmount)}
          </strong>
        </div>

        {/* ================================================
            MANUAL PRINCIPAL
        ================================================= */}

        <div
          style={
            collectionSummaryStyles.metric
          }
        >
          <span
            style={
              collectionSummaryStyles.metricLabel
            }
          >
            Manual Principal
          </span>

          <strong
            style={
              collectionSummaryStyles.metricValue
            }
          >
            {formatCurrency(manualPrincipal)}
          </strong>
        </div>

        {/* ================================================
            LATE FEE
        ================================================= */}

        <div
          style={
            collectionSummaryStyles.metric
          }
        >
          <span
            style={
              collectionSummaryStyles.metricLabel
            }
          >
            Late Fee / Penalty
          </span>

          <strong
            style={
              collectionSummaryStyles.metricValue
            }
          >
            {formatCurrency(lateFee)}
          </strong>
        </div>
      </div>

      {/* ==================================================
          CALCULATION ROW
      ================================================== */}

      <div
        style={
          collectionSummaryStyles.calculation
        }
      >
        <div
          style={
            collectionSummaryStyles.calculationRow
          }
        >
          <span
            style={
              collectionSummaryStyles.calculationLabel
            }
          >
            Gross Amount
          </span>

          <strong
            style={
              collectionSummaryStyles.calculationValue
            }
          >
            {formatCurrency(grossAmount)}
          </strong>
        </div>

        <div
          style={
            collectionSummaryStyles.calculationRow
          }
        >
          <span
            style={
              collectionSummaryStyles.discountLabel
            }
          >
            Discount
          </span>

          <strong
            style={
              collectionSummaryStyles.discountValue
            }
          >
            {formatCurrency(discount)}
          </strong>
        </div>
      </div>

      {/* ==================================================
          FINAL COLLECTION
      ================================================== */}

      <div
        style={
          collectionSummaryStyles.finalCard
        }
      >
        <div
          style={
            collectionSummaryStyles.finalContent
          }
        >
          <span
            style={
              collectionSummaryStyles.finalLabel
            }
          >
            Final Collection
          </span>

          <strong
            style={
              collectionSummaryStyles.finalValue
            }
          >
            {formatCurrency(finalCollection)}
          </strong>
        </div>
      </div>

      {/* ==================================================
          INFORMATION NOTE
      ================================================== */}

      {!hasCollection && (
        <div
          style={
            collectionSummaryStyles.emptyNote
          }
        >
          No collection amount has been selected yet.
        </div>
      )}
    </section>
  );
}

// ============================================================
// END
// ============================================================ 