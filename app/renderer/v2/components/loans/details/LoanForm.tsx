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

import { FinoraCalendar } from "../../common/calendar";

import {
  getCurrentLocalBusinessDate,
} from "../../../services/business/businessDateService";

/* ============================================================
   FINORA RESPONSIVE ENGINE
============================================================ */

import { useResponsive } from "../../../utils/responsive";

import { formatCurrency } from "../../../utils/currency/formatCurrency";

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
   * false / undefined â†’ existing editable Loan Amount.
   *
   * GOLD:
   * true â†’ sanctioned Gold principal is preserved and cannot
   * be changed inside the shared Loan Studio.
   */
  loanAmountReadOnly?: boolean;

  emiCalculation: "fixed" | "reducing" | "interestOnly";

  interest: string;

  processingFee: string;

  advanceDeduction: string;

  lateFee: string;


  loanDate?: string;
  collectionDate: string;
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


  onLoanDateChange?: (value: string) => void;
  onCollectionDateChange: (value: string) => void;
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

const formatCollectionDateInput = (
  value: string,
): string => {
  const normalized =
    String(value ?? "").trim();

  const legacyIso =
    /^(\d{4})-(\d{2})-(\d{2})/.exec(normalized);

  if (legacyIso) {
    return `${legacyIso[3]}-${legacyIso[2]}`;
  }

  const digits =
    onlyDigits(normalized).slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
};
const formatIndianInteger = (value: string): string => {
  const digits = onlyDigits(value);

  if (!digits) {
    return "";
  }

  return formatCurrency(
    Number(digits),
  );
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


  loanDate = "",
  collectionDate,
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


  onLoanDateChange = () => undefined,
  onCollectionDateChange,
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
  const handleCollectionDateChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    onCollectionDateChange(
      formatCollectionDateInput(
        event.target.value,
      ),
    );
  };

  const handleInterestChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onInterestChange(event.target.value.replace(/[^0-9.]/g, ""));
  };

  const handleDurationChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const nextValue = onlyDigits(event.target.value);

    if (!nextValue) {
      onDurationChange("");
      return;
    }

    const numericValue = Number(nextValue);

    if (durationType === "months" && numericValue > 60) {
      return;
    }

    if (durationType === "years" && numericValue > 5) {
      return;
    }

    onDurationChange(nextValue);
  };

  const handleDurationTypeChange = (nextDurationType: string): void => {
    const currentDuration = Number(duration || 0);

    if (nextDurationType === "months" && currentDuration > 60) {
      onDurationChange("60");
    }

    if (nextDurationType === "years" && currentDuration > 5) {
      onDurationChange("5");
    }

    onDurationTypeChange(nextDurationType);
  };

  const handlePurposeChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onPurposeChange(event.target.value);
  };

  const handleRemarksChange = (
    event: ChangeEvent<HTMLInputElement>,
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
              placeholder="Enter Loan Amount"
              autoComplete="off"
              title={
                loanAmountReadOnly
                  ? "Locked from Gold Loan Step 1 sanctioned amount"
                  : undefined
              }
              style={{                 ...inputStyle,                 fontWeight: 650,               }}
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
              <option value="interestOnly">Interest Only</option>

              <option value="fixed">Fixed EMI</option>

              <option value="reducing">Reducing EMI</option>
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
              placeholder="Percentage In Rupees"
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
              placeholder="Enter Processing Fee"
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
              placeholder="Enter Deduction Amount"
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
              placeholder="Enter Late Fee"
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
          {/* LOAN DATE */}

          <div style={fieldGroupStyle}>
            {renderLabel("Loan Date", true)}

            <div className="finora-loan-date-control">
              <FinoraCalendar
                value={loanDate}
                onChange={onLoanDateChange}
                max={getCurrentLocalBusinessDate()}
                allowClear={false}
                showRelativeDay
                placeholder="DD/MM/YYYY"
                ariaLabel="Loan Date"
              />
            </div>
          </div>

          {/* COLLECTION DATE */}

          <div style={fieldGroupStyle}>
            {renderLabel("Collection Date - Every Month")}

            <input
              type="text"
              inputMode="numeric"
              value={formatCollectionDateInput(collectionDate)}
              onChange={handleCollectionDateChange}
              placeholder="Starts: DD-MM"
              maxLength={5}
              autoComplete="off"
              aria-label="Collection Date DD-MM"
              style={{
                ...inputStyle,
                height: "38px",
                minHeight: "38px",
                marginTop: "4px",
              }}
            />
          </div>

          {/* LOAN DURATION */}

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
                style={{
                  ...inputStyle,
                  height: "38px",
                  minHeight: "38px",
                }}
              />

              <select
                value={durationType}
                onChange={(event) => handleDurationTypeChange(event.target.value)}
                style={{
                  ...selectStyle,
                  height: "38px",
                  minHeight: "38px",
                }}
              >
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
              placeholder="Enter Loan Purpose"
              autoComplete="off"
              style={inputStyle}
            />
          </div>

          {/* REMARKS */}

          <div style={fieldGroupStyle}>
            {renderLabel("Remarks")}

            <input

              type="text"

              value={remarks}

              onChange={handleRemarksChange}

              placeholder="Enter Remarks"

              autoComplete="off"

              style={inputStyle}

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

