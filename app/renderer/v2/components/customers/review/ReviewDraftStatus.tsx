/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER REVIEW DRAFT STATUS

   RESPONSIBILITY:
   - Draft status presentation
   - Saved / pending state
   - Last saved information

   BUSINESS LOGIC:
   - NONE

   STYLES:
   ReviewDraftStatus.styles.ts
=========================================================== */

import {
  wrapperStyle,
  badgeStyle,
  savedBadgeStyle,
  pendingBadgeStyle,
  infoStyle,
  lastSavedStyle,
} from "./ReviewDraftStatus.styles";

/* ===========================================================
   TYPES
=========================================================== */

interface ReviewDraftStatusProps {

  isDraftSaved: boolean;

  lastSaved?: string;
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReviewDraftStatus({

  isDraftSaved,

  lastSaved,

}: ReviewDraftStatusProps) {

  return (

    <section style={wrapperStyle}>

      {/* =====================================================
         STATUS BADGE
      ===================================================== */}

      <div
        style={{
          ...badgeStyle,

          ...(isDraftSaved
            ? savedBadgeStyle
            : pendingBadgeStyle),
        }}
      >
        {isDraftSaved
          ? "✓ Review Saved"
          : "● Draft Pending"}
      </div>

      {/* =====================================================
         STATUS INFORMATION
      ===================================================== */}

      <div style={infoStyle}>

        {isDraftSaved
          ? "Customer review has been saved successfully."
          : "Customer review is waiting to be saved."}

      </div>

      {/* =====================================================
         LAST SAVED
      ===================================================== */}

      {lastSaved && (

        <div style={lastSavedStyle}>

          Last Saved : {lastSaved}

        </div>

      )}

    </section>

  );

}
