/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   REMINDER & SCHEDULER STUDIO
   REMINDER DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

interface ReminderDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReminderDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: ReminderDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Reminder & Scheduler Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}
