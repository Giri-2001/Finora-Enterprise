// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTIONS ENGINE
//
// RECEIPT DRAFT STATUS
//
// RESPONSIBILITY
//
// - Display Receipt draft state
// - Display last saved / updated timestamp
// - Presentation only
// - No persistence
// - No storage access
// - No business logic
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import StudioDraftStatus
  from "../../common/studio/StudioDraftStatus";

// ============================================================
// TYPES
// ============================================================

interface ReceiptDraftStatusProps {
  savedAt?: string;

  status?: "Draft" | "Completed";
}

// ============================================================
// COMPONENT
// ============================================================

export default function ReceiptDraftStatus({
  savedAt = "Not Saved",

  status = "Draft",
}: ReceiptDraftStatusProps) {
  return (
    <StudioDraftStatus
      title="Receipt Draft"
      status={status}
      updatedAt={savedAt}
    />
  );
}

// ============================================================
// END
// ============================================================