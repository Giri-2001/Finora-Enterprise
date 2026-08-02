/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   TRANSACTION ANALYTICS STUDIO
   ANALYTICS SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface AnalyticsSummaryProps {

  totalTransactions?: number;

  successfulTransactions?: number;

  failedTransactions?: number;

  totalVolume?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function AnalyticsSummary({

  totalTransactions = 0,

  successfulTransactions = 0,

  failedTransactions = 0,

  totalVolume = 0,

}: AnalyticsSummaryProps) {

  return (

    <SummaryCard title="Analytics Summary">

      <span>

        Total Transactions :
        <strong> {totalTransactions}</strong>

      </span>

      <span>

        Successful :
        <strong> {successfulTransactions}</strong>

      </span>

      <span>

        Failed :
        <strong> {failedTransactions}</strong>

      </span>

      <span>

        Total Volume :
        <strong> ₹ {totalVolume}</strong>

      </span>

    </SummaryCard>

  );

}
