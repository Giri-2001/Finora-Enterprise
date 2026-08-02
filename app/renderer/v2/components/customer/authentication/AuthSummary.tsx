/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   CUSTOMER AUTHENTICATION STUDIO
   AUTHENTICATION SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface AuthSummaryProps {

  totalCustomers?: number;

  activeSessions?: number;

  successfulLogins?: number;

  failedLogins?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function AuthSummary({

  totalCustomers = 0,

  activeSessions = 0,

  successfulLogins = 0,

  failedLogins = 0,

}: AuthSummaryProps) {

  return (

    <SummaryCard title="Authentication Summary">

      <span>

        Total Customers :
        <strong> {totalCustomers}</strong>

      </span>

      <span>

        Active Sessions :
        <strong> {activeSessions}</strong>

      </span>

      <span>

        Successful Logins :
        <strong> {successfulLogins}</strong>

      </span>

      <span>

        Failed Logins :
        <strong> {failedLogins}</strong>

      </span>

    </SummaryCard>

  );

}
