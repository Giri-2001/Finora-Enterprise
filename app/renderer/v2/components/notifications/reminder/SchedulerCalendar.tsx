/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   REMINDER & SCHEDULER STUDIO
   SCHEDULER CALENDAR
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface SchedulerCalendarProps {

  scheduledToday?: number;

  scheduledThisWeek?: number;

  recurringSchedules?: number;

  nextExecution?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function SchedulerCalendar({

  scheduledToday = 0,

  scheduledThisWeek = 0,

  recurringSchedules = 0,

  nextExecution = "--",

}: SchedulerCalendarProps) {

  return (

    <SummaryCard title="Scheduler Calendar">

      <span>

        Scheduled Today :
        <strong> {scheduledToday}</strong>

      </span>

      <span>

        This Week :
        <strong> {scheduledThisWeek}</strong>

      </span>

      <span>

        Recurring :
        <strong> {recurringSchedules}</strong>

      </span>

      <span>

        Next Execution :
        <strong> {nextExecution}</strong>

      </span>

    </SummaryCard>

  );

}
