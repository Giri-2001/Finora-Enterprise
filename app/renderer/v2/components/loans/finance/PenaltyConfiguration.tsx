/* ===========================================================
FINORA ENTERPRISE V2
FINANCE STUDIO
PENALTY CONFIGURATION
=========================================================== */

/* ===========================================================
IMPORTS
=========================================================== */

import {
  FormField,
  SelectInput,
  TextInput,
} from "../../common";

import {
  accentStyle,
  fieldContentStyle,
  fieldStyle,
  headerStyle,
  wrapperStyle,
} from "./PenaltyConfiguration.styles";

/* ===========================================================
TYPES
=========================================================== */

interface PenaltyConfigurationProps {
  penaltyType: string;
  penaltyValue: string;
  onPenaltyTypeChange: (
    value: string,
  ) => void;
  onPenaltyValueChange: (
    value: string,
  ) => void;
}

/* ===========================================================
COMPONENT
=========================================================== */

export default function PenaltyConfiguration({
  penaltyType,
  penaltyValue,
  onPenaltyTypeChange,
  onPenaltyValueChange,
}: PenaltyConfigurationProps) {
  return (
    <div style={wrapperStyle}>

      {/* CONFIGURATION HEADER */}
      <div style={headerStyle}>
        <span style={accentStyle} />

        <span>
          Penalty Configuration
        </span>
      </div>

      {/* PENALTY TYPE */}
      <div style={fieldStyle}>
        <div style={fieldContentStyle}>
          <FormField
            label="Penalty Type"
          >
            <SelectInput
              value={penaltyType}
              onChange={(event) =>
                onPenaltyTypeChange(
                  event.target.value,
                )
              }
              options={[
                {
                  label: "Fixed Amount",
                  value: "Fixed Amount",
                },
                {
                  label: "Percentage",
                  value: "Percentage",
                },
              ]}
            />
          </FormField>
        </div>
      </div>

      {/* PENALTY VALUE */}
      <div style={fieldStyle}>
        <div style={fieldContentStyle}>
          <FormField
            label="Penalty Value"
          >
            <TextInput
              type="number"
              value={penaltyValue}
              onChange={(event) =>
                onPenaltyValueChange(
                  event.target.value,
                )
              }
              placeholder="Enter penalty value"
            />
          </FormField>
        </div>
      </div>

      {/* GRACE PERIOD */}
      <div style={fieldStyle}>
        <div style={fieldContentStyle}>
          <FormField
            label="Grace Period (Days)"
          >
            <TextInput
              type="number"
              placeholder="Enter grace period"
            />
          </FormField>
        </div>
      </div>

    </div>
  );
}

/* ===========================================================
END
=========================================================== */
