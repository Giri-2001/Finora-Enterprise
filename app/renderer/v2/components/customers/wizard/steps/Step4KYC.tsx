/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 4 — KYC STUDIO™

   Version     : 3.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:
   - Customer KYC state
   - Aadhaar / PAN / Voter ID / Driving Licence
   - Live KYC preview
   - Wizard synchronization

   REMOVED:
   - Document Upload
   - Verification Status
   - Verification Overview
   - Draft Pending

   IMPORTANT:
   - Entered KYC data is never treated as verified.
   - Responsive geometry comes from the KYC Responsive Engine.
   - Global wizard header/footer remain owned by CustomerWizardLayout.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import {
  BadgeCheck,
  CarFront,
  CreditCard,
  IdCard,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import type {
  CustomerWizardData,
} from "../CustomerWizard";

import {
  useResponsive,
} from "../../../../utils/responsive";

import {
  useTheme,
} from "../../../../themes/provider";

import {
  getKycTokens,
} from "../../../../utils/responsive/customers/kyc/kyc.tokens";

import {
  createStep4KycStyles,
  createStep4ThemeVariables,
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

type KycField =
  | "aadhaarNumber"
  | "panNumber"
  | "voterId"
  | "drivingLicense";

interface KycFormData {
  aadhaarNumber: string;
  panNumber: string;
  voterId: string;
  drivingLicense: string;
}

interface KycFieldProps {
  label: string;
  field: KycField;
  value: string;
  placeholder: string;
  required?: boolean;
  icon: LucideIcon;
  styles: ReturnType<typeof createStep4KycStyles>;
  onChange: (
    field: KycField,
    value: string,
  ) => void;
}

/* ===========================================================
   DEFAULT STATE
=========================================================== */

const EMPTY_KYC_DATA: KycFormData = {
  aadhaarNumber: "",
  panNumber: "",
  voterId: "",
  drivingLicense: "",
};

/* ===========================================================
   HELPERS
=========================================================== */

function normalizeAadhaar(
  value: string,
): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 12);
}

function normalizePan(
  value: string,
): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
}

function normalizeId(
  value: string,
): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 20);
}

function displayValue(
  value: string,
): string {
  return value.trim() || "--";
}

/* ===========================================================
   FIELD COMPONENT
=========================================================== */

function KycFieldView({
  label,
  field,
  value,
  placeholder,
  required = false,
  icon: Icon,
  styles,
  onChange,
}: KycFieldProps) {
  return (
    <div style={styles.fieldStyle}>
      <label
        htmlFor={`finora-kyc-${field}`}
        style={styles.labelStyle}
      >
        {label}

        {required ? (
          <span
            style={styles.requiredStyle}
            aria-hidden="true"
          >
            *
          </span>
        ) : null}
      </label>

      <div style={styles.inputWrapperStyle}>
        <Icon
          style={styles.inputIconStyle}
          strokeWidth={1.9}
          aria-hidden="true"
        />

        <input
          id={`finora-kyc-${field}`}
          type="text"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          style={styles.inputStyle}
          onChange={(event) =>
            onChange(
              field,
              event.target.value,
            )
          }
        />
      </div>
    </div>
  );
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function Step4KYC({
  wizardData,
  updateWizardData,
}: Step4KYCProps) {
  const {
    tokens,
  } = useResponsive();

  const {
    theme,
  } = useTheme();

  const kycTokens = useMemo(
    () =>
      getKycTokens(
        tokens.meta.viewport,
      ),
    [
      tokens.meta.viewport,
    ],
  );

  const styles = useMemo(
    () =>
      createStep4KycStyles(
        kycTokens,
      ),
    [
      kycTokens,
    ],
  );

  const themeVariables = useMemo(
    () =>
      createStep4ThemeVariables(
        theme,
      ),
    [
      theme,
    ],
  );

  const [
    kycData,
    setKycData,
  ] = useState<KycFormData>({
    ...EMPTY_KYC_DATA,
    aadhaarNumber:
      wizardData.aadhaar ?? "",
    panNumber:
      wizardData.pan ?? "",
    voterId:
      wizardData.voterId ?? "",
    drivingLicense:
      wizardData.drivingLicence ?? "",
  });

  useEffect(() => {
    setKycData({
      ...EMPTY_KYC_DATA,
      aadhaarNumber:
        wizardData.aadhaar ?? "",
      panNumber:
        wizardData.pan ?? "",
      voterId:
        wizardData.voterId ?? "",
      drivingLicense:
        wizardData.drivingLicence ?? "",
    });
  }, [
    wizardData.aadhaar,
    wizardData.pan,
    wizardData.voterId,
    wizardData.drivingLicence,
  ]);

  function handleFieldChange(
    field: KycField,
    rawValue: string,
  ): void {
    const value =
      field === "aadhaarNumber"
        ? normalizeAadhaar(rawValue)
        : field === "panNumber"
          ? normalizePan(rawValue)
          : normalizeId(rawValue);

    setKycData((previous) => ({
      ...previous,
      [field]: value,
    }));

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
      return;
    }

    if (field === "voterId") {
      updateWizardData({
        voterId: value,
      });
      return;
    }

    updateWizardData({
      drivingLicence: value,
    });
  }

  const hasAnyKycData = Boolean(
    kycData.aadhaarNumber ||
    kycData.panNumber ||
    kycData.voterId ||
    kycData.drivingLicense,
  );

  const themeStyle = {
    ...styles.pageStyle,
    ...themeVariables,
  } as CSSProperties &
    Record<`--${string}`, string>;

  return (
    <section style={themeStyle}>
      <main style={styles.contentStyle}>

        <section
          style={styles.panelStyle}
          aria-labelledby="finora-kyc-identity-title"
        >
<header style={styles.panelHeaderStyle}>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
    }}
  >
    <div
      style={{
        width: "40px",
        height: "40px",
        minWidth: "40px",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
  "transparent",
  color:
  "var(--finora-theme-brand-accent, #4D82E6)",
        border:
  "1px solid var(--finora-theme-brand-accent, #4D82E6)",
      }}
    >
      <IdCard
        size={kycTokens.inputIconSize * 1.5}
        strokeWidth={1.9}
      />
    </div>

    <div>
      <h2
        id="finora-kyc-identity-title"
        style={styles.panelTitleStyle}
      >
        Identity Information
      </h2>

      <p style={styles.panelSubtitleStyle}>
        Capture customer identity documents required for KYC verification.
      </p>
    </div>
  </div>
</header>
          <div style={styles.fieldGridStyle}>
            <KycFieldView
              label="Aadhaar Number"
              field="aadhaarNumber"
              value={kycData.aadhaarNumber}
              placeholder="Enter 12-digit Aadhaar number"
              required
              icon={IdCard}
              styles={styles}
              onChange={handleFieldChange}
            />

            <KycFieldView
              label="PAN Number"
              field="panNumber"
              value={kycData.panNumber}
              placeholder="Enter 10-digit PAN number"
              required
              icon={CreditCard}
              styles={styles}
              onChange={handleFieldChange}
            />

            <KycFieldView
              label="Voter ID"
              field="voterId"
              value={kycData.voterId}
              placeholder="Enter Voter ID number"
              icon={BadgeCheck}
              styles={styles}
              onChange={handleFieldChange}
            />

            <KycFieldView
              label="Driving Licence"
              field="drivingLicense"
              value={kycData.drivingLicense}
              placeholder="Enter Driving Licence number"
              icon={CarFront}
              styles={styles}
              onChange={handleFieldChange}
            />
          </div>
        </section>

        <section
          style={styles.panelStyle}
          aria-labelledby="finora-kyc-preview-title"
        >
          
          <article style={styles.previewCardStyle}>
            <div style={styles.previewHeaderStyle}>
              <div
                style={styles.previewIconStyle}
                aria-hidden="true"
              >
                <ShieldCheck
                  size={kycTokens.previewIconSize}
                  strokeWidth={1.8}
                />
              </div>

              <div style={{ minWidth: 0 }}>
                <h3 style={styles.previewTitleStyle}>
                  KYC Preview
                </h3>

                <p style={styles.previewSubtitleStyle}>
                  Live preview of the customer's identity details.
                </p>
              </div>
            </div>

            <div style={styles.previewRowsStyle}>
              <div style={styles.previewRowStyle}>
                <span style={styles.previewLabelStyle}>
                  CUSTOMER
                </span>
                <span style={styles.previewValueStyle}>
                  {displayValue(
                    wizardData.fullName ?? "",
                  )}
                </span>
              </div>

              <div style={styles.previewRowStyle}>
                <span style={styles.previewLabelStyle}>
                  AADHAAR
                </span>
                <span style={styles.previewValueStyle}>
                  {displayValue(
                    kycData.aadhaarNumber,
                  )}
                </span>
              </div>

              <div style={styles.previewRowStyle}>
                <span style={styles.previewLabelStyle}>
                  PAN
                </span>
                <span style={styles.previewValueStyle}>
                  {displayValue(
                    kycData.panNumber,
                  )}
                </span>
              </div>

              <div style={styles.previewRowStyle}>
                <span style={styles.previewLabelStyle}>
                  VOTER ID
                </span>
                <span style={styles.previewValueStyle}>
                  {displayValue(
                    kycData.voterId,
                  )}
                </span>
              </div>

              <div style={styles.previewRowStyle}>
                <span style={styles.previewLabelStyle}>
                  DRIVING LICENCE
                </span>
                <span style={styles.previewValueStyle}>
                  {displayValue(
                    kycData.drivingLicense,
                  )}
                </span>
              </div>
            </div>

            <div style={styles.previewStatusStyle}>
              <ShieldCheck
                size={kycTokens.previewStatusSize + 4}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              {hasAnyKycData
                ? "Verification Pending"
                : "KYC Pending"}
            </div>
          </article>
        </section>
      </main>
    </section>
  );
}

/* ===========================================================
   END
=========================================================== */
