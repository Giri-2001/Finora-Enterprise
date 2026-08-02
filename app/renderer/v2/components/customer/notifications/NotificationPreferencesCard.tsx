/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   CUSTOMER NOTIFICATIONS STUDIO
   NOTIFICATION PREFERENCES CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface NotificationPreferencesCardProps {

  pushNotifications?: boolean;

  smsNotifications?: boolean;

  emailNotifications?: boolean;

  marketingNotifications?: boolean;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function NotificationPreferencesCard({

  pushNotifications = true,

  smsNotifications = true,

  emailNotifications = true,

  marketingNotifications = false,

}: NotificationPreferencesCardProps) {

  return (

    <SummaryCard title="Notification Preferences">

      <span>

        Push Notifications :
        <strong> {pushNotifications ? "Enabled" : "Disabled"}</strong>

      </span>

      <span>

        SMS Notifications :
        <strong> {smsNotifications ? "Enabled" : "Disabled"}</strong>

      </span>

      <span>

        Email Notifications :
        <strong> {emailNotifications ? "Enabled" : "Disabled"}</strong>

      </span>

      <span>

        Marketing Notifications :
        <strong> {marketingNotifications ? "Enabled" : "Disabled"}</strong>

      </span>

    </SummaryCard>

  );

}
