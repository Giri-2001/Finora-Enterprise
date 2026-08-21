/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 2 — BASIC DETAILS

   Version     : 3.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:

   - Personal information
   - Occupation profile
   - Family & emergency information
   - Live wizard synchronization

   ARCHITECTURE:

   - Presentation orchestration only
   - Existing business state preserved
   - Existing wizard synchronization preserved
   - Responsive geometry owned by child components
   - No local breakpoints
   - No viewport detection
   - No business logic
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useEffect,
  useState,
} from "react";


import {
  UserRound,
  BriefcaseBusiness,
  UsersRound,
} from "lucide-react";


import BasicForm, {
  type BasicFormData,
} from "../../basic/BasicForm";


import OccupationCard, {
  type OccupationData,
} from "../../basic/OccupationCard";


import FamilyDetails, {
  type FamilyDetailsData,
} from "../../basic/FamilyDetails";


import type {
  CustomerWizardData,
} from "../CustomerWizard";


import {
  pageStyle,
  pageHeaderStyle,
  pageTitleStyle,
  pageSubtitleStyle,
  contentStyle,
  sectionStyle,
  sectionHeaderStyle,
  sectionIconStyle,
  sectionTitleStyle,
  sectionSubtitleStyle,
  fieldAreaStyle,
  sectionAccentStyle,
} from "./Step2Basic.styles";


/* ===========================================================
   TYPES
=========================================================== */

interface BasicState
  extends BasicFormData,
    OccupationData,
    FamilyDetailsData {}


/* ===========================================================
   DEFAULT STATE
=========================================================== */

const DEFAULT_STATE:
  BasicState = {

  fatherOrSpouseName:
    "",

  education:
    "",

  maritalStatus:
    "",

  spouseName:
    "",

  occupation:
    "",

  workPlace:
    "",

  monthlyIncome:
    "",

  experience:
    "",

  numberOfFamilyMembers:
    "",

  emergencyContactName:
    "",

  emergencyContactMobile:
    "",

};


/* ===========================================================
   PROPS
=========================================================== */

interface Step2BasicProps {

  wizardData?:
    CustomerWizardData;

  updateWizardData: (
    data:
      Partial<CustomerWizardData>,
  ) => void;

}


/* ===========================================================
   COMPONENT
=========================================================== */

export default function Step2Basic({

  wizardData,

  updateWizardData,

}: Step2BasicProps) {


  /* =========================================================
     STATE
  ========================================================= */

  const [
    state,
    setState,
  ] = useState(
    DEFAULT_STATE,
  );


  /* =========================================================
     RESTORE WIZARD DATA
  ========================================================= */

  useEffect(() => {

    if (!wizardData) {
      return;
    }


    setState(
      (previous) => ({

        ...previous,

        fatherOrSpouseName:
          wizardData.fatherOrSpouseName ??
          previous.fatherOrSpouseName,

        education:
          wizardData.education ??
          previous.education,

        maritalStatus:
          wizardData.maritalStatus ??
          previous.maritalStatus,

        spouseName:
          wizardData.spouseName ??
          previous.spouseName,

        occupation:
          wizardData.occupation ??
          previous.occupation,

        workPlace:
          wizardData.workPlace ??
          previous.workPlace,

        monthlyIncome:
          wizardData.monthlyIncome ??
          previous.monthlyIncome,

        experience:
          wizardData.experience ??
          previous.experience,

        numberOfFamilyMembers:
          wizardData.numberOfFamilyMembers ??
          previous.numberOfFamilyMembers,

        emergencyContactName:
          wizardData.emergencyContactName ??
          previous.emergencyContactName,

        emergencyContactMobile:
          wizardData.emergencyContactMobile ??
          previous.emergencyContactMobile,

      }),
    );

  }, [
    wizardData,
  ]);


  /* =========================================================
     UPDATE FIELD
  ========================================================= */

  function updateField(

    field:
      keyof BasicState,

    value:
      string,

  ): void {

    setState(
      (previous) => ({

        ...previous,

        [field]:
          value,

      }),
    );


    /* =======================================================
       LIVE WIZARD SYNC
    ======================================================= */

    updateWizardData({

      [field]:
        value,

    } as Partial<CustomerWizardData>);

  }


  /* =========================================================
     UI
  ========================================================= */

  return (

    <section
      style={
        pageStyle
      }
    >

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <header
        style={
          pageHeaderStyle
        }
      >

        <h1
          style={
            pageTitleStyle
          }
        >
          Customer Basic Details
        </h1>


        <p
          style={
            pageSubtitleStyle
          }
        >
          Capture personal, occupation and family
          information for the customer's permanent profile.
        </p>

      </header>


      {/* =================================================
          THREE PREMIUM SECTIONS
      ================================================= */}

      <div
        style={
          contentStyle
        }
      >

        {/* =================================================
            SECTION 1 — PERSONAL INFORMATION
        ================================================= */}

        <section
          style={
            sectionStyle
          }
        >

          <header
            style={
              sectionHeaderStyle
            }
          >

            <div
              style={
                sectionIconStyle
              }
              aria-hidden="true"
            >

              <UserRound />

            </div>


            <div>

              <h2
                style={
                  sectionTitleStyle
                }
              >
                1. Personal Information
              </h2>


              <p
                style={
                  sectionSubtitleStyle
                }
              >
                Basic personal and marital information.
              </p>

            </div>

          </header>


          <div
            style={
              fieldAreaStyle
            }
          >

            <BasicForm

              value={
                state
              }

              onChange={
                updateField
              }

            />

          </div>


          <div
            style={
              sectionAccentStyle
            }
          />

        </section>


        {/* =================================================
            SECTION 2 — OCCUPATION PROFILE
        ================================================= */}

        <section
          style={
            sectionStyle
          }
        >

          <header
            style={
              sectionHeaderStyle
            }
          >

            <div
              style={
                sectionIconStyle
              }
              aria-hidden="true"
            >

              <BriefcaseBusiness />

            </div>


            <div>

              <h2
                style={
                  sectionTitleStyle
                }
              >
                2. Occupation Profile
              </h2>


              <p
                style={
                  sectionSubtitleStyle
                }
              >
                Professional and income information.
              </p>

            </div>

          </header>


          <div
            style={
              fieldAreaStyle
            }
          >

            <OccupationCard

              value={
                state
              }

              onChange={
                updateField
              }

            />

          </div>


          <div
            style={
              sectionAccentStyle
            }
          />

        </section>


        {/* =================================================
            SECTION 3 — FAMILY & EMERGENCY
        ================================================= */}

        <section
          style={
            sectionStyle
          }
        >

          <header
            style={
              sectionHeaderStyle
            }
          >

            <div
              style={
                sectionIconStyle
              }
              aria-hidden="true"
            >

              <UsersRound />

            </div>


            <div>

              <h2
                style={
                  sectionTitleStyle
                }
              >
                3. Family & Emergency
              </h2>


              <p
                style={
                  sectionSubtitleStyle
                }
              >
                Family size and emergency contact information.
              </p>

            </div>

          </header>


          <div
            style={
              fieldAreaStyle
            }
          >

            <FamilyDetails

              value={
                state
              }

              onChange={
                updateField
              }

            />

          </div>


          <div
            style={
              sectionAccentStyle
            }
          />

        </section>

      </div>

    </section>

  );

}


/* ===========================================================
   END
=========================================================== */