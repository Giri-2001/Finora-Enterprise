/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   PHASE 2 — STEP 1

   IDENTITY STUDIO™

   Responsibility:

   - Step 1 identity state
   - Customer identity updates
   - Customer photo updates
   - Customer contact updates
   - Customer personal identity updates
   - Front ID card live preview
   - Branch identity preview

   Version : 2.0
   Status  : Production
=========================================================== */

import {
  useEffect,
  useState,
} from "react";

import IdentityForm, {
  type IdentityFormData,
} from "../../identity/IdentityForm";

import CustomerPhotoUploader
  from "../../identity/CustomerPhotoUploader";

import IdentityPreviewCard
  from "../../identity/IdentityPreviewCard";

import CustomerIdentityHanger
  from "../components/CustomerIdentityHanger";

import {
  pageStyle,
  leftPanelStyle,
  idCardHolderStyle,
  formPanelStyle,
  formHeaderStyle,
  formTitleStyle,
  formSubtitleStyle,
  photoSectionStyle,
  formBodyStyle,
  rightPanelStyle,
  previewHolderStyle,
} from "./Step1Identity.styles";

/* ===========================================================
   TYPES
=========================================================== */

type PreferredLanguage =
  | "Telugu"
  | "English"
  | "Hindi"
  | "Tamil"
  | "Kannada"
  | "Marathi"
  | "Other";

interface IdentityState
  extends IdentityFormData {

  email: string;

  whatsappNumber: string;

  dateOfBirth: string;

  preferredLanguage:
    PreferredLanguage;

  photoUrl: string;

}

interface Step1IdentityProps {

  initialData?: {

    customerId?: string;

    photo?: string;

    fullName?: string;

    mobileNumber?: string;

    whatsapp?: string;

    email?: string;

    dateOfBirth?: string;

    preferredLanguage?:
      PreferredLanguage;

  };

  updateWizardData: (
    data: {

      fullName?: string;

      mobileNumber?: string;

      customerId?: string;

      photo?: string;

      whatsapp?: string;

      email?: string;

      dateOfBirth?: string;

      preferredLanguage?:
        PreferredLanguage;

    },
  ) => void;

}

/* ===========================================================
   DEFAULT STATE
=========================================================== */

const DEFAULT_STATE:
  IdentityState = {

  customerName: "",

  mobileNumber: "",

  whatsappSame: true,

  whatsappNumber: "",

  email: "",

  dateOfBirth: "",

  preferredLanguage:
    "English",

  businessName:
    "Sri Giri Finance",

  branchName:
    "Hyderabad",

  customerId:
    "FIN-CUS-SGF-HYD-900001",

  photoUrl: "",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function Step1Identity({

  initialData,

  updateWizardData,

}: Step1IdentityProps) {

  /* =========================================================
     LOCAL STATE
  ========================================================= */

  const [
    state,
    setState,
  ] = useState<IdentityState>(
    DEFAULT_STATE,
  );

  /* =========================================================
     EDIT MODE / INITIAL DATA SYNC
  ========================================================= */

  useEffect(() => {

    if (!initialData) {

      return;

    }

    setState(
      (previous) => ({

        ...previous,

        customerName:
          initialData.fullName ??
          previous.customerName,

        mobileNumber:
          initialData.mobileNumber ??
          previous.mobileNumber,

        customerId:
          initialData.customerId ??
          previous.customerId,

        photoUrl:
          initialData.photo ??
          previous.photoUrl,

        whatsappNumber:
          initialData.whatsapp ??
          previous.whatsappNumber,

        email:
          initialData.email ??
          previous.email,

        dateOfBirth:
          initialData.dateOfBirth ??
          previous.dateOfBirth,

        preferredLanguage:
          initialData.preferredLanguage ??
          previous.preferredLanguage,

      }),
    );

  }, [
    initialData,
  ]);

  /* =========================================================
     FIELD UPDATE
  ========================================================= */

  function updateField(

    field:
      keyof IdentityState,

    value:
      string | boolean,

  ): void {

    setState(
      (previous) => ({

        ...previous,

        [field]: value,

      }),
    );

    /* =======================================================
       CUSTOMER NAME
    ======================================================= */

    if (
      field === "customerName"
    ) {

      updateWizardData({

        fullName:
          String(value),

      });

    }

    /* =======================================================
       MOBILE NUMBER
    ======================================================= */

    if (
      field === "mobileNumber"
    ) {

      const mobileNumber =
        String(value);

      updateWizardData({

        mobileNumber,

        ...(state.whatsappSame
          ? {
              whatsapp:
                mobileNumber,
            }
          : {}),

      });

    }

    /* =======================================================
       WHATSAPP SAME NUMBER
    ======================================================= */

    if (
      field === "whatsappSame"
    ) {

      const sameNumber =
        Boolean(value);

      updateWizardData({

        whatsapp:
          sameNumber
            ? state.mobileNumber
            : state.whatsappNumber,

      });

      return;

    }

    /* =======================================================
       WHATSAPP NUMBER
    ======================================================= */

    if (
      field === "whatsappNumber"
    ) {

      const whatsappNumber =
        String(value);

      updateWizardData({

        whatsapp:
          state.whatsappSame
            ? state.mobileNumber
            : whatsappNumber,

      });

    }

    /* =======================================================
       EMAIL ADDRESS
    ======================================================= */

    if (
      field === "email"
    ) {

      updateWizardData({

        email:
          String(value),

      });

    }

    /* =======================================================
       DATE OF BIRTH
    ======================================================= */

    if (
      field === "dateOfBirth"
    ) {

      updateWizardData({

        dateOfBirth:
          String(value),

      });

    }

   /* =======================================================
   PREFERRED LANGUAGE
======================================================= */

if (
  field === "preferredLanguage"
) {

  const preferredLanguage =
    String(value) as PreferredLanguage;

  updateWizardData({

    preferredLanguage,

  });

}
    /* =======================================================
       CUSTOMER ID
    ======================================================= */

    if (
      field === "customerId"
    ) {

      updateWizardData({

        customerId:
          String(value),

      });

    }

    /* =======================================================
       CUSTOMER PHOTO
    ======================================================= */

    if (
      field === "photoUrl"
    ) {

      updateWizardData({

        photo:
          String(value),

      });

    }

  }

  /* =========================================================
     CUSTOMER CARD NAME
  ========================================================= */

  const displayCustomerName =
    state.customerName.trim()
      ? state.customerName
      : "Customer Name";

  /* =========================================================
     UI
  ========================================================= */

  return (

    <section
      style={pageStyle}
    >

      {/* =================================================
          LEFT — REAL FINORA CUSTOMER ID CARD
      ================================================= */}

      <aside
        style={leftPanelStyle}
      >

        <div
          style={idCardHolderStyle}
        >

          <CustomerIdentityHanger

            customerId={
              state.customerId
            }

            customerName={
              displayCustomerName
            }

            phoneNumber={
              state.mobileNumber
            }

            profilePhoto={
              state.photoUrl
            }

            kycVerified={
              false
            }

          />

        </div>

      </aside>

      {/* =================================================
          CENTER — IDENTITY FORM
      ================================================= */}

      <main
        style={formPanelStyle}
      >

        <header
          style={formHeaderStyle}
        >

          <h1
            style={formTitleStyle}
          >

            Customer Identity

          </h1>

          <p
            style={formSubtitleStyle}
          >

            Create the customer's permanent
            FINORA digital identity.

          </p>

        </header>

        {/* ===============================================
            PHOTO
        =============================================== */}

        <div
          style={photoSectionStyle}
        >

          <CustomerPhotoUploader

            imageUrl={
              state.photoUrl
            }

            onImageChange={
              (image) =>
                updateField(
                  "photoUrl",
                  image,
                )
            }

          />

        </div>

        {/* ===============================================
            FORM
        =============================================== */}

        <div
          style={formBodyStyle}
        >

          <IdentityForm

            value={
              state
            }

            onChange={
              updateField
            }

          />

        </div>

      </main>

      {/* =================================================
          RIGHT — LIVE BRANCH PREVIEW
      ================================================= */}

      <aside
        style={rightPanelStyle}
      >

        <div
          style={previewHolderStyle}
        >

          <IdentityPreviewCard

            customerName={
              displayCustomerName
            }

            customerId={
              state.customerId
            }

            businessName={
              state.businessName
            }

            branchName={
              state.branchName
            }

            imageUrl={
              state.photoUrl
            }

          />

        </div>

      </aside>

    </section>

  );

}
