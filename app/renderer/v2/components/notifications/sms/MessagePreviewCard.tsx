/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   SMS & WHATSAPP STUDIO
   MESSAGE PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface MessagePreviewCardProps {

  recipient?: string;

  channel?: string;

  template?: string;

  scheduledAt?: string;

  status?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function MessagePreviewCard({

  recipient = "--",

  channel = "SMS",

  template = "--",

  scheduledAt = "--",

  status = "Draft",

}: MessagePreviewCardProps) {

  return (

    <SummaryCard title="Message Preview">

      <span>

        Recipient :
        <strong> {recipient}</strong>

      </span>

      <span>

        Channel :
        <strong> {channel}</strong>

      </span>

      <span>

        Template :
        <strong> {template}</strong>

      </span>

      <span>

        Scheduled :
        <strong> {scheduledAt}</strong>

      </span>

      <span>

        Status :
        <strong> {status}</strong>

      </span>

    </SummaryCard>

  );

}
