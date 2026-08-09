/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER KYC VERIFICATION STATUS

   RESPONSIBILITY:
   - Verification status presentation

   STYLES:
   VerificationStatus.styles.ts
=========================================================== */

import {
  cardStyle,
  headingStyle,
  statusStyle,
  infoStyle,
} from "./VerificationStatus.styles";

/* ===========================================================
   TYPES
=========================================================== */

interface VerificationStatusProps {
  verified?: boolean;
  verifiedBy?: string;
  verifiedOn?: string;
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function VerificationStatus({
  verified,
  verifiedBy,
  verifiedOn,
}: VerificationStatusProps) {

  return (
    <section style={cardStyle}>

      <h3 style={headingStyle}>
        Verification Status
      </h3>

      <div style={statusStyle(verified)}>
        {verified
          ? "✓ Verified"
          : "⏳ Pending Verification"}
      </div>

      <div style={infoStyle}>
        Verified By : {verifiedBy || "--"}
      </div>

      <div style={infoStyle}>
        Verified On : {verifiedOn || "--"}
      </div>

    </section>
  );
}
