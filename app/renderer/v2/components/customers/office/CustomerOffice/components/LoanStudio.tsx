// ============================================================
// FINORA ENTERPRISE OS
// LOAN STUDIO
//
// RESPONSIBILITY:
// - Compose the Loan Studio state engine and presentation view.
//
// ARCHITECTURE:
// - State / business logic  → useLoanStudio.ts
// - Presentation / JSX      → LoanStudio.view.tsx
// - Types                   → LoanStudio.types.ts
// - Helpers                 → LoanStudio.helpers.ts
// - Layout                  → LoanStudio.layout.ts
// - Existing presentation  → LoanStudio.styles.ts
//
// IMPORTANT:
// - No inline styles.
// - No business calculations.
// - No storage access.
// - No service access.
// - No responsive logic.
// ============================================================

import type { LoanStudioProps } from "./LoanStudio.types";

import { useLoanStudio } from "./useLoanStudio";

import LoanStudioView from "./LoanStudio.view";

// ============================================================
// COMPONENT
// ============================================================

export default function LoanStudio(props: LoanStudioProps) {
  const viewModel = useLoanStudio(props);

  return <LoanStudioView {...viewModel} />;
}
