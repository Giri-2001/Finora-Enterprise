/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   PUSH NOTIFICATION STUDIO
   PUSH COMPOSER
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface PushComposerProps {

  title?: string;

  messageLength?: number;

  targetPlatform?: string;

  scheduledTime?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PushComposer({

  title = "Push Notification",

  messageLength = 0,

  targetPlatform = "All Devices",

  scheduledTime = "--",

}: PushComposerProps) {

  return (

    <SummaryCard title="Push Composer">

      <span>

        Title :
        <strong> {title}</strong>

      </span>

      <span>

        Characters :
        <strong> {messageLength}</strong>

      </span>

      <span>

        Target :
        <strong> {targetPlatform}</strong>

      </span>

      <span>

        Scheduled :
        <strong> {scheduledTime}</strong>

      </span>

    </SummaryCard>

  );

}
