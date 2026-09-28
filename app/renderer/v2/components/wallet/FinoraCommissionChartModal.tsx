/* ============================================================
   FINORA ENTERPRISE OS™

   FINORA WALLET™

   FINORA COMMISSION CHART MODAL

   RESPONSIBILITY:
   - Present current FINORA release fees
   - Present previous fee only when the release value changed
   - Presentation only
============================================================ */

import {
  X,
} from "lucide-react";

import {
  useResponsive,
} from "../../utils/responsive";

import {
  formatRupee,
} from "../../utils/currency/formatCurrency";

import type {
  FinoraFeeChartPricing,
  FinoraFeeChartValue,
} from "../../services/pricing/finoraFeeChartPricing";

import {
  createFinoraCommissionChartModalStyles,
} from "./FinoraCommissionChartModal.styles";

interface FinoraCommissionChartModalProps {
  pricing:
    FinoraFeeChartPricing;

  onClose:
    () => void;
}

interface FeeRow {
  label:
    string;

  value:
    FinoraFeeChartValue;
}

function renderFeeValue(
  value: FinoraFeeChartValue,
): string {
  if (
    typeof value.previous === "number" &&
    value.previous !== value.current
  ) {
    return `${formatRupee(value.previous)} → ${formatRupee(value.current)}`;
  }

  return formatRupee(value.current);
}

export default function FinoraCommissionChartModal({
  pricing,
  onClose,
}: FinoraCommissionChartModalProps) {
  const {
    tokens,
  } = useResponsive();

  const styles =
    createFinoraCommissionChartModalStyles(tokens);

  const rows:
    FeeRow[] = [
      {
        label:
          "Customer Fee",

        value:
          pricing.customerFee,
      },

      {
        label:
          "Loan Fee",

        value:
          pricing.loanFee,
      },

      {
        label:
          "Collection — Below ₹25,000",

        value:
          pricing.collectionBelow25000,
      },

      {
        label:
          "Collection — ₹25,000 – ₹50,000",

        value:
          pricing.collection25000To50000,
      },

      {
        label:
          "Collection — Above ₹50,000",

        value:
          pricing.collectionAbove50000,
      },
    ];

  return (
    <div
      style={styles.backdrop}
      onClick={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="finora-commission-chart-title"
        style={styles.panel}
      >
        <div style={styles.header}>
          <div style={styles.headingGroup}>
            <h2
              id="finora-commission-chart-title"
              style={styles.title}
            >
              FINORA Commission Chart
            </h2>

            <p style={styles.subtitle}>
              Current FINORA platform fees for this branch.
              Changed release values show previous → current.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close FINORA Commission Chart"
            style={styles.iconButton}
          >
            <X
              size={tokens.icon.md}
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
        </div>

        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span style={styles.tableHeaderLabel}>
              Fee Type
            </span>

            <span style={styles.tableHeaderValue}>
              Amount
            </span>
          </div>

          {rows.map((row) => (
            <div
              key={row.label}
              style={styles.tableRow}
            >
              <span style={styles.rowLabel}>
                {row.label}
              </span>

              <span style={styles.rowValue}>
                {renderFeeValue(row.value)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}