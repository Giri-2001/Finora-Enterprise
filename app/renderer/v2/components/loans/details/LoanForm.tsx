/* ===========================================================
   FINORA ENTERPRISE V2
   LOAN DETAILS STUDIO
   LOAN FORM
=========================================================== */

import { CSSProperties } from "react";

import {
  FormField,
  TextInput,
  SelectInput,
} from "../../common";

/* ===========================================================
   STYLES
=========================================================== */

const wrapperStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  gap: "20px",

};

/* ===========================================================
   TYPES
=========================================================== */

interface LoanFormProps {

  loanAmount: string;

  loanType: string;

  interest: string;

  processingFee: string;

  advanceDeduction: string;

  lateFee: string;

  repaymentType: string;

  duration: string;

durationType: string;

loanStatus: string;

  purpose: string;

  remarks: string;

  onLoanAmountChange: (
    value: string,
  ) => void;

  onLoanTypeChange: (
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

  onRepaymentTypeChange: (
    value: string,
  ) => void;

  onDurationChange: (
  value: string,
) => void;

onDurationTypeChange: (
  value: string,
) => void;

onLoanStatusChange: (
  value: string,
) => void;

  onPurposeChange: (
    value: string,
  ) => void;

  onRemarksChange: (
    value: string,
  ) => void;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function LoanForm({

  loanAmount,

  loanType,

  interest,

  processingFee,

  advanceDeduction,

  lateFee,

  repaymentType,

  duration,

durationType,

loanStatus,

  purpose,

  remarks,

  onLoanAmountChange,

  onLoanTypeChange,

  onInterestChange,

  onProcessingFeeChange,

  onAdvanceDeductionChange,

  onLateFeeChange,

  onRepaymentTypeChange,

  onDurationChange,

onDurationTypeChange,

onLoanStatusChange,

  onPurposeChange,

  onRemarksChange,

}: LoanFormProps) {

  return (

    <div style={wrapperStyle}>

      <FormField

        label="Loan Number"

        required

      >

        <TextInput

          placeholder="Auto Generated"

        />

      </FormField>

      <FormField

        label="Loan Amount"

        required

      >

        <TextInput

  type="number"

  value={loanAmount}

  onChange={(event) =>
    onLoanAmountChange(
      event.target.value,
    )
  }

  placeholder="Enter loan amount"

/>

      </FormField>

      <FormField

        label="Loan Type"

        required

      >

        <SelectInput

  value={loanType}

  onChange={(event) =>
    onLoanTypeChange(
      event.target.value,
    )
  }

  options={[

    {
      label: "Daily Loan",
      value: "daily",
    },

    {
      label: "Weekly Loan",
      value: "weekly",
    },

    {
      label: "Monthly Loan",
      value: "monthly",
    },

  ]}

/>

      </FormField>

      <FormField

  label="Interest (%)"

  required

>

  <TextInput

    type="number"

    value={interest}

    onChange={(event) =>

      onInterestChange(
        event.target.value,
      )

    }

    placeholder="Enter interest percentage"

  />

</FormField>

<FormField

  label="Processing Fee"

>

  <TextInput

    type="number"

    value={processingFee}

    onChange={(event) =>

      onProcessingFeeChange(
        event.target.value,
      )

    }

    placeholder="Enter processing fee"

  />

</FormField>

<FormField

  label="Advance Deduction"

>

  <TextInput

    type="number"

    value={advanceDeduction}

    onChange={(event) =>

      onAdvanceDeductionChange(
        event.target.value,
      )

    }

    placeholder="Amount deducted before disbursement"

  />

</FormField>

<FormField

  label="Late Fee"

>

  <TextInput

    type="number"

    value={lateFee}

    onChange={(event) =>

      onLateFeeChange(
        event.target.value,
      )

    }

    placeholder="Enter late fee"

  />

</FormField>

<FormField

  label="Repayment Type"

  required

>

  <SelectInput

    value={repaymentType}

    onChange={(event) =>

      onRepaymentTypeChange(
        event.target.value,
      )

    }

    options={[

      {
        label: "Daily",
        value: "daily",
      },

      {
        label: "Weekly",
        value: "weekly",
      },

      {
        label: "Monthly",
        value: "monthly",
      },

      {
        label: "One Time",
        value: "one-time",
      },

    ]}

  />

</FormField>

<FormField

  label="Loan Duration"

  required

>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 170px",
      gap: "12px",
    }}
  >

    <TextInput

      type="number"

      value={duration}

      onChange={(event) =>
        onDurationChange(
          event.target.value,
        )
      }

      placeholder="Duration"

    />

    <SelectInput

      value={durationType}

      onChange={(event) =>
        onDurationTypeChange(
          event.target.value,
        )
      }

      options={[

        {
          label: "Days",
          value: "days",
        },

        {
          label: "Weeks",
          value: "weeks",
        },

        {
          label: "Months",
          value: "months",
        },

        {
          label: "Years",
          value: "years",
        },

      ]}

    />

  </div>

</FormField>

<FormField

  label="Loan Status"

  required

>

  <SelectInput

    value={loanStatus}

    onChange={(event) =>
      onLoanStatusChange(
        event.target.value,
      )
    }

    options={[

      {
        label: "Pending Approval",
        value: "Pending Approval",
      },

      {
        label: "Approved",
        value: "Approved",
      },

      {
        label: "Disbursed",
        value: "Disbursed",
      },

      {
        label: "Running",
        value: "Running",
      },

      {
        label: "Closed",
        value: "Closed",
      },

      {
        label: "Defaulted",
        value: "Defaulted",
      },

      {
        label: "Rejected",
        value: "Rejected",
      },

    ]}

  />

</FormField>

    </div>

  );

}
