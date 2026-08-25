/* ===========================================================
   FINORA ENTERPRISE OS™
   LOAN STUDIO™ — STEP 1

   RESPONSIBILITY:
   - Render Step 1 only
   - Receive values and callbacks
   - Delegate presentation to Step 1 styles

   IMPORTANT:
   - No business logic
   - No storage/service access
   - No responsive calculations
   - Existing Loan Studio features preserved
=========================================================== */

import { formatIndianDate } from "./LoanStudio.helpers";

import {
  step1WorkspaceStyle,
  step1TopStyle,
  step1BottomStyle,
  step1CustomerStyle,
  step1OverviewStyle,
  step1FormStyle,
  step1PreviewStyle,
} from "./views/LoanStudioStep1.styles";

import LoanCustomerCard, {
  type LoanCustomerOption,
} from "../../../../loans/details/LoanCustomerCard";

import LoanPreviewCard
  from "../../../../loans/details/LoanPreviewCard";

import LoanForm
  from "../../../../loans/details/LoanForm";

import LoanStatistics
  from "../../../../loans/details/LoanStatistics";

/* ===========================================================
   TYPES
=========================================================== */

type EMICalculationMode =
  | "fixed"
  | "reducing"
  | "interestOnly";

type LoanStudioStep1Props = {
  activeCustomerName: string;
  activeCustomerId: string;
  activeCustomerPhone: string;

  selectedCustomer?: LoanCustomerOption;

  loanCustomerOptions: LoanCustomerOption[];

  setSelectedCustomer: (
    customer: LoanCustomerOption,
  ) => void;

  loanStatistics: {
    totalLoans: number;
    activeLoans: number;
    totalDisbursed: number;
  };

  loanAmount: string;

  setLoanAmount: (
    value: string,
  ) => void;

  emiCalculation:
    EMICalculationMode;

  setEMICalculation: (
    value: EMICalculationMode,
  ) => void;

  interest: string;

  setInterest: (
    value: string,
  ) => void;

  processingFee: string;

  setProcessingFee: (
    value: string,
  ) => void;

  advanceDeduction: string;

  setAdvanceDeduction: (
    value: string,
  ) => void;

  lateFee: string;

  setLateFee: (
    value: string,
  ) => void;

  repaymentType: string;

  setRepaymentType: (
    value: string,
  ) => void;

  duration: string;

  setDuration: (
    value: string,
  ) => void;

  durationType: string;

  setDurationType: (
    value: string,
  ) => void;

  purpose: string;

  setPurpose: (
    value: string,
  ) => void;

  remarks: string;

  setRemarks: (
    value: string,
  ) => void;

  loanTypeLabel: string;

  totalInterest: number;

  totalPayable: number;

  installmentAmount: number;

  loanDate: Date;

  maturityDate: Date | null;
};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function LoanStudioStep1(
  props: LoanStudioStep1Props,
) {
  const {
    activeCustomerName,
    activeCustomerId,
    activeCustomerPhone,
    selectedCustomer,
    loanCustomerOptions,
    setSelectedCustomer,
    loanStatistics,

    loanAmount,
    setLoanAmount,

    emiCalculation,
    setEMICalculation,

    interest,
    setInterest,

    processingFee,
    setProcessingFee,

    advanceDeduction,
    setAdvanceDeduction,

    lateFee,
    setLateFee,

    repaymentType,
    setRepaymentType,

    duration,
    setDuration,

    durationType,
    setDurationType,

    purpose,
    setPurpose,

    remarks,
    setRemarks,

    loanTypeLabel,
    totalInterest,
    totalPayable,
    installmentAmount,
    loanDate,
    maturityDate,
  } = props;

  return (
    <section style={step1WorkspaceStyle}>
      <div style={step1TopStyle}>
        <div style={step1CustomerStyle}>
          <LoanCustomerCard
            customerName={activeCustomerName}
            customerId={activeCustomerId}
            phoneNumber={activeCustomerPhone}
            photo={selectedCustomer?.photo}
            customers={loanCustomerOptions}
            onCustomerSelect={setSelectedCustomer}
          />
        </div>

        <div style={step1OverviewStyle}>
          <LoanStatistics
            totalLoans={loanStatistics.totalLoans}
            activeLoans={loanStatistics.activeLoans}
            totalDisbursed={loanStatistics.totalDisbursed}
          />
        </div>
      </div>

      <div style={step1BottomStyle}>
        <div style={step1FormStyle}>
          <LoanForm
            loanAmount={loanAmount}
            emiCalculation={emiCalculation}
            interest={interest}
            processingFee={processingFee}
            advanceDeduction={advanceDeduction}
            lateFee={lateFee}
            repaymentType={repaymentType}
            duration={duration}
            durationType={durationType}
            purpose={purpose}
            remarks={remarks}
            onLoanAmountChange={setLoanAmount}
            onEMICalculationChange={setEMICalculation}
            onInterestChange={setInterest}
            onProcessingFeeChange={setProcessingFee}
            onAdvanceDeductionChange={setAdvanceDeduction}
            onLateFeeChange={setLateFee}
            onRepaymentTypeChange={setRepaymentType}
            onDurationChange={setDuration}
            onDurationTypeChange={setDurationType}
            onPurposeChange={setPurpose}
            onRemarksChange={setRemarks}
          />
        </div>

        <div style={step1PreviewStyle}>
          <LoanPreviewCard
            customerName={activeCustomerName}
            loanAmount={Number(loanAmount || 0)}
            loanType={loanTypeLabel}
            loanStatus="--"
            interest={Number(interest || 0)}
            totalInterest={totalInterest}
            totalPayable={totalPayable}
            installmentAmount={installmentAmount}
            loanDate={formatIndianDate(loanDate)}
            maturityDate={formatIndianDate(maturityDate)}
            processingFee={Number(processingFee || 0)}
            advanceDeduction={Number(advanceDeduction || 0)}
            netDisbursement={
              Number(loanAmount || 0) -
              Number(processingFee || 0) -
              Number(advanceDeduction || 0)
            }
            lateFee={Number(lateFee || 0)}
            repaymentType={
              repaymentType
                ? repaymentType.toUpperCase()
                : "--"
            }
          />
        </div>
      </div>
    </section>
  );
}