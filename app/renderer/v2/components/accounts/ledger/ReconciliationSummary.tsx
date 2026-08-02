/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   LEDGER & RECONCILIATION STUDIO
   RECONCILIATION SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ReconciliationSummaryProps {

  matchedEntries?: number;

  unmatchedEntries?: number;

  reconciledAmount?: number;

  reconciliationStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReconciliationSummary({

  matchedEntries = 0,

  unmatchedEntries = 0,

  reconciledAmount = 0,

  reconciliationStatus = "Balanced",

}: ReconciliationSummaryProps) {

  return (

    <SummaryCard title="Reconciliation Summary">

      <span>

        Matched Entries :
        <strong> {matchedEntries}</strong>

      </span>

      <span>

        Unmatched Entries :
        <strong> {unmatchedEntries}</strong>

      </span>

      <span>

        Reconciled Amount :
        <strong> ₹ {reconciledAmount}</strong>

      </span>

      <span>

        Status :
        <strong> {reconciliationStatus}</strong>

      </span>

    </SummaryCard>

  );

}
