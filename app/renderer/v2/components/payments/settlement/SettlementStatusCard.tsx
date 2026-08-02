/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   SETTLEMENT STUDIO
   SETTLEMENT STATUS CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface SettlementStatusCardProps {

  settlementId?: string;

  provider?: string;

  settlementStatus?: string;

  settledAmount?: number;

  settledAt?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function SettlementStatusCard({

  settlementId = "--",

  provider = "--",

  settlementStatus = "Pending",

  settledAmount = 0,

  settledAt = "--",

}: SettlementStatusCardProps) {

  return (

    <SummaryCard title="Settlement Status">

      <span>

        Settlement ID :
        <strong> {settlementId}</strong>

      </span>

      <span>

        Provider :
        <strong> {provider}</strong>

      </span>

      <span>

        Status :
        <strong> {settlementStatus}</strong>

      </span>

      <span>

        Amount :
        <strong> ₹ {settledAmount}</strong>

      </span>

      <span>

        Settled At :
        <strong> {settledAt}</strong>

      </span>

    </SummaryCard>

  );

}
