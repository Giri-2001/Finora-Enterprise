// ============================================================
// FINORA ENTERPRISE OS™
// LOANS OFFICE RESPONSIVE ENGINE
// HOOK
// ============================================================

import {
  useEffect,
  useState,
} from "react";

import {
  getLoansOfficeTokens,
} from "./loansOffice.tokens";

export function useLoansOfficeResponsive() {
  const [width, setWidth] = useState<number>(() =>
    typeof window === "undefined" ? 1440 : window.innerWidth,
  );

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return {
    tokens: getLoansOfficeTokens(width),
  };
}

export default useLoansOfficeResponsive;
