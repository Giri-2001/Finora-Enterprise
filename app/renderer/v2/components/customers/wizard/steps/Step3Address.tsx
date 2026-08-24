/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 3 — ADDRESS STUDIO™

   Version     : 3.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:

   - Customer address state
   - Current address
   - Permanent address
   - City / Village
   - District
   - State
   - PIN Code
   - Live address preview
   - Live wizard synchronization

   IMPORTANT:

   - Address responsive geometry is resolved by the
     Responsive Engine.
   - No viewport detection.
   - No media queries.
   - No component-level responsive sizing.
   - No Address Proof / Map / GIS / Verification UI.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useEffect,
  useMemo,
  useState,
} from "react";


import {
  CheckCircle2,
  MapPin,
} from "lucide-react";


import AddressForm, {
  type AddressFormData,
} from "../../address/AddressForm";


import AddressPreviewCard
  from "../../address/AddressPreviewCard";


import type {
  CustomerWizardData,
} from "../CustomerWizard";


import {
  useResponsive,
} from "../../../../utils/responsive";


import {
  useTheme,
} from "../../../../themes/provider";


import {
  getAddressTokens,
} from "../../../../utils/responsive/customers/address/address.tokens";


import {
  createStep3AddressStyles,
  createStep3ThemeVariables,
} from "./Step3Address.styles";


/* ===========================================================
   TYPES
=========================================================== */

interface Step3AddressProps {

  updateWizardData: (
    data:
      Partial<CustomerWizardData>,
  ) => void;

  wizardData?:
    CustomerWizardData;

}


/* ===========================================================
   DEFAULT STATE
=========================================================== */

const DEFAULT_ADDRESS:
  AddressFormData = {

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
 * Resolve the legacy canonical address field.
 *
 * The wizard historically stored the primary address
 * inside `address`. The new address model keeps the
 * current and permanent addresses separately.
 */
function buildCanonicalAddress(
  data:
    AddressFormData,
):
  string {

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
     RESPONSIVE ENGINE
  ========================================================= */

  const {
    tokens,
  } =
    useResponsive();


  const addressTokens =
    useMemo(
      () =>
        getAddressTokens(
          tokens.meta.viewport,
        ),
      [
        tokens.meta.viewport,
      ],
    );


  /* =========================================================
     THEME ENGINE
  ========================================================= */

  const {
    theme,
  } =
    useTheme();


  /* =========================================================
     STYLE ENGINE
  ========================================================= */

  const styles =
    useMemo(
      () =>
        createStep3AddressStyles(
          addressTokens,
          theme,
        ),
      [
        addressTokens,
        theme,
      ],
    );


  const themeVariables =
    useMemo(
      () =>
        createStep3ThemeVariables(
          theme,
        ),
      [
        theme,
      ],
    );


  /* =========================================================
     ADDRESS STATE
  ========================================================= */

  const [
    address,
    setAddress,
  ] =
    useState<AddressFormData>(
      DEFAULT_ADDRESS,
    );


  /* =========================================================
     RESTORE WIZARD ADDRESS
  ========================================================= */

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
     RESTORE LEGACY CANONICAL ADDRESS
  ========================================================= */

  useEffect(() => {

    const savedAddress =
      wizardData?.address ??
      "";


    if (!savedAddress) {

      return;

    }


    setAddress(
      (
        previous,
      ) => {

        if (
          previous.currentAddress ===
          savedAddress
        ) {

          return previous;

        }


        return {

          ...previous,

          currentAddress:
            savedAddress,

        };

      },
    );

  }, [
    wizardData?.address,
  ]);


  /* =========================================================
     ADDRESS FIELD UPDATE
  ========================================================= */

  function updateAddressField(
    field:
      keyof AddressFormData,
    value:
      string,
  ):
    void {

    setAddress(
      (
        previous,
      ) => {

        const nextAddress:
          AddressFormData = {

          ...previous,

          [field]:
            value,

        };


        updateWizardData({

          [field]:
            value,

          address:
            buildCanonicalAddress(
              nextAddress,
            ),

        } as Partial<CustomerWizardData>);


        return nextAddress;

      },
    );

  }


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <div
      style={{
        ...styles.pageStyle,
        ...themeVariables,
      }}
    >

      {/* =====================================================
          ADDRESS GLOBAL STYLES
      ===================================================== */}

      <style>
        {
          styles.addressGlobalStyle
        }
      </style>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div
        style={
          styles.contentStyle
        }
      >


        {/* ===================================================
            SECTION 1 — ADDRESS INFORMATION
        =================================================== */}

        <section
          style={
            styles.sectionStyle
          }
        >

          <header
            style={
              styles.sectionHeaderStyle
            }
          >

            <div
              style={
                styles.sectionIconStyle
              }

              aria-hidden="true"
            >

              <MapPin
                size={
                  addressTokens.sectionIconFontSize
                }

                strokeWidth={
                  1.9
                }
              />

            </div>


            <div
              style={{
                minWidth:
                  0,
              }}
            >

              <h2
                style={
                  styles.sectionTitleStyle
                }
              >
                Address Information
              </h2>


              <p
                style={
                  styles.sectionSubtitleStyle
                }
              >
                Capture the customer's residential and permanent address.
              </p>

            </div>

          </header>


          <div
            style={
              styles.fieldAreaStyle
            }
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


        {/* ===================================================
            SECTION 2 — LIVE ADDRESS PREVIEW
        =================================================== */}

        <section
          style={
            styles.sectionStyle
          }
        >

          <div
            style={{
              ...styles.fieldAreaStyle,

              justifyContent:
                "center",

              alignItems:
                "stretch",

            }}
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

        </section>


      </div>

    </div>

  );

}


/* ===========================================================
   END
=========================================================== */