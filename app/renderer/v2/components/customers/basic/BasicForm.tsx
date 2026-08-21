/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER BASIC INFORMATION™

   STEP 2 — PERSONAL INFORMATION

   Version     : 3.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:
   - Controlled customer personal information fields
   - Education
   - Marital status
   - Father / Spouse name
   - Spouse name

   ARCHITECTURE:
   - Responsive engine owns responsive token resolution
   - Presentation styles own visual presentation
   - Lucide owns field icons
   - No emojis
   - No viewport detection
   - No business logic
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


import {
  GraduationCap,
  HeartHandshake,
  UserRound,
  UsersRound,
} from "lucide-react";


/* ===========================================================
   RESPONSIVE ENGINE
=========================================================== */

import {
  useBasicFormResponsive,
  createBasicFormPageStyle,
} from "../../../utils/responsive/customers/basicform";


/* ===========================================================
   PRESENTATION STYLES
=========================================================== */

import {
  createBasicFormRootStyle,
  createBasicFormLabelStyle,
  createBasicFormRequiredStyle,
  createBasicFormInputStyle,
  createBasicFormSelectStyle,
  createBasicFormOptionStyle,
  createBasicFormIconStyle,
  createBasicFormInputWrapperStyle,
  createBasicFormIconInputStyle,
} from "./BasicForm.styles";


/* ===========================================================
   TYPES
=========================================================== */

export interface BasicFormData {

  fatherOrSpouseName:
    string;

  education:
    string;

  maritalStatus:
    string;

  spouseName:
    string;

}


interface BasicFormProps {

  value:
    BasicFormData;

  onChange: (
    field:
      keyof BasicFormData,
    value:
      string,
  ) => void;

}


/* ===========================================================
   LABEL
=========================================================== */

function FieldLabel({

  children,

  required = false,

}: {

  children:
    string;

  required?:
    boolean;

}) {

  const {
    basicFormTokens,
  } =
    useBasicFormResponsive();


  const labelStyle =
    createBasicFormLabelStyle(
      basicFormTokens,
    );


  const requiredStyle =
    createBasicFormRequiredStyle();


  return (

    <span
      style={
        labelStyle
      }
    >

      {children}

      {required && (

        <span
          style={
            requiredStyle
          }
        >
          *
        </span>

      )}

    </span>

  );

}


/* ===========================================================
   COMPONENT
=========================================================== */

export default function BasicForm({

  value,

  onChange,

}: BasicFormProps) {


  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const {
    basicFormTokens,
  } =
    useBasicFormResponsive();


  /* =========================================================
     ROOT STYLE
  ========================================================= */

  const rootStyle:
    CSSProperties =
    createBasicFormRootStyle(
      basicFormTokens,
    );


  /* =========================================================
     PAGE STYLE
  ========================================================= */

  const pageStyle:
    CSSProperties =
    createBasicFormPageStyle(
      basicFormTokens,
    );


  /* =========================================================
     FIELD GRID
  ========================================================= */

  const fieldGridStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    display:
      "grid",

    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",

    columnGap:
      `${basicFormTokens.columnGap}px`,

    boxSizing:
      "border-box",

  };


  /* =========================================================
     FIELD STYLE
  ========================================================= */

  const fieldStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      `${basicFormTokens.fieldGap}px`,

    boxSizing:
      "border-box",

  };


  /* =========================================================
     INPUT STYLE
  ========================================================= */

  const inputStyle:
    CSSProperties =
    createBasicFormInputStyle(
      basicFormTokens,
    );


  /* =========================================================
     SELECT STYLE
  ========================================================= */

  const selectStyle:
    CSSProperties =
    createBasicFormSelectStyle(
      basicFormTokens,
    );


  /* =========================================================
     OPTION STYLE
  ========================================================= */

  const optionStyle:
    CSSProperties =
    createBasicFormOptionStyle(
      basicFormTokens,
    );


  /* =========================================================
     ICON STYLE
  ========================================================= */

  const iconStyle:
    CSSProperties =
    createBasicFormIconStyle(
      basicFormTokens,
    );


  /* =========================================================
     INPUT WRAPPER
  ========================================================= */

  const inputWrapperStyle:
    CSSProperties =
    createBasicFormInputWrapperStyle();


  /* =========================================================
     ICON INPUT
  ========================================================= */

  const iconInputStyle:
    CSSProperties =
    createBasicFormIconInputStyle(
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
          pageStyle
        }
      >

        <div
          style={
            fieldGridStyle
          }
        >

          {/* =================================================
              FATHER / SPOUSE
          ================================================= */}

          <div
            style={
              fieldStyle
            }
          >

            <FieldLabel
              required
            >
              Father / Spouse Name
            </FieldLabel>


            <div
              style={
                inputWrapperStyle
              }
            >

              <UsersRound
                style={{
                  ...iconStyle,

                  position:
                    "absolute",

                  left:
                    `${basicFormTokens.inputPaddingX}px`,

                  top:
                    "50%",

                  transform:
                    "translateY(-50%)",

                  pointerEvents:
                    "none",
                }}
                aria-hidden="true"
              />


              <input
                style={
                  iconInputStyle
                }

                value={
                  value.fatherOrSpouseName
                }

                placeholder=
                  "Enter father or spouse name"

                onChange={(
                  event,
                ) =>
                  onChange(
                    "fatherOrSpouseName",
                    event.target.value,
                  )
                }

                aria-label=
                  "Father or Spouse Name"
              />

            </div>

          </div>


          {/* =================================================
              EDUCATION
          ================================================= */}

          <div
            style={
              fieldStyle
            }
          >

            <FieldLabel>
              Education
            </FieldLabel>


            <div
              style={
                inputWrapperStyle
              }
            >

              <GraduationCap
                style={{
                  ...iconStyle,

                  position:
                    "absolute",

                  left:
                    `${basicFormTokens.inputPaddingX}px`,

                  top:
                    "50%",

                  transform:
                    "translateY(-50%)",

                  pointerEvents:
                    "none",
                }}
                aria-hidden="true"
              />


              <select
                style={{
                  ...selectStyle,

                  paddingLeft:
                    `${basicFormTokens.inputPaddingX + basicFormTokens.iconSize + basicFormTokens.iconOffset}px`,
                }}

                value={
                  value.education
                }

                onChange={(
                  event,
                ) =>
                  onChange(
                    "education",
                    event.target.value,
                  )
                }

                aria-label=
                  "Education"
              >

                <option
                  value=""
                  style={
                    optionStyle
                  }
                >
                  Select education
                </option>


                <option
                  value="No Formal Education"
                  style={
                    optionStyle
                  }
                >
                  No Formal Education
                </option>


                <option
                  value="Primary"
                  style={
                    optionStyle
                  }
                >
                  Primary
                </option>


                <option
                  value="Secondary"
                  style={
                    optionStyle
                  }
                >
                  Secondary
                </option>


                <option
                  value="Intermediate"
                  style={
                    optionStyle
                  }
                >
                  Intermediate
                </option>


                <option
                  value="Diploma"
                  style={
                    optionStyle
                  }
                >
                  Diploma
                </option>


                <option
                  value="Graduate"
                  style={
                    optionStyle
                  }
                >
                  Graduate
                </option>


                <option
                  value="Post Graduate"
                  style={
                    optionStyle
                  }
                >
                  Post Graduate
                </option>


                <option
                  value="Doctorate"
                  style={
                    optionStyle
                  }
                >
                  Doctorate
                </option>


                <option
                  value="Other"
                  style={
                    optionStyle
                  }
                >
                  Other
                </option>

              </select>

            </div>

          </div>


          {/* =================================================
              MARITAL STATUS
          ================================================= */}

          <div
            style={
              fieldStyle
            }
          >

            <FieldLabel>
              Marital Status
            </FieldLabel>


            <div
              style={
                inputWrapperStyle
              }
            >

              <HeartHandshake
                style={{
                  ...iconStyle,

                  position:
                    "absolute",

                  left:
                    `${basicFormTokens.inputPaddingX}px`,

                  top:
                    "50%",

                  transform:
                    "translateY(-50%)",

                  pointerEvents:
                    "none",
                }}
                aria-hidden="true"
              />


              <select
                style={{
                  ...selectStyle,

                  paddingLeft:
                    `${basicFormTokens.inputPaddingX + basicFormTokens.iconSize + basicFormTokens.iconOffset}px`,
                }}

                value={
                  value.maritalStatus
                }

                onChange={(
                  event,
                ) =>
                  onChange(
                    "maritalStatus",
                    event.target.value,
                  )
                }

                aria-label=
                  "Marital Status"
              >

                <option
                  value=""
                  style={
                    optionStyle
                  }
                >
                  Select marital status
                </option>


                <option
                  value="Single"
                  style={
                    optionStyle
                  }
                >
                  Single
                </option>


                <option
                  value="Married"
                  style={
                    optionStyle
                  }
                >
                  Married
                </option>


                <option
                  value="Widowed"
                  style={
                    optionStyle
                  }
                >
                  Widowed
                </option>


                <option
                  value="Divorced"
                  style={
                    optionStyle
                  }
                >
                  Divorced
                </option>


                <option
                  value="Separated"
                  style={
                    optionStyle
                  }
                >
                  Separated
                </option>

              </select>

            </div>

          </div>


          {/* =================================================
              SPOUSE NAME
          ================================================= */}

          <div
            style={
              fieldStyle
            }
          >

            <FieldLabel>
              Spouse Name
            </FieldLabel>


            <div
              style={
                inputWrapperStyle
              }
            >

              <UserRound
                style={{
                  ...iconStyle,

                  position:
                    "absolute",

                  left:
                    `${basicFormTokens.inputPaddingX}px`,

                  top:
                    "50%",

                  transform:
                    "translateY(-50%)",

                  pointerEvents:
                    "none",
                }}
                aria-hidden="true"
              />


              <input
                style={
                  iconInputStyle
                }

                value={
                  value.spouseName
                }

                placeholder=
                  "Enter spouse name"

                onChange={(
                  event,
                ) =>
                  onChange(
                    "spouseName",
                    event.target.value,
                  )
                }

                aria-label=
                  "Spouse Name"
              />

            </div>

          </div>

        </div>

      </div>

    </section>

  );

}


/* ===========================================================
   END
=========================================================== */