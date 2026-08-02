/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   REMINDER & SCHEDULER STUDIO
   REMINDER RULES
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ReminderRulesProps {

  activeRules?: number;

  recurringRules?: number;

  overdueRules?: number;

  defaultSchedule?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReminderRules({

  activeRules = 0,

  recurringRules = 0,

  overdueRules = 0,

  defaultSchedule = "Daily",

}: ReminderRulesProps) {

  return (

    <SummaryCard title="Reminder Rules">

      <span>

        Active Rules :
        <strong> {activeRules}</strong>

      </span>

      <span>

        Recurring Rules :
        <strong> {recurringRules}</strong>

      </span>

      <span>

        Overdue Rules :
        <strong> {overdueRules}</strong>

      </span>

      <span>

        Default Schedule :
        <strong> {defaultSchedule}</strong>

      </span>

    </SummaryCard>

  );

}
