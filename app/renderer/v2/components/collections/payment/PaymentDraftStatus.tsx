/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   PAYMENT DRAFT STATUS
=========================================================== */

import StudioDraftStatus from "../../common/studio/StudioDraftStatus";

import {
  useCollectionController,
} from "../controller";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PaymentDraftStatus() {
  const {
    reviewData,
  } = useCollectionController();

  return (
    <StudioDraftStatus
      title="Payment Draft"
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
