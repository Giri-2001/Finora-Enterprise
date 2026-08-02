/* ===========================================================
   FINORA ENTERPRISE V2
   COLLECTION STUDIO
   COLLECTION STATISTICS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface CollectionStatisticsProps {

  totalCollected?: number;

  outstandingAmount?: number;

  collectionCount?: number;

  lastCollectionDate?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CollectionStatistics({

  totalCollected = 0,

  outstandingAmount = 0,

  collectionCount = 0,

  lastCollectionDate = "--",

}: CollectionStatisticsProps) {

  return (

    <SummaryCard title="Collection Statistics">

      <span>

        Total Collected :
        <strong> ₹ {totalCollected}</strong>

      </span>

      <span>

        Outstanding :
        <strong> ₹ {outstandingAmount}</strong>

      </span>

      <span>

        Collections :
        <strong> {collectionCount}</strong>

      </span>

      <span>

        Last Collection :
        <strong> {lastCollectionDate}</strong>

      </span>

    </SummaryCard>

  );

}
