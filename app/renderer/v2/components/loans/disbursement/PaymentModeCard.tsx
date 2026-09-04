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

import type { CSSProperties } from "react";

import SummaryCard from "../../common/cards/SummaryCard";

import { FormField, SelectInput } from "../../common";

// ============================================================
// STYLES
// ============================================================

const fieldsStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,

  display: "grid",

  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",

  gap: "10px",

  alignItems: "start",

  boxSizing: "border-box",
};

// ============================================================
// TYPES
// ============================================================

interface PaymentModeCardProps {
  paymentMode?: string;

  transactionStatus?: string;

  onPaymentModeChange?: (value: string) => void;

  onTransactionStatusChange?: (value: string) => void;
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
    <SummaryCard title="Payment Mode">
      <div style={fieldsStyle}>
        {/* ==================================================
            PRIMARY PAYMENT MODE
        ================================================== */}

        <FormField label="Payment Mode" required>
          <SelectInput
            value={paymentMode}
            onChange={(event) => {
              onPaymentModeChange?.(event.target.value);
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

        {/* ==================================================
            TRANSACTION STATUS
        ================================================== */}

        <FormField label="Transaction Status">
          <SelectInput
            value={transactionStatus}
            onChange={(event) => {
              onTransactionStatusChange?.(event.target.value);
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
            ]}
          />
        </FormField>
      </div>
    </SummaryCard>
  );
}

// ============================================================
// END
// ============================================================
