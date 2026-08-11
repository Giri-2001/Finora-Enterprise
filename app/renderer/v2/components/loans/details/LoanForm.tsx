// ============================================================
// FINORA ENTERPRISE V2
//
// LOAN DETAILS STUDIO
// LOAN FORM
//
// RESPONSIBILITY:
// - Render Loan Details input fields
// - Keep Loan Form presentation local
// - Forward field changes to LoanStudio
// - Keep Loan business logic outside this component
//
// IMPORTANT:
// - No calculation logic.
// - No persistence logic.
// - No LoanService access.
// - No global design-system changes.
// - Money inputs use raw numeric state + Indian display formatting.
// - Number inputs intentionally use type="text" to remove browser arrows.
// - Interest Type is configured in Step 1.
// - Repayment frequency is configured separately in Repayment Studio.
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  ChangeEvent,
} from "react";

import {
  formGridStyle,
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

// ============================================================
// TYPES
// ============================================================

interface LoanFormProps {

  loanAmount: string;

  interestType: string;

  interest: string;

  processingFee: string;

  advanceDeduction: string;

  lateFee: string;

  duration: string;

  durationType: string;

  purpose: string;

  remarks: string;

  onLoanAmountChange: (
    value: string,
  ) => void;

  onInterestTypeChange: (
    value: string,
  ) => void;

  onInterestChange: (
    value: string,
  ) => void;

  onProcessingFeeChange: (
    value: string,
  ) => void;

  onAdvanceDeductionChange: (
    value: string,
  ) => void;

  onLateFeeChange: (
    value: string,
  ) => void;

  onDurationChange: (
    value: string,
  ) => void;

  onDurationTypeChange: (
    value: string,
  ) => void;

  onPurposeChange: (
    value: string,
  ) => void;

  onRemarksChange: (
    value: string,
  ) => void;

  /*
   * ----------------------------------------------------------
   * LEGACY COMPATIBILITY
   *
   * LoanStudio is being cleaned in the next replacement.
   * These optional props are intentionally accepted temporarily
   * so the current parent does not break during this step.
   *
   * They are NOT rendered or used by this component.
   * ----------------------------------------------------------
   */

  repaymentType?: string;

  loanStatus?: string;

  onRepaymentTypeChange?: (
    value: string,
  ) => void;

  onLoanStatusChange?: (
    value: string,
  ) => void;
}

// ============================================================
// HELPERS
// ============================================================

const onlyDigits = (
  value: string,
): string =>
  value.replace(
    /\D/g,
    "",
  );


const formatIndianInteger = (
  value: string,
): string => {

  const digits =
    onlyDigits(value);

  if (!digits) {
    return "";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits: 0,
    },
  ).format(
    Number(digits),
  );
};

// ============================================================
// COMPONENT
// ============================================================

export default function LoanForm({

  loanAmount,

  interestType,

  interest,

  processingFee,

  advanceDeduction,

  lateFee,

  duration,

  durationType,

  purpose,

  remarks,

  onLoanAmountChange,

  onInterestTypeChange,

  onInterestChange,

  onProcessingFeeChange,

  onAdvanceDeductionChange,

  onLateFeeChange,

  onDurationChange,

  onDurationTypeChange,

  onPurposeChange,

  onRemarksChange,

}: LoanFormProps) {

  // ==========================================================
  // MONEY INPUT HANDLER
  //
  // Parent receives raw digits.
  // Input displays Indian comma formatting immediately.
  //
  // Example:
  // 10000   -> 10,000
  // 100000  -> 1,00,000
  //
  // ==========================================================

  const handleMoneyChange = (
    value: string,
    callback: (
      nextValue: string,
    ) => void,
  ): void => {

    callback(
      onlyDigits(value),
    );
  };

  // ==========================================================
  // LOAN AMOUNT
  // ==========================================================

  const handleLoanAmountChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {

    handleMoneyChange(
      event.target.value,
      onLoanAmountChange,
    );
  };

  // ==========================================================
  // PROCESSING FEE
  // ==========================================================

  const handleProcessingFeeChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {

    handleMoneyChange(
      event.target.value,
      onProcessingFeeChange,
    );
  };

  // ==========================================================
  // ADVANCE DEDUCTION
  // ==========================================================

  const handleAdvanceDeductionChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {

    handleMoneyChange(
      event.target.value,
      onAdvanceDeductionChange,
    );
  };

  // ==========================================================
  // LATE FEE
  // ==========================================================

  const handleLateFeeChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {

    handleMoneyChange(
      event.target.value,
      onLateFeeChange,
    );
  };

  // ==========================================================
  // INTEREST
  // ==========================================================

  const handleInterestChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {

    onInterestChange(
      event.target.value.replace(
        /[^0-9.]/g,
        "",
      ),
    );
  };

  // ==========================================================
  // DURATION
  // ==========================================================

  const handleDurationChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {

    onDurationChange(
      onlyDigits(
        event.target.value,
      ),
    );
  };

  // ==========================================================
  // PURPOSE
  // ==========================================================

  const handlePurposeChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {

    onPurposeChange(
      event.target.value,
    );
  };

  // ==========================================================
  // REMARKS
  // ==========================================================

  const handleRemarksChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ): void => {

    onRemarksChange(
      event.target.value,
    );
  };

  // ==========================================================
  // LABEL HELPER
  // ==========================================================

  const renderLabel = (
    label: string,
    required = false,
  ) => (

    <div style={fieldLabelStyle}>

      <span>
        {label}
      </span>

      {required && (

        <span style={requiredMarkStyle}>
          *
        </span>

      )}

    </div>
  );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div>

      {/* ====================================================
          BASIC LOAN DETAILS
      ==================================================== */}

      <section style={sectionStyle}>

        <div style={sectionTitleStyle}>
          Loan Basic Details
        </div>

        <div style={formGridStyle}>

          {/* LOAN NUMBER */}

          <div style={fieldGroupStyle}>

            {renderLabel(
              "Loan Number",
              true,
            )}

            <input
              type="text"
              value="Auto Generated"
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
              "Loan Amount",
              true,
            )}

            <input
              type="text"
              inputMode="numeric"
              value={
                formatIndianInteger(
                  loanAmount,
                )
              }
              onChange={
                handleLoanAmountChange
              }
              placeholder="Enter loan amount"
              autoComplete="off"
              style={inputStyle}
            />

          </div>

          {/* INTEREST TYPE */}

          <div style={fieldGroupStyle}>

            {renderLabel(
              "Interest Type",
              true,
            )}

            <select
              value={interestType}
              onChange={(
                event,
              ) =>
                onInterestTypeChange(
                  event.target.value,
                )
              }
              style={selectStyle}
            >

              <option value="Flat Interest">
                Flat Interest
              </option>

              <option value="Reducing Balance">
                Reducing Balance
              </option>

            </select>

          </div>

          {/* INTEREST */}

          <div style={fieldGroupStyle}>

            {renderLabel(
              "Interest (%)",
              true,
            )}

            <input
              type="text"
              inputMode="decimal"
              value={interest}
              onChange={
                handleInterestChange
              }
              placeholder="Enter interest percentage"
              autoComplete="off"
              style={inputStyle}
            />

          </div>

        </div>

      </section>

      {/* ====================================================
          FINANCIAL TERMS
      ==================================================== */}

      <section style={sectionStyle}>

        <div style={sectionTitleStyle}>
          Financial Terms
        </div>

        <div style={formGridStyle}>

          {/* PROCESSING FEE */}

          <div style={fieldGroupStyle}>

            {renderLabel(
              "Processing Fee",
            )}

            <input
              type="text"
              inputMode="numeric"
              value={
                formatIndianInteger(
                  processingFee,
                )
              }
              onChange={
                handleProcessingFeeChange
              }
              placeholder="Enter processing fee"
              autoComplete="off"
              style={inputStyle}
            />

          </div>

          {/* ADVANCE DEDUCTION */}

          <div style={fieldGroupStyle}>

            {renderLabel(
              "Advance Deduction",
            )}

            <input
              type="text"
              inputMode="numeric"
              value={
                formatIndianInteger(
                  advanceDeduction,
                )
              }
              onChange={
                handleAdvanceDeductionChange
              }
              placeholder="Enter deduction amount"
              autoComplete="off"
              style={inputStyle}
            />

          </div>

          {/* LATE FEE */}

          <div style={fieldGroupStyle}>

            {renderLabel(
              "Late Fee",
            )}

            <input
              type="text"
              inputMode="numeric"
              value={
                formatIndianInteger(
                  lateFee,
                )
              }
              onChange={
                handleLateFeeChange
              }
              placeholder="Enter late fee"
              autoComplete="off"
              style={inputStyle}
            />

          </div>

        </div>

      </section>

      {/* ====================================================
          LOAN DURATION
      ==================================================== */}

      <section style={sectionStyle}>

        <div style={sectionTitleStyle}>
          Loan Duration
        </div>

        <div style={formGridStyle}>

          {/* LOAN DURATION */}

          <div style={fieldGroupStyle}>

            {renderLabel(
              "Loan Duration",
              true,
            )}

            <div style={durationGroupStyle}>

              <input
                type="text"
                inputMode="numeric"
                value={duration}
                onChange={
                  handleDurationChange
                }
                placeholder="Duration"
                autoComplete="off"
                style={inputStyle}
              />

              <select
                value={durationType}
                onChange={(
                  event,
                ) =>
                  onDurationTypeChange(
                    event.target.value,
                  )
                }
                style={selectStyle}
              >

                <option value="">
                  Unit
                </option>

                <option value="days">
                  Days
                </option>

                <option value="weeks">
                  Weeks
                </option>

                <option value="months">
                  Months
                </option>

                <option value="years">
                  Years
                </option>

              </select>

            </div>

          </div>

        </div>

      </section>

      {/* ====================================================
          ADDITIONAL INFORMATION
      ==================================================== */}

      <section style={sectionStyle}>

        <div style={sectionTitleStyle}>
          Additional Information
        </div>

        <div style={formGridStyle}>

          {/* PURPOSE */}

          <div style={fieldGroupStyle}>

            {renderLabel(
              "Purpose",
            )}

            <input
              type="text"
              value={purpose}
              onChange={
                handlePurposeChange
              }
              placeholder="Enter loan purpose"
              autoComplete="off"
              style={{
                ...inputStyle,
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
              }}
            />

          </div>

          {/* REMARKS */}

          <div style={fieldGroupStyle}>

            {renderLabel(
              "Remarks",
            )}

            <textarea
              value={remarks}
              onChange={
                handleRemarksChange
              }
              placeholder="Enter remarks"
              rows={1}
              style={{
                ...textareaStyle,
                width: "100%",
                minWidth: 0,
                height: "32px",
                minHeight: "32px",
                boxSizing: "border-box",
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
