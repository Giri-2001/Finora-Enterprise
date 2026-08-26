// ============================================================
// FINORA ENTERPRISE OS™
// LOANS OFFICE RESPONSIVE ENGINE
// BREAKPOINTS
// ============================================================

export const LOANS_OFFICE_BREAKPOINTS = {
  mobileMax: 767,
  tabletMax: 1023,
  laptopMax: 1439,
} as const;

export type LoansOfficeViewport = "mobile" | "tablet" | "laptop" | "desktop";
