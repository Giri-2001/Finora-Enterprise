/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   SETTLEMENT STUDIO
   SETTLEMENT QUEUE
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface SettlementQueueProps {

  pendingSettlements?: number;

  processingSettlements?: number;

  completedSettlements?: number;

  nextSettlementTime?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function SettlementQueue({

  pendingSettlements = 0,

  processingSettlements = 0,

  completedSettlements = 0,

  nextSettlementTime = "--",

}: SettlementQueueProps) {

  return (

    <SummaryCard title="Settlement Queue">

      <span>

        Pending :
        <strong> {pendingSettlements}</strong>

      </span>

      <span>

        Processing :
        <strong> {processingSettlements}</strong>

      </span>

      <span>

        Completed :
        <strong> {completedSettlements}</strong>

      </span>

      <span>

        Next Settlement :
        <strong> {nextSettlementTime}</strong>

      </span>

    </SummaryCard>

  );

}
