/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER WIZARD
   STEP 3 - ADDRESS STUDIO
=========================================================== */

import StudioLayout from "../../../common/layout/StudioLayout";
import TwoColumnStudio from "../../../common/layout/TwoColumnStudio";

import AddressHeader from "../../address/AddressHeader";
import AddressForm, { type AddressFormData } from "../../address/AddressForm";
import AddressMapCard from "../../address/AddressMapCard";
import AddressProofCard from "../../address/AddressProofCard";
import AddressPreviewCard from "../../address/AddressPreviewCard";
import AddressDraftStatus from "../../address/AddressDraftStatus";

export default function Step3Address() {

  const address: AddressFormData = {

    currentAddress: "",

    permanentAddress: "",

    city: "",

    district: "",

    state: "",

    pinCode: "",

  };

  return (

    <StudioLayout>

      <AddressHeader />

      <TwoColumnStudio

        left={

          <>

            <AddressForm

              value={address}

              onChange={() => {}}

            />

            <AddressMapCard />

            <AddressProofCard />

          </>

        }

        right={

          <>

            <AddressPreviewCard

              value={{

                customerName: "",

                currentAddress: address.currentAddress,

                city: address.city,

                state: address.state,

                pinCode: address.pinCode,

              }}

            />

            <AddressDraftStatus

              isDraftSaved={false}

            />

          </>

        }

      />

    </StudioLayout>

  );

}
