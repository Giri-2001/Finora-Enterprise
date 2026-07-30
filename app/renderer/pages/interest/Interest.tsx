import { useState } from "react";

import Card from "../../components/ui/Card";

import InterestCalculator from "../../components/interest/InterestCalculator";
import InterestHistory from "../../components/interest/InterestHistory";

import { getInterestHistory } from "../../store/interestStore";

import type { InterestHistory as InterestHistoryType } from "../../components/interest/types";

export default function Interest() {
  const [history] = useState<InterestHistoryType[]>(getInterestHistory());

  return (
    <div>
      <h1>Interest Engine</h1>

      <p>Calculate loan interest and track interest history inside FINORA.</p>

      <Card title="Interest Calculator">
        <InterestCalculator />
      </Card>

      <Card title="Interest Records">
        <InterestHistory history={history} />
      </Card>
    </div>
  );
}
