/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   SMS & WHATSAPP STUDIO
   RECIPIENT SELECTOR
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface RecipientSelectorProps {

  totalRecipients?: number;

  selectedRecipients?: number;

  customerGroups?: number;

  broadcastMode?: boolean;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function RecipientSelector({

  totalRecipients = 0,

  selectedRecipients = 0,

  customerGroups = 0,

  broadcastMode = false,

}: RecipientSelectorProps) {

  return (

    <SummaryCard title="Recipient Selector">

      <span>

        Total Recipients :
        <strong> {totalRecipients}</strong>

      </span>

      <span>

        Selected :
        <strong> {selectedRecipients}</strong>

      </span>

      <span>

        Customer Groups :
        <strong> {customerGroups}</strong>

      </span>

      <span>

        Broadcast :
        <strong> {broadcastMode ? "Enabled" : "Disabled"}</strong>

      </span>

    </SummaryCard>

  );

}
