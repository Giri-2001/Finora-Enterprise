/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   EMI SCHEDULE STUDIO
   PAYMENT CALENDAR CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface PaymentCalendarCardProps {

  currentMonth?: string;

  upcomingPayments?: number;

  completedPayments?: number;

  missedPayments?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PaymentCalendarCard({

  currentMonth = "--",

  upcomingPayments = 0,

  completedPayments = 0,

  missedPayments = 0,

}: PaymentCalendarCardProps) {

  return (

    <SummaryCard title="Payment Calendar">

      <span>

        Month :
        <strong> {currentMonth}</strong>

      </span>

      <span>

        Upcoming Payments :
        <strong> {upcomingPayments}</strong>

      </span>

      <span>

        Completed Payments :
        <strong> {completedPayments}</strong>

      </span>

      <span>

        Missed Payments :
        <strong> {missedPayments}</strong>

      </span>

    </SummaryCard>

  );

}
