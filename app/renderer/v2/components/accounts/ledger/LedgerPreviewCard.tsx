/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   LEDGER & RECONCILIATION STUDIO
   LEDGER PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface LedgerPreviewCardProps {

  reportDate?: string;

  totalEntries?: number;

  reconciledEntries?: number;

  pendingEntries?: number;

  status?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function LedgerPreviewCard({

  reportDate = "--",

  totalEntries = 0,

  reconciledEntries = 0,

  pendingEntries = 0,

  status = "--",

}: LedgerPreviewCardProps) {

  return (

    <SummaryCard title="Ledger Preview">

      <span>
        Report Date :
        <strong> {reportDate}</strong>
      </span>

      <span>
        Total Entries :
        <strong> {totalEntries}</strong>
      </span>

      <span>
        Reconciled :
        <strong> {reconciledEntries}</strong>
      </span>

      <span>
        Pending :
        <strong> {pendingEntries}</strong>
      </span>

      <span>
        Status :
        <strong> {status}</strong>
      </span>

    </SummaryCard>

  );

}
