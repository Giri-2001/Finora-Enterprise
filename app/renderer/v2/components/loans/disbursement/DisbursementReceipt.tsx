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

import { formatCurrency } from "../../../utils/currency/formatCurrency";

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
          ₹ {formatCurrency(amount)}
        </strong>
      </span>

    </SummaryCard>

  );
}

// ============================================================
// END
// ============================================================
