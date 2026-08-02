/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   LEDGER & RECONCILIATION STUDIO
   LEDGER ENTRIES
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface LedgerEntriesProps {

  totalEntries?: number;

  debitEntries?: number;

  creditEntries?: number;

  lastEntryDate?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function LedgerEntries({

  totalEntries = 0,

  debitEntries = 0,

  creditEntries = 0,

  lastEntryDate = "--",

}: LedgerEntriesProps) {

  return (

    <SummaryCard title="Ledger Entries">

      <span>

        Total Entries :
        <strong> {totalEntries}</strong>

      </span>

      <span>

        Debit Entries :
        <strong> {debitEntries}</strong>

      </span>

      <span>

        Credit Entries :
        <strong> {creditEntries}</strong>

      </span>

      <span>

        Last Entry :
        <strong> {lastEntryDate}</strong>

      </span>

    </SummaryCard>

  );

}
