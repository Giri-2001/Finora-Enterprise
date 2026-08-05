/* ===========================================================
   FINORA ENTERPRISE V2
   STEP 2 - BASIC DETAILS
--------------------------------------------------------------
Customer Basic Details Wizard Controller
=========================================================== */

import { useState } from "react";
import type { CSSProperties } from "react";

import BasicHeader from "../../basic/BasicHeader";
import BasicForm, {
  type BasicFormData,
} from "../../basic/BasicForm";
import OccupationCard, {
  type OccupationData,
} from "../../basic/OccupationCard";
import FamilyDetails, {
  type FamilyDetailsData,
} from "../../basic/FamilyDetails";
import CustomerStatistics, {
  type CustomerStatisticsData,
} from "../../basic/CustomerStatistics";
import BasicDraftStatus from "../../basic/BasicDraftStatus";

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

const DEFAULT_STATE: BasicState = {

   fullName: "",

  mobileNumber: "",

  fatherOrSpouseName: "",

  occupation: "",

  monthlyIncome: "",

  education: "",

  maritalStatus: "",

  workPlace: "",

  experience: "",

  spouseName: "",

  numberOfFamilyMembers: "",

  emergencyContactName: "",

  emergencyContactMobile: "",

};

/* ===========================================================
   STYLES
=========================================================== */

const pageStyle: CSSProperties = {

  display: "grid",

  gridTemplateColumns: "2fr 1fr",

  gap: "32px",

  alignItems: "start",

};

const leftColumnStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  gap: "24px",

};

const rightColumnStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  gap: "24px",

};

/* ===========================================================
   COMPONENT
=========================================================== */

interface Step2BasicProps {

  updateWizardData: (
    data: Partial<{
      fullName: string;
      mobileNumber: string;
      whatsapp: string;
      email: string;
    }>
  ) => void;

}


export default function Step2Basic({

  updateWizardData,

}: Step2BasicProps) {

  const [state, setState] =
    useState<BasicState>(DEFAULT_STATE);

  function updateField(
    field: keyof BasicState,
    value: string,
  ) {

    setState((previous) => ({

      ...previous,

      [field]: value,

    }));

if (field === "fullName") {

  updateWizardData({

    fullName: value,

  });

}


if (field === "mobileNumber") {

  updateWizardData({

    mobileNumber: value,

  });

}

  }

  const statistics: CustomerStatisticsData = {

    customerSince: "Today",

    totalLoans: 0,

    activeLoans: 0,

    closedLoans: 0,

  };

  return (

    <div style={pageStyle}>

      <section style={leftColumnStyle}>

        <BasicHeader
          title="Customer Basic Studio™"
          subtitle="Capture customer personal and financial background."
        />

        <BasicForm
          value={state}
          onChange={updateField}
        />

        <OccupationCard
          value={state}
          onChange={updateField}
        />

        <FamilyDetails
          value={state}
          onChange={updateField}
        />

        <BasicDraftStatus
          isDraftSaved={true}
          lastSaved="Just now"
        />

      </section>

      <aside style={rightColumnStyle}>

        <CustomerStatistics
          value={statistics}
        />

      </aside>

    </div>

  );

}
