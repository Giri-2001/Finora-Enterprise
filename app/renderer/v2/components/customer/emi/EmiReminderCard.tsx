/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   EMI SCHEDULE STUDIO
   EMI REMINDER CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface EmiReminderCardProps {

  nextReminder?: string;

  reminderMethod?: string;

  autoReminderEnabled?: boolean;

  reminderStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function EmiReminderCard({

  nextReminder = "--",

  reminderMethod = "Push Notification",

  autoReminderEnabled = true,

  reminderStatus = "Scheduled",

}: EmiReminderCardProps) {

  return (

    <SummaryCard title="EMI Reminder">

      <span>

        Next Reminder :
        <strong> {nextReminder}</strong>

      </span>

      <span>

        Reminder Method :
        <strong> {reminderMethod}</strong>

      </span>

      <span>

        Auto Reminder :
        <strong> {autoReminderEnabled ? "Enabled" : "Disabled"}</strong>

      </span>

      <span>

        Status :
        <strong> {reminderStatus}</strong>

      </span>

    </SummaryCard>

  );

}
