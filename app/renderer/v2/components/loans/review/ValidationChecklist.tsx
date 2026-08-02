/* ===========================================================
   FINORA ENTERPRISE V2
   REVIEW STUDIO
   VALIDATION CHECKLIST
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ValidationChecklist() {

  return (

    <SummaryCard title="Validation Checklist">

      <ul
        style={{
          margin: 0,
          paddingLeft: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <li>Customer information completed</li>

        <li>Finance configuration verified</li>

        <li>Repayment schedule generated</li>

        <li>Guarantor details verified</li>

        <li>Disbursement details confirmed</li>

        <li>Loan ready for approval</li>

      </ul>

    </SummaryCard>

  );

}
