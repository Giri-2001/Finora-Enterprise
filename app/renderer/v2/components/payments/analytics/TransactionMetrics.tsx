/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   TRANSACTION ANALYTICS STUDIO
   TRANSACTION METRICS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface TransactionMetricsProps {

  totalTransactions?: number;

  successfulTransactions?: number;

  failedTransactions?: number;

  successRate?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function TransactionMetrics({

  totalTransactions = 0,

  successfulTransactions = 0,

  failedTransactions = 0,

  successRate = 0,

}: TransactionMetricsProps) {

  return (

    <SummaryCard title="Transaction Metrics">

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

        Success Rate :
        <strong> {successRate}%</strong>

      </span>

    </SummaryCard>

  );

}
