/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

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
        <li>
          Collection details verified
        </li>

        <li>
          Payment information confirmed
        </li>

        <li>
          Receipt generated successfully
        </li>

        <li>
          Settlement verified
        </li>

        <li>
          Outstanding balance reviewed
        </li>

        <li>
          Collection ready for completion
        </li>
      </ul>
    </SummaryCard>
  );
}
