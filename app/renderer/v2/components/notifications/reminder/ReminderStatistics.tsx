/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   REMINDER & SCHEDULER STUDIO
   REMINDER STATISTICS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ReminderStatisticsProps {

  totalReminders?: number;

  sentToday?: number;

  pendingReminders?: number;

  recurringReminders?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReminderStatistics({

  totalReminders = 0,

  sentToday = 0,

  pendingReminders = 0,

  recurringReminders = 0,

}: ReminderStatisticsProps) {

  return (

    <SummaryCard title="Reminder Statistics">

      <span>

        Total Reminders :
        <strong> {totalReminders}</strong>

      </span>

      <span>

        Sent Today :
        <strong> {sentToday}</strong>

      </span>

      <span>

        Pending :
        <strong> {pendingReminders}</strong>

      </span>

      <span>

        Recurring :
        <strong> {recurringReminders}</strong>

      </span>

    </SummaryCard>

  );

}
