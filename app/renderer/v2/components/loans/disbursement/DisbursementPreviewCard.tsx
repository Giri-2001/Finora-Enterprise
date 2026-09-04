// ============================================================
// FINORA ENTERPRISE V2
//
// DISBURSEMENT STUDIO
// DISBURSEMENT PREVIEW CARD
//
// RESPONSIBILITY:
// - Present live disbursement preview
// - Presentation only
//
// ============================================================

import SummaryCard from "../../common/cards/SummaryCard";

// ============================================================
// TYPES
// ============================================================

interface DisbursementPreviewCardProps {

  disbursementDate?: string;

  amount?: number;

  paymentMode?: string;

  transactionStatus?: string;

}

// ============================================================
// COMPONENT
// ============================================================

export default function DisbursementPreviewCard({

  disbursementDate = "--",

  amount = 0,

  paymentMode = "--",

  transactionStatus = "--",

}: DisbursementPreviewCardProps) {

  return (

    <SummaryCard
      title="Disbursement Preview"
    >

      <span>
        Date :
        <strong>
          {" "}
          {disbursementDate}
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

      <span>
        Status :
        <strong>
          {" "}
          {transactionStatus.charAt(0).toUpperCase() + transactionStatus.slice(1)}
        </strong>
      </span>

    </SummaryCard>

  );
}

// ============================================================
// END
// ============================================================
