/* ===========================================================
FINORA ENTERPRISE V2
DISBURSEMENT STUDIO
HEADER
=========================================================== */

import StudioHeader from "../../common/studio/StudioHeader";

/* ===========================================================
COMPONENT
=========================================================== */

export default function DisbursementHeader() {
  return (
    <StudioHeader
      title="Disbursement Studio"
      subtitle="Configure loan disbursement, payment mode and release details."
      variant="enterprise"
      titleTextStyle={{
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        fontSize: "21px",
      }}
      subtitleTextStyle={{
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        fontSize: "13px",
      }}
    />
  );
}

/* ===========================================================
END
=========================================================== */
