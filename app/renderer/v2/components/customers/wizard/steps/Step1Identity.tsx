/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER IDENTITY STUDIO
--------------------------------------------------------------
Phase 2

Step 1

Identity

Creates the customer's digital identity.
=========================================================== */

import IdentityHeader from "../../identity/IdentityHeader";
import IdentityForm, {
  type IdentityFormData,
} from "../../identity/IdentityForm";
import CustomerPhotoUploader from "../../identity/CustomerPhotoUploader";
import CustomerIdPreview from "../../identity/CustomerIdPreview";
import IdentityPreviewCard from "../../identity/IdentityPreviewCard";
import IdentityDraftStatus from "../../identity/IdentityDraftStatus";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

interface IdentityState extends IdentityFormData {
  photoUrl: string;
}

/* ===========================================================
   DEFAULT STATE
=========================================================== */

const DEFAULT_STATE: IdentityState = {
  customerName: "",
  mobileNumber: "",
  whatsappSame: true,
  businessName: "Sri Giri Finance",
  branchName: "Hyderabad",
  customerId: "FIN-CUS-SGF-HYD-900001",
  photoUrl: "",
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

const formCardStyle: CSSProperties = {

  background: "#ffffff",

  border: "1px solid #e5e7eb",

  borderRadius: "18px",

  padding: "28px",

};

const previewCardStyle: CSSProperties = {

  background: "#0f172a",

  color: "#ffffff",

  borderRadius: "20px",

  padding: "24px",

  minHeight: "520px",

};

const sectionTitleStyle: CSSProperties = {

  marginTop: 0,

  marginBottom: "24px",

  fontSize: "24px",

  fontWeight: 700,

};

const labelStyle: CSSProperties = {

  display: "block",

  marginBottom: "8px",

  fontWeight: 600,

};

const inputStyle: CSSProperties = {

  width: "100%",

  padding: "14px",

  borderRadius: "12px",

  border: "1px solid #d1d5db",

  marginBottom: "22px",

  boxSizing: "border-box",

  fontSize: "15px",

};

const photoStyle: CSSProperties = {

  width: "130px",

  height: "130px",

  borderRadius: "18px",

  border: "2px dashed #cbd5e1",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  marginBottom: "20px",

  overflow: "hidden",

  background: "#f8fafc",

};

const cardPhotoStyle: CSSProperties = {

  width: "110px",

  height: "110px",

  borderRadius: "16px",

  background: "#334155",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  marginBottom: "24px",

};

export default function Step1Identity() {

  const [state, setState] =
    useState(DEFAULT_STATE);

  const customerName =
    useMemo(() => {

      if (
        state.customerName.trim() === ""
      ) {

        return "Customer Name";

      }

      return state.customerName;

    }, [state.customerName]);

      /* ===========================================================
     UPDATE HELPERS
  =========================================================== */

  function updateField(
    field: keyof IdentityState,
    value: string | boolean,
  ): void {

    setState((previous) => ({

      ...previous,

      [field]: value,

    }));

  }

  /* ===========================================================
     UI
  =========================================================== */

  return (

    <section style={pageStyle}>

      {/* ==========================================
          LEFT SIDE
      ========================================== */}

      <div style={formCardStyle}>

        <IdentityHeader
  title="Customer Identity Studio™"
  subtitle="Create the customer's permanent FINORA digital identity."
/>

        <CustomerPhotoUploader
  imageUrl={state.photoUrl}
  onImageChange={(image) =>
    updateField(
      "photoUrl",
      image,
    )
  }
/>

        <IdentityForm
  value={state}
  onChange={updateField}
/>

<CustomerIdPreview
  customerId={state.customerId}
/>

<IdentityDraftStatus
  isDraftSaved={true}
  lastSaved="Just now"
/>

      </div>

      {/* ==========================================
          LIVE PREVIEW
      ========================================== */}

     <aside>

  <IdentityPreviewCard
    customerName={state.customerName}
    customerId={state.customerId}
    businessName={state.businessName}
    branchName={state.branchName}
    imageUrl={state.photoUrl}
  />

</aside>

    </section>

  );

}
