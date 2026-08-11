/* ===========================================================
   FINORA ENTERPRISE V2

   REPAYMENT STUDIO
   EMI CONFIGURATION

   RESPONSIBILITY:
   - Configure EMI calculation mode
   - Configure installment amount
   - Configure first installment date
   - Keep the component ready for LoanStudio state wiring

   IMPORTANT:
   - No business calculations here
   - No repository access
   - No service access
   - No localStorage access
   - Presentation/input responsibility only
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useState,
} from "react";

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
} from "./EMIConfiguration.styles";


/* ===========================================================
   TYPES
=========================================================== */

export type EMICalculationMode =
  | "fixed"
  | "variable";


interface EMIConfigurationProps {

  emiCalculation?: EMICalculationMode;

  installmentAmount?: string;

  firstInstallmentDate?: string;

  onEMICalculationChange?: (
    value: EMICalculationMode,
  ) => void;

  onInstallmentAmountChange?: (
    value: string,
  ) => void;

  onFirstInstallmentDateChange?: (
    value: string,
  ) => void;
}


/* ===========================================================
   COMPONENT
=========================================================== */

export default function EMIConfiguration({

  emiCalculation:
    controlledEMICalculation,

  installmentAmount:
    controlledInstallmentAmount,

  firstInstallmentDate:
    controlledFirstInstallmentDate,

  onEMICalculationChange,

  onInstallmentAmountChange,

  onFirstInstallmentDateChange,

}: EMIConfigurationProps) {


  /* ==========================================================
     LOCAL FALLBACK STATE

     The current LoanStudio still renders:

       <EMIConfiguration />

     Therefore these fallback states keep the existing screen
     working until LoanStudio is wired to the repayment state.

     Once LoanStudio passes values and callbacks, the component
     automatically becomes controlled.
  ========================================================== */

  const [
    localEMICalculation,
    setLocalEMICalculation,
  ] = useState<EMICalculationMode>(
    "fixed",
  );


  const [
    localInstallmentAmount,
    setLocalInstallmentAmount,
  ] = useState(
    "",
  );


  const [
    localFirstInstallmentDate,
    setLocalFirstInstallmentDate,
  ] = useState(
    "",
  );


  /* ==========================================================
     RESOLVED VALUES
  ========================================================== */

  const emiCalculation =
    controlledEMICalculation ??
    localEMICalculation;


  const installmentAmount =
    controlledInstallmentAmount ??
    localInstallmentAmount;


  const firstInstallmentDate =
    controlledFirstInstallmentDate ??
    localFirstInstallmentDate;


  /* ==========================================================
     EMI CALCULATION CHANGE
  ========================================================== */

  function handleEMICalculationChange(
    value: string,
  ): void {

    const normalizedValue:
      EMICalculationMode =
      value === "variable"
        ? "variable"
        : "fixed";


    setLocalEMICalculation(
      normalizedValue,
    );


    onEMICalculationChange?.(
      normalizedValue,
    );

  }


  /* ==========================================================
     INSTALLMENT AMOUNT CHANGE
  ========================================================== */

  function handleInstallmentAmountChange(
    value: string,
  ): void {

    setLocalInstallmentAmount(
      value,
    );


    onInstallmentAmountChange?.(
      value,
    );

  }


  /* ==========================================================
     FIRST INSTALLMENT DATE CHANGE
  ========================================================== */

  function handleFirstInstallmentDateChange(
    value: string,
  ): void {

    setLocalFirstInstallmentDate(
      value,
    );


    onFirstInstallmentDateChange?.(
      value,
    );

  }


  /* ==========================================================
     RENDER
  ========================================================== */

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
          EMI Configuration
        </span>

      </div>


      {/* ==================================================
          CONTENT
      ================================================== */}

      <div
        style={
          contentStyle
        }
      >

        {/* ================================================
            EMI CALCULATION
        ================================================ */}

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
              label="EMI Calculation"
              required
            >

              <SelectInput
                value={
                  emiCalculation
                }

                onChange={(
                  event,
                ) => {

                  handleEMICalculationChange(
                    event.target.value,
                  );

                }}

                options={[
                  {
                    label:
                      "Fixed EMI",

                    value:
                      "fixed",
                  },

                  {
                    label:
                      "Variable EMI",

                    value:
                      "variable",
                  },
                ]}
              />

            </FormField>

          </div>

        </div>


        {/* ================================================
            INSTALLMENT AMOUNT
        ================================================ */}

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
              label="Installment Amount (₹)"
            >

              <TextInput
                type="number"

                value={
                  installmentAmount
                }

                onChange={(
                  event,
                ) => {

                  handleInstallmentAmountChange(
                    event.target.value,
                  );

                }}

                placeholder="Auto or Manual"
              />

            </FormField>

          </div>

        </div>


        {/* ================================================
            FIRST INSTALLMENT DATE
        ================================================ */}

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
              label="First Installment Date"
            >

              <TextInput
                type="date"

                value={
                  firstInstallmentDate
                }

                onChange={(
                  event,
                ) => {

                  handleFirstInstallmentDateChange(
                    event.target.value,
                  );

                }}
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
