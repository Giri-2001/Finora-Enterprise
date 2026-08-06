/* ===========================================================
   FINORA ENTERPRISE V2
   LOAN DETAILS STUDIO
   LOAN PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  formatCurrency,
} from "../../../utils/currency/formatCurrency";

/* ===========================================================
   TYPES
=========================================================== */

interface LoanPreviewCardProps {

  customerName?: string;

  loanAmount?: number;

  loanType?: string;

  loanStatus?: string;

  interest?: number;

  totalInterest?: number;

  totalPayable?: number;

  installmentAmount?: number;

  loanDate?: string;

maturityDate?: string;

  processingFee?: number;

  advanceDeduction?: number;

  netDisbursement?: number;

  lateFee?: number;

  repaymentType?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function LoanPreviewCard({

  customerName = "--",

  loanAmount = 0,

  loanType = "--",

interest = 0,

totalInterest = 0,

totalPayable = 0,

installmentAmount = 0,

loanDate = "--",

maturityDate = "--",

processingFee = 0,

advanceDeduction = 0,

netDisbursement = 0,

lateFee = 0,

repaymentType = "--",

loanStatus = "--",

}: LoanPreviewCardProps) {

  return (

    <SummaryCard title="Loan Preview">

      <span>

        Customer :
        <strong> {customerName}</strong>

      </span>

      <span>

        Loan Amount :
        <strong> ₹ {loanAmount}</strong>

      </span>

      <span>

        Loan Type :
        <strong> {loanType}</strong>

      </span>

      <span>

  Interest :

  <strong> {interest}%</strong>

</span>

<span>

  Total Interest :

  <strong>
  ₹ {formatCurrency(totalInterest)}
</strong>

</span>

<span>

  Total Payable :

  <strong>

    ₹ {formatCurrency(totalPayable)}

  </strong>

</span>

<span>

  Installment :

  <strong>

    ₹ {formatCurrency(installmentAmount)}

  </strong>

</span>

<span>

  Loan Date :

  <strong>

    {loanDate}

  </strong>

</span>

<span>

  Status :

  <strong>

    {loanStatus}

  </strong>

</span>

<span>

  Maturity :

  <strong>

    {maturityDate}

  </strong>

</span>

<span>

  Processing Fee :

  <strong> ₹ {processingFee}</strong>

</span>

<span>

  Advance Deduction :

  <strong> ₹ {advanceDeduction}</strong>

</span>

<span>

  Net Disbursement :

  <strong> ₹ {netDisbursement}</strong>

</span>

<span>

  Late Fee :

  <strong> ₹ {lateFee}</strong>

</span>

<span>

  Repayment :

  <strong> {repaymentType}</strong>

</span>

    </SummaryCard>

  );

}
