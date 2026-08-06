/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   LEDGER & RECONCILIATION STUDIO
   BANK RECONCILIATION
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  formatCurrency,
} from "../../../utils/currency/formatCurrency";
/* ===========================================================
   TYPES
=========================================================== */

interface BankReconciliationProps {

  bankBalance?: number;

  ledgerBalance?: number;

  difference?: number;

  reconciliationStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function BankReconciliation({

  bankBalance = 0,

  ledgerBalance = 0,

  difference = 0,

  reconciliationStatus = "Balanced",

}: BankReconciliationProps) {

  return (

    <SummaryCard title="Bank Reconciliation">

      <span>

        Bank Balance :
        <strong> ₹ {formatCurrency(bankBalance)}</strong>

      </span>

      <span>

        Ledger Balance :
        <strong> ₹ {formatCurrency(ledgerBalance)}</strong>

      </span>

      <span>

        Difference :
        <strong> ₹ {formatCurrency(difference)}</strong>

      </span>

      <span>

        Status :
        <strong> {reconciliationStatus}</strong>

      </span>

    </SummaryCard>

  );

}
