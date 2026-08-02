/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER WIZARD
   STEP 4 - KYC STUDIO
=========================================================== */

import StudioLayout from "../../../common/layout/StudioLayout";
import TwoColumnStudio from "../../../common/layout/TwoColumnStudio";

import KYCHeader from "../../kyc/KYCHeader";
import KYCForm, {
  type KYCFormData,
} from "../../kyc/KYCForm";
import DocumentUploader from "../../kyc/DocumentUploader";
import VerificationStatus from "../../kyc/VerificationStatus";
import KYCPreviewCard from "../../kyc/KYCPreviewCard";
import KYCDraftStatus from "../../kyc/KYCDraftStatus";

export default function Step4KYC() {

  const kyc: KYCFormData = {

    aadhaarNumber: "",

    panNumber: "",

    voterId: "",

    drivingLicense: "",

  };

  return (

    <StudioLayout>

      <KYCHeader />

      <TwoColumnStudio

        left={

          <>

            <KYCForm

              value={kyc}

              onChange={() => {}}

            />

            <DocumentUploader />

            <VerificationStatus />

          </>

        }

        right={

          <>

            <KYCPreviewCard

              value={{

                customerName: "",

                aadhaarNumber: kyc.aadhaarNumber,

                panNumber: kyc.panNumber,

                verified: false,

              }}

            />

            <KYCDraftStatus

              isDraftSaved={false}

            />

          </>

        }

      />

    </StudioLayout>

  );

}
