/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   LEDGER & RECONCILIATION STUDIO
   BANK RECONCILIATION
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

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
        <strong> ₹ {bankBalance}</strong>

      </span>

      <span>

        Ledger Balance :
        <strong> ₹ {ledgerBalance}</strong>

      </span>

      <span>

        Difference :
        <strong> ₹ {difference}</strong>

      </span>

      <span>

        Status :
        <strong> {reconciliationStatus}</strong>

      </span>

    </SummaryCard>

  );

}
