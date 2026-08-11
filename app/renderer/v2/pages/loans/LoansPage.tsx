/* ===========================================================
FINORA ENTERPRISE OS™

LOANS PAGE

RESPONSIBILITY:
- Entry point for Loan Office
- Hosts the complete Loan Studio workflow
=========================================================== */

import StudioLayout
  from "../../components/common/layout/StudioLayout";

import LoanStudio
  from "../../components/customers/office/CustomerOffice/components/LoanStudio";

/* ===========================================================
COMPONENT
=========================================================== */

export default function LoansPage() {
  return (
    <StudioLayout>
      <LoanStudio />
    </StudioLayout>
  );
}

/* ===========================================================
END
=========================================================== */
