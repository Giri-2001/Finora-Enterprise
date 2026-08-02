/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   TRANSACTION ANALYTICS STUDIO
   GATEWAY COMPARISON
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface GatewayComparisonProps {

  topGateway?: string;

  totalGateways?: number;

  averageSuccessRate?: number;

  totalVolume?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function GatewayComparison({

  topGateway = "--",

  totalGateways = 0,

  averageSuccessRate = 0,

  totalVolume = 0,

}: GatewayComparisonProps) {

  return (

    <SummaryCard title="Gateway Comparison">

      <span>

        Top Gateway :
        <strong> {topGateway}</strong>

      </span>

      <span>

        Gateways :
        <strong> {totalGateways}</strong>

      </span>

      <span>

        Avg. Success Rate :
        <strong> {averageSuccessRate}%</strong>

      </span>

      <span>

        Total Volume :
        <strong> ₹ {totalVolume}</strong>

      </span>

    </SummaryCard>

  );

}
