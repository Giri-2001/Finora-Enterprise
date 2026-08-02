/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   COLLECTION REPORTS STUDIO
   COLLECTION EFFICIENCY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface CollectionEfficiencyProps {

  scheduledCollections?: number;

  completedCollections?: number;

  pendingCollections?: number;

  efficiencyRate?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CollectionEfficiency({

  scheduledCollections = 0,

  completedCollections = 0,

  pendingCollections = 0,

  efficiencyRate = 0,

}: CollectionEfficiencyProps) {

  return (

    <SummaryCard title="Collection Efficiency">

      <span>

        Scheduled Collections :
        <strong> {scheduledCollections}</strong>

      </span>

      <span>

        Completed Collections :
        <strong> {completedCollections}</strong>

      </span>

      <span>

        Pending Collections :
        <strong> {pendingCollections}</strong>

      </span>

      <span>

        Efficiency Rate :
        <strong> {efficiencyRate}%</strong>

      </span>

    </SummaryCard>

  );

}
