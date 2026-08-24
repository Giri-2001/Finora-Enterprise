/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   PHASE 2 — STEP 1

   IDENTITY STUDIO™

   Version : 3.0
   Status  : Production
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useEffect,
  useState,
} from "react";


/* ===========================================================
   IDENTITY COMPONENTS
=========================================================== */

import IdentityForm, {
  type IdentityFormData,
} from "../../identity/IdentityForm";


import CustomerPhotoUploader
  from "../../identity/CustomerPhotoUploader";


/* ===========================================================
   RESPONSIVE ENGINE
=========================================================== */

import {
  useResponsive,
} from "../../../../utils/responsive";


/* ===========================================================
   THEME ENGINE
=========================================================== */

import {
  useTheme,
} from "../../../../themes/provider";

import {
  UserRound,
} from "lucide-react";


/* ===========================================================
   PRESENTATION STYLES
=========================================================== */

import {
  createStep1IdentityStyles,
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

  customerName:
    "",

  mobileNumber:
    "",

  whatsappSame:
    true,

  whatsappNumber:
    "",

  email:
    "",

  dateOfBirth:
    "",

  preferredLanguage:
    "English",

  businessName:
    "Sri Giri Finance",

  branchName:
    "Hyderabad",

  customerId:
    "FIN-CUS-SGF-HYD-900001",

  photoUrl:
    "",

};


/* ===========================================================
   COMPONENT
=========================================================== */

export default function Step1Identity({

  initialData,

  updateWizardData,

}: Step1IdentityProps) {


  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const {
    tokens,
  } = useResponsive();


  /* =========================================================
     THEME ENGINE
  ========================================================= */

  const {
    theme,
  } = useTheme();


  /* =========================================================
     PRESENTATION STYLES
  ========================================================= */

  const {

    pageStyle,

    formPanelStyle,

    formHeaderStyle,

     formHeaderIconStyle,

    formTitleStyle,

    formSubtitleStyle,

    photoSectionStyle,

    formBodyStyle,

  } =
    createStep1IdentityStyles(

      tokens,

      theme,

    );


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
     INITIAL DATA SYNC
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
       EMAIL
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
     UI
  ========================================================= */

  return (

    <section
  style={{
    ...pageStyle,

    "--finora-theme-brand-accent":
      theme.colors.brand.accent,

    "--finora-theme-brand-accent-soft":
      theme.colors.brand.accentSoft,
  } as React.CSSProperties}
>

      <main
        style={
          formPanelStyle
        }
      >

  <header
  style={
    formHeaderStyle
  }
>

  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
    }}
  >

    {/* =====================================================
        IDENTITY ICON
    ===================================================== */}

    <div
      style={{
        width: "42px",
        height: "42px",
        minWidth: "42px",

        borderRadius: "6px",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        background:
          "transparent",

        color:
          "var(--finora-theme-brand-accent, #4D82E6)",

        border:
          "1px solid var(--finora-theme-brand-accent, #4D82E6)",

        boxSizing: "border-box",

        transform:
          "translateY(2px)",
      }}
    >

      <UserRound
        size={20}
        strokeWidth={2.2}
      />

    </div>


    {/* =====================================================
        TITLE + SUBTITLE
    ===================================================== */}

    <div
      style={{
        display: "flex",

        flexDirection: "column",

        justifyContent: "center",

        minWidth: 0,

        flex: 1,
      }}
    >

      <h1
        style={{
          ...formTitleStyle,

          margin: 0,
        }}
      >
        Customer Identity
      </h1>


      <p
        style={{
          ...formSubtitleStyle,

          margin:
            "3px 0 0",
        }}
      >
        Create the customer's permanent
        FINORA digital identity.
      </p>

    </div>

  </div>

</header>


        <div
  style={{
    ...photoSectionStyle,

    "--finora-theme-brand-accent":
      theme.colors.brand.accent,

    "--finora-theme-brand-accent-soft":
      theme.colors.brand.accentSoft,
  } as React.CSSProperties}
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


        <div
          style={
            formBodyStyle
          }
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

    </section>

  );

}


/* ===========================================================
   END
=========================================================== */