/* ===========================================================
   FINORA ENTERPRISE V2
   ACCOUNTS ENGINE
   INCOME MANAGEMENT STUDIO
   INCOME VERIFICATION
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface IncomeVerificationProps {

  verifiedTransactions?: number;

  pendingTransactions?: number;

  rejectedTransactions?: number;

  verificationStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function IncomeVerification({

  verifiedTransactions = 0,

  pendingTransactions = 0,

  rejectedTransactions = 0,

  verificationStatus = "Verified",

}: IncomeVerificationProps) {

  return (

    <SummaryCard title="Income Verification">

      <span>

        Verified :
        <strong> {verifiedTransactions}</strong>

      </span>

      <span>

        Pending :
        <strong> {pendingTransactions}</strong>

      </span>

      <span>

        Rejected :
        <strong> {rejectedTransactions}</strong>

      </span>

      <span>

        Status :
        <strong> {verificationStatus}</strong>

      </span>

    </SummaryCard>

  );

}
