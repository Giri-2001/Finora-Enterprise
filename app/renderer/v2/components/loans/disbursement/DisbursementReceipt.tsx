// ============================================================
// FINORA ENTERPRISE V2
//
// DISBURSEMENT STUDIO
// DISBURSEMENT RECEIPT
//
// RESPONSIBILITY:
// - Present disbursement receipt information
// - Presentation only
//
// ============================================================

import SummaryCard from "../../common/cards/SummaryCard";

// ============================================================
// TYPES
// ============================================================

interface DisbursementReceiptProps {

  receiptNumber?: string;

  customerName?: string;

  amount?: number;

  paymentMode?: string;

}

// ============================================================
// COMPONENT
// ============================================================

export default function DisbursementReceipt({

  receiptNumber = "--",

  customerName = "--",

  amount = 0,

  paymentMode = "--",

}: DisbursementReceiptProps) {

  return (

    <SummaryCard
      title="Disbursement Receipt"
    >

      <span>
        Receipt No :
        <strong>
          {" "}
          {receiptNumber}
        </strong>
      </span>

      <span>
        Customer :
        <strong>
          {" "}
          {customerName}
        </strong>
      </span>

      <span>
        Amount :
        <strong>
          {" "}
          ₹ {amount}
        </strong>
      </span>

      <span>
        Payment Mode :
        <strong>
          {" "}
          {paymentMode.charAt(0).toUpperCase() + paymentMode.slice(1)}
        </strong>
      </span>

    </SummaryCard>

  );
}

// ============================================================
// END
// ============================================================
