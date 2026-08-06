/* ===========================================================
   FINORA ENTERPRISE OS™

   LOANS PAGE
=========================================================== */

import { useState } from "react";

import StudioLayout from "../../components/common/layout/StudioLayout";

import LoanHeader from "../../components/loans/details/LoanHeader";
import LoanStatistics from "../../components/loans/details/LoanStatistics";
import LoanForm from "../../components/loans/details/LoanForm";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function LoansPage() {

  const [loanAmount, setLoanAmount] =
    useState("");

  const [loanType, setLoanType] =
    useState("");

  const [interest, setInterest] =
    useState("");

  const [processingFee, setProcessingFee] =
    useState("");

  const [advanceDeduction, setAdvanceDeduction] =
    useState("");

  const [lateFee, setLateFee] =
    useState("");

  const [repaymentType, setRepaymentType] =
    useState("");

  const [duration, setDuration] =
    useState("");

  const [durationType, setDurationType] =
    useState("");

  const [loanStatus, setLoanStatus] =
    useState("");

  const [purpose, setPurpose] =
    useState("");

  const [remarks, setRemarks] =
    useState("");

  return (
    <StudioLayout>

      <LoanHeader />

      <LoanStatistics
        totalLoans={0}
        activeLoans={0}
        totalDisbursed={0}
      />

      <div
        style={{
          marginTop: 24,
        }}
      >

        <LoanForm

          loanAmount={loanAmount}
          loanType={loanType}
          interest={interest}
          processingFee={processingFee}
          advanceDeduction={advanceDeduction}
          lateFee={lateFee}

          repaymentType={repaymentType}

          duration={duration}
          durationType={durationType}

          loanStatus={loanStatus}

          purpose={purpose}
          remarks={remarks}

          onLoanAmountChange={setLoanAmount}
          onLoanTypeChange={setLoanType}
          onInterestChange={setInterest}
          onProcessingFeeChange={setProcessingFee}
          onAdvanceDeductionChange={setAdvanceDeduction}
          onLateFeeChange={setLateFee}

          onRepaymentTypeChange={setRepaymentType}

          onDurationChange={setDuration}
          onDurationTypeChange={setDurationType}

          onLoanStatusChange={setLoanStatus}

          onPurposeChange={setPurpose}
          onRemarksChange={setRemarks}

        />

      </div>

    </StudioLayout>
  );
}
