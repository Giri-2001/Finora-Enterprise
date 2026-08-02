/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER WIZARD
   STEP 6 - REVIEW STUDIO
=========================================================== */

import StudioLayout from "../../../common/layout/StudioLayout";
import TwoColumnStudio from "../../../common/layout/TwoColumnStudio";

import ReviewHeader from "../../review/ReviewHeader";
import CustomerSummary from "../../review/CustomerSummary";
import ValidationStatus from "../../review/ValidationStatus";
import ReviewChecklist from "../../review/ReviewChecklist";
import ReviewActions from "../../review/ReviewActions";
import ReviewDraftStatus from "../../review/ReviewDraftStatus";

export default function Step6Review() {

  return (

    <StudioLayout>

      <ReviewHeader />

      <TwoColumnStudio

        left={

          <>

            <CustomerSummary

              customerId=""

              customerName=""

              phoneNumber=""

              kycVerified={false}

            />

            <ValidationStatus

              identityComplete={false}

              addressComplete={false}

              kycVerified={false}

              nomineeAdded={false}

            />

            <ReviewChecklist />

          </>

        }

        right={

          <>

            <ReviewActions

              onSave={() => {}}

              onEdit={() => {}}

              onCancel={() => {}}

            />

            <ReviewDraftStatus

              isDraftSaved={false}

            />

          </>

        }

      />

    </StudioLayout>

  );

}
