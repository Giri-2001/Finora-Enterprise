/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   DASHBOARD FILTERS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  FormField,
  SelectInput,
  TextInput,
} from "../../common";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function DashboardFilters() {

  return (

    <SummaryCard title="Dashboard Filters">

      <FormField
        label="Date Range"
        required
      >
        <TextInput
          type="date"
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
