/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   PROFILE & SETTINGS STUDIO
   PREFERENCES CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface PreferencesCardProps {

  language?: string;

  theme?: string;

  notificationPreference?: string;

  communicationPreference?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PreferencesCard({

  language = "English",

  theme = "System",

  notificationPreference = "Push Notifications",

  communicationPreference = "SMS & Email",

}: PreferencesCardProps) {

  return (

    <SummaryCard title="Preferences">

      <span>

        Language :
        <strong> {language}</strong>

      </span>

      <span>

        Theme :
        <strong> {theme}</strong>

      </span>

      <span>

        Notifications :
        <strong> {notificationPreference}</strong>

      </span>

      <span>

        Communication :
        <strong> {communicationPreference}</strong>

      </span>

    </SummaryCard>

  );

}
