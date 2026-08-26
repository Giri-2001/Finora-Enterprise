// ============================================================
// FINORA ENTERPRISE OS™
// LOAN DETAILS — RESPONSIVE ENGINE
// RESPONSIVE HOOK
// ============================================================

import { useEffect, useState } from "react";

import {
  getLoanDetailsViewport,
  type LoanDetailsViewport,
} from "./loanDetails.breakpoints";

import { createLoanDetailsTokens } from "./loanDetails.tokens";

import type { LoanDetailsResponsiveTokens } from "./loanDetails.types";

// ============================================================
// HOOK
// ============================================================

export function useLoanDetailsResponsive(): LoanDetailsResponsiveTokens {
  const getViewport = (): LoanDetailsViewport => {
    if (typeof window === "undefined") {
      return "desktop";
    }

    return getLoanDetailsViewport(window.innerWidth);
  };

  const [viewport, setViewport] = useState<LoanDetailsViewport>(getViewport);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleResize = (): void => {
      setViewport(getLoanDetailsViewport(window.innerWidth));
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return createLoanDetailsTokens(viewport);
}
