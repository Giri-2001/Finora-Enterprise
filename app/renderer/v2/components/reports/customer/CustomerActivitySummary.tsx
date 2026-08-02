/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   CUSTOMER REPORTS STUDIO
   CUSTOMER ACTIVITY SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface CustomerActivitySummaryProps {

  totalCustomers?: number;

  activeCustomers?: number;

  inactiveCustomers?: number;

  newCustomers?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerActivitySummary({

  totalCustomers = 0,

  activeCustomers = 0,

  inactiveCustomers = 0,

  newCustomers = 0,

}: CustomerActivitySummaryProps) {

  return (

    <SummaryCard title="Customer Activity Summary">

      <span>

        Total Customers :
        <strong> {totalCustomers}</strong>

      </span>

      <span>

        Active Customers :
        <strong> {activeCustomers}</strong>

      </span>

      <span>

        Inactive Customers :
        <strong> {inactiveCustomers}</strong>

      </span>

      <span>

        New Customers :
        <strong> {newCustomers}</strong>

      </span>

    </SummaryCard>

  );

}
