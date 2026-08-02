/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   PUSH NOTIFICATION STUDIO
   PUSH PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface PushPreviewCardProps {

  title?: string;

  audience?: string;

  scheduledAt?: string;

  priority?: string;

  status?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PushPreviewCard({

  title = "--",

  audience = "--",

  scheduledAt = "--",

  priority = "Normal",

  status = "Draft",

}: PushPreviewCardProps) {

  return (

    <SummaryCard title="Push Preview">

      <span>
        Title :
        <strong> {title}</strong>
      </span>

      <span>
        Audience :
        <strong> {audience}</strong>
      </span>

      <span>
        Scheduled :
        <strong> {scheduledAt}</strong>
      </span>

      <span>
        Priority :
        <strong> {priority}</strong>
      </span>

      <span>
        Status :
        <strong> {status}</strong>
      </span>

    </SummaryCard>

  );

}
