/* ===========================================================
   FINORA ENTERPRISE V2

   CUSTOMER WIZARD PROGRESS

   COMPACT MODE
   -----------------------------------------------------------
   Wizard progress header hidden for Smart Wall view.
=========================================================== */

import type {
  CSSProperties,
} from "react";


interface CustomerWizardProgressProps {

  currentStep: number;

  totalSteps: number;

  progress: number;

  title: string;

  subtitle: string;

}


/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerWizardProgress({

}: CustomerWizardProgressProps) {


  return (

    <div
      style={
        {
          display: "none",
        } as CSSProperties
      }
    />

  );

}
