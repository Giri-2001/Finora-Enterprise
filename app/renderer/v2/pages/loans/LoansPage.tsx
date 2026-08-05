/* ===========================================================
   FINORA OS V2
   LOANS PAGE
=========================================================== */

import StudioLayout from "../../components/common/layout/StudioLayout";

import LoanHeader from "../../components/loans/details/LoanHeader";
import LoanStatistics from "../../components/loans/details/LoanStatistics";
import LoanForm from "../../components/loans/details/LoanForm";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function LoansPage() {
  return (
    <StudioLayout>
      <LoanHeader />

      <LoanStatistics
        totalLoans={0}
        activeLoans={0}
        totalDisbursed={0}
      />

      <div
        style={{
          marginTop: 24,
        }}
      >
        <LoanForm />
      </div>
    </StudioLayout>
  );
}
