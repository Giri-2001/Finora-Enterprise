/* ===========================================================
   FINORA ENTERPRISE V2
   FINANCE STUDIO
   FINANCE PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface FinancePreviewCardProps {

  interestType?: string;

  interestRate?: number;

  processingFee?: number;

  penaltyValue?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function FinancePreviewCard({

  interestType = "--",

  interestRate = 0,

  processingFee = 0,

  penaltyValue = 0,

}: FinancePreviewCardProps) {

  return (

    <SummaryCard title="Finance Preview">

      <span>

        Interest Type : <strong>{interestType}</strong>

      </span>

      <span>

        Interest Rate : <strong>{interestRate}%</strong>

      </span>

      <span>

        Processing Fee : <strong>₹ {processingFee}</strong>

      </span>

      <span>

        Penalty : <strong>₹ {penaltyValue}</strong>

      </span>

    </SummaryCard>

  );

}
