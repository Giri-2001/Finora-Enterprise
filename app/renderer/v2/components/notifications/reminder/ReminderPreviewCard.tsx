/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   REMINDER & SCHEDULER STUDIO
   REMINDER PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ReminderPreviewCardProps {

  reminderTitle?: string;

  recipient?: string;

  scheduledTime?: string;

  recurrence?: string;

  status?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReminderPreviewCard({

  reminderTitle = "--",

  recipient = "--",

  scheduledTime = "--",

  recurrence = "One Time",

  status = "Draft",

}: ReminderPreviewCardProps) {

  return (

    <SummaryCard title="Reminder Preview">

      <span>

        Reminder :
        <strong> {reminderTitle}</strong>

      </span>

      <span>

        Recipient :
        <strong> {recipient}</strong>

      </span>

      <span>

        Scheduled :
        <strong> {scheduledTime}</strong>

      </span>

      <span>

        Recurrence :
        <strong> {recurrence}</strong>

      </span>

      <span>

        Status :
        <strong> {status}</strong>

      </span>

    </SummaryCard>

  );

}
