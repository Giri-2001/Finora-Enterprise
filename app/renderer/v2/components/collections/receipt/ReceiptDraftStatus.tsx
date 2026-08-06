/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   RECEIPT DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

import {
  useCollectionController,
} from "../controller";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReceiptDraftStatus() {
  const {
    reviewData,
  } = useCollectionController();

  return (
    <StudioDraftStatus
      title="Receipt Draft"
      status={
        reviewData.status === "Approved"
          ? "Completed"
          : "Draft"
      }
      updatedAt={
        reviewData.updatedAt || "Not Saved"
      }
    />
  );
}
