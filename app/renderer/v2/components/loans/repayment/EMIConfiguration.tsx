// ===========================================================
// FINORA ENTERPRISE V2
// REPAYMENT STUDIO — EMI CONFIGURATION
// ===========================================================

import { useState } from "react";

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

export type EMICalculationMode =
  | "fixed"
  | "reducing"
  | "interestOnly";

interface EMIConfigurationProps {
  emiCalculation?: EMICalculationMode;
  installmentAmount?: string;
  firstInstallmentDate?: string;
  onEMICalculationChange?: (value: EMICalculationMode) => void;
  onInstallmentAmountChange?: (value: string) => void;
  onFirstInstallmentDateChange?: (value: string) => void;
}

export default function EMIConfiguration({
  emiCalculation: controlledEMICalculation,
  installmentAmount: controlledInstallmentAmount,
  firstInstallmentDate: controlledFirstInstallmentDate,
  onEMICalculationChange,
  onInstallmentAmountChange,
  onFirstInstallmentDateChange,
}: EMIConfigurationProps) {

  const [localEMICalculation, setLocalEMICalculation] =
    useState<EMICalculationMode>("fixed");
  const [localInstallmentAmount, setLocalInstallmentAmount] =
    useState("");
  const [localFirstInstallmentDate, setLocalFirstInstallmentDate] =
    useState("");

  const emiCalculation =
    controlledEMICalculation ?? localEMICalculation;
  const installmentAmount =
    controlledInstallmentAmount ?? localInstallmentAmount;
  const firstInstallmentDate =
    controlledFirstInstallmentDate ?? localFirstInstallmentDate;

  function handleEMICalculationChange(value: string): void {
    const normalizedValue: EMICalculationMode =
      value === "reducing"
        ? "reducing"
        : value === "interestOnly"
          ? "interestOnly"
          : "fixed";

    setLocalEMICalculation(normalizedValue);
    onEMICalculationChange?.(normalizedValue);
  }

  function handleInstallmentAmountChange(value: string): void {
    setLocalInstallmentAmount(value);
    onInstallmentAmountChange?.(value);
  }

  function handleFirstInstallmentDateChange(value: string): void {
    setLocalFirstInstallmentDate(value);
    onFirstInstallmentDateChange?.(value);
  }

  return (
    <div style={wrapperStyle}>
      <div style={headerStyle}>
        <span style={accentStyle} />
        <span>EMI Configuration</span>
      </div>

      <div style={contentStyle}>
        <div style={fieldStyle}>
          <div style={fieldContentStyle}>
            <FormField label="EMI Calculation" required>
              <SelectInput
                value={emiCalculation}
                onChange={(event) =>
                  handleEMICalculationChange(
                    event.target.value,
                  )
                }
                options={[
                  { label: "Fixed EMI", value: "fixed" },
                  { label: "Reducing EMI", value: "reducing" },
                  { label: "Interest Only", value: "interestOnly" },
                ]}
              />
            </FormField>
          </div>
        </div>

        <div style={fieldStyle}>
          <div style={fieldContentStyle}>
            <FormField label="Installment Amount (₹)">
              <TextInput
                type="number"
                value={installmentAmount}
                onChange={(event) =>
                  handleInstallmentAmountChange(
                    event.target.value,
                  )
                }
                placeholder="Auto or Manual"
              />
            </FormField>
          </div>
        </div>

        <div style={fieldStyle}>
          <div style={fieldContentStyle}>
            <FormField label="First Installment Date">
              <TextInput
                type="date"
                value={firstInstallmentDate}
                onChange={(event) =>
                  handleFirstInstallmentDateChange(
                    event.target.value,
                  )
                }
              />
            </FormField>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================
// END
// ===========================================================
