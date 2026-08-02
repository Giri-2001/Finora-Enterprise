/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   COLLECTION REPORTS STUDIO
   COLLECTION TREND SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface CollectionTrendSummaryProps {

  dailyCollections?: number;

  weeklyCollections?: number;

  monthlyCollections?: number;

  recoveryRate?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CollectionTrendSummary({

  dailyCollections = 0,

  weeklyCollections = 0,

  monthlyCollections = 0,

  recoveryRate = 0,

}: CollectionTrendSummaryProps) {

  return (

    <SummaryCard title="Collection Trend Summary">

      <span>

        Daily Collections :
        <strong> ₹ {dailyCollections}</strong>

      </span>

      <span>

        Weekly Collections :
        <strong> ₹ {weeklyCollections}</strong>

      </span>

      <span>

        Monthly Collections :
        <strong> ₹ {monthlyCollections}</strong>

      </span>

      <span>

        Recovery Rate :
        <strong> {recoveryRate}%</strong>

      </span>

    </SummaryCard>

  );

}
