// ============================================================
// FINORA ENTERPRISE V2
//
// DISBURSEMENT STUDIO
// DISBURSEMENT FORM
//
// RESPONSIBILITY:
// - Display the session-locked ERP Business Date
// - Display calculated net disbursement amount
// - Disbursement amount is NOT manually editable
// - Controlled by LoanStudio
//
// IMPORTANT:
// - Net Disbursement is calculated by LoanStudio.
// - Processing Fee is already deducted before reaching here.
// - Advance Deduction is already deducted before reaching here.
// - Step 6 must never allow manual amount override.
//
// ============================================================

import SummaryCard from "../../common/cards/SummaryCard";

import { FinoraCalendar, FormField, TextInput } from "../../common";

import { formatCurrency } from "../../../utils/currency/formatCurrency";

import { useResponsive } from "../../../utils/responsive";

import {
  disbursementFormStyle,
  fieldsGridStyle,
  fieldStyle,
  formLabelTextStyle,
  inputWrapperStyle,
  amountInputStyle,
} from "./DisbursementForm.styles";

// ============================================================
// TYPES
// ============================================================

interface DisbursementFormProps {
  disbursementDate?: string;

  /**
   * Calculated Net Disbursement.
   *
   * This value comes from LoanStudio.
   *
   * Formula:
   *
   * Principal
   * - Processing Fee
   * - Advance Deduction
   * = Net Disbursement
   *
   * User must NOT manually edit this amount.
   */
  netDisbursement?: number;

}

// ============================================================
// COMPONENT
// ============================================================

export default function DisbursementForm({
  disbursementDate = "",

  netDisbursement = 0,
}: DisbursementFormProps) {
  // ==========================================================
  // SAFE DISPLAY VALUE
  // ==========================================================

  const calculatedDisbursement = Number.isFinite(netDisbursement)
    ? Math.max(0, netDisbursement)
    : 0;

  const formattedDisbursement = formatCurrency(calculatedDisbursement);

  const { tokens } = useResponsive();

  const isMobile = tokens.meta.viewport === "mobile";

  const isTablet = tokens.meta.viewport === "tablet";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div style={disbursementFormStyle}>
      <SummaryCard title="Disbursement Mode">
        {isTablet ? (
          <div
            style={{
              width: "100%",
              minWidth: 0,
              display: "grid",
              gridTemplateColumns:
                "138px minmax(0, 1fr)",
              columnGap: "10px",
              rowGap: "12px",
              alignItems: "center",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                ...formLabelTextStyle,
                fontSize: "13px",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                minWidth: 0,
              }}
            >
              <span>Disbursement Date</span>
              <span
                aria-hidden="true"
                style={{
                  color:
                    "var(--finora-theme-brand-accent, #D39A00)",
                }}
              >
                *
              </span>
            </div>

            <div style={inputWrapperStyle}>
              <div
                className="finora-disbursement-date-compact"
                title="This date is locked to the active FINORA Login Date."
              >
                <FinoraCalendar
                  value={disbursementDate}
                  onChange={() => undefined}
                  disabled
                  allowClear={false}
                  showRelativeDay
                  placeholder="DD/MM/YYYY"
                  ariaLabel="Disbursement Date locked to Login Date"
                />
              </div>
            </div>

            <div
              style={{
                ...formLabelTextStyle,
                fontSize: "13px",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                minWidth: 0,
              }}
            >
              <span>Disbursement Amount</span>
              <span
                aria-hidden="true"
                style={{
                  color:
                    "var(--finora-theme-brand-accent, #D39A00)",
                }}
              >
                *
              </span>
            </div>

            <div style={inputWrapperStyle}>
              <TextInput
                type="text"
                value={formattedDisbursement}
                readOnly
                disabled
                style={amountInputStyle}
              />
            </div>
          </div>
        ) : (
        <div
          style={{
            ...fieldsGridStyle,
            ...(isMobile
              ? {
                  gridTemplateColumns: "minmax(0, 1fr)",
                }
              : {}),
          }}
        >
          {/* =================================================
              DISBURSEMENT DATE
          ================================================= */}

          <div style={fieldStyle}>
            <FormField label="Disbursement Date" required labelTextStyle={formLabelTextStyle}>
              <div style={inputWrapperStyle}>
                <div
                  title="This date is locked to the active FINORA Login Date."
                >
                  <FinoraCalendar
                    value={disbursementDate}
                    onChange={() => undefined}
                    disabled
                    allowClear={false}
                    showRelativeDay
                    placeholder="DD/MM/YYYY"
                    ariaLabel="Disbursement Date locked to Login Date"
                  />
                </div>
              </div>
            </FormField>
          </div>

          {/* =================================================
              NET DISBURSEMENT
          ================================================= */}

          <div style={fieldStyle}>
            <FormField label="Disbursement Amount" required labelTextStyle={formLabelTextStyle}>
              <div style={inputWrapperStyle}>
                <TextInput
                  type="text"
                  value={formattedDisbursement}
                  readOnly
                  disabled
                  style={amountInputStyle}
                />
              </div>
            </FormField>
          </div>
        </div>
        )}
      </SummaryCard>
    </div>
  );
}

// ============================================================
// END
// ============================================================
