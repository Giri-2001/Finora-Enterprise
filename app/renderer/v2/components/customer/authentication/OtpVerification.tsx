/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   CUSTOMER AUTHENTICATION STUDIO
   OTP VERIFICATION
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface OtpVerificationProps {

  mobileNumber?: string;

  otpStatus?: string;

  attemptsRemaining?: number;

  expiresIn?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function OtpVerification({

  mobileNumber = "--",

  otpStatus = "Pending",

  attemptsRemaining = 3,

  expiresIn = "02:00",

}: OtpVerificationProps) {

  return (

    <SummaryCard title="OTP Verification">

      <span>

        Mobile :
        <strong> {mobileNumber}</strong>

      </span>

      <span>

        Status :
        <strong> {otpStatus}</strong>

      </span>

      <span>

        Attempts Remaining :
        <strong> {attemptsRemaining}</strong>

      </span>

      <span>

        Expires In :
        <strong> {expiresIn}</strong>

      </span>

    </SummaryCard>

  );

}
