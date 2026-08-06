/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   SETTLEMENT DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

import {
  useCollectionController,
} from "../controller";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function SettlementDraftStatus() {
  const {
    reviewData,
  } = useCollectionController();

  return (
    <StudioDraftStatus
      title="Settlement Draft"
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
