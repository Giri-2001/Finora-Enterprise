/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER KYC DRAFT STATUS

   RESPONSIBILITY:
   - Draft status presentation

   STYLES:
   KYCDraftStatus.styles.ts
=========================================================== */

import {
  wrapperStyle,
  savedStyle,
  pendingStyle,
  infoStyle,
} from "./KYCDraftStatus.styles";

/* ===========================================================
   TYPES
=========================================================== */

interface KYCDraftStatusProps {
  isDraftSaved: boolean;
  lastSaved?: string;
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function KYCDraftStatus({
  isDraftSaved,
  lastSaved,
}: KYCDraftStatusProps) {
  return (
    <section style={wrapperStyle}>
      {/* =====================================================
          STATUS
      ===================================================== */}

      <div
        style={
          isDraftSaved
            ? savedStyle
            : pendingStyle
        }
      >
        {isDraftSaved
          ? "✓ KYC Saved"
          : "● Draft Pending"}
      </div>

      {/* =====================================================
          INFORMATION
      ===================================================== */}

      <div style={infoStyle}>
        {isDraftSaved
          ? "Customer KYC details have been saved."
          : "Customer KYC details are waiting to be saved."}
      </div>

      {/* =====================================================
          LAST SAVED
      ===================================================== */}

      {lastSaved && (
        <div style={infoStyle}>
          Last Saved : {lastSaved}
        </div>
      )}
    </section>
  );
}
