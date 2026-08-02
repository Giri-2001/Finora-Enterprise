/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   SMS & WHATSAPP STUDIO
   MESSAGE COMPOSER
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface MessageComposerProps {

  templateName?: string;

  messageLength?: number;

  language?: string;

  scheduledTime?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function MessageComposer({

  templateName = "Default Template",

  messageLength = 0,

  language = "English",

  scheduledTime = "--",

}: MessageComposerProps) {

  return (

    <SummaryCard title="Message Composer">

      <span>

        Template :
        <strong> {templateName}</strong>

      </span>

      <span>

        Characters :
        <strong> {messageLength}</strong>

      </span>

      <span>

        Language :
        <strong> {language}</strong>

      </span>

      <span>

        Scheduled :
        <strong> {scheduledTime}</strong>

      </span>

    </SummaryCard>

  );

}
