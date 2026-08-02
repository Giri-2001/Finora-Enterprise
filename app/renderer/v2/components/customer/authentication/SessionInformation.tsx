/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   CUSTOMER AUTHENTICATION STUDIO
   SESSION INFORMATION
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface SessionInformationProps {

  sessionId?: string;

  deviceName?: string;

  loginTime?: string;

  expiresAt?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function SessionInformation({

  sessionId = "--",

  deviceName = "--",

  loginTime = "--",

  expiresAt = "--",

}: SessionInformationProps) {

  return (

    <SummaryCard title="Session Information">

      <span>

        Session ID :
        <strong> {sessionId}</strong>

      </span>

      <span>

        Device :
        <strong> {deviceName}</strong>

      </span>

      <span>

        Login Time :
        <strong> {loginTime}</strong>

      </span>

      <span>

        Expires At :
        <strong> {expiresAt}</strong>

      </span>

    </SummaryCard>

  );

}
