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
useEffect,
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

  currentAddress:
    "",

  permanentAddress:
    "",

  city:
    "",

  district:
    "",

  state:
    "",

  pinCode:
    "",
};

/* ===========================================================
HELPERS
=========================================================== */

/**
 * Builds the canonical address value used by the final
 * customer review layer.
 *
 * Structured address fields remain separately synchronized
 * with CustomerWizardData.
 *
 * `address` is the canonical legacy/review value required
 * by Step 6 validation and CustomerProfile creation.
 */
function buildCanonicalAddress(
  data: AddressFormData,
): string {

  return (
    data.currentAddress?.trim() ||
    data.permanentAddress?.trim() ||
    ""
  );
}

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

// =========================================================
// RESTORE WIZARD ADDRESS
//
// Step 3 unmounts when moving to another wizard step.
// Therefore the local AddressForm state must be rebuilt
// from the central CustomerWizardData when Step 3 mounts.
//
// CustomerWizardData is the temporary source of truth
// while the customer is still being created.
// =========================================================

useEffect(() => {

  if (!wizardData) {
    return;
  }

  setAddress({

    currentAddress:
      wizardData.currentAddress ??
      wizardData.address ??
      "",

    permanentAddress:
      wizardData.permanentAddress ??
      "",

    city:
      wizardData.city ??
      "",

    district:
      wizardData.district ??
      "",

    state:
      wizardData.state ??
      "",

    pinCode:
      wizardData.pinCode ??
      "",

  });

}, [
  wizardData,
]);

/* =========================================================
   RESTORE EXISTING WIZARD ADDRESS
========================================================= */

useEffect(() => {

  const savedAddress =
    wizardData?.address ?? "";

  if (!savedAddress) {
    return;
  }

  setAddress(
    (previous) => ({
      ...previous,

      currentAddress:
        savedAddress,
    }),
  );

}, [
  wizardData?.address,
]);

/* =========================================================
   ADDRESS FIELD UPDATE
========================================================= */

function updateAddressField(
  field: keyof AddressFormData,
  value: string,
): void {

  setAddress(
    (previous) => {

      const nextAddress: AddressFormData = {
        ...previous,

        [field]:
          value,
      };

      updateWizardData({
        [field]:
          value,

        address:
          nextAddress.currentAddress ??
          "",

      } as Partial<CustomerWizardData>);

      return nextAddress;
    },
  );
}

  /* =========================================================
  UI
  ========================================================= */

  return (

    <div
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

              justifyContent:
                "center",
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

                  verified={
                    false
                  }

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

    </div>

  );

}

/* ===========================================================
END
=========================================================== */
