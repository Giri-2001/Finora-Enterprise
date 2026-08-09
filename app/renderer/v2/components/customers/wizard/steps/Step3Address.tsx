/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 3 — ADDRESS STUDIO™

   Version     : 2.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   Responsibility:

   - Customer address state
   - Current address
   - Permanent address
   - Location details
   - Live address preview
   - Address verification
   - Future GIS status
   - Live wizard synchronization
=========================================================== */

import {
  useState,
} from "react";

import AddressForm, {
  type AddressFormData,
} from "../../address/AddressForm";

import AddressMapCard
  from "../../address/AddressMapCard";

import AddressProofCard
  from "../../address/AddressProofCard";

import AddressPreviewCard
  from "../../address/AddressPreviewCard";

import type {
  CustomerWizardData,
} from "../CustomerWizard";

import {
  pageStyle,
  contentStyle,
  sectionStyle,
  sectionHeaderStyle,
  sectionIconStyle,
  sectionTitleStyle,
  sectionSubtitleStyle,
  fieldAreaStyle,
  secondaryGridStyle,
  secondaryCardStyle,
} from "./Step3Address.styles";

/* ===========================================================
   TYPES
=========================================================== */

interface Step3AddressProps {
  updateWizardData: (
    data: Partial<CustomerWizardData>,
  ) => void;

  wizardData?: CustomerWizardData;
}

/* ===========================================================
   DEFAULT STATE
=========================================================== */

const DEFAULT_ADDRESS: AddressFormData = {
  currentAddress: "",

  permanentAddress: "",

  city: "",

  district: "",

  state: "",

  pinCode: "",
};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function Step3Address({
  updateWizardData,
  wizardData,
}: Step3AddressProps) {

  /* =========================================================
     ADDRESS STATE
  ========================================================= */

  const [
    address,
    setAddress,
  ] = useState<AddressFormData>(
    DEFAULT_ADDRESS,
  );

  /* =========================================================
     ADDRESS FIELD UPDATE
  ========================================================= */

  function updateAddressField(
    field: keyof AddressFormData,
    value: string,
  ): void {

    setAddress(
      (previous) => ({
        ...previous,

        [field]: value,
      }),
    );

    updateWizardData({
      [field]: value,
    } as Partial<CustomerWizardData>);
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <section
      style={pageStyle}
    >

      {/* =================================================
          MAIN STEP CONTENT
      ================================================= */}

      <div
        style={contentStyle}
      >

        {/* =================================================
            SECTION 1 — ADDRESS INFORMATION
        ================================================= */}

        <section
          style={sectionStyle}
        >

          {/* ===============================================
              SECTION HEADER
          =============================================== */}

          <header
            style={sectionHeaderStyle}
          >

            <div
              style={sectionIconStyle}
              aria-hidden="true"
            >
              📍
            </div>

            <div>

              <h2
                style={sectionTitleStyle}
              >
                1. Address Information
              </h2>

              <p
                style={sectionSubtitleStyle}
              >
                Capture the customer's residential and permanent address.
              </p>

            </div>

          </header>

          {/* ===============================================
              ADDRESS FORM
          =============================================== */}

          <div
            style={fieldAreaStyle}
          >

            <AddressForm

              value={
                address
              }

              onChange={
                updateAddressField
              }

            />

          </div>

        </section>

        {/* =================================================
            SECTION 2 — ADDRESS VERIFICATION & PREVIEW
        ================================================= */}

        <section
          style={sectionStyle}
        >

          {/* ===============================================
              SECTION HEADER
          =============================================== */}

          <header
            style={sectionHeaderStyle}
          >

            <div
              style={sectionIconStyle}
              aria-hidden="true"
            >
              ✓
            </div>

            <div>

              <h2
                style={sectionTitleStyle}
              >
                2. Address Verification
              </h2>

              <p
                style={sectionSubtitleStyle}
              >
                Verification status, location readiness and live address preview.
              </p>

            </div>

          </header>

          {/* ===============================================
              VERIFICATION CARDS
          =============================================== */}

          <div
            style={{
              ...fieldAreaStyle,
              justifyContent: "center",
            }}
          >

            <div
              style={{
                ...secondaryGridStyle,

                gridTemplateColumns:
                  "repeat(3,minmax(0,1fr))",

                alignItems:
                  "stretch",
              }}
            >

              {/* =========================================
                  ADDRESS PROOF
              ========================================= */}

              <div
                style={secondaryCardStyle}
              >

                <AddressProofCard

                  documentType="Not Provided"

                  verified={false}

                />

              </div>

              {/* =========================================
                  GIS / LOCATION
              ========================================= */}

              <div
                style={secondaryCardStyle}
              >

                <AddressMapCard />

              </div>

              {/* =========================================
                  LIVE PREVIEW
              ========================================= */}

              <div
                style={secondaryCardStyle}
              >

                <AddressPreviewCard

                  value={{
                    customerName:
                      wizardData?.fullName ||
                      "--",

                    currentAddress:
                      address.currentAddress,

                    city:
                      address.city,

                    state:
                      address.state,

                    pinCode:
                      address.pinCode,
                  }}

                />

              </div>

            </div>

          </div>

        </section>

      </div>

    </section>
  );
}
