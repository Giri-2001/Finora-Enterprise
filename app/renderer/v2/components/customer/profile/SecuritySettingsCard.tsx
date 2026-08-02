/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   PROFILE & SETTINGS STUDIO
   SECURITY SETTINGS CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface SecuritySettingsCardProps {

  twoFactorEnabled?: boolean;

  biometricEnabled?: boolean;

  deviceVerified?: boolean;

  lastPasswordChange?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function SecuritySettingsCard({

  twoFactorEnabled = false,

  biometricEnabled = false,

  deviceVerified = false,

  lastPasswordChange = "--",

}: SecuritySettingsCardProps) {

  return (

    <SummaryCard title="Security Settings">

      <span>

        Two-Factor Authentication :
        <strong> {twoFactorEnabled ? "Enabled" : "Disabled"}</strong>

      </span>

      <span>

        Biometric Login :
        <strong> {biometricEnabled ? "Enabled" : "Disabled"}</strong>

      </span>

      <span>

        Trusted Device :
        <strong> {deviceVerified ? "Verified" : "Not Verified"}</strong>

      </span>

      <span>

        Last Password Change :
        <strong> {lastPasswordChange}</strong>

      </span>

    </SummaryCard>

  );

}
