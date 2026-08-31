// ============================================================
// FINORA ENTERPRISE V2
//
// LOAN DETAILS STUDIO
// LOAN FORM
//
// RESPONSIBILITY:
// - Render Loan Details input fields.
// - Consume central FINORA Responsive Engine.
// - Consume dedicated Step 1 responsive tokens.
// - Forward field changes to LoanStudio.
// - Support locked principal for Gold Loan handoff.
// - Keep Loan business logic outside this component.
//
// RESPONSIVE CONTRACT:
// - Mobile  : 1 field per row.
// - Tablet  : 2 fields per row.
// - Laptop  : 4 fields per row.
// - Desktop : 4 fields per row.
//
// IMPORTANT:
// - No window.innerWidth.
// - No local breakpoint logic.
// - No business calculations.
// - No persistence logic.
// - Responsive geometry comes from Step 1 tokens.
// - Theme colours remain owned by FINORA Theme Engine.
// - Standard Loan behaviour remains unchanged.
// - Gold Loan may lock Loan Amount after Gold Step 1.
//
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import type { ChangeEvent } from "react";

/* ============================================================
   FINORA RESPONSIVE ENGINE
============================================================ */

import { useResponsive } from "../../../utils/responsive";

/* ============================================================
   STEP 1 RESPONSIVE TOKEN ENGINE
============================================================ */

import { getStep1DetailsTokens } from "../../../utils/responsive/step1Details/step1Details.tokens";

/* ============================================================
   LOAN FORM PRESENTATION STYLES
============================================================ */

import {
  createLoanFormGridStyle,
  fieldGroupStyle,
  fieldLabelStyle,
  requiredMarkStyle,
  inputStyle,
  selectStyle,
  textareaStyle,
  durationGroupStyle,
  sectionStyle,
  sectionTitleStyle,
} from "./LoanForm.styles";

/* ============================================================
   TYPES
============================================================ */

interface LoanFormProps {
  loanNumberPreview?: string;

  loanAmount: string;

  /*
   * STANDARD:
   * false / undefined → existing editable Loan Amount.
   *
   * GOLD:
   * true → sanctioned Gold principal is preserved and cannot
   * be changed inside the shared Loan Studio.
   */
  loanAmountReadOnly?: boolean;

  emiCalculation: "fixed" | "reducing" | "interestOnly";

  interest: string;

  processingFee: string;

  advanceDeduction: string;

  lateFee: string;

  repaymentType: string;

  duration: string;

  durationType: string;

  purpose: string;

  remarks: string;

  onLoanAmountChange: (value: string) => void;

  onEMICalculationChange: (
    value: "fixed" | "reducing" | "interestOnly",
  ) => void;

  onInterestChange: (value: string) => void;

  onProcessingFeeChange: (value: string) => void;

  onAdvanceDeductionChange: (value: string) => void;

  onLateFeeChange: (value: string) => void;

  onRepaymentTypeChange: (value: string) => void;

  onDurationChange: (value: string) => void;

  onDurationTypeChange: (value: string) => void;

  onPurposeChange: (value: string) => void;

  onRemarksChange: (value: string) => void;
}

/* ============================================================
   HELPERS
============================================================ */

const onlyDigits = (value: string): string => value.replace(/\D/g, "");

const formatIndianInteger = (value: string): string => {
  const digits = onlyDigits(value);

  if (!digits) {
    return "";
  }

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(digits));
};

/* ============================================================
   COMPONENT
============================================================ */

export default function LoanForm({
  loanNumberPreview = "",

  loanAmount,

  loanAmountReadOnly = false,

  emiCalculation,

  interest,

  processingFee,

  advanceDeduction,

  lateFee,

  duration,

  durationType,

  purpose,

  remarks,

  onLoanAmountChange,

  onEMICalculationChange,

  onInterestChange,

  onProcessingFeeChange,

  onAdvanceDeductionChange,

  onLateFeeChange,

  onRepaymentTypeChange,

  onDurationChange,

  onDurationTypeChange,

  onPurposeChange,

  onRemarksChange,
}: LoanFormProps) {
  /* ==========================================================
     CENTRAL RESPONSIVE ENGINE
  ========================================================== */

  const { tokens } = useResponsive();

  /* ==========================================================
     STEP 1 RESPONSIVE TOKENS
  ========================================================== */

  const step1Tokens = getStep1DetailsTokens(tokens.meta.viewport);

  /* ==========================================================
     RESPONSIVE FORM GRID
  ========================================================== */

  const resolvedFormGridStyle = createLoanFormGridStyle(step1Tokens);

  /* ==========================================================
     HANDLERS
  ========================================================== */

  const handleMoneyChange = (
    value: string,

    callback: (nextValue: string) => void,
  ): void => {
    callback(onlyDigits(value));
  };

  const handleLoanAmountChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    /*
     * Defence in depth.
     *
     * readOnly already prevents browser editing, but the handler
     * also refuses mutation when Gold principal is locked.
     */
    if (loanAmountReadOnly) {
      return;
    }

    handleMoneyChange(event.target.value, onLoanAmountChange);
  };

  const handleProcessingFeeChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    handleMoneyChange(event.target.value, onProcessingFeeChange);
  };

  const handleAdvanceDeductionChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    handleMoneyChange(event.target.value, onAdvanceDeductionChange);
  };

  const handleLateFeeChange = (event: ChangeEvent<HTMLInputElement>): void => {
    handleMoneyChange(event.target.value, onLateFeeChange);
  };

  const handleInterestChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onInterestChange(event.target.value.replace(/[^0-9.]/g, ""));
  };

  const handleDurationChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onDurationChange(onlyDigits(event.target.value));
  };

  const handlePurposeChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onPurposeChange(event.target.value);
  };

  const handleRemarksChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    onRemarksChange(event.target.value);
  };

  /* ==========================================================
     LABEL
  ========================================================== */

  const renderLabel = (
    label: string,

    required = false,
  ) => (
    <div style={fieldLabelStyle}>
      <span>{label}</span>

      {required && <span style={requiredMarkStyle}>*</span>}
    </div>
  );

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div>
      {/* ======================================================
          LOAN BASIC DETAILS
      ====================================================== */}

      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>Loan Basic Details</div>

        <div style={resolvedFormGridStyle}>
          {/* LOAN NUMBER */}

          <div style={fieldGroupStyle}>
            {renderLabel("Loan Number", true)}

            <input
              type="text"
              value={
                loanNumberPreview ||
                "Auto Generated"
              }
              readOnly
              aria-label="Loan Number"
              style={{
                ...inputStyle,
                opacity: 0.72,
                cursor: "default",
              }}
            />
          </div>

          {/* LOAN AMOUNT */}

          <div style={fieldGroupStyle}>
            {renderLabel(
              loanAmountReadOnly ? "Sanctioned Loan Amount" : "Loan Amount",
              true,
            )}

            <input
              type="text"
              inputMode="numeric"
              value={formatIndianInteger(loanAmount)}
              readOnly={loanAmountReadOnly}
              aria-readonly={loanAmountReadOnly}
              onChange={handleLoanAmountChange}
              placeholder="Enter loan amount"
              autoComplete="off"
              title={
                loanAmountReadOnly
                  ? "Locked from Gold Loan Step 1 sanctioned amount"
                  : undefined
              }
              style={inputStyle}
            />
          </div>

          {/* EMI CALCULATION */}

          <div style={fieldGroupStyle}>
            {renderLabel("EMI Calculation", true)}

            <select
              value={emiCalculation}
              onChange={(event) => {
                const value = event.target.value;

                const normalized: "fixed" | "reducing" | "interestOnly" =
                  value === "reducing"
                    ? "reducing"
                    : value === "interestOnly"
                      ? "interestOnly"
                      : "fixed";

                onEMICalculationChange(normalized);
              }}
              style={selectStyle}
            >
              <option value="fixed">Fixed EMI</option>

              <option value="reducing">Reducing EMI</option>

              <option value="interestOnly">Interest Only</option>
            </select>
          </div>

          {/* INTEREST */}

          <div style={fieldGroupStyle}>
            {renderLabel("Interest (%)", true)}

            <input
              type="text"
              inputMode="decimal"
              value={interest}
              onChange={handleInterestChange}
              placeholder="Enter interest percentage"
              autoComplete="off"
              style={inputStyle}
            />
          </div>
        </div>
      </section>

      {/* ======================================================
          FINANCIAL TERMS
      ====================================================== */}

      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>Financial Terms</div>

        <div style={resolvedFormGridStyle}>
          {/* PROCESSING FEE */}

          <div style={fieldGroupStyle}>
            {renderLabel("Processing Fee")}

            <input
              type="text"
              inputMode="numeric"
              value={formatIndianInteger(processingFee)}
              onChange={handleProcessingFeeChange}
              placeholder="Enter processing fee"
              autoComplete="off"
              style={inputStyle}
            />
          </div>

          {/* ADVANCE DEDUCTION */}

          <div style={fieldGroupStyle}>
            {renderLabel("Advance Deduction")}

            <input
              type="text"
              inputMode="numeric"
              value={
                emiCalculation === "reducing"
                  ? "0"
                  : formatIndianInteger(advanceDeduction)
              }
              onChange={handleAdvanceDeductionChange}
              placeholder="Enter deduction amount"
              autoComplete="off"
              disabled={emiCalculation === "reducing"}
              style={inputStyle}
            />
          </div>

          {/* LATE FEE */}

          <div style={fieldGroupStyle}>
            {renderLabel("Late Fee")}

            <input
              type="text"
              inputMode="numeric"
              value={formatIndianInteger(lateFee)}
              onChange={handleLateFeeChange}
              placeholder="Enter late fee"
              autoComplete="off"
              style={inputStyle}
            />
          </div>
        </div>
      </section>

      {/* ======================================================
          LOAN DURATION
      ====================================================== */}

      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>Loan Duration</div>

        <div style={resolvedFormGridStyle}>
          <div style={fieldGroupStyle}>
            {renderLabel("Loan Duration", true)}

            <div style={durationGroupStyle}>
              <input
                type="text"
                inputMode="numeric"
                value={duration}
                onChange={handleDurationChange}
                placeholder="Duration"
                autoComplete="off"
                style={inputStyle}
              />

              <select
                value={durationType}
                onChange={(event) => onDurationTypeChange(event.target.value)}
                style={selectStyle}
              >
                <option value="">Unit</option>

                <option value="days">Days</option>

                <option value="weeks">Weeks</option>

                <option value="months">Months</option>

                <option value="years">Years</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          ADDITIONAL INFORMATION
      ====================================================== */}

      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>Additional Information</div>

        <div style={resolvedFormGridStyle}>
          {/* PURPOSE */}

          <div style={fieldGroupStyle}>
            {renderLabel("Purpose")}

            <input
              type="text"
              value={purpose}
              onChange={handlePurposeChange}
              placeholder="Enter loan purpose"
              autoComplete="off"
              style={inputStyle}
            />
          </div>

          {/* REMARKS */}

          <div style={fieldGroupStyle}>
            {renderLabel("Remarks")}

            <textarea
              value={remarks}
              onChange={handleRemarksChange}
              placeholder="Enter remarks"
              rows={1}
              style={{
                ...textareaStyle,

                height: "32px",

                minHeight: "32px",

                resize: "none",
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// END
// ============================================================
