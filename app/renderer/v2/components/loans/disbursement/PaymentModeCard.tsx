// ============================================================
// FINORA ENTERPRISE V2
//
// DISBURSEMENT STUDIO
// PAYMENT MODE CARD
//
// RESPONSIBILITY:
// - Configure primary payment mode
// - Configure transaction status
// - Controlled by LoanStudio
//
// ============================================================

import SummaryCard from "../../common/cards/SummaryCard";

import {
  FormField,
  SelectInput,
} from "../../common";

// ============================================================
// TYPES
// ============================================================

interface PaymentModeCardProps {

  paymentMode?: string;

  transactionStatus?: string;

  onPaymentModeChange?: (
    value: string,
  ) => void;

  onTransactionStatusChange?: (
    value: string,
  ) => void;
}

// ============================================================
// COMPONENT
// ============================================================

export default function PaymentModeCard({

  paymentMode = "cash",

  transactionStatus = "pending",

  onPaymentModeChange,

  onTransactionStatusChange,

}: PaymentModeCardProps) {

  return (

    <SummaryCard
      title="Payment Mode"
    >

      <FormField
        label="Primary Payment Mode"
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


      <FormField
        label="Transaction Status"
      >

        <SelectInput
          value={
            transactionStatus
          }
          onChange={(
            event,
          ) => {

            onTransactionStatusChange?.(
              event.target.value,
            );

          }}
          options={[
            {
              label: "Pending",
              value: "pending",
            },
            {
              label: "Completed",
              value: "completed",
            },
            {
              label: "Failed",
              value: "failed",
            },
          ]}
        />

      </FormField>

    </SummaryCard>

  );
}

// ============================================================
// END
// ============================================================
