/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   COLLECTION REPORTS STUDIO
   RECOVERY ANALYSIS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface RecoveryAnalysisProps {

  recoveredAmount?: number;

  overdueAmount?: number;

  recoveryPercentage?: number;

  averageRecoveryDays?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function RecoveryAnalysis({

  recoveredAmount = 0,

  overdueAmount = 0,

  recoveryPercentage = 0,

  averageRecoveryDays = 0,

}: RecoveryAnalysisProps) {

  return (

    <SummaryCard title="Recovery Analysis">

      <span>

        Recovered Amount :
        <strong> ₹ {recoveredAmount}</strong>

      </span>

      <span>

        Overdue Amount :
        <strong> ₹ {overdueAmount}</strong>

      </span>

      <span>

        Recovery Percentage :
        <strong> {recoveryPercentage}%</strong>

      </span>

      <span>

        Average Recovery Days :
        <strong> {averageRecoveryDays}</strong>

      </span>

    </SummaryCard>

  );

}
