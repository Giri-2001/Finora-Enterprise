/* ===========================================================
   FINORA ENTERPRISE V2
   NOTIFICATION ENGINE
   PUSH NOTIFICATION STUDIO
   AUDIENCE SELECTOR
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface AudienceSelectorProps {

  totalDevices?: number;

  selectedDevices?: number;

  customerSegments?: number;

  broadcastEnabled?: boolean;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function AudienceSelector({

  totalDevices = 0,

  selectedDevices = 0,

  customerSegments = 0,

  broadcastEnabled = false,

}: AudienceSelectorProps) {

  return (

    <SummaryCard title="Audience Selector">

      <span>

        Total Devices :
        <strong> {totalDevices}</strong>

      </span>

      <span>

        Selected Devices :
        <strong> {selectedDevices}</strong>

      </span>

      <span>

        Customer Segments :
        <strong> {customerSegments}</strong>

      </span>

      <span>

        Broadcast :
        <strong>{broadcastEnabled ? " Enabled" : " Disabled"}</strong>

      </span>

    </SummaryCard>

  );

}
