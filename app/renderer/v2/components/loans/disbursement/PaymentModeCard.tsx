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
// STEP 6 FORM TYPOGRAPHY
// ============================================================

const formLabelTextStyle: CSSProperties = {
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "15px",
  fontWeight: 600,
};

const dropdownTextStyle: CSSProperties = {
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "14px",
  fontWeight: 650,
  lineHeight: 1.4,
  color: "var(--finora-theme-text-primary, #f8fafc)",
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
    <div className="paisarule-step6-payment-mode">
      <SummaryCard title="Payment Mode">
      <div style={fieldsStyle}>
        {/* ==================================================
            PRIMARY PAYMENT MODE
        ================================================== */}

        <FormField label="Payment Mode" required labelTextStyle={formLabelTextStyle}>
          <SelectInput
            value={paymentMode}
            className="paisarule-step6-select" style={dropdownTextStyle}
            optionTextStyle={dropdownTextStyle}
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

        <FormField label="Transaction Status" labelTextStyle={formLabelTextStyle}>
          <SelectInput
            value={transactionStatus}
            className="paisarule-step6-select" style={dropdownTextStyle}
            optionTextStyle={dropdownTextStyle}
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
      </div>      </SummaryCard>

      <style>{`
        @media (max-width: 640px) {
          .paisarule-step6-payment-mode .paisarule-step6-select {
            min-height: 40px !important;
            height: 40px !important;
            font-size: 15px !important;
            color: var(--finora-theme-text-primary, #f8fafc) !important;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// END
// ============================================================
