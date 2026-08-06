/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   COLLECTION DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

import {
  useCollectionController,
} from "../controller";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CollectionDraftStatus() {
  const {
    reviewData,
  } = useCollectionController();

  return (
    <StudioDraftStatus
      title="Collection Draft"
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
