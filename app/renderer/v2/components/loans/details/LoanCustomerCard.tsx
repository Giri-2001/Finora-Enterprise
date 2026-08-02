/* ===========================================================
   FINORA ENTERPRISE V2
   LOAN DETAILS STUDIO
   LOAN CUSTOMER CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface LoanCustomerCardProps {

  customerName?: string;

  customerId?: string;

  phoneNumber?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function LoanCustomerCard({

  customerName = "Select Customer",

  customerId = "--",

  phoneNumber = "--",

}: LoanCustomerCardProps) {

  return (

    <SummaryCard title="Customer Information">

      <strong>{customerName}</strong>

      <span>Customer ID : {customerId}</span>

      <span>Phone : {phoneNumber}</span>

    </SummaryCard>

  );

}
