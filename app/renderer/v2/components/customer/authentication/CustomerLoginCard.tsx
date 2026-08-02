/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   CUSTOMER AUTHENTICATION STUDIO
   CUSTOMER LOGIN CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface CustomerLoginCardProps {

  customerId?: string;

  mobileNumber?: string;

  loginMethod?: string;

  lastLogin?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerLoginCard({

  customerId = "--",

  mobileNumber = "--",

  loginMethod = "Mobile OTP",

  lastLogin = "--",

}: CustomerLoginCardProps) {

  return (

    <SummaryCard title="Customer Login">

      <span>

        Customer ID :
        <strong> {customerId}</strong>

      </span>

      <span>

        Mobile :
        <strong> {mobileNumber}</strong>

      </span>

      <span>

        Login Method :
        <strong> {loginMethod}</strong>

      </span>

      <span>

        Last Login :
        <strong> {lastLogin}</strong>

      </span>

    </SummaryCard>

  );

}
