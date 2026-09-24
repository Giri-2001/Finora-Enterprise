/* ===========================================================
FINORA ENTERPRISE V2
DISBURSEMENT STUDIO
HEADER
=========================================================== */

import StudioHeader from "../../common/studio/StudioHeader";

import { useResponsive } from "../../../utils/responsive";

/* ===========================================================
COMPONENT
=========================================================== */

export default function DisbursementHeader() {
  const { tokens } = useResponsive();

  const isMobile = tokens.meta.viewport === "mobile";
  return (
    <StudioHeader
      title="Disbursement Studio"
      subtitle="Configure loan disbursement, payment mode and release details."
      variant="enterprise"
            titleTextStyle={{
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        fontSize: isMobile ? "19px" : "21px",
        textAlign: isMobile ? "center" : undefined,
        width: isMobile ? "100%" : undefined,
      }}
            subtitleTextStyle={{
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        fontSize: "13px",
        textAlign: isMobile ? "center" : undefined,
        lineHeight: isMobile ? 1.2 : undefined,
        width: isMobile ? "100%" : undefined,
      }}
    />
  );
}

/* ===========================================================
END
=========================================================== */
