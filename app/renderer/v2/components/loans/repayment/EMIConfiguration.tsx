// ============================================================
// FINORA ENTERPRISE V2
//
// REPAYMENT STUDIO
// EMI CONFIGURATION
//
// RESPONSIBILITY:
// - Configure EMI calculation mode
// - Configure installment date
// - Presentation/input responsibility only
//
// IMPORTANT:
// - No business calculations here
// - No repository access
// - No service access
// - No localStorage access
// ============================================================

import {
  useState,
} from "react";

import {
  FormField,
  SelectInput,
  TextInput,
} from "../../common";

import {
  contentStyle,
  fieldContentStyle,
  fieldStyle,
  inputStyle,
} from "./EMIConfiguration.styles";

// ============================================================
// TYPES
// ============================================================

export type EMICalculationMode =
  | "fixed"
  | "variable"
  | "interestOnly";

interface EMIConfigurationProps {
  emiCalculation?: EMICalculationMode;

  firstInstallmentDate?: string;

  onEMICalculationChange?: (
    value: EMICalculationMode,
  ) => void;

  onFirstInstallmentDateChange?: (
    value: string,
  ) => void;
}

// ============================================================
// COMPONENT
// ============================================================

export default function EMIConfiguration({
  emiCalculation:
    controlledEMICalculation,

  firstInstallmentDate:
    controlledFirstInstallmentDate,

  onEMICalculationChange,

  onFirstInstallmentDateChange,

}: EMIConfigurationProps) {

  // ==========================================================
  // LOCAL FALLBACK STATE
  // ==========================================================

  const [
    localEMICalculation,
    setLocalEMICalculation,
  ] = useState<EMICalculationMode>(
    "fixed",
  );

  const [
    localFirstInstallmentDate,
    setLocalFirstInstallmentDate,
  ] = useState("");

  // ==========================================================
  // RESOLVED VALUES
  // ==========================================================

  const emiCalculation =
    controlledEMICalculation ??
    localEMICalculation;

  const firstInstallmentDate =
    controlledFirstInstallmentDate ??
    localFirstInstallmentDate;

  // ==========================================================
  // EMI CALCULATION CHANGE
  // ==========================================================

  function handleEMICalculationChange(
    value: string,
  ): void {

    const normalizedValue:
      EMICalculationMode =
      value === "variable"
        ? "variable"
        : value === "interestOnly"
          ? "interestOnly"
          : "fixed";

    setLocalEMICalculation(
      normalizedValue,
    );

    onEMICalculationChange?.(
      normalizedValue,
    );
  }

  // ==========================================================
  // INSTALLMENT DATE CHANGE
  // ==========================================================

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

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      style={contentStyle}
    >

    </div>
  );
}

// ============================================================
// END
// ============================================================
