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
// - EMI Calculation is configured in Step 1.
// - Repayment frequency is handled by LoanStudio state.
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

export type EMICalculationMode =
  | "fixed"
  | "variable"
  | "interestOnly";


interface LoanFormProps {

  loanAmount: string;

  emiCalculation:
    EMICalculationMode;

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


  onEMICalculationChange: (
    value: EMICalculationMode,
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
   * These remain optional temporarily so existing LoanStudio
   * callers do not break while the parent wiring is updated.
   *
   * They are not rendered by this component.
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

  onDurationChange,

  onDurationTypeChange,

  onPurposeChange,

  onRemarksChange,

}: LoanFormProps) {


  // ==========================================================
  // MONEY INPUT HANDLER
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

    <div
      style={
        fieldLabelStyle
      }
    >

      <span>
        {label}
      </span>


      {required && (

        <span
          style={
            requiredMarkStyle
          }
        >
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

      <section
        style={
          sectionStyle
        }
      >

        <div
          style={
            sectionTitleStyle
          }
        >
          Loan Basic Details
        </div>


        <div
          style={
            formGridStyle
          }
        >


          {/* ==================================================
              LOAN NUMBER
          ================================================== */}

          <div
            style={
              fieldGroupStyle
            }
          >

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


          {/* ==================================================
              LOAN AMOUNT
          ================================================== */}

          <div
            style={
              fieldGroupStyle
            }
          >

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
              style={
                inputStyle
              }
            />

          </div>


          {/* ==================================================
              EMI CALCULATION

              IMPORTANT:
              - Replaces old Interest Type field.
              - Controlled directly by LoanStudio.
              - No local state here.
              ================================================== */}

          <div
            style={
              fieldGroupStyle
            }
          >

            {renderLabel(
              "EMI Calculation",
              true,
            )}


            <select
              value={
                emiCalculation
              }
              onChange={(
                event,
              ) => {

                const value =
                  event.target.value;

                const normalizedValue:
                  EMICalculationMode =
                  value === "variable"
                    ? "variable"
                    : value ===
                      "interestOnly"
                      ? "interestOnly"
                      : "fixed";


                onEMICalculationChange(
                  normalizedValue,
                );

              }}
              style={
                selectStyle
              }
            >

              <option value="fixed">
                Fixed EMI
              </option>


              <option value="variable">
                Variable EMI
              </option>


              <option value="interestOnly">
                Interest Only
              </option>

            </select>

          </div>


          {/* ==================================================
              INTEREST
          ================================================== */}

          <div
            style={
              fieldGroupStyle
            }
          >

            {renderLabel(
              "Interest (%)",
              true,
            )}


            <input
              type="text"
              inputMode="decimal"
              value={
                interest
              }
              onChange={
                handleInterestChange
              }
              placeholder="Enter interest percentage"
              autoComplete="off"
              style={
                inputStyle
              }
            />

          </div>

        </div>

      </section>


      {/* ====================================================
          FINANCIAL TERMS
      ==================================================== */}

      <section
        style={
          sectionStyle
        }
      >

        <div
          style={
            sectionTitleStyle
          }
        >
          Financial Terms
        </div>


        <div
          style={
            formGridStyle
          }
        >


          {/* ==================================================
              PROCESSING FEE
          ================================================== */}

          <div
            style={
              fieldGroupStyle
            }
          >

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
              style={
                inputStyle
              }
            />

          </div>


          {/* ==================================================
              ADVANCE DEDUCTION
          ================================================== */}

          <div
            style={
              fieldGroupStyle
            }
          >

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
              style={
                inputStyle
              }
            />

          </div>


          {/* ==================================================
              LATE FEE
          ================================================== */}

          <div
            style={
              fieldGroupStyle
            }
          >

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
              style={
                inputStyle
              }
            />

          </div>

        </div>

      </section>


      {/* ====================================================
          LOAN DURATION
      ==================================================== */}

      <section
        style={
          sectionStyle
        }
      >

        <div
          style={
            sectionTitleStyle
          }
        >
          Loan Duration
        </div>


        <div
          style={
            formGridStyle
          }
        >

          <div
            style={
              fieldGroupStyle
            }
          >

            {renderLabel(
              "Loan Duration",
              true,
            )}


            <div
              style={
                durationGroupStyle
              }
            >

              <input
                type="text"
                inputMode="numeric"
                value={
                  duration
                }
                onChange={
                  handleDurationChange
                }
                placeholder="Duration"
                autoComplete="off"
                style={
                  inputStyle
                }
              />


              <select
                value={
                  durationType
                }
                onChange={(
                  event,
                ) =>
                  onDurationTypeChange(
                    event.target.value,
                  )
                }
                style={
                  selectStyle
                }
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

      <section
        style={
          sectionStyle
        }
      >

        <div
          style={
            sectionTitleStyle
          }
        >
          Additional Information
        </div>


        <div
          style={
            formGridStyle
          }
        >

          {/* ==================================================
              PURPOSE
          ================================================== */}

          <div
            style={
              fieldGroupStyle
            }
          >

            {renderLabel(
              "Purpose",
            )}


            <input
              type="text"
              value={
                purpose
              }
              onChange={
                handlePurposeChange
              }
              placeholder="Enter loan purpose"
              autoComplete="off"
              style={
                inputStyle
              }
            />

          </div>


          {/* ==================================================
              REMARKS
          ================================================== */}

          <div
            style={
              fieldGroupStyle
            }
          >

            {renderLabel(
              "Remarks",
            )}


            <textarea
              value={
                remarks
              }
              onChange={
                handleRemarksChange
              }
              placeholder="Enter remarks"
              rows={3}
              style={
                textareaStyle
              }
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
