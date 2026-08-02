/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   NOTIFICATION CENTER STUDIO
   NOTIFICATION FILTERS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface NotificationFiltersProps {

  allEnabled?: boolean;

  unreadOnly?: boolean;

  highPriorityOnly?: boolean;

  archivedVisible?: boolean;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function NotificationFilters({

  allEnabled = true,

  unreadOnly = false,

  highPriorityOnly = false,

  archivedVisible = false,

}: NotificationFiltersProps) {

  return (

    <SummaryCard title="Notification Filters">

      <span>
        All Notifications :
        <strong> {allEnabled ? "Enabled" : "Disabled"}</strong>
      </span>

      <span>
        Unread Only :
        <strong> {unreadOnly ? "Yes" : "No"}</strong>
      </span>

      <span>
        High Priority Only :
        <strong> {highPriorityOnly ? "Yes" : "No"}</strong>
      </span>

      <span>
        Show Archived :
        <strong> {archivedVisible ? "Yes" : "No"}</strong>
      </span>

    </SummaryCard>

  );

}
