// ============================================================
// FINORA ENTERPRISE V2
// LOAN DETAILS STUDIO — LOAN FORM
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

interface LoanFormProps {
  loanAmount: string;
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
  onEMICalculationChange: (value: "fixed" | "reducing" | "interestOnly") => void;
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

const onlyDigits = (value: string): string =>
  value.replace(/\D/g, "");

const formatIndianInteger = (value: string): string => {
  const digits = onlyDigits(value);
  if (!digits) return "";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(digits));
};

export default function LoanForm({
  loanAmount,
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

  const handleMoneyChange = (
    value: string,
    callback: (nextValue: string) => void,
  ): void => {
    callback(onlyDigits(value));
  };

  const handleLoanAmountChange = (event: ChangeEvent<HTMLInputElement>): void => {
    handleMoneyChange(event.target.value, onLoanAmountChange);
  };

  const handleProcessingFeeChange = (event: ChangeEvent<HTMLInputElement>): void => {
    handleMoneyChange(event.target.value, onProcessingFeeChange);
  };

  const handleAdvanceDeductionChange = (event: ChangeEvent<HTMLInputElement>): void => {
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

  const handleRemarksChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    onRemarksChange(event.target.value);
  };

  const renderLabel = (label: string, required = false) => (
    <div style={fieldLabelStyle}>
      <span>{label}</span>
      {required && <span style={requiredMarkStyle}>*</span>}
    </div>
  );

  return (
    <div>
      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>Loan Basic Details</div>
        <div style={formGridStyle}>

          <div style={fieldGroupStyle}>
            {renderLabel("Loan Number", true)}
            <input
              type="text"
              value="Auto Generated"
              readOnly
              aria-label="Loan Number"
              style={{ ...inputStyle, opacity: 0.72, cursor: "default" }}
            />
          </div>

          <div style={fieldGroupStyle}>
            {renderLabel("Loan Amount", true)}
            <input
              type="text"
              inputMode="numeric"
              value={formatIndianInteger(loanAmount)}
              onChange={handleLoanAmountChange}
              placeholder="Enter loan amount"
              autoComplete="off"
              style={inputStyle}
            />
          </div>

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

      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>Financial Terms</div>
        <div style={formGridStyle}>

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

      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>Loan Duration</div>
        <div style={formGridStyle}>
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

      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>Additional Information</div>
        <div style={formGridStyle}>
          <div style={fieldGroupStyle}>
            {renderLabel("Purpose")}
            <input
              type="text"
              value={purpose}
              onChange={handlePurposeChange}
              placeholder="Enter loan purpose"
              autoComplete="off"
              style={{ ...inputStyle, width: "100%", minWidth: 0, boxSizing: "border-box" }}
            />
          </div>

          <div style={fieldGroupStyle}>
            {renderLabel("Remarks")}
            <textarea
              value={remarks}
              onChange={handleRemarksChange}
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
