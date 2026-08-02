/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   PROFILE & SETTINGS STUDIO
   PROFILE INFORMATION CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ProfileInformationCardProps {

  customerName?: string;

  customerId?: string;

  mobileNumber?: string;

  emailAddress?: string;

  memberSince?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ProfileInformationCard({

  customerName = "--",

  customerId = "--",

  mobileNumber = "--",

  emailAddress = "--",

  memberSince = "--",

}: ProfileInformationCardProps) {

  return (

    <SummaryCard title="Profile Information">

      <span>

        Customer :
        <strong> {customerName}</strong>

      </span>

      <span>

        Customer ID :
        <strong> {customerId}</strong>

      </span>

      <span>

        Mobile :
        <strong> {mobileNumber}</strong>

      </span>

      <span>

        Email :
        <strong> {emailAddress}</strong>

      </span>

      <span>

        Member Since :
        <strong> {memberSince}</strong>

      </span>

    </SummaryCard>

  );

}
