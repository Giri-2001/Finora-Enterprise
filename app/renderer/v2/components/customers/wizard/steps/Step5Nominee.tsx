/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER WIZARD
   STEP 5 - NOMINEE STUDIO
=========================================================== */

import StudioLayout from "../../../common/layout/StudioLayout";
import TwoColumnStudio from "../../../common/layout/TwoColumnStudio";

import NomineeHeader from "../../nominee/NomineeHeader";
import NomineeForm, {
  type NomineeFormData,
} from "../../nominee/NomineeForm";
import RelationshipSelector from "../../nominee/RelationshipSelector";
import NomineePreviewCard from "../../nominee/NomineePreviewCard";
import NomineeSummaryCard from "../../nominee/NomineeSummaryCard";
import NomineeDraftStatus from "../../nominee/NomineeDraftStatus";

export default function Step5Nominee() {

  const nominee: NomineeFormData = {

    nomineeCustomerId: "",

    nomineeName: "",

    relationship: "",

    phoneNumber: "",

  };

  return (

    <StudioLayout>

      <NomineeHeader />

      <TwoColumnStudio

        left={

          <>

            <NomineeForm

              value={nominee}

              onChange={() => {}}

            />

            <RelationshipSelector

              value={nominee.relationship}

              onChange={() => {}}

            />

          </>

        }

        right={

          <>

            <NomineePreviewCard

              value={{

                customerName: "",

                nomineeCustomerId: nominee.nomineeCustomerId,

                nomineeName: nominee.nomineeName,

                relationship: nominee.relationship,

                phoneNumber: nominee.phoneNumber,

              }}

            />

            <NomineeSummaryCard />

            <NomineeDraftStatus

              isDraftSaved={false}

            />

          </>

        }

      />

    </StudioLayout>

  );

}
