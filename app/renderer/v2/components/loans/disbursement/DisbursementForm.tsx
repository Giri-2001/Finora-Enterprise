// ============================================================
// FINORA ENTERPRISE V2
//
// DISBURSEMENT STUDIO
// DISBURSEMENT FORM
//
// RESPONSIBILITY:
// - Collect disbursement date
// - Collect disbursement amount
// - Select primary payment mode
// - Controlled by LoanStudio
//
// ============================================================

import type { CSSProperties } from "react";

import {
  FormField,
  SelectInput,
  TextInput,
} from "../../common";

// ============================================================
// STYLES
// ============================================================

const wrapperStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

// ============================================================
// TYPES
// ============================================================

interface DisbursementFormProps {

  disbursementDate?: string;

  disbursementAmount?: string;

  paymentMode?: string;

  onDisbursementDateChange?: (
    value: string,
  ) => void;

  onDisbursementAmountChange?: (
    value: string,
  ) => void;

  onPaymentModeChange?: (
    value: string,
  ) => void;
}

// ============================================================
// COMPONENT
// ============================================================

export default function DisbursementForm({

  disbursementDate = "",

  disbursementAmount = "0",

  paymentMode = "cash",

  onDisbursementDateChange,

  onDisbursementAmountChange,

  onPaymentModeChange,

}: DisbursementFormProps) {

  return (

    <div
      style={wrapperStyle}
    >

      <FormField
        label="Disbursement Date"
        required
      >

        <TextInput
          type="date"
          value={
            disbursementDate
          }
          onChange={(
            event,
          ) => {

            onDisbursementDateChange?.(
              event.target.value,
            );

          }}
        />

      </FormField>


      <FormField
        label="Disbursement Amount"
        required
      >

        <TextInput
          type="number"
          value={
            disbursementAmount
          }
          onChange={(
            event,
          ) => {

            onDisbursementAmountChange?.(
              event.target.value,
            );

          }}
          placeholder="Enter amount"
        />

      </FormField>


      <FormField
        label="Payment Mode"
        required
      >

        <SelectInput
          value={
            paymentMode
          }
          onChange={(
            event,
          ) => {

            onPaymentModeChange?.(
              event.target.value,
            );

          }}
          options={[
            {
              label: "Cash",
              value: "cash",
            },
            {
              label: "Bank Transfer",
              value: "bank",
            },
            {
              label: "UPI",
              value: "upi",
            },
            {
              label: "Cheque",
              value: "cheque",
            },
          ]}
        />

      </FormField>

    </div>

  );
}

// ============================================================
// END
// ============================================================
