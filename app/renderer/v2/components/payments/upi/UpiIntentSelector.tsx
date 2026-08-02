/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   UPI PAYMENT STUDIO
   UPI INTENT SELECTOR
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface UpiIntentSelectorProps {

  selectedApp?: string;

  availableApps?: number;

  deepLinkEnabled?: boolean;

  fallbackToQr?: boolean;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function UpiIntentSelector({

  selectedApp = "Any UPI App",

  availableApps = 0,

  deepLinkEnabled = true,

  fallbackToQr = true,

}: UpiIntentSelectorProps) {

  return (

    <SummaryCard title="UPI Intent Selector">

      <span>

        Selected App :
        <strong> {selectedApp}</strong>

      </span>

      <span>

        Available Apps :
        <strong> {availableApps}</strong>

      </span>

      <span>

        Deep Link :
        <strong> {deepLinkEnabled ? " Enabled" : " Disabled"}</strong>

      </span>

      <span>

        QR Fallback :
        <strong> {fallbackToQr ? " Enabled" : " Disabled"}</strong>

      </span>

    </SummaryCard>

  );

}
