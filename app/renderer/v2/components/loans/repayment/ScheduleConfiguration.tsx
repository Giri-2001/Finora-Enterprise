// ============================================================
// FINORA ENTERPRISE V2
//
// REPAYMENT STUDIO
// SCHEDULE CONFIGURATION
//
// RESPONSIBILITY:
// - Configure repayment frequency
// - Configure loan duration
// - Configure duration unit
// - Keep repayment configuration controlled by LoanStudio
// - Presentation only
//
// IMPORTANT:
// - No calculation logic.
// - No schedule generation.
// - No persistence.
// - No LoanService access.
// - Schedule generation remains in LoanStudio / schedule engine.
//
// DESIGN:
// - FINORA Enterprise dark navy
// - Compact premium layout
// - No brown
// - No gold
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import {
  FormField,
  SelectInput,
  TextInput,
} from "../../common";

import {
  accentStyle,
  contentStyle,
  fieldContentStyle,
  fieldStyle,
  headerStyle,
  wrapperStyle,
} from "./ScheduleConfiguration.styles";

// ============================================================
// TYPES
// ============================================================

interface ScheduleConfigurationProps {

  repaymentType?: string;

  duration?: string;

  durationType?: string;

  onRepaymentTypeChange?: (
    value: string,
  ) => void;

  onDurationChange?: (
    value: string,
  ) => void;

  onDurationTypeChange?: (
    value: string,
  ) => void;
}

// ============================================================
// COMPONENT
// ============================================================

export default function ScheduleConfiguration({

  repaymentType = "daily",

  duration = "",

  durationType = "days",

  onRepaymentTypeChange,

  onDurationChange,

  onDurationTypeChange,

}: ScheduleConfigurationProps) {

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <section
      style={wrapperStyle}
    >

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div
        style={headerStyle}
      >

        <span
          style={accentStyle}
        />

        <span>
          Schedule Configuration
        </span>

      </div>


      {/* ====================================================
          CONFIGURATION CONTENT
      ==================================================== */}

      <div
        style={contentStyle}
      >

        {/* ==================================================
            REPAYMENT FREQUENCY
        ================================================== */}

        <div
          style={fieldStyle}
        >

          <div
            style={fieldContentStyle}
          >

            <FormField
              label="Repayment Frequency"
              required
            >

              <SelectInput

                value={
                  repaymentType
                }

                onChange={(
                  event,
                ) => {

                  onRepaymentTypeChange?.(
                    event.target.value,
                  );

                }}

                options={[
                  {
                    label: "Daily",
                    value: "daily",
                  },
                  {
                    label: "Weekly",
                    value: "weekly",
                  },
                  {
                    label: "Monthly",
                    value: "monthly",
                  },
                ]}

              />

            </FormField>

          </div>

        </div>


        {/* ==================================================
            LOAN DURATION
        ================================================== */}

        <div
          style={fieldStyle}
        >

          <div
            style={fieldContentStyle}
          >

            <FormField
              label="Loan Duration"
              required
            >

              <TextInput

                type="number"

                value={
                  duration
                }

                onChange={(
                  event,
                ) => {

                  onDurationChange?.(
                    event.target.value,
                  );

                }}

                placeholder="Enter duration"

              />

            </FormField>

          </div>

        </div>


        {/* ==================================================
            DURATION UNIT
        ================================================== */}

        <div
          style={fieldStyle}
        >

          <div
            style={fieldContentStyle}
          >

            <FormField
              label="Duration Unit"
              required
            >

              <SelectInput

                value={
                  durationType
                }

                onChange={(
                  event,
                ) => {

                  onDurationTypeChange?.(
                    event.target.value,
                  );

                }}

                options={[
                  {
                    label: "Days",
                    value: "days",
                  },
                  {
                    label: "Weeks",
                    value: "weeks",
                  },
                  {
                    label: "Months",
                    value: "months",
                  },
                ]}

              />

            </FormField>

          </div>

        </div>

      </div>

    </section>

  );
}

// ============================================================
// END
// ============================================================
