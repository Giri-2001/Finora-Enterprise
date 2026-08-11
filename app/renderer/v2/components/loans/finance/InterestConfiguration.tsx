// ============================================================
// FINORA ENTERPRISE V2
//
// FINANCE STUDIO
// INTEREST CONFIGURATION
//
// RESPONSIBILITY:
// - Configure interest type
// - Display controlled interest rate
// - Keep interest basis aligned with LoanStudio
// - No calculation logic
// - No persistence
// - No service access
//
// BUSINESS RULE:
// - Step 1 interest rate remains the source value.
// - Step 2 displays the same controlled rate.
// - Current FINORA flat-interest loan calculation uses
//   monthly basis.
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
  fieldContentStyle,
  fieldStyle,
  headerStyle,
  wrapperStyle,
} from "./InterestConfiguration.styles";


// ============================================================
// TYPES
// ============================================================

interface InterestConfigurationProps {

  interestType: string;

  interestRate: string;

  interestCalculation?: string;

  onInterestTypeChange: (
    value: string,
  ) => void;

  onInterestRateChange: (
    value: string,
  ) => void;

}


// ============================================================
// COMPONENT
// ============================================================

export default function InterestConfiguration({

  interestType,

  interestRate,

  interestCalculation = "monthly",

  onInterestTypeChange,

  onInterestRateChange,

}: InterestConfigurationProps) {

  return (

    <div
      style={
        wrapperStyle
      }
    >


      {/* ==================================================
          HEADER
      ================================================== */}

      <div
        style={
          headerStyle
        }
      >

        <span
          style={
            accentStyle
          }
        />


        <span>
          Interest Configuration
        </span>

      </div>


      {/* ==================================================
          INTEREST TYPE
      ================================================== */}

      <div
        style={
          fieldStyle
        }
      >

        <div
          style={
            fieldContentStyle
          }
        >

          <FormField
            label="Interest Type"
            required
          >

            <SelectInput

              value={
                interestType
              }

              onChange={(
                event,
              ) =>
                onInterestTypeChange(
                  event.target.value,
                )
              }

              options={[
                {
                  label:
                    "Flat Interest",

                  value:
                    "Flat Interest",
                },

                {
                  label:
                    "Reducing Balance",

                  value:
                    "Reducing Balance",
                },
              ]}

            />

          </FormField>

        </div>

      </div>


      {/* ==================================================
          INTEREST RATE
      ================================================== */}

      <div
        style={
          fieldStyle
        }
      >

        <div
          style={
            fieldContentStyle
          }
        >

          <FormField
            label="Interest Rate (%)"
            required
          >

            <TextInput

              type="number"

              value={
                interestRate
              }

              onChange={(
                event,
              ) =>
                onInterestRateChange(
                  event.target.value,
                )
              }

              placeholder="Enter interest rate"

            />

          </FormField>

        </div>

      </div>


      {/* ==================================================
          INTEREST BASIS
      ================================================== */}

      <div
        style={
          fieldStyle
        }
      >

        <div
          style={
            fieldContentStyle
          }
        >

          <FormField
            label="Interest Basis"
            required
          >

            <SelectInput

              value={
                interestCalculation
              }

              disabled

              options={[
                {
                  label:
                    "Monthly",

                  value:
                    "monthly",
                },
              ]}

            />

          </FormField>

        </div>

      </div>


    </div>
  );
}


// ============================================================
// END
// ============================================================
