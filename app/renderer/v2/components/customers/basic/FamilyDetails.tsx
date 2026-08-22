/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER FAMILY & EMERGENCY™

   Version     : 3.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:

   - Match Step 1 / BasicForm field presentation
   - Two-column family layout
   - Same label sizing
   - Same input sizing
   - Same placeholder/value sizing
   - Same field spacing
   - Same icon sizing
   - Responsive values consumed from BasicForm Responsive Engine
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


import {
  UsersRound,
  UserRound,
  Phone,
} from "lucide-react";


/* ===========================================================
   RESPONSIVE ENGINE
=========================================================== */

import {
  useBasicFormResponsive,
} from "../../../utils/responsive/customers/basicform";




/* ===========================================================
   PRESENTATION STYLES
=========================================================== */

import {
  createFamilyDetailsRootStyle,
  createFamilyDetailsGridStyle,
  createFamilyDetailsFieldStyle,
  createFamilyDetailsLabelStyle,
  createFamilyDetailsInputWrapperStyle,
  createFamilyDetailsInputStyle,
  createFamilyDetailsIconStyle,
} from "./FamilyDetails.styles";


/* ===========================================================
   TYPES
=========================================================== */

export interface FamilyDetailsData {

  numberOfFamilyMembers:
    string;

  emergencyContactName:
    string;

  emergencyContactMobile:
    string;

}


interface FamilyDetailsProps {

  value:
    FamilyDetailsData;

  onChange: (
    field:
      keyof FamilyDetailsData,
    value:
      string,
  ) => void;

}


/* ===========================================================
   COMPONENT
=========================================================== */

export default function FamilyDetails({

  value,

  onChange,

}: FamilyDetailsProps) {


  /* =========================================================
     RESPONSIVE ENGINE

     IMPORTANT:

     Family fields intentionally consume the SAME
     BasicFormResponsiveTokens used by Step 1.

     This guarantees:

     - exact label size
     - exact input size
     - exact spacing
     - exact responsive scaling
     - exact typography consistency
  ========================================================= */

  const {
    basicFormTokens,
  } =
    useBasicFormResponsive();


  /* =========================================================
     STYLES
  ========================================================= */

  const rootStyle:
    CSSProperties =
    createFamilyDetailsRootStyle();


  const gridStyle:
    CSSProperties =
    createFamilyDetailsGridStyle(
      basicFormTokens,
    );


  const fieldStyle:
    CSSProperties =
    createFamilyDetailsFieldStyle(
      basicFormTokens,
    );


  const labelStyle:
    CSSProperties =
    createFamilyDetailsLabelStyle(
      basicFormTokens,
    );


  const inputWrapperStyle:
    CSSProperties =
    createFamilyDetailsInputWrapperStyle();


  const inputStyle:
    CSSProperties =
    createFamilyDetailsInputStyle(
      basicFormTokens,
    );


  const iconStyle:
    CSSProperties =
    createFamilyDetailsIconStyle(
      basicFormTokens,
    );


  /* =========================================================
     UI
  ========================================================= */

  return (

    <section
      style={
        rootStyle
      }
    >

      <div
        style={
          gridStyle
        }
      >


        {/* =================================================
           NUMBER OF FAMILY MEMBERS
        ================================================= */}

        <div
          style={
            fieldStyle
          }
        >

          <label
            style={
              labelStyle
            }
          >
            Number of Family Members
          </label>


          <div
            style={
              inputWrapperStyle
            }
          >

            <UsersRound
              style={
                iconStyle
              }
              aria-hidden="true"
            />


            <input
              type="text"

              style={
                inputStyle
              }

              value={
                value.numberOfFamilyMembers
              }

              placeholder="Enter family members"

              inputMode="numeric"

              onChange={
                (event) =>
                  onChange(
                    "numberOfFamilyMembers",
                    event.target.value,
                  )
              }

              aria-label="Number of Family Members"

            />

          </div>

        </div>


        {/* =================================================
           EMERGENCY CONTACT NAME
        ================================================= */}

        <div
          style={
            fieldStyle
          }
        >

          <label
            style={
              labelStyle
            }
          >
            Emergency Contact Name
          </label>


          <div
            style={
              inputWrapperStyle
            }
          >

            <UserRound
              style={
                iconStyle
              }
              aria-hidden="true"
            />


            <input
              type="text"

              style={
                inputStyle
              }

              value={
                value.emergencyContactName
              }

              placeholder="Enter emergency contact"

              onChange={
                (event) =>
                  onChange(
                    "emergencyContactName",
                    event.target.value,
                  )
              }

              aria-label="Emergency Contact Name"

            />

          </div>

        </div>


        {/* =================================================
           EMERGENCY CONTACT MOBILE
        ================================================= */}

        <div
          style={
            fieldStyle
          }
        >

          <label
            style={
              labelStyle
            }
          >
            Emergency Contact Mobile
          </label>


          <div
            style={
              inputWrapperStyle
            }
          >

            <Phone
              style={
                iconStyle
              }
              aria-hidden="true"
            />


            <input
              type="text"

              style={
                inputStyle
              }

              value={
                value.emergencyContactMobile
              }

              placeholder="Enter mobile number"

              inputMode="tel"

              onChange={
                (event) =>
                  onChange(
                    "emergencyContactMobile",
                    event.target.value,
                  )
              }

              aria-label="Emergency Contact Mobile"

            />

          </div>

        </div>


      </div>

    </section>

  );

}


/* ===========================================================
   END
=========================================================== */