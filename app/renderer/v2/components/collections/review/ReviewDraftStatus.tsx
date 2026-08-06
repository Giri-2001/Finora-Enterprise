/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   REVIEW DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

import {
  useCollectionController,
} from "../controller";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReviewDraftStatus() {
  const {
    reviewData,
  } = useCollectionController();

  return (
    <StudioDraftStatus
      title="Collection Review Draft"
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
