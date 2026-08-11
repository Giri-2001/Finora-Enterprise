// ============================================================
// FINORA ENTERPRISE V2
//
// DISBURSEMENT STUDIO
// DISBURSEMENT DRAFT STATUS
//
// RESPONSIBILITY:
// - Display Disbursement draft state
// - Display last saved / updated timestamp
// - Presentation only
// - No persistence
// - No storage access
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import StudioDraftStatus
  from "../../common/studio/StudioDraftStatus";

// ============================================================
// TYPES
// ============================================================

interface DisbursementDraftStatusProps {

  savedAt?: string;

  status?: "Draft" | "Completed";

}

// ============================================================
// COMPONENT
// ============================================================

export default function DisbursementDraftStatus({

  savedAt = "Not Saved",

  status = "Draft",

}: DisbursementDraftStatusProps) {

  return (

    <StudioDraftStatus

      title="Disbursement Draft"

      status={status}

      updatedAt={savedAt}

    />

  );

}

// ============================================================
// END
// ============================================================
