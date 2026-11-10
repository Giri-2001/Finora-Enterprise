/* ===========================================================
FINORA ENTERPRISE V2
GUARANTOR STUDIO
GUARANTOR VERIFICATION

RESPONSIBILITY:
- Render guarantor verification controls
- Receive verification state from Loan Studio
- Update Loan Studio through controlled callbacks
- Preserve FINORA SelectInput architecture

VERSION : 2.0
STATUS  : Production
=========================================================== */

/* ===========================================================
IMPORTS
=========================================================== */

import { FormField, SelectInput } from "../../common";

import {
  accentStyle,
  contentStyle,
  fieldContentStyle,
  fieldStyle,
  headerStyle,
  selectOptionTextStyle,
  selectStyle,
  mobileGuarantorVerificationCss,
  wrapperStyle,
} from "./GuarantorVerification.styles";

/* ===========================================================
TYPES
=========================================================== */

interface GuarantorVerificationProps {
  verificationStatus: string;

  identityVerification: string;

  onVerificationStatusChange: (value: string) => void;

  onIdentityVerificationChange: (value: string) => void;
}

/* ===========================================================
COMPONENT
=========================================================== */

export default function GuarantorVerification({
  verificationStatus,
  identityVerification,
  onVerificationStatusChange,
  onIdentityVerificationChange,
}: GuarantorVerificationProps) {
  return (
    <div className="paisarule-guarantor-verification" style={wrapperStyle}>
        <style>{mobileGuarantorVerificationCss}</style>
      {/* HEADER */}

      <div style={headerStyle}>
        <span style={accentStyle} />

        <span className="paisarule-guarantor-verification-title">Guarantor Verification</span>
      </div>

      {/* CONTENT */}

      <div style={contentStyle}>
        {/* VERIFICATION STATUS */}

        <div style={fieldStyle}>
          <div style={fieldContentStyle}>
            <FormField label="Verification Status" required>
              <SelectInput
                value={verificationStatus}
                onChange={(event) =>
                  onVerificationStatusChange(event.target.value)
                }
                className="paisarule-guarantor-verification-select" style={selectStyle}
                optionTextStyle={selectOptionTextStyle}
                options={[
                  {
                    label: "Pending",
                    value: "pending",
                  },
                  {
                    label: "Verified",
                    value: "verified",
                  },
                  {
                    label: "Rejected",
                    value: "rejected",
                  },
                ]}
              />
            </FormField>
          </div>
        </div>

        {/* IDENTITY VERIFICATION */}

        <div style={fieldStyle}>
          <div style={fieldContentStyle}>
            <FormField label="Identity Verification">
              <SelectInput
                value={identityVerification}
                onChange={(event) =>
                  onIdentityVerificationChange(event.target.value)
                }
                className="paisarule-guarantor-verification-select" style={selectStyle}
                optionTextStyle={selectOptionTextStyle}
                options={[
                  {
                    label: "Aadhaar",
                    value: "aadhaar",
                  },
                  {
                    label: "PAN",
                    value: "pan",
                  },
                  {
                    label: "Driving Licence",
                    value: "dl",
                  },
                  {
                    label: "Voter ID",
                    value: "voter",
                  },
                ]}
              />
            </FormField>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================
END
=========================================================== */
