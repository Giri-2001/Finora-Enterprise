/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   SETTLEMENT STUDIO
   SETTLEMENT PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface SettlementPreviewCardProps {

  settlementId?: string;

  provider?: string;

  totalAmount?: number;

  settlementDate?: string;

  status?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function SettlementPreviewCard({

  settlementId = "--",

  provider = "--",

  totalAmount = 0,

  settlementDate = "--",

  status = "Pending",

}: SettlementPreviewCardProps) {

  return (

    <SummaryCard title="Settlement Preview">

      <span>

        Settlement ID :
        <strong> {settlementId}</strong>

      </span>

      <span>

        Provider :
        <strong> {provider}</strong>

      </span>

      <span>

        Amount :
        <strong> ₹ {totalAmount}</strong>

      </span>

      <span>

        Settlement Date :
        <strong> {settlementDate}</strong>

      </span>

      <span>

        Status :
        <strong> {status}</strong>

      </span>

    </SummaryCard>

  );

}
