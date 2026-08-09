/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 4 — KYC STUDIO™

   RESPONSIBILITY:
   - Compose the complete Customer KYC workspace
   - Connect KYC child components
   - Maintain KYC form state
   - Sync supported KYC data with Customer Wizard
   - Present KYC preview, verification and draft status

   IMPORTANT:
   - Global Customer Wizard header is already provided by
     CustomerWizardLayout.
   - Step 4 does NOT render another page header.
   - The previous Step 4 internal header is intentionally hidden
     for the current compact enterprise layout.
   - It can be restored in a future design revision if required.
   - No StudioLayout
   - No TwoColumnStudio
   - No inline styles
   - Uses dedicated Step4KYC.styles.ts
=========================================================== */

import {
  useEffect,
  useState,
} from "react";

import KYCForm from "../../kyc/KYCForm";

import type {
  KYCFormData,
} from "../../kyc/KYCForm";

import DocumentUploader
  from "../../kyc/DocumentUploader";

import VerificationStatus
  from "../../kyc/VerificationStatus";

import KYCPreviewCard
  from "../../kyc/KYCPreviewCard";

import type {
  KYCPreviewData,
} from "../../kyc/KYCPreviewCard";

import KYCDraftStatus
  from "../../kyc/KYCDraftStatus";

import type {
  CustomerWizardData,
} from "../CustomerWizard";

import {
  pageStyle,
  contentStyle,
  leftColumnStyle,
  rightColumnStyle,
  panelStyle,
  panelHeaderStyle,
  panelTitleStyle,
  panelSubtitleStyle,
  statusRowStyle,
  statusItemStyle,
  statusLabelStyle,
  statusValueStyle,
  footerNoteStyle,
} from "./Step4KYC.styles";

/* ===========================================================
   TYPES
=========================================================== */

interface Step4KYCProps {
  wizardData: CustomerWizardData;

  updateWizardData: (
    data: Partial<CustomerWizardData>,
  ) => void;
}

/* ===========================================================
   DEFAULT KYC DATA
=========================================================== */

const EMPTY_KYC_DATA: KYCFormData = {
  aadhaarNumber: "",
  panNumber: "",
  voterId: "",
  drivingLicense: "",
};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function Step4KYC({
  wizardData,
  updateWizardData,
}: Step4KYCProps) {

  /* =========================================================
     KYC STATE
  ========================================================= */

  const [
    kycData,
    setKycData,
  ] = useState<KYCFormData>({
    ...EMPTY_KYC_DATA,

    aadhaarNumber:
      wizardData.aadhaar ?? "",

    panNumber:
      wizardData.pan ?? "",
  });

  /* =========================================================
     SYNC WIZARD DATA
  ========================================================= */

  useEffect(() => {

    setKycData(
      (previous: KYCFormData) => ({
        ...previous,

        aadhaarNumber:
          wizardData.aadhaar ??
          previous.aadhaarNumber,

        panNumber:
          wizardData.pan ??
          previous.panNumber,
      }),
    );

  }, [
    wizardData.aadhaar,
    wizardData.pan,
  ]);

  /* =========================================================
     KYC FIELD CHANGE
  ========================================================= */

  const handleKYCChange = (
    field: keyof KYCFormData,
    value: string,
  ) => {

    setKycData(
      (previous: KYCFormData) => ({
        ...previous,
        [field]: value,
      }),
    );

    /* =======================================================
       SYNC SUPPORTED WIZARD FIELDS
    ======================================================= */

    if (field === "aadhaarNumber") {

      updateWizardData({
        aadhaar: value,
      });

      return;
    }

    if (field === "panNumber") {

      updateWizardData({
        pan: value,
      });
    }
  };

  /* =========================================================
     PREVIEW DATA
  ========================================================= */

  const previewData: KYCPreviewData = {

    customerName:
      wizardData.fullName ||
      "New Customer",

    aadhaarNumber:
      kycData.aadhaarNumber,

    panNumber:
      kycData.panNumber,

    verified: false,
  };

  /* =========================================================
     CURRENT VERIFICATION STATE

     Do not fake successful verification.
  ========================================================= */

  const isVerified = false;

  /* =========================================================
     CURRENT DOCUMENT STATE

     DocumentUploader is currently presentation-only.
  ========================================================= */

  const documentUploaded = false;

  /* =========================================================
     PAGE

     The page itself fills the available wizard content area.
     Header and footer are owned by CustomerWizardLayout.
  ========================================================= */

  return (

    <section style={pageStyle}>

      {/* =====================================================
          FUTURE OPTIONAL STEP HEADER

          Intentionally not rendered in the current design.

          Future:
          Customer KYC Studio™
          Verify customer identity documents and
          compliance information.

          The global FINORA / Customers Hub header already
          provides the required navigation context.
      ===================================================== */}

      {/* =====================================================
          MAIN KYC WORKSPACE
      ===================================================== */}

      <main style={contentStyle}>

        {/* ===================================================
            LEFT COLUMN
        =================================================== */}

        <div style={leftColumnStyle}>

          {/* =================================================
              IDENTITY INFORMATION
          ================================================= */}

          <section style={panelStyle}>

            <div style={panelHeaderStyle}>

              <div>

                <h2 style={panelTitleStyle}>
                  Identity Information
                </h2>

                <p style={panelSubtitleStyle}>
                  Capture customer identity documents
                  required for KYC verification.
                </p>

              </div>

            </div>

            <KYCForm
              value={kycData}
              onChange={handleKYCChange}
            />

          </section>

          {/* =================================================
              DOCUMENT UPLOAD
          ================================================= */}

          <section style={panelStyle}>

            <div style={panelHeaderStyle}>

              <div>

                <h2 style={panelTitleStyle}>
                  Document Upload
                </h2>

                <p style={panelSubtitleStyle}>
                  Attach the supporting KYC document.
                </p>

              </div>

            </div>

            <DocumentUploader
              documentName="KYC Identity Document"
              uploaded={documentUploaded}
            />

          </section>

          {/* =================================================
              VERIFICATION STATUS
          ================================================= */}

          <section style={panelStyle}>

            <div style={panelHeaderStyle}>

              <div>

                <h2 style={panelTitleStyle}>
                  Verification Status
                </h2>

                <p style={panelSubtitleStyle}>
                  Current identity verification state.
                </p>

              </div>

            </div>

            <VerificationStatus
              verified={isVerified}
            />

            <p style={footerNoteStyle}>
              Verification will remain pending until
              the required KYC information is verified.
            </p>

          </section>

        </div>

        {/* ===================================================
            RIGHT COLUMN
        =================================================== */}

        <div style={rightColumnStyle}>

          {/* =================================================
              KYC PREVIEW
          ================================================= */}

          <section style={panelStyle}>

            <div style={panelHeaderStyle}>

              <div>

                <h2 style={panelTitleStyle}>
                  KYC Preview
                </h2>

                <p style={panelSubtitleStyle}>
                  Live summary of the customer KYC data.
                </p>

              </div>

            </div>

            <KYCPreviewCard
              value={previewData}
            />

          </section>

          {/* =================================================
              VERIFICATION OVERVIEW
          ================================================= */}

          <section style={panelStyle}>

            <div style={panelHeaderStyle}>

              <div>

                <h2 style={panelTitleStyle}>
                  Verification Overview
                </h2>

                <p style={panelSubtitleStyle}>
                  Compliance readiness at a glance.
                </p>

              </div>

            </div>

            <div style={statusRowStyle}>

              <div style={statusItemStyle}>

                <span style={statusLabelStyle}>
                  Identity
                </span>

                <span style={statusValueStyle}>
                  {isVerified
                    ? "Verified"
                    : "Pending"}
                </span>

              </div>

              <div style={statusItemStyle}>

                <span style={statusLabelStyle}>
                  Documents
                </span>

                <span style={statusValueStyle}>
                  {documentUploaded
                    ? "Ready"
                    : "Pending"}
                </span>

              </div>

              <div style={statusItemStyle}>

                <span style={statusLabelStyle}>
                  KYC
                </span>

                <span style={statusValueStyle}>
                  {isVerified
                    ? "Complete"
                    : "Pending"}
                </span>

              </div>

            </div>

            {/*  <p style={footerNoteStyle}>
              Automated OCR and verification can be
              connected in a future FINORA release.
            </p>  */}

          </section>

          {/* =================================================
              DRAFT STATUS
          ================================================= */}

          <KYCDraftStatus
            isDraftSaved={false}
          />

        </div>

      </main>

    </section>
  );
}
