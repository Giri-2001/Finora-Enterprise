/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   CASH BOOK STUDIO
   CASH TRANSACTION LIST
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface CashTransactionListProps {

  totalTransactions?: number;

  cashReceipts?: number;

  cashPayments?: number;

  lastTransaction?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CashTransactionList({

  totalTransactions = 0,

  cashReceipts = 0,

  cashPayments = 0,

  lastTransaction = "--",

}: CashTransactionListProps) {

  return (

    <SummaryCard title="Cash Transaction List">

      <span>

        Total Transactions :
        <strong> {totalTransactions}</strong>

      </span>

      <span>

        Cash Receipts :
        <strong> {cashReceipts}</strong>

      </span>

      <span>

        Cash Payments :
        <strong> {cashPayments}</strong>

      </span>

      <span>

        Last Transaction :
        <strong> {lastTransaction}</strong>

      </span>

    </SummaryCard>

  );

}
