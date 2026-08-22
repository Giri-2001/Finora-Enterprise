/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER BASIC INFORMATION
   STEP 2 — PERSONAL INFORMATION

   Version : 3.0
   Status  : Production
=========================================================== */

import {
  GraduationCap,
  HeartHandshake,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  useBasicFormResponsive,
} from "../../../utils/responsive/customers/basicform";

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
  createBasicFormIconPositionStyle,
  createBasicFormIconSelectStyle,
  createBasicFormFieldGridStyle,
  createBasicFormFieldStyle,
} from "./BasicForm.styles";


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


export default function BasicForm({

  value,

  onChange,

}: BasicFormProps) {

  const {
    basicFormTokens,
  } =
    useBasicFormResponsive();

  const rootStyle =
    createBasicFormRootStyle(
      basicFormTokens,
    );



  const fieldGridStyle =
    createBasicFormFieldGridStyle(
      basicFormTokens,
    );

  const fieldStyle =
    createBasicFormFieldStyle(
      basicFormTokens,
    );

  const inputStyle =
    createBasicFormInputStyle(
      basicFormTokens,
    );

  const selectStyle =
    createBasicFormSelectStyle(
      basicFormTokens,
    );

  const optionStyle =
    createBasicFormOptionStyle(
      basicFormTokens,
    );

  const iconStyle =
    createBasicFormIconStyle(
      basicFormTokens,
    );

  const inputWrapperStyle =
    createBasicFormInputWrapperStyle();

  const iconInputStyle =
    createBasicFormIconInputStyle(
      basicFormTokens,
    );

  const iconPositionStyle =
    createBasicFormIconPositionStyle(
      basicFormTokens,
    );

  const iconSelectStyle =
    createBasicFormIconSelectStyle(
      basicFormTokens,
    );

  return (

    <section
      style={
        rootStyle
      }
    >

     

        <div
          style={
            fieldGridStyle
          }
        >

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
                  ...iconPositionStyle,
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

                placeholder="Enter father or spouse name"

                onChange={(
                  event,
                ) =>
                  onChange(
                    "fatherOrSpouseName",
                    event.target.value,
                  )
                }

                aria-label="Father or Spouse Name"
              />

            </div>

          </div>


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
                  ...iconPositionStyle,
                }}
                aria-hidden="true"
              />

              <select
                style={{
                  ...selectStyle,
                  ...iconSelectStyle,
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

                aria-label="Education"
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
                  ...iconPositionStyle,
                }}
                aria-hidden="true"
              />

              <select
                style={{
                  ...selectStyle,
                  ...iconSelectStyle,
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

                aria-label="Marital Status"
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
                  ...iconPositionStyle,
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

                placeholder="Enter spouse name"

                onChange={(
                  event,
                ) =>
                  onChange(
                    "spouseName",
                    event.target.value,
                  )
                }

                aria-label="Spouse Name"
              />

            </div>

          </div>

        </div>


    </section>

  );

}