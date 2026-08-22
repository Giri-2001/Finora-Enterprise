/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER OCCUPATION PROFILE™
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";

import {
  BriefcaseBusiness,
  Building2,
  WalletCards,
  Clock3,
} from "lucide-react";


/* ===========================================================
   RESPONSIVE ENGINE
=========================================================== */

import {
  useOccupationResponsive,
} from "../../../utils/responsive/customers/occupation";


/* ===========================================================
   PRESENTATION STYLES
=========================================================== */

import {
  createOccupationCardRootStyle,
  createOccupationCardGridStyle,
  createOccupationCardFieldStyle,
  createOccupationCardLabelStyle,
  createOccupationCardInputWrapperStyle,
  createOccupationCardInputStyle,
  createOccupationCardIconStyle,
  createOccupationCardIconInputStyle,
} from "./OccupationCard.styles";


/* ===========================================================
   TYPES
=========================================================== */

export interface OccupationData {

  occupation:
    string;

  workPlace:
    string;

  monthlyIncome:
    string;

  experience:
    string;

}


interface OccupationCardProps {

  value:
    OccupationData;

  onChange: (
    field:
      keyof OccupationData,
    value:
      string,
  ) => void;

}


/* ===========================================================
   COMPONENT
=========================================================== */

export default function OccupationCard({

  value,

  onChange,

}: OccupationCardProps) {


  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const {
    occupationTokens,
  } =
    useOccupationResponsive();


  /* =========================================================
     STYLES
  ========================================================= */

  const rootStyle:
    CSSProperties =
    createOccupationCardRootStyle();


  const gridStyle:
    CSSProperties =
    createOccupationCardGridStyle(
      occupationTokens,
    );


  const fieldStyle:
    CSSProperties =
    createOccupationCardFieldStyle(
      occupationTokens,
    );


  const labelStyle:
    CSSProperties =
    createOccupationCardLabelStyle(
      occupationTokens,
    );


  const inputWrapperStyle:
    CSSProperties =
    createOccupationCardInputWrapperStyle();


  const inputStyle:
  CSSProperties =
  createOccupationCardIconInputStyle(
    occupationTokens,
  );


  const iconStyle:
    CSSProperties =
    createOccupationCardIconStyle(
      occupationTokens,
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
            Occupation
          </label>


          <div
            style={
              inputWrapperStyle
            }
          >

            <BriefcaseBusiness
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
                value.occupation
              }
              placeholder="Enter occupation"
              onChange={
                (event) =>
                  onChange(
                    "occupation",
                    event.target.value,
                  )
              }
              aria-label="Occupation"
            />

          </div>

        </div>


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
            Workplace / Business
          </label>


          <div
            style={
              inputWrapperStyle
            }
          >

            <Building2
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
                value.workPlace
              }
              placeholder="Enter workplace or business"
              onChange={
                (event) =>
                  onChange(
                    "workPlace",
                    event.target.value,
                  )
              }
              aria-label="Workplace or Business"
            />

          </div>

        </div>


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
            Monthly Income
          </label>


          <div
            style={
              inputWrapperStyle
            }
          >

            <WalletCards
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
                value.monthlyIncome
              }
              placeholder="Enter monthly income"
              inputMode="numeric"
              onChange={
                (event) =>
                  onChange(
                    "monthlyIncome",
                    event.target.value,
                  )
              }
              aria-label="Monthly Income"
            />

          </div>

        </div>


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
            Work Experience
          </label>


          <div
            style={
              inputWrapperStyle
            }
          >

            <Clock3
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
                value.experience
              }
              placeholder="Years of experience"
              inputMode="decimal"
              onChange={
                (event) =>
                  onChange(
                    "experience",
                    event.target.value,
                  )
              }
              aria-label="Work Experience"
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