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

import { FormField, TextInput } from "../../common";

import {
  disbursementFormStyle,
  fieldsGridStyle,
  fieldStyle,
  inputWrapperStyle,
  dateInputStyle,
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

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div style={disbursementFormStyle}>
      <SummaryCard title="Disbursement Mode">
        <div style={fieldsGridStyle}>
          {/* =================================================
              DISBURSEMENT DATE
          ================================================= */}

          <div style={fieldStyle}>
            <FormField label="Disbursement Date" required>
              <div style={inputWrapperStyle}>
                <TextInput
                  type="date"
                  value={disbursementDate}
                  readOnly
                  disabled
                  aria-label="Disbursement Date locked to Login Date"
                  title="This date is locked to the active FINORA Login Date."
                  style={dateInputStyle}
                />
              </div>
            </FormField>
          </div>

          {/* =================================================
              NET DISBURSEMENT
          ================================================= */}

          <div style={fieldStyle}>
            <FormField label="Disbursement Amount" required>
              <div style={inputWrapperStyle}>
                <TextInput
                  type="number"
                  value={calculatedDisbursement}
                  readOnly
                  disabled
                  style={amountInputStyle}
                />
              </div>
            </FormField>
          </div>
        </div>
      </SummaryCard>
    </div>
  );
}

// ============================================================
// END
// ============================================================
