/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   DASHBOARD FILTERS
=========================================================== */

import { useState } from "react";

import SummaryCard from "../../common/cards/SummaryCard";

import {
  FinoraCalendar,
  FormField,
  SelectInput,
} from "../../common";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function DashboardFilters() {

  const [dateRange, setDateRange] =
    useState({
      from: "",
      to: "",
    });

  return (

    <SummaryCard title="Dashboard Filters">

      <FormField
        label="Date Range"
        required
      >
        <FinoraCalendar
          mode="range"
          value={dateRange}
          onChange={setDateRange}
          fromLabel="From"
          toLabel="To"
          placeholder="DD/MM/YYYY"
          ariaLabel="Dashboard Date Range"
          showDuration
        />
      </FormField>

      <FormField
        label="Report Type"
      >
        <SelectInput
          options={[
            {
              label: "Daily",
              value: "daily",
            },
            {
              label: "Weekly",
              value: "weekly",
            },
            {
              label: "Monthly",
              value: "monthly",
            },
            {
              label: "Yearly",
              value: "yearly",
            },
          ]}
        />
      </FormField>

      <FormField
        label="Branch"
      >
        <SelectInput
          options={[
            {
              label: "All Branches",
              value: "all",
            },
          ]}
        />
      </FormField>

    </SummaryCard>

  );

}
