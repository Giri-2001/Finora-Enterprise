/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   PROFILE & SETTINGS STUDIO
   PROFILE SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ProfileSummaryProps {

  profileCompletion?: number;

  verifiedDetails?: number;

  activeDevices?: number;

  securityScore?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ProfileSummary({

  profileCompletion = 0,

  verifiedDetails = 0,

  activeDevices = 0,

  securityScore = 0,

}: ProfileSummaryProps) {

  return (

    <SummaryCard title="Profile Summary">

      <span>

        Profile Completion :
        <strong> {profileCompletion}%</strong>

      </span>

      <span>

        Verified Details :
        <strong> {verifiedDetails}</strong>

      </span>

      <span>

        Active Devices :
        <strong> {activeDevices}</strong>

      </span>

      <span>

        Security Score :
        <strong> {securityScore}%</strong>

      </span>

    </SummaryCard>

  );

}
