/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   SETTLEMENT STUDIO
   SETTLEMENT SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface SettlementSummaryProps {

  totalSettlements?: number;

  completedSettlements?: number;

  pendingSettlements?: number;

  totalSettledAmount?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function SettlementSummary({

  totalSettlements = 0,

  completedSettlements = 0,

  pendingSettlements = 0,

  totalSettledAmount = 0,

}: SettlementSummaryProps) {

  return (

    <SummaryCard title="Settlement Summary">

      <span>

        Total Settlements :
        <strong> {totalSettlements}</strong>

      </span>

      <span>

        Completed :
        <strong> {completedSettlements}</strong>

      </span>

      <span>

        Pending :
        <strong> {pendingSettlements}</strong>

      </span>

      <span>

        Total Settled Amount :
        <strong> ₹ {totalSettledAmount}</strong>

      </span>

    </SummaryCard>

  );

}
